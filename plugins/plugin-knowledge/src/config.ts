import { ModelConfig, ModelConfigSchema, ProviderRateLimits } from './types.ts';
import z from 'zod';
import { logger, IAgentRuntime } from '@elizaos/core';

/**
 * Validates the model configuration using runtime settings
 * @param runtime The agent runtime to get settings from
 * @returns The validated configuration or throws an error
 */
export function validateModelConfig(runtime?: IAgentRuntime): ModelConfig {
  try {
    // Helper function to get setting from runtime or fallback to process.env
    const getSetting = (key: string, defaultValue?: string) => {
      if (runtime) {
        return runtime.getSetting(key) || defaultValue;
      }
      return process.env[key] || defaultValue;
    };

    // Determine if contextual Knowledge is enabled
    const ctxKnowledgeEnabled = getSetting('CTX_KNOWLEDGE_ENABLED') === 'true';
    logger.debug(`Configuration: CTX_KNOWLEDGE_ENABLED=${ctxKnowledgeEnabled}`);

    // If EMBEDDING_PROVIDER is not provided, assume we're using akash-chat
    const embeddingProvider = getSetting('EMBEDDING_PROVIDER');
    const assumeAkashChat = !embeddingProvider;

    if (assumeAkashChat) {
      const akashChatApiKey = getSetting('AKASH_CHAT_API_KEY');
      const embeddingModel = getSetting('TEXT_EMBEDDING_MODEL');

      if (akashChatApiKey && embeddingModel) {
        logger.debug('EMBEDDING_PROVIDER not specified, using configuration from akash-chat');
      } else {
        logger.debug(
          'EMBEDDING_PROVIDER not specified. Assuming embeddings are provided by another plugin.'
        );
      }
    }

    // Only set embedding provider if explicitly configured
    // If not set, let the runtime handle embeddings (e.g., plugin-google-genai)
    const finalEmbeddingProvider = embeddingProvider;

    const textEmbeddingModel =
      getSetting('TEXT_EMBEDDING_MODEL') ||
      'BAAI-bge-large-en-v1-5';
    const embeddingDimension =
      getSetting('EMBEDDING_DIMENSION') || '1024';

    // Remove legacy OpenAI configuration
    
    const config = ModelConfigSchema.parse({
      EMBEDDING_PROVIDER: finalEmbeddingProvider,
      TEXT_PROVIDER: getSetting('TEXT_PROVIDER'),

      AKASH_CHAT_API_KEY: getSetting('AKASH_CHAT_API_KEY'),
      AKASH_CHAT_BASE_URL: getSetting('AKASH_CHAT_BASE_URL') || 'https://chatapi.akash.network/api/v1',

      TEXT_EMBEDDING_MODEL: textEmbeddingModel,
      TEXT_MODEL: getSetting('TEXT_MODEL') || 'Meta-Llama-3-1-8B-Instruct-FP8',
      CTX_KNOWLEDGE_MODEL: getSetting('CTX_KNOWLEDGE_MODEL') || 'DeepSeek-R1-Distill-Llama-70B',

      MAX_INPUT_TOKENS: getSetting('MAX_INPUT_TOKENS', '4000'),
      MAX_OUTPUT_TOKENS: getSetting('MAX_OUTPUT_TOKENS', '4096'),

      EMBEDDING_DIMENSION: embeddingDimension,

      CTX_KNOWLEDGE_ENABLED: ctxKnowledgeEnabled,
    });

    validateConfigRequirements(config, assumeAkashChat);
    return config;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join(', ');
      throw new Error(`Model configuration validation failed: ${issues}`);
    }
    throw error;
  }
}

/**
 * Validates the required API keys and configuration based on the selected mode
 * @param config The model configuration to validate
 * @param assumeAkashChat Whether we're assuming akash-chat is being used
 * @throws Error if a required configuration value is missing
 */
function validateConfigRequirements(config: ModelConfig, assumeAkashChat: boolean): void {
  // Only validate embedding requirements if EMBEDDING_PROVIDER is explicitly set
  const embeddingProvider = config.EMBEDDING_PROVIDER;

  // If EMBEDDING_PROVIDER is explicitly set, validate its requirements
  if (embeddingProvider === 'akash-chat' && !config.AKASH_CHAT_API_KEY) {
    throw new Error('AKASH_CHAT_API_KEY is required when EMBEDDING_PROVIDER is set to "akash-chat"');
  }

  // If no embedding provider is set, skip validation - let runtime handle it
  if (!embeddingProvider) {
    logger.debug('No EMBEDDING_PROVIDER specified. Embeddings will be handled by the runtime.');
  }

  // If Contextual Knowledge is enabled, we need additional validations
  if (config.CTX_KNOWLEDGE_ENABLED) {
    logger.debug('Contextual Knowledge is enabled. Validating text generation settings...');

    // Validate API keys based on the text provider
    if (config.TEXT_PROVIDER === 'akash-chat' && !config.AKASH_CHAT_API_KEY) {
      throw new Error('AKASH_CHAT_API_KEY is required when TEXT_PROVIDER is set to "akash-chat"');
    }

    // Validate that TEXT_MODEL is provided for akash-chat
    if (config.TEXT_PROVIDER === 'akash-chat' && !config.TEXT_MODEL) {
      throw new Error('TEXT_MODEL is required when TEXT_PROVIDER is set to "akash-chat"');
    }
  } else {
    logger.debug('Contextual Knowledge is disabled. Using configured provider for embeddings only.');
  }
}

/**
 * Returns rate limit information for the configured providers
 *
 * @param runtime The agent runtime to get settings from
 * @returns Rate limit configuration for the current providers
 */
export async function getProviderRateLimits(runtime?: IAgentRuntime): Promise<ProviderRateLimits> {
  const config = validateModelConfig(runtime);

  // Helper function to get setting from runtime or fallback to process.env
  const getSetting = (key: string, defaultValue: string) => {
    if (runtime) {
      return runtime.getSetting(key) || defaultValue;
    }
    return process.env[key] || defaultValue;
  };

  // Get rate limit values from runtime settings or use defaults
  const maxConcurrentRequests = parseInt(getSetting('MAX_CONCURRENT_REQUESTS', '30'), 10);
  const requestsPerMinute = parseInt(getSetting('REQUESTS_PER_MINUTE', '60'), 10);
  const tokensPerMinute = parseInt(getSetting('TOKENS_PER_MINUTE', '150000'), 10);

  // Provider-specific rate limits
  switch (config.EMBEDDING_PROVIDER) {
    case 'akash-chat':
      // Akash Chat API rate limits
      return {
        maxConcurrentRequests,
        requestsPerMinute: Math.min(requestsPerMinute, 100),
        tokensPerMinute: Math.min(tokensPerMinute, 100000),
        provider: 'akash-chat',
      };

    default:
      // Use default values for unknown providers
      return {
        maxConcurrentRequests,
        requestsPerMinute,
        tokensPerMinute,
        provider: config.EMBEDDING_PROVIDER || 'akash-chat',
      };
  }
}

/**
 * Helper function to get integer value from environment variables
 * @param envVar The environment variable name
 * @param defaultValue The default value if not present
 * @returns The parsed integer value
 */
function getEnvInt(envVar: string, defaultValue: number): number {
  return process.env[envVar] ? parseInt(process.env[envVar]!, 10) : defaultValue;
}
