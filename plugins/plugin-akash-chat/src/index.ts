import { createOpenAI } from '@ai-sdk/openai';
import type {
  DetokenizeTextParams,
  GenerateTextParams,
  IAgentRuntime,
  ModelTypeName,
  ObjectGenerationParams,
  Plugin,
  TextEmbeddingParams,
  TokenizeTextParams,
} from '@elizaos/core';
import {
  EventType,
  logger,
  ModelType,
  safeReplacer,
  ServiceType,
  VECTOR_DIMS,
} from '@elizaos/core';
import {
  generateObject,
  generateText,
  JSONParseError,
  type JSONValue,
  type LanguageModelUsage,
} from 'ai';
import { encodingForModel, type TiktokenModel } from 'js-tiktoken';
import { createFallbackEmbedding } from './embedding-fallback';

// Supported Akash Chat models with validation
const SUPPORTED_MODELS = {
  // Text generation models
  TEXT_MODELS: [
    'Meta-Llama-3-1-8B-Instruct-FP8',
    'Meta-Llama-3-2-3B-Instruct',
    'Meta-Llama-3-3-70B-Instruct',
    'Meta-Llama-3-3-8B-Instruct',
    'DeepSeek-R1-Distill-Llama-70B',
    'DeepSeek-R1-Distill-Qwen-14B',
    'DeepSeek-R1-Distill-Qwen-32B',
    'Meta-Llama-3-8B-Instruct',
    'Meta-Llama-3-70B-Instruct',
  ],
  // Embedding models
  EMBEDDING_MODELS: [
    'BAAI-bge-large-en-v1-5',
    'text-embedding-3-small', // OpenAI compatible fallback
  ],
  // Default models for abstraction
  DEFAULTS: {
    SMALL: 'Meta-Llama-3-1-8B-Instruct-FP8',
    LARGE: 'Meta-Llama-3-3-70B-Instruct',
    EMBEDDING: 'BAAI-bge-large-en-v1-5',
  }
} as const;

// Akash Chat API constraints and configuration
const AKASH_CONSTRAINTS = {
  MAX_CONCURRENT: 2,
  RATE_LIMIT_PER_MINUTE: 60,
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  DEFAULT_TIMEOUT: 30000,
  DEFAULT_EMBEDDING_DIMENSIONS: 1024,
} as const;

/**
 * Enhanced request queue with priority support and concurrency enforcement
 */
class EnhancedRequestQueue {
  private foregroundQueue: Array<() => Promise<any>> = [];
  private backgroundQueue: Array<() => Promise<any>> = [];
  private activeRequests = 0;
  private maxConcurrent: number;
  private lastLogTime = 0;

  constructor(maxConcurrent = AKASH_CONSTRAINTS.MAX_CONCURRENT) {
    // Enforce Akash limits with user warning
    if (maxConcurrent > AKASH_CONSTRAINTS.MAX_CONCURRENT) {
      logger.warn(
        `[AkashChat] Configured concurrency (${maxConcurrent}) exceeds Akash limit (${AKASH_CONSTRAINTS.MAX_CONCURRENT}). Using Akash limit to prevent API errors.`
      );
      this.maxConcurrent = AKASH_CONSTRAINTS.MAX_CONCURRENT;
    } else {
      this.maxConcurrent = maxConcurrent;
    }

    logger.info(`[AkashChat] Request queue initialized with max concurrency: ${this.maxConcurrent}`);
  }

  async enqueue<T>(
    requestFn: () => Promise<T>, 
    priority: 'foreground' | 'background' = 'foreground'
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const wrappedRequest = async () => {
        this.activeRequests++;
        try {
          const result = await this.executeWithRetry(requestFn);
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.activeRequests--;
          this.processQueue();
        }
      };

      if (priority === 'foreground') {
        this.foregroundQueue.push(wrappedRequest);
      } else {
        this.backgroundQueue.push(wrappedRequest);
      }

      this.processQueue();
    });
  }

  private async executeWithRetry<T>(requestFn: () => Promise<T>): Promise<T> {
    let lastError: Error | undefined;
    
    for (let attempt = 1; attempt <= AKASH_CONSTRAINTS.MAX_RETRIES; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt === AKASH_CONSTRAINTS.MAX_RETRIES) {
          logger.error(`[AkashChat] All ${AKASH_CONSTRAINTS.MAX_RETRIES} retry attempts failed: ${lastError.message}`);
          break;
        }

        // Check if error is retryable
        if (this.isRetryableError(lastError)) {
          const delay = AKASH_CONSTRAINTS.RETRY_DELAY * attempt;
          logger.warn(`[AkashChat] Request failed (attempt ${attempt}/${AKASH_CONSTRAINTS.MAX_RETRIES}), retrying in ${delay}ms: ${lastError.message}`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          logger.error(`[AkashChat] Non-retryable error: ${lastError.message}`);
          break;
        }
      }
    }

    throw lastError;
  }

  private isRetryableError(error: Error): boolean {
    const retryableMessages = [
      'rate limit',
      'too many requests',
      'temporary unavailable',
      'timeout',
      'network error',
      'connection reset',
      'ECONNRESET',
      'ETIMEDOUT',
    ];

    const message = error.message.toLowerCase();
    return retryableMessages.some(retryMsg => message.includes(retryMsg));
  }

  private processQueue(): void {
    if (this.activeRequests >= this.maxConcurrent) {
      return;
    }

    // Log queue status periodically (every 30 seconds)
    const now = Date.now();
    if (now - this.lastLogTime > 30000) {
      this.lastLogTime = now;
      const totalQueued = this.foregroundQueue.length + this.backgroundQueue.length;
      if (totalQueued > 0) {
        logger.debug(`[AkashChat] Queue status: ${this.activeRequests}/${this.maxConcurrent} active, ${this.foregroundQueue.length} foreground, ${this.backgroundQueue.length} background queued`);
      }
    }

    // Prioritize foreground requests (user chat)
    const nextRequest = this.foregroundQueue.shift() || this.backgroundQueue.shift();
    if (nextRequest) {
      setTimeout(nextRequest, 0);
    }
  }
}

