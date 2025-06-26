import { createOpenAI } from '@ai-sdk/openai';
import type {
  ModelTypeName,
  ObjectGenerationParams,
  Plugin,
  TextEmbeddingParams,
} from '@elizaos/core';
import {
  type DetokenizeTextParams,
  type GenerateTextParams,
  ModelType,
  type TokenizeTextParams,
  logger,
  VECTOR_DIMS,
} from '@elizaos/core';
import { generateObject, generateText } from 'ai';
import { type TiktokenModel, encodingForModel } from 'js-tiktoken';

/**
 * Runtime interface for the AkashChat plugin
 */
interface Runtime {
  getSetting(key: string): string | undefined;
  character: {
    system?: string;
  };
  fetch?: typeof fetch;
  hasModelHandler?: (modelType: ModelTypeName) => boolean;
}

// Cache for API clients to avoid recreating them
const clientCache = new Map<string, ReturnType<typeof createOpenAI>>();

// Cache for tokenizers to avoid recreating them
const tokenizerCache = new Map<string, any>();

// Request queue with priority support to manage concurrent requests and respect rate limits
class PriorityRequestQueue {
  private foregroundQueue: Array<() => Promise<any>> = []; // User chat requests (high priority)
  private backgroundQueue: Array<() => Promise<any>> = []; // Knowledge processing requests (low priority)
  private activeRequests = 0;
  private readonly maxConcurrentRequests = 2; // Reduced to 2 to stay well under API limit of 3
  private readonly maxBackgroundRequests = 1; // Reserve at least 1 slot for foreground requests
  private lastLogTime = 0; // For periodic queue status logging
  
  async enqueue<T>(requestFn: () => Promise<T>, priority: 'foreground' | 'background' = 'foreground'): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const wrappedRequest = async () => {
        this.activeRequests++;
        
        // Periodic logging when queue is busy
        this.logQueueStatusIfNeeded();
        
        try {
          const result = await requestFn();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.activeRequests--;
          this.processQueue();
        }
      };
      
      // Add to appropriate queue based on priority
      if (priority === 'foreground') {
        this.foregroundQueue.push(wrappedRequest);
      } else {
        this.backgroundQueue.push(wrappedRequest);
      }
      
      this.processQueue();
    });
  }
  
  private processQueue() {
    if (this.activeRequests >= this.maxConcurrentRequests) {
      return; // All slots occupied
    }
    
    // Always prioritize foreground requests
    if (this.foregroundQueue.length > 0) {
      const nextRequest = this.foregroundQueue.shift();
      if (nextRequest) {
        nextRequest();
      }
      return;
    }
    
    // Process background requests only if we have available slots and don't exceed background limit
    if (this.backgroundQueue.length > 0 && this.activeRequests < this.maxBackgroundRequests) {
      const nextRequest = this.backgroundQueue.shift();
      if (nextRequest) {
        nextRequest();
      }
    }
  }
  
  private logQueueStatusIfNeeded() {
    const now = Date.now();
    const shouldLog = (
      // Log every 30 seconds when there's queue activity
      (now - this.lastLogTime > 30000) &&
      // But only if there's something interesting to report
      (this.foregroundQueue.length > 0 || this.backgroundQueue.length > 2 || this.activeRequests > 0)
    );
    
    if (shouldLog) {
      const status = this.getQueueStatus();
      logger.info(`🔄 Akash Chat Queue Status: active=${status.activeRequests}, fg_queue=${status.foregroundQueue}, bg_queue=${status.backgroundQueue}`);
      this.lastLogTime = now;
    }
  }
  
  // Method to get queue status for debugging
  getQueueStatus() {
    return {
      activeRequests: this.activeRequests,
      foregroundQueue: this.foregroundQueue.length,
      backgroundQueue: this.backgroundQueue.length,
      maxConcurrentRequests: this.maxConcurrentRequests,
      maxBackgroundRequests: this.maxBackgroundRequests
    };
  }
}