// Global request queue instance
const requestQueue = new EnhancedRequestQueue();

/**
 * Retrieves a configuration setting from the runtime, falling back to environment variables or a default value.
 */
function getSetting(
  runtime: IAgentRuntime,
  key: string,
  defaultValue?: string
): string | undefined {
  return runtime.getSetting(key) ?? process.env[key] ?? defaultValue;
}

/**
 * Retrieves the Akash Chat API base URL with provider-aware resolution.
 */
function getBaseURL(runtime?: IAgentRuntime): string {
  const baseURL = runtime 
    ? getSetting(runtime, 'AKASH_CHAT_BASE_URL', 'https://chatapi.akash.network/api/v1')
    : (process.env.AKASH_CHAT_BASE_URL || 'https://chatapi.akash.network/api/v1');
  
  logger.debug(`[AkashChat] Using base URL: ${baseURL}`);
  return baseURL;
}

/**
 * Helper function to get the API key for Akash Chat
 */
function getApiKey(runtime: IAgentRuntime): string | undefined {
  const apiKey = getSetting(runtime, 'AKASH_CHAT_API_KEY') || getSetting(runtime, 'API_KEY');
  if (!apiKey) {
    logger.warn('[AkashChat] API key not configured. Set AKASH_CHAT_API_KEY or API_KEY environment variable.');
  }
  return apiKey;
}

/**
 * Helper function to get the small model name with enhanced fallbacks and validation
 */
function getSmallModel(runtime: IAgentRuntime): string {
  const configuredModel = (
    getSetting(runtime, 'AKASH_CHAT_SMALL_MODEL') ||
    getSetting(runtime, 'SMALL_MODEL') ||
    SUPPORTED_MODELS.DEFAULTS.SMALL
  );

  if (!SUPPORTED_MODELS.TEXT_MODELS.includes(configuredModel as any)) {
    logger.warn(`[AkashChat] Configured small model '${configuredModel}' not in supported list. Using default: ${SUPPORTED_MODELS.DEFAULTS.SMALL}`);
    return SUPPORTED_MODELS.DEFAULTS.SMALL;
  }

  logger.debug(`[AkashChat] Using small model: ${configuredModel}`);
  return configuredModel;
}

/**
 * Helper function to get the large model name with enhanced fallbacks and validation
 */
function getLargeModel(runtime: IAgentRuntime): string {
  const configuredModel = (
    getSetting(runtime, 'AKASH_CHAT_LARGE_MODEL') ||
    getSetting(runtime, 'LARGE_MODEL') ||
    SUPPORTED_MODELS.DEFAULTS.LARGE
  );

  if (!SUPPORTED_MODELS.TEXT_MODELS.includes(configuredModel as any)) {
    logger.warn(`[AkashChat] Configured large model '${configuredModel}' not in supported list. Using default: ${SUPPORTED_MODELS.DEFAULTS.LARGE}`);
    return SUPPORTED_MODELS.DEFAULTS.LARGE;
  }

  logger.debug(`[AkashChat] Using large model: ${configuredModel}`);
  return configuredModel;
}

/**
 * Helper function to get the embedding model name with validation
 */
function getEmbeddingModel(runtime: IAgentRuntime): string {
  const configuredModel = (
    getSetting(runtime, 'AKASH_CHAT_EMBEDDING_MODEL') ||
    getSetting(runtime, 'AKASHCHAT_EMBEDDING_MODEL') ||
    SUPPORTED_MODELS.DEFAULTS.EMBEDDING
  );

  if (!SUPPORTED_MODELS.EMBEDDING_MODELS.includes(configuredModel as any)) {
    logger.warn(`[AkashChat] Configured embedding model '${configuredModel}' not in supported list. Using default: ${SUPPORTED_MODELS.DEFAULTS.EMBEDDING}`);
    return SUPPORTED_MODELS.DEFAULTS.EMBEDDING;
  }

  logger.debug(`[AkashChat] Using embedding model: ${configuredModel}`);
  return configuredModel;
}