// Global priority request queue instance
const requestQueue = new PriorityRequestQueue();

/**
 * Helper function to get settings with fallback to process.env
 */
function getSetting(runtime: any, key: string, defaultValue?: string): string | undefined {
  return runtime.getSetting(key) ?? process.env[key] ?? defaultValue;
}

/**
 * Helper function to get the base URL for AkashChat API
 */
function getBaseURL(): string {
  return 'https://chatapi.akash.network/api/v1';
}

/**
 * Helper function to get the API key for AkashChat
 */
function getApiKey(runtime: any): string | undefined {
  return getSetting(runtime, 'AKASH_CHAT_API_KEY');
}

/**
 * Gets the API URL to use, with Cloudflare Gateway support if enabled
 */
function getApiURL(runtime: Runtime): string {
  try {
    const isCloudflareEnabled = runtime.getSetting('CLOUDFLARE_GW_ENABLED') === 'true';
    if (!isCloudflareEnabled) {
      return getBaseURL();
    }

    const cloudflareAccountId = runtime.getSetting('CLOUDFLARE_AI_ACCOUNT_ID');
    const cloudflareGatewayId = runtime.getSetting('CLOUDFLARE_AI_GATEWAY_ID');
    
    if (!cloudflareAccountId || !cloudflareGatewayId) {
      return getBaseURL();
    }
    
    return `https://gateway.ai.cloudflare.com/v1/${cloudflareAccountId}/${cloudflareGatewayId}/akashchat`;
  } catch (error) {
    return getBaseURL();
  }
}

/**
 * Check if a model type is supported in the current ElizaOS version
 */
function isModelTypeSupported(runtime: any, modelType: ModelTypeName): boolean {
  try {
    // Try to access the model handler registry to see if this type is registered
    return runtime.hasModelHandler?.(modelType as any) ?? 
           // Fallback check for older versions
           Object.values(ModelType).includes(modelType as any);
  } catch (error) {
    // If there's an error, assume it's not supported
    return false;
  }
}

/**
 * Get or create an API client for Akash Chat
 */
function getAkashChatClient(runtime: Runtime): ReturnType<typeof createOpenAI> {
  const baseURL = getApiURL(runtime);
  const apiKey = getApiKey(runtime);
  
  // Create a cache key based on the API URL and key
  const cacheKey = `${baseURL}:${apiKey}`;
  
  // Return cached client if available
  if (clientCache.has(cacheKey)) {
    return clientCache.get(cacheKey)!;
  }
  
  // Create new client
  const client = createOpenAI({
    apiKey: apiKey!,
    fetch: runtime.fetch,
    baseURL,
  });
  
  // Cache the client
  clientCache.set(cacheKey, client);
  return client;
}

/**
 * Maps ElizaOS model types to Akash Chat model names
 */
function getModelName(runtime: Runtime, modelType: ModelTypeName): string {
  switch (modelType) {
    case ModelType.TEXT_SMALL:
      return getSetting(runtime, 'AKASH_CHAT_SMALL_MODEL') || 'Meta-Llama-3-1-8B-Instruct-FP8';
    default:
      return getSetting(runtime, 'AKASH_CHAT_LARGE_MODEL') || 'Meta-Llama-3-3-70B-Instruct';
  }
}

/**
 * Get a tokenizer for the specified model, with caching
 */
function getTokenizer(modelName: string) {
  if (tokenizerCache.has(modelName)) {
    return tokenizerCache.get(modelName);
  }
  
  const encoding = encodingForModel(modelName as TiktokenModel);
  tokenizerCache.set(modelName, encoding);
  return encoding;
}

/**
 * Tokenizes text using the specified model
 */
async function tokenizeText(runtime: Runtime, model: ModelTypeName, prompt: string) {
  try {
    const modelName = getModelName(runtime, model);
    const encoding = getTokenizer(modelName);
    return encoding.encode(prompt);
  } catch (error) {
    logger.error('Error in tokenizeText:', error);
    return [];
  }
}