/**
 * Create an Akash Chat client with proper configuration and validation
 */
function createAkashChatClient(runtime: IAgentRuntime) {
  const apiKey = getApiKey(runtime);
  if (!apiKey) {
    throw new Error('Akash Chat API key not configured. Please set AKASH_CHAT_API_KEY environment variable.');
  }

  return createOpenAI({
    apiKey,
    baseURL: getBaseURL(runtime),
  });
}

/**
 * Validates if a model is supported by Akash Chat API
 */
function validateModel(modelName: string, modelType: 'text' | 'embedding' = 'text'): boolean {
  if (modelType === 'text') {
    return SUPPORTED_MODELS.TEXT_MODELS.includes(modelName as any);
  } else {
    return SUPPORTED_MODELS.EMBEDDING_MODELS.includes(modelName as any);
  }
}

/**
 * Lists available models from Akash Chat API
 */
async function listAvailableModels(runtime: IAgentRuntime): Promise<string[]> {
  try {
    const baseURL = getBaseURL(runtime);
    const apiKey = getApiKey(runtime);
    
    if (!apiKey) {
      throw new Error('API key not configured');
    }

    const response = await fetch(`${baseURL}/models`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.statusText}`);
    }

    const data = await response.json() as { data: Array<{ id: string }> };
    const modelIds = data.data?.map(model => model.id) || [];
    
    logger.info(`[AkashChat] Available models: ${modelIds.length} found`);
    return modelIds;
  } catch (error) {
    logger.error(`[AkashChat] Failed to list available models: ${error instanceof Error ? error.message : String(error)}`);
    // Return known supported models as fallback
    return [...SUPPORTED_MODELS.TEXT_MODELS, ...SUPPORTED_MODELS.EMBEDDING_MODELS];
  }
}

/**
 * Enhanced tokenization with model-specific logic
 */
async function tokenizeText(
  runtime: IAgentRuntime,
  modelType: ModelTypeName,
  prompt: string
): Promise<number[]> {
  try {
    // Map Akash models to compatible tokenizers
    const modelName = modelType === ModelType.TEXT_SMALL 
      ? getSmallModel(runtime) 
      : getLargeModel(runtime);
    
    // Use a compatible tokenizer (most Llama models can use gpt-4 tokenizer as approximation)
    const tokenizerModel = modelName.includes('Llama') ? 'gpt-4' : 'gpt-4o-mini';
    const encoding = encodingForModel(tokenizerModel as TiktokenModel);
    const tokens = encoding.encode(prompt);
    
    logger.debug(`[AkashChat] Tokenized text for ${modelName}: ${tokens.length} tokens`);
    return tokens;
  } catch (error) {
    logger.error(`[AkashChat] Tokenization failed: ${error instanceof Error ? error.message : String(error)}`);
    // Return approximate token count as fallback
    return prompt.split(/\s+/).map((_, index) => index);
  }
}

/**
 * Enhanced detokenization with model-specific logic
 */
async function detokenizeText(
  runtime: IAgentRuntime,
  modelType: ModelTypeName,
  tokens: number[]
): Promise<string> {
  try {
    const modelName = modelType === ModelType.TEXT_SMALL 
      ? getSmallModel(runtime) 
      : getLargeModel(runtime);
    
    // Use a compatible tokenizer
    const tokenizerModel = modelName.includes('Llama') ? 'gpt-4' : 'gpt-4o-mini';
    const encoding = encodingForModel(tokenizerModel as TiktokenModel);
    const text = encoding.decode(tokens);
    
    logger.debug(`[AkashChat] Detokenized ${tokens.length} tokens for ${modelName}`);
    return text;
  } catch (error) {
    logger.error(`[AkashChat] Detokenization failed: ${error instanceof Error ? error.message : String(error)}`);
    // Return tokens as string fallback
    return tokens.join(' ');
  }
}

/**
 * Enhanced text generation with priority support and error handling
 */
async function generateAkashChatTextWithPriority(
  client: ReturnType<typeof createOpenAI>,
  model: string,
  params: {
    prompt: string;
    system?: string;
    temperature?: number;
    maxTokens?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
    stopSequences?: string[];
  },
  priority: 'foreground' | 'background'
): Promise<string> {
  return requestQueue.enqueue(async () => {
    logger.debug(`[AkashChat] Generating text with ${model} (priority: ${priority})`);
    
    const { text, usage } = await generateText({
      model: client.languageModel(model),
      prompt: params.prompt,
      system: params.system,
      temperature: params.temperature ?? 0.7,
      maxTokens: params.maxTokens ?? 8192,
      frequencyPenalty: params.frequencyPenalty ?? 0.7,
      presencePenalty: params.presencePenalty ?? 0.7,
      stopSequences: params.stopSequences ?? [],
    });

    if (usage) {
      logger.debug(`[AkashChat] Token usage - Prompt: ${usage.promptTokens}, Completion: ${usage.completionTokens}, Total: ${usage.totalTokens}`);
    }

    return text;
  }, priority);
}

/**
 * Enhanced object generation with priority support and JSON repair
 */
async function generateAkashChatObjectWithPriority(
  client: ReturnType<typeof createOpenAI>,
  model: string,
  params: ObjectGenerationParams,
  priority: 'foreground' | 'background'
): Promise<JSONValue> {
  return requestQueue.enqueue(async () => {
    logger.debug(`[AkashChat] Generating object with ${model} (priority: ${priority})`);
    
    try {
      const { object, usage } = await generateObject({
        model: client.languageModel(model),
        output: 'no-schema',
        prompt: params.prompt,
        temperature: params.temperature ?? 0.7,
        experimental_repairText: getJsonRepairFunction(),
      });

      if (usage) {
        logger.debug(`[AkashChat] Token usage - Prompt: ${usage.promptTokens}, Completion: ${usage.completionTokens}, Total: ${usage.totalTokens}`);
      }

      return object;
    } catch (error: unknown) {
      if (error instanceof JSONParseError) {
        logger.error(`[AkashChat] JSON parsing failed: ${error.message}`);
        
        const repairFunction = getJsonRepairFunction();
        const repairedJsonString = await repairFunction({
          text: error.text,
          error,
        });

        if (repairedJsonString) {
          try {
            const repairedObject = JSON.parse(repairedJsonString);
            logger.info('[AkashChat] Successfully repaired JSON response');
            return repairedObject;
          } catch (repairError) {
            logger.error(`[AkashChat] Failed to parse repaired JSON: ${repairError instanceof Error ? repairError.message : String(repairError)}`);
            throw repairError;
          }
        } else {
          logger.error('[AkashChat] JSON repair failed');
          throw error;
        }
      } else {
        logger.error(`[AkashChat] Object generation failed: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
      }
    }
  }, priority);
}

/**
 * Returns a function to repair JSON text with Akash-specific handling
 */
function getJsonRepairFunction(): (params: {
  text: string;
  error: unknown;
}) => Promise<string | null> {
  return async ({ text, error }: { text: string; error: unknown }) => {
    try {
      if (error instanceof JSONParseError) {
        // Clean common Akash Chat API response formatting issues
        const cleanedText = text
          .replace(/```json\n|\n```|```/g, '')
          .replace(/^[^{]*({.*})[^}]*$/s, '$1') // Extract JSON object
          .trim();
        
        JSON.parse(cleanedText);
        return cleanedText;
      }
      return null;
    } catch (jsonError: unknown) {
      const message = jsonError instanceof Error ? jsonError.message : String(jsonError);
      logger.warn(`[AkashChat] Failed to repair JSON: ${message}`);
      return null;
    }
  };
}

/**
 * Emits a model usage event with Akash-specific metadata
 */
function emitModelUsageEvent(
  runtime: IAgentRuntime,
  type: ModelTypeName,
  prompt: string,
  usage: LanguageModelUsage
) {
  runtime.emitEvent(EventType.MODEL_USED, {
    provider: 'akash-chat',
    type,
    prompt,
    tokens: {
      prompt: usage.promptTokens,
      completion: usage.completionTokens,
      total: usage.totalTokens,
    },
  });
}

/**
 * Enhanced Akash Chat plugin with feature parity to OpenAI plugin
 */
export const akashchatPlugin: Plugin = {
  name: 'akash-chat',
  description: 'Enhanced Akash Chat API plugin with comprehensive OpenAI feature parity, including model abstraction, validation, enhanced error handling, and robust concurrency management.',
  priority: 100, // High priority to ensure this plugin handles models first
  
  // Comprehensive configuration with all supported options
  config: {
    AKASH_CHAT_API_KEY: process.env.AKASH_CHAT_API_KEY,
    API_KEY: process.env.API_KEY, // Alternative key name
    AKASH_CHAT_BASE_URL: process.env.AKASH_CHAT_BASE_URL,
    AKASH_CHAT_SMALL_MODEL: process.env.AKASH_CHAT_SMALL_MODEL,
    AKASH_CHAT_LARGE_MODEL: process.env.AKASH_CHAT_LARGE_MODEL,
    SMALL_MODEL: process.env.SMALL_MODEL, // OpenAI compatibility
    LARGE_MODEL: process.env.LARGE_MODEL, // OpenAI compatibility
    AKASH_CHAT_EMBEDDING_MODEL: process.env.AKASH_CHAT_EMBEDDING_MODEL,
    AKASHCHAT_EMBEDDING_MODEL: process.env.AKASHCHAT_EMBEDDING_MODEL, // Legacy compatibility
    AKASH_CHAT_EMBEDDING_DIMENSIONS: process.env.AKASH_CHAT_EMBEDDING_DIMENSIONS,
    AKASHCHAT_EMBEDDING_DIMENSIONS: process.env.AKASHCHAT_EMBEDDING_DIMENSIONS, // Legacy compatibility
    AKASH_CHAT_MAX_CONCURRENT: process.env.AKASH_CHAT_MAX_CONCURRENT,
    AKASH_CHAT_TIMEOUT: process.env.AKASH_CHAT_TIMEOUT,
  },

  async init(_config, runtime) {
    // Enhanced initialization with comprehensive validation
    const validationPromise = new Promise<void>(async (resolve) => {
      try {
        const apiKey = getApiKey(runtime);
        if (!apiKey) {
          logger.warn('[AkashChat] API key not configured - functionality will be limited');
          logger.warn('Please set AKASH_CHAT_API_KEY or API_KEY environment variable');
          resolve();
          return;
        }

        // Validate API connectivity and model availability
        try {
          const baseURL = getBaseURL(runtime);
          logger.info(`[AkashChat] Validating API connectivity to ${baseURL}`);
          
          const response = await fetch(`${baseURL}/models`, {
            headers: { 
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            signal: AbortSignal.timeout(10000), // 10 second timeout
          });

          if (!response.ok) {
            logger.warn(`[AkashChat] API validation failed: ${response.status} ${response.statusText}`);
            logger.warn('Akash Chat functionality will be limited until a valid API key is provided');
          } else {
            const data = await response.json() as { data: Array<{ id: string }> };
            const modelCount = data.data?.length || 0;
            logger.info(`[AkashChat] API validated successfully - ${modelCount} models available`);
            
            // Validate configured models
            const smallModel = getSmallModel(runtime);
            const largeModel = getLargeModel(runtime);
            const embeddingModel = getEmbeddingModel(runtime);
            
            logger.info(`[AkashChat] Model configuration validated:`);
            logger.info(`  Small model: ${smallModel}`);
            logger.info(`  Large model: ${largeModel}`);
            logger.info(`  Embedding model: ${embeddingModel}`);
          }
        } catch (fetchError: unknown) {
          const message = fetchError instanceof Error ? fetchError.message : String(fetchError);
          logger.warn(`[AkashChat] Error validating API: ${message}`);
          logger.warn('Functionality will be limited until connectivity is restored');
        }

        // Log configuration summary
        const maxConcurrent = parseInt(getSetting(runtime, 'AKASH_CHAT_MAX_CONCURRENT', String(AKASH_CONSTRAINTS.MAX_CONCURRENT)) || String(AKASH_CONSTRAINTS.MAX_CONCURRENT), 10);
        logger.info(`[AkashChat] Plugin initialized with max concurrency: ${Math.min(maxConcurrent, AKASH_CONSTRAINTS.MAX_CONCURRENT)}`);

      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        logger.warn(`[AkashChat] Plugin initialization issue: ${message}`);
        logger.warn('Configure AKASH_CHAT_API_KEY in your environment variables for full functionality');
      } finally {
        resolve();
      }
    });

    // Don't block initialization
    validationPromise.catch(() => {
      // Errors already logged above
    });
  },

  models: {
    /**
     * Enhanced text embedding with comprehensive error handling and fallbacks
     */
    [ModelType.TEXT_EMBEDDING]: async (
      runtime: IAgentRuntime,
      params: TextEmbeddingParams | string | null
    ): Promise<number[]> => {
      const embeddingModel = getEmbeddingModel(runtime);
      const embeddingDimension = Number.parseInt(
        getSetting(runtime, 'AKASH_CHAT_EMBEDDING_DIMENSIONS') ||
        getSetting(runtime, 'AKASHCHAT_EMBEDDING_DIMENSIONS') ||
        String(AKASH_CONSTRAINTS.DEFAULT_EMBEDDING_DIMENSIONS),
        10
      ) as (typeof VECTOR_DIMS)[keyof typeof VECTOR_DIMS];

      logger.debug(`[AkashChat] Using embedding model: ${embeddingModel} with dimension: ${embeddingDimension}`);

      // Validate embedding dimension
      if (!Object.values(VECTOR_DIMS).includes(embeddingDimension)) {
        const errorMsg = `Invalid embedding dimension: ${embeddingDimension}. Must be one of: ${Object.values(VECTOR_DIMS).join(', ')}`;
        logger.error(`[AkashChat] ${errorMsg}`);
        throw new Error(errorMsg);
      }

      // Handle null input (initialization)
      if (params === null) {
        logger.debug('[AkashChat] Creating test embedding for initialization');
        const testVector = Array(embeddingDimension).fill(0);
        testVector[0] = 0.1;
        return testVector;
      }

      // Extract text from params
      let text: string;
      if (typeof params === 'string') {
        text = params;
      } else if (typeof params === 'object' && params.text) {
        text = params.text;
      } else {
        logger.warn('[AkashChat] Invalid input format for embedding');
        const fallbackVector = Array(embeddingDimension).fill(0);
        fallbackVector[0] = 0.2;
        return fallbackVector;
      }

      // Handle empty text
      if (!text.trim()) {
        logger.warn('[AkashChat] Empty text for embedding');
        const emptyVector = Array(embeddingDimension).fill(0);
        emptyVector[0] = 0.3;
        return emptyVector;
      }

      try {
        const baseURL = getBaseURL(runtime);
        const apiKey = getApiKey(runtime);

        if (!apiKey) {
          logger.error('[AkashChat] API key not configured for embedding');
          return createFallbackEmbedding(text, embeddingDimension);
        }

        return await requestQueue.enqueue(async () => {
          const response = await fetch(`${baseURL}/embeddings`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: embeddingModel,
              input: text,
            }),
          });

          if (!response.ok) {
            logger.error(`[AkashChat] Embedding API error: ${response.status} - ${response.statusText}`);
            throw new Error(`Embedding request failed: ${response.statusText}`);
          }

          const data = (await response.json()) as { 
            data: [{ embedding: number[] }];
            usage?: { prompt_tokens: number; total_tokens: number };
          };

          if (!data?.data?.[0]?.embedding) {
            logger.error('[AkashChat] Invalid embedding response structure');
            throw new Error('Invalid embedding response');
          }

          const embedding = data.data[0].embedding;

          // Log usage metrics
          if (data.usage) {
            emitModelUsageEvent(runtime, ModelType.TEXT_EMBEDDING, text, {
              promptTokens: data.usage.prompt_tokens,
              completionTokens: 0,
              totalTokens: data.usage.total_tokens,
            });
          }

          logger.debug(`[AkashChat] Generated embedding with length ${embedding.length}`);
          return embedding;
        }, 'background');

      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error(`[AkashChat] Embedding generation failed: ${message}`);
        
        // Return fallback embedding to prevent system crashes
        return createFallbackEmbedding(text, embeddingDimension);
      }
    },

    /**
     * Enhanced tokenization with model-specific support
     */
    [ModelType.TEXT_TOKENIZER_ENCODE]: async (
      runtime: IAgentRuntime,
      { prompt, modelType = ModelType.TEXT_LARGE }: TokenizeTextParams
    ) => {
      return tokenizeText(runtime, modelType ?? ModelType.TEXT_LARGE, prompt);
    },

    /**
     * Enhanced detokenization with model-specific support
     */
    [ModelType.TEXT_TOKENIZER_DECODE]: async (
      runtime: IAgentRuntime,
      { tokens, modelType = ModelType.TEXT_LARGE }: DetokenizeTextParams
    ) => {
      return detokenizeText(runtime, modelType ?? ModelType.TEXT_LARGE, tokens);
    },

    /**
     * Small model text generation with priority handling
     */
    [ModelType.TEXT_SMALL]: async (
      runtime: IAgentRuntime,
      {
        prompt,
        stopSequences = [],
        maxTokens = 8192,
        temperature = 0.7,
        frequencyPenalty = 0.7,
        presencePenalty = 0.7,
      }: GenerateTextParams
    ) => {
      logger.debug(`[AkashChat] TEXT_SMALL generation request`, { 
        promptLength: prompt.length,
        maxTokens,
        temperature,
      });

      const client = createAkashChatClient(runtime);
      const model = getSmallModel(runtime);

      const result = await generateAkashChatTextWithPriority(client, model, {
        prompt,
        system: runtime.character.system,
        temperature,
        maxTokens,
        frequencyPenalty,
        presencePenalty,
        stopSequences,
      }, 'foreground'); // User chat gets priority

      logger.debug(`[AkashChat] TEXT_SMALL generated ${result.length} characters`);
      return result;
    },

    /**
     * Large model text generation with priority handling
     */
    [ModelType.TEXT_LARGE]: async (
      runtime: IAgentRuntime,
      {
        prompt,
        stopSequences = [],
        maxTokens = 8192,
        temperature = 0.7,
        frequencyPenalty = 0.7,
        presencePenalty = 0.7,
      }: GenerateTextParams
    ) => {
      logger.debug(`[AkashChat] TEXT_LARGE generation request`, { 
        promptLength: prompt.length,
        maxTokens,
        temperature,
      });

      const client = createAkashChatClient(runtime);
      const model = getLargeModel(runtime);

      const result = await generateAkashChatTextWithPriority(client, model, {
        prompt,
        system: runtime.character.system,
        temperature,
        maxTokens,
        frequencyPenalty,
        presencePenalty,
        stopSequences,
      }, 'background'); // Knowledge processing uses background priority

      logger.debug(`[AkashChat] TEXT_LARGE generated ${result.length} characters`);
      return result;
    },

    /**
     * Small model object generation with enhanced error handling
     */
    [ModelType.OBJECT_SMALL]: async (
      runtime: IAgentRuntime,
      params: ObjectGenerationParams
    ) => {
      logger.debug(`[AkashChat] OBJECT_SMALL generation request`, { 
        promptLength: params.prompt.length,
        hasSchema: !!params.schema,
      });

      const client = createAkashChatClient(runtime);
      const model = getSmallModel(runtime);

      const result = await generateAkashChatObjectWithPriority(client, model, params, 'foreground');
      logger.debug(`[AkashChat] OBJECT_SMALL generated object`);
      return result;
    },

    /**
     * Large model object generation with enhanced error handling
     */
    [ModelType.OBJECT_LARGE]: async (
      runtime: IAgentRuntime,
      params: ObjectGenerationParams
    ) => {
      logger.debug(`[AkashChat] OBJECT_LARGE generation request`, { 
        promptLength: params.prompt.length,
        hasSchema: !!params.schema,
      });

      const client = createAkashChatClient(runtime);
      const model = getLargeModel(runtime);

      const result = await generateAkashChatObjectWithPriority(client, model, params, 'background');
      logger.debug(`[AkashChat] OBJECT_LARGE generated object`);
      return result;
    },
  },

  /**
   * Comprehensive test suite with enhanced validation
   */
  tests: [
    {
      name: 'akash_chat_enhanced_plugin_tests',
      tests: [
        {
          name: 'akash_chat_test_api_connectivity_and_validation',
          fn: async (runtime: IAgentRuntime) => {
            try {
              const baseURL = getBaseURL(runtime);
              const apiKey = getApiKey(runtime);
              
              if (!apiKey) {
                throw new Error('API key not configured');
              }

              const response = await fetch(`${baseURL}/models`, {
                headers: {
                  Authorization: `Bearer ${apiKey}`,
                  'Content-Type': 'application/json',
                },
              });

              if (!response.ok) {
                throw new Error(`API validation failed: ${response.status} ${response.statusText}`);
              }

              const data = await response.json() as { data: Array<{ id: string }> };
              const modelCount = data.data?.length || 0;
              
              logger.info(`[AkashChat] API validation successful - ${modelCount} models available`);
              
              // Test model configuration
              const smallModel = getSmallModel(runtime);
              const largeModel = getLargeModel(runtime);
              const embeddingModel = getEmbeddingModel(runtime);
              
              logger.info(`[AkashChat] Model configuration test passed:`);
              logger.info(`  Small: ${smallModel}`);
              logger.info(`  Large: ${largeModel}`);
              logger.info(`  Embedding: ${embeddingModel}`);
              
            } catch (error) {
              logger.error(`[AkashChat] API validation failed: ${error instanceof Error ? error.message : String(error)}`);
              throw error;
            }
          },
        },
        {
          name: 'akash_chat_test_model_validation',
          fn: async (runtime: IAgentRuntime) => {
            try {
              // Test model validation functions
              const validTextModel = validateModel('Meta-Llama-3-1-8B-Instruct-FP8', 'text');
              const validEmbeddingModel = validateModel('BAAI-bge-large-en-v1-5', 'embedding');
              const invalidModel = validateModel('non-existent-model', 'text');
              
              if (!validTextModel) throw new Error('Valid text model validation failed');
              if (!validEmbeddingModel) throw new Error('Valid embedding model validation failed');
              if (invalidModel) throw new Error('Invalid model validation should have failed');
              
              logger.info('[AkashChat] Model validation tests passed');
              
              // Test model abstraction
              const smallModel = getSmallModel(runtime);
              const largeModel = getLargeModel(runtime);
              
              if (!validateModel(smallModel, 'text')) {
                throw new Error(`Small model ${smallModel} validation failed`);
              }
              if (!validateModel(largeModel, 'text')) {
                throw new Error(`Large model ${largeModel} validation failed`);
              }
              
              logger.info('[AkashChat] Model abstraction tests passed');
              
            } catch (error) {
              logger.error(`[AkashChat] Model validation test failed: ${error instanceof Error ? error.message : String(error)}`);
              throw error;
            }
          },
        },
        {
          name: 'akash_chat_test_enhanced_text_embedding',
          fn: async (runtime: IAgentRuntime) => {
            try {
              const embedding = await runtime.useModel(ModelType.TEXT_EMBEDDING, {
                text: 'Hello, Akash Network!',
              });
              
              if (!Array.isArray(embedding) || embedding.length === 0) {
                throw new Error('Invalid embedding format');
              }
              
              logger.info(`[AkashChat] Embedding test passed - length: ${embedding.length}`);
            } catch (error) {
              logger.error(`[AkashChat] Embedding test failed: ${error instanceof Error ? error.message : String(error)}`);
              throw error;
            }
          },
        },
        {
          name: 'akash_chat_test_enhanced_text_small',
          fn: async (runtime: IAgentRuntime) => {
            try {
              const text = await runtime.useModel(ModelType.TEXT_SMALL, {
                prompt: 'Explain Akash Network in 20 words.',
                maxTokens: 100,
              });
              
              if (!text || typeof text !== 'string' || text.length === 0) {
                throw new Error('Invalid text generation result');
              }
              
              logger.info(`[AkashChat] Small model test passed - generated ${text.length} characters`);
            } catch (error) {
              logger.error(`[AkashChat] Small model test failed: ${error instanceof Error ? error.message : String(error)}`);
              throw error;
            }
          },
        },
        {
          name: 'akash_chat_test_enhanced_text_large',
          fn: async (runtime: IAgentRuntime) => {
            try {
              const text = await runtime.useModel(ModelType.TEXT_LARGE, {
                prompt: 'What are the benefits of decentralized cloud computing?',
                maxTokens: 200,
              });
              
              if (!text || typeof text !== 'string' || text.length === 0) {
                throw new Error('Invalid text generation result');
              }
              
              logger.info(`[AkashChat] Large model test passed - generated ${text.length} characters`);
            } catch (error) {
              logger.error(`[AkashChat] Large model test failed: ${error instanceof Error ? error.message : String(error)}`);
              throw error;
            }
          },
        },
        {
          name: 'akash_chat_test_tokenization',
          fn: async (runtime: IAgentRuntime) => {
            try {
              const prompt = 'Hello Akash Network tokenization!';
              
              const tokens = await runtime.useModel(ModelType.TEXT_TOKENIZER_ENCODE, { 
                prompt,
                modelType: ModelType.TEXT_SMALL,
              });
              
              if (!Array.isArray(tokens) || tokens.length === 0) {
                throw new Error('Tokenization failed');
              }
              
              const decodedText = await runtime.useModel(ModelType.TEXT_TOKENIZER_DECODE, { 
                tokens,
                modelType: ModelType.TEXT_SMALL,
              });
              
              logger.info(`[AkashChat] Tokenization test passed - ${tokens.length} tokens`);
              logger.info(`[AkashChat] Original: "${prompt}"`);
              logger.info(`[AkashChat] Decoded: "${decodedText}"`);
              
            } catch (error) {
              logger.error(`[AkashChat] Tokenization test failed: ${error instanceof Error ? error.message : String(error)}`);
              throw error;
            }
          },
        },
        {
          name: 'akash_chat_test_object_generation',
          fn: async (runtime: IAgentRuntime) => {
            try {
              const result = await runtime.useModel(ModelType.OBJECT_SMALL, {
                prompt: 'Generate a JSON object with information about Akash Network including name, type, and description fields.',
                temperature: 0.1,
              });
              
              if (!result || typeof result !== 'object') {
                throw new Error('Object generation failed');
              }
              
              logger.info(`[AkashChat] Object generation test passed`);
              logger.info(`[AkashChat] Generated object:`, JSON.stringify(result, null, 2));
              
            } catch (error) {
              logger.error(`[AkashChat] Object generation test failed: ${error instanceof Error ? error.message : String(error)}`);
              throw error;
            }
          },
        },
        {
          name: 'akash_chat_test_concurrency_and_priority',
          fn: async (runtime: IAgentRuntime) => {
            try {
              // Test concurrent requests with different priorities
              const startTime = Date.now();
              
              const foregroundPromise1 = runtime.useModel(ModelType.TEXT_SMALL, {
                prompt: 'Quick response 1',
                maxTokens: 50,
              });
              
              const backgroundPromise = runtime.useModel(ModelType.TEXT_LARGE, {
                prompt: 'Background processing task',
                maxTokens: 100,
              });
              
              const foregroundPromise2 = runtime.useModel(ModelType.TEXT_SMALL, {
                prompt: 'Quick response 2',
                maxTokens: 50,
              });
              
              const results = await Promise.all([
                foregroundPromise1,
                backgroundPromise,
                foregroundPromise2,
              ]);
              
              const endTime = Date.now();
              const duration = endTime - startTime;
              
              if (results.some(result => !result || typeof result !== 'string')) {
                throw new Error('Concurrent request failed');
              }
              
              logger.info(`[AkashChat] Concurrency test passed - ${results.length} requests completed in ${duration}ms`);
              
            } catch (error) {
              logger.error(`[AkashChat] Concurrency test failed: ${error instanceof Error ? error.message : String(error)}`);
              throw error;
            }
          },
        },
      ],
    },
  ],
};

export default akashchatPlugin;