/**
 * Detokenize a sequence of tokens back into text using the specified model
 */
async function detokenizeText(runtime: Runtime, model: ModelTypeName, tokens: number[]) {
  try {
    const modelName = getModelName(runtime, model);
    const encoding = getTokenizer(modelName);
    return encoding.decode(tokens);
  } catch (error) {
    logger.error('Error in detokenizeText:', error);
    return '';
  }
}

/**
 * Handles rate limit errors with exponential backoff
 */
async function handleRateLimitError(error: Error, retryFn: () => Promise<unknown>, retryCount = 0) {
  if (!error.message.includes('Rate limit')) {
    throw error;
  }
  
  // Extract retry delay from error message if possible
  let retryDelay = Math.min(10000 * Math.pow(1.5, retryCount), 60000); // Exponential backoff with 1 minute max
  const delayMatch = error.message.match(/try again in (\d+\.?\d*)s/i);
  
  if (delayMatch?.[1]) {
    // Convert to milliseconds and add a small buffer
    retryDelay = Math.ceil(Number.parseFloat(delayMatch[1]) * 1000) + 500;
  }
  
  logger.info(`Rate limit reached. Retrying after ${retryDelay}ms (attempt ${retryCount + 1})`);
  await new Promise((resolve) => setTimeout(resolve, retryDelay));
  
  try {
    return await retryFn();
  } catch (retryError: any) {
    if (retryError.message.includes('Rate limit') && retryCount < 3) {
      return handleRateLimitError(retryError, retryFn, retryCount + 1);
    }
    throw retryError;
  }
}

/**
 * Generate text using AkashChat API with optimized handling and request queuing
 * This is considered a foreground operation (user chat) and gets high priority
 */
async function generateAkashChatText(
  akashchat: ReturnType<typeof createOpenAI>,
  model: string,
  params: {
    prompt: string;
    system?: string;
    temperature: number;
    maxTokens: number;
    frequencyPenalty: number;
    presencePenalty: number;
    stopSequences: string[];
  }
) {
  return generateAkashChatTextWithPriority(akashchat, model, params, 'foreground');
}

/**
 * Generate text using AkashChat API with configurable priority
 */
async function generateAkashChatTextWithPriority(
  akashchat: ReturnType<typeof createOpenAI>,
  model: string,
  params: {
    prompt: string;
    system?: string;
    temperature: number;
    maxTokens: number;
    frequencyPenalty: number;
    presencePenalty: number;
    stopSequences: string[];
  },
  priority: 'foreground' | 'background' = 'foreground'
) {
  return requestQueue.enqueue(async () => {
    try {
      const { text } = await generateText({
        model: akashchat.languageModel(model),
        prompt: params.prompt,
        system: params.system,
        temperature: params.temperature,
        maxTokens: params.maxTokens,
        frequencyPenalty: params.frequencyPenalty,
        presencePenalty: params.presencePenalty,
        stopSequences: params.stopSequences,
      });
      
      // Log model usage for debugging
      const taskType = priority === 'background' ? 'knowledge' : 'chat';
      logger.debug(`🤖 Akash Chat: Used model "${model}" for ${taskType} task (${priority} priority)`);
      
      return text;
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes('Rate limit')) {
        return handleRateLimitError(error, () => 
          generateAkashChatTextWithPriority(akashchat, model, params, priority)
        ) as Promise<string>;
      }
      
      logger.error('Error generating text:', error);
      return 'Error generating text. Please try again later.';
    }
  }, priority);
}

/**
 * Generate object using AkashChat API with optimized handling and request queuing
 * This is considered a foreground operation (user chat) and gets high priority
 */
async function generateAkashChatObject(
  akashchat: ReturnType<typeof createOpenAI>,
  model: string,
  params: ObjectGenerationParams
) {
  return generateAkashChatObjectWithPriority(akashchat, model, params, 'foreground');
}

/**
 * Generate object using AkashChat API with configurable priority
 */
async function generateAkashChatObjectWithPriority(
  akashchat: ReturnType<typeof createOpenAI>,
  model: string,
  params: ObjectGenerationParams,
  priority: 'foreground' | 'background' = 'foreground'
) {
  return requestQueue.enqueue(async () => {
    try {
      const { object } = await generateObject({
        model: akashchat.languageModel(model),
        output: params.schema as any || 'no-schema',
        prompt: params.prompt,
        temperature: params.temperature,
      });
      
      // Log model usage for debugging
      const taskType = priority === 'background' ? 'knowledge' : 'chat';
      logger.debug(`🤖 Akash Chat: Used model "${model}" for ${taskType} object task (${priority} priority)`);
      
      return object;
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes('Rate limit')) {
        return handleRateLimitError(error, () => 
          generateAkashChatObjectWithPriority(akashchat, model, params, priority)
        );
      }
      
      logger.error('Error generating object:', error);
      return {};
    }
  }, priority);
}

/**
 * Get current queue status for monitoring and debugging
 */
export function getRequestQueueStatus() {
  return requestQueue.getQueueStatus();
}

export const akashchatPlugin: Plugin = {
  name: 'akashchat',
  description: 'AkashChat API plugin for language model capabilities via Akash Network',
  
  config: {
    AKASH_CHAT_API_KEY: process.env.AKASH_CHAT_API_KEY,
    AKASH_CHAT_SMALL_MODEL: process.env.AKASH_CHAT_SMALL_MODEL || 'Meta-Llama-3-1-8B-Instruct-FP8',
    AKASH_CHAT_LARGE_MODEL: process.env.AKASH_CHAT_LARGE_MODEL || 'Meta-Llama-3-3-70B-Instruct',
    AKASHCHAT_EMBEDDING_MODEL: process.env.AKASHCHAT_EMBEDDING_MODEL || 'BAAI-bge-large-en-v1-5',
    AKASHCHAT_EMBEDDING_DIMENSIONS: process.env.AKASHCHAT_EMBEDDING_DIMENSIONS || '1024',
    ENABLE_DOCUMENT_CACHING: process.env.ENABLE_DOCUMENT_CACHING || 'true',
    CACHE_OPTIMIZATION: process.env.CACHE_OPTIMIZATION || 'true',
  },
  
  async init(config: Record<string, string>, runtime: any) {
    const apiKey = getApiKey(runtime);
    console.log('DEBUG: Akash Chat API Key from runtime:', apiKey);
    console.log('DEBUG: Process env AKASH_CHAT_API_KEY:', process.env.AKASH_CHAT_API_KEY);
    console.log('DEBUG: Runtime getSetting AKASH_CHAT_API_KEY:', runtime.getSetting('AKASH_CHAT_API_KEY'));
    if (!apiKey) {
      throw Error('Missing AKASH_CHAT_API_KEY in environment variables or settings');
    }
    
    // Pre-warm the client cache
    getAkashChatClient(runtime);
    
    // Log initial queue status
    logger.info('✅ Akash Chat plugin initialized with priority request queue', requestQueue.getQueueStatus());
    
    // Validate API key
    try {
      const baseURL = getBaseURL();
      const response = await fetch(`${baseURL}/models`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      
      if (!response.ok) {
        logger.warn(`API key validation failed: ${response.status} ${response.statusText}`);
      } else {
        const data = await response.json();
        logger.info(`✅ Akash Chat API connected successfully. Models available: ${(data as any)?.data?.length || 0}`);
      }
    } catch (error) {
      logger.warn('Could not validate Akash Chat API key:', error);
    }
  },
  
  models: {
    async [ModelType.TEXT_EMBEDDING](runtime, params) {
      logger.debug(`[AkashChatPlugin] Model handler called: TEXT_EMBEDDING, params:`, params);
      
      const embeddingDimension = parseInt(
        getSetting(runtime, 'AKASHCHAT_EMBEDDING_DIMENSIONS', '1024')
      ) as (typeof VECTOR_DIMS)[keyof typeof VECTOR_DIMS];
      
      // Validate embedding dimension
      if (!Object.values(VECTOR_DIMS).includes(embeddingDimension)) {
        logger.error(`Invalid embedding dimension: ${embeddingDimension}`);
        throw new Error(`Invalid embedding dimension: ${embeddingDimension}`);
      }
      
      // Handle null input (initialization case)
      if (params === null) {
        const testVector = Array(embeddingDimension).fill(0);
        testVector[0] = 0.1;
        return testVector;
      }
      
      // Get the text from whatever format was provided
      let text: string;
      if (typeof params === 'string') {
        text = params;
      } else if (typeof params === 'object' && params.text) {
        text = params.text;
      } else {
        const fallbackVector = Array(embeddingDimension).fill(0);
        fallbackVector[0] = 0.2;
        return fallbackVector;
      }
      
      // Skip API call for empty text
      if (!text.trim()) {
        const emptyVector = Array(embeddingDimension).fill(0);
        emptyVector[0] = 0.3;
        return emptyVector;
      }
      
      try {
        const baseURL = getBaseURL();
        const response = await requestQueue.enqueue(async () => {
          return fetch(`${baseURL}/embeddings`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${getApiKey(runtime)}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: getSetting(runtime, 'AKASHCHAT_EMBEDDING_MODEL', 'BAAI-bge-large-en-v1-5'),
              input: text,
            }),
          });
        }, 'background'); // Low priority for knowledge base processing
        
        if (!response.ok) {
          const errorVector = Array(embeddingDimension).fill(0);
          errorVector[0] = 0.4;
          return errorVector;
        }
        
        const data = (await response.json()) as { data: [{ embedding: number[] }] };
        
        if (!data?.data?.[0]?.embedding) {
          const errorVector = Array(embeddingDimension).fill(0);
          errorVector[0] = 0.5;
          return errorVector;
        }
        
        return data.data[0].embedding;
      } catch (error) {
        logger.error('Error generating embedding:', error);
        const errorVector = Array(embeddingDimension).fill(0);
        errorVector[0] = 0.6;
        return errorVector;
      }
    },
    
    async [ModelType.TEXT_TOKENIZER_ENCODE](runtime, { prompt, modelType = ModelType.TEXT_LARGE }: TokenizeTextParams) {
      return tokenizeText(runtime, modelType ?? ModelType.TEXT_LARGE, prompt);
    },
    
    async [ModelType.TEXT_TOKENIZER_DECODE](runtime, { tokens, modelType = ModelType.TEXT_LARGE }: DetokenizeTextParams) {
      return detokenizeText(runtime, modelType ?? ModelType.TEXT_LARGE, tokens);
    },
    
    async [ModelType.TEXT_SMALL](runtime, { 
      prompt, 
      stopSequences = [],
      maxTokens = 8192,
      temperature =  0.7,
      frequencyPenalty = 0.7,
      presencePenalty = 0.7,
    }: GenerateTextParams) {
      logger.debug(`[AkashChatPlugin] Model handler called: TEXT_SMALL, params:`, { 
        prompt, 
        stopSequences, 
        maxTokens, 
        temperature, 
        frequencyPenalty, 
        presencePenalty 
      });
      
      const akashchat = getAkashChatClient(runtime);
      const model = getModelName(runtime, ModelType.TEXT_SMALL);
      
      // Use foreground priority for TEXT_SMALL (typically user chat)
      return generateAkashChatTextWithPriority(akashchat, model, {
        prompt,
        system: runtime.character.system,
        temperature,
        maxTokens,
        frequencyPenalty,
        presencePenalty,
        stopSequences,
      }, 'foreground');
    },
    
    async [ModelType.TEXT_LARGE](runtime, {
      prompt,
      stopSequences = [],
      maxTokens = 8192,
      temperature = 0.7,
      frequencyPenalty = 0.7,
      presencePenalty = 0.7,
    }: GenerateTextParams) {
      logger.debug(`[AkashChatPlugin] Model handler called: TEXT_LARGE, params:`, { 
        prompt, 
        stopSequences, 
        maxTokens, 
        temperature, 
        frequencyPenalty, 
        presencePenalty 
      });
      
      const akashchat = getAkashChatClient(runtime);
      const model = getModelName(runtime, ModelType.TEXT_LARGE);
      
      // Use background priority for TEXT_LARGE (typically knowledge processing)
      return generateAkashChatTextWithPriority(akashchat, model, {
        prompt,
        system: runtime.character.system,
        temperature,
        maxTokens,
        frequencyPenalty,
        presencePenalty,
        stopSequences,
      }, 'background');
    },
    
    async [ModelType.OBJECT_SMALL](runtime, params: ObjectGenerationParams) {
      logger.debug(`[AkashChatPlugin] Model handler called: OBJECT_SMALL, params:`, params);
      
      const akashchat = getAkashChatClient(runtime);
      const model = getModelName(runtime, ModelType.TEXT_SMALL);
      
      // Use foreground priority for OBJECT_SMALL (typically user chat)
      return generateAkashChatObjectWithPriority(akashchat, model, params, 'foreground');
    },
    
    async [ModelType.OBJECT_LARGE](runtime, params: ObjectGenerationParams) {
      logger.debug(`[AkashChatPlugin] Model handler called: OBJECT_LARGE, params:`, params);
      
      const akashchat = getAkashChatClient(runtime);
      const model = getModelName(runtime, ModelType.TEXT_LARGE);
      
      // Use background priority for OBJECT_LARGE (typically knowledge processing)
      return generateAkashChatObjectWithPriority(akashchat, model, params, 'background');
    },
  },
  
  tests: [
    {
      name: 'akashchat_plugin_tests',
      tests: [
        {
          name: 'akashchat_test_url_and_api_key_validation',
          fn: async (runtime) => {
            try {
              const baseURL = getBaseURL();
              const response = await fetch(`${baseURL}/models`, {
                headers: {
                  Authorization: `Bearer ${runtime.getSetting('AKASH_CHAT_API_KEY')}`,
                },
              });
              
              if (!response.ok) {
                logger.error(`Failed to validate Akash Chat API key: ${response.statusText}`);
                return;
              }
              
              const data = await response.json();
              logger.log('Models Available:', (data as { data: unknown[] })?.data?.length);
            } catch (error) {
              logger.error('Error in akashchat_test_url_and_api_key_validation:', error);
            }
          },
        },
        {
          name: 'akashchat_test_text_embedding',
          fn: async (runtime) => {
            try {
              const embedding = await runtime.useModel(ModelType.TEXT_EMBEDDING, {
                text: 'Hello, world!',
              });
              logger.log('Embedding generated with length:', embedding.length);
            } catch (error) {
              logger.error('Error in test_text_embedding:', error);
            }
          },
        },
        {
          name: 'akashchat_test_text_large',
          fn: async (runtime) => {
            try {
              const text = await runtime.useModel(ModelType.TEXT_LARGE, {
                prompt: 'What is the nature of reality in 10 words?',
              });
              logger.log('Generated with test_text_large:', text);
            } catch (error) {
              logger.error('Error in test_text_large:', error);
            }
          },
        },
        {
          name: 'akashchat_test_text_small',
          fn: async (runtime) => {
            try {
              const text = await runtime.useModel(ModelType.TEXT_SMALL, {
                prompt: 'What is the nature of reality in 10 words?',
              });
              logger.log('Generated with test_text_small:', text);
            } catch (error) {
              logger.error('Error in test_text_small:', error);
            }
          },
        },
      ],
    },
  ],
};

export default akashchatPlugin;