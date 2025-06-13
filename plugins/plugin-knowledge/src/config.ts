import { ModelConfig, ModelConfigSchema, ProviderRateLimits, KnowledgeConfig } from './types.ts';
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

    // If EMBEDDING_PROVIDER is not provided, assume we're using plugin-openai
    const embeddingProvider = getSetting('EMBEDDING_PROVIDER');
    const assumePluginOpenAI = !embeddingProvider;

    if (assumePluginOpenAI) {
      const openaiApiKey = getSetting('OPENAI_API_KEY');
      const openaiEmbeddingModel = getSetting('OPENAI_EMBEDDING_MODEL');

      if (openaiApiKey && openaiEmbeddingModel) {
        logger.info('EMBEDDING_PROVIDER not specified, using configuration from plugin-openai');
      } else {
        logger.warn(
          'EMBEDDING_PROVIDER not specified, but plugin-openai configuration incomplete. Check OPENAI_API_KEY and OPENAI_EMBEDDING_MODEL.'
        );
      }
    }

    // Set embedding provider defaults based on plugin-openai if EMBEDDING_PROVIDER is not set
    const finalEmbeddingProvider = embeddingProvider || 'openai';
    const textEmbeddingModel =
      getSetting('TEXT_EMBEDDING_MODEL') ||
      getSetting('OPENAI_EMBEDDING_MODEL') ||
      (finalEmbeddingProvider === 'akash' ? 'BAAI-bge-large-en-v1-5' : 'text-embedding-3-small');
    const embeddingDimension =
      getSetting('EMBEDDING_DIMENSION') || 
      getSetting('OPENAI_EMBEDDING_DIMENSIONS') || 
      (finalEmbeddingProvider === 'akash' ? '1024' : '1536');

    // Use OpenAI API key from runtime settings
    const openaiApiKey = getSetting('OPENAI_API_KEY');
    // Use Akash Chat API key from runtime settings
    const akashChatApiKey = getSetting('AKASH_CHAT_API_KEY');

    const config = ModelConfigSchema.parse({
      EMBEDDING_PROVIDER: finalEmbeddingProvider,
      TEXT_PROVIDER: getSetting('TEXT_PROVIDER'),

      OPENAI_API_KEY: openaiApiKey,
      ANTHROPIC_API_KEY: getSetting('ANTHROPIC_API_KEY'),
      OPENROUTER_API_KEY: getSetting('OPENROUTER_API_KEY'),
      GOOGLE_API_KEY: getSetting('GOOGLE_API_KEY'),
      AKASH_CHAT_API_KEY: akashChatApiKey,

      OPENAI_BASE_URL: getSetting('OPENAI_BASE_URL'),
      ANTHROPIC_BASE_URL: getSetting('ANTHROPIC_BASE_URL'),
      OPENROUTER_BASE_URL: getSetting('OPENROUTER_BASE_URL'),
      GOOGLE_BASE_URL: getSetting('GOOGLE_BASE_URL'),
      AKASH_CHAT_BASE_URL: getSetting('AKASH_CHAT_BASE_URL', 'https://chatapi.akash.network/api/v1'),

      TEXT_EMBEDDING_MODEL: textEmbeddingModel,
      TEXT_MODEL: getSetting('TEXT_MODEL'),

      MAX_INPUT_TOKENS: getSetting('MAX_INPUT_TOKENS', '4000'),
      MAX_OUTPUT_TOKENS: getSetting('MAX_OUTPUT_TOKENS', '4096'),

      EMBEDDING_DIMENSION: embeddingDimension,

      CTX_KNOWLEDGE_ENABLED: ctxKnowledgeEnabled,
    });

    validateConfigRequirements(config, assumePluginOpenAI);
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
 * Get the knowledge configuration from runtime settings
 * @param runtime The agent runtime to get settings from
 * @param config Optional existing config object to extend
 * @returns The knowledge configuration
 */
export function getKnowledgeConfig(
  runtime?: IAgentRuntime,
  config?: Record<string, string>
): KnowledgeConfig {
  // Helper function to get setting from runtime, config, or fallback to process.env
  const getSetting = (key: string, defaultValue?: string) => {
    if (runtime) {
      return runtime.getSetting(key) || config?.[key] || process.env[key] || defaultValue;
    }
    return config?.[key] || process.env[key] || defaultValue;
  };

  // Get knowledge configuration settings
  return {
    CTX_KNOWLEDGE_ENABLED: getSetting('CTX_KNOWLEDGE_ENABLED') === 'true',
    LOAD_DOCS_ON_STARTUP: getSetting('LOAD_DOCS_ON_STARTUP') !== 'false',
    MAX_INPUT_TOKENS: getSetting('MAX_INPUT_TOKENS', '4000'),
    MAX_OUTPUT_TOKENS: getSetting('MAX_OUTPUT_TOKENS', '4096'),
    EMBEDDING_PROVIDER: getSetting('EMBEDDING_PROVIDER'),
    TEXT_PROVIDER: getSetting('TEXT_PROVIDER'),
    TEXT_EMBEDDING_MODEL: getSetting('TEXT_EMBEDDING_MODEL'),
    
    // Git repository settings
    DOCS_REPOS: getSetting('DOCS_REPOS'),
    
    // Individual repository configurations
    DOCS_REPO_1_URL: getSetting('DOCS_REPO_1_URL'),
    DOCS_REPO_1_PATH: getSetting('DOCS_REPO_1_PATH'),
    DOCS_REPO_1_BRANCH: getSetting('DOCS_REPO_1_BRANCH'),
    DOCS_REPO_1_DOCS_PATH: getSetting('DOCS_REPO_1_DOCS_PATH'),
  };
}

/**
 * Validates the required API keys and configuration based on the selected mode
 * @param config The model configuration to validate
 * @param assumePluginOpenAI Whether we're assuming plugin-openai is being used
 * @throws Error if a required configuration value is missing
 */
function validateConfigRequirements(config: ModelConfig, assumePluginOpenAI: boolean): void {
  // Skip validation for embedding provider if we're using plugin-openai's configuration
  if (!assumePluginOpenAI) {
    // Only validate embedding provider if not using plugin-openai
    if (config.EMBEDDING_PROVIDER === 'openai' && !config.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is required when EMBEDDING_PROVIDER is set to "openai"');
    }
    if (config.EMBEDDING_PROVIDER === 'google' && !config.GOOGLE_API_KEY) {
      throw new Error('GOOGLE_API_KEY is required when EMBEDDING_PROVIDER is set to "google"');
    }
    if (config.EMBEDDING_PROVIDER === 'akash' && !config.AKASH_CHAT_API_KEY) {
      throw new Error('AKASH_CHAT_API_KEY is required when EMBEDDING_PROVIDER is set to "akash"');
    }
  } else {
    // If we're assuming plugin-openai, make sure we have the required values
    if (!config.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is required when using plugin-openai configuration');
    }
    if (!config.TEXT_EMBEDDING_MODEL) {
      throw new Error('OPENAI_EMBEDDING_MODEL is required when using plugin-openai configuration');
    }
  }

  // If Contextual Knowledge is enabled, we need additional validations
  if (config.CTX_KNOWLEDGE_ENABLED) {
    logger.info('Contextual Knowledge is enabled. Validating text generation settings...');

    // Text provider and model are required for CTX_RAG
    if (!config.TEXT_PROVIDER) {
      throw new Error('TEXT_PROVIDER is required when CTX_KNOWLEDGE_ENABLED is true');
    }

    if (!config.TEXT_MODEL) {
      throw new Error('TEXT_MODEL is required when CTX_KNOWLEDGE_ENABLED is true');
    }

    // Validate API keys based on the text provider
    if (config.TEXT_PROVIDER === 'openai' && !config.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is required when TEXT_PROVIDER is set to "openai"');
    }
    if (config.TEXT_PROVIDER === 'anthropic' && !config.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is required when TEXT_PROVIDER is set to "anthropic"');
    }
    if (config.TEXT_PROVIDER === 'openrouter' && !config.OPENROUTER_API_KEY) {
      throw new Error('OPENROUTER_API_KEY is required when TEXT_PROVIDER is set to "openrouter"');
    }
    if (config.TEXT_PROVIDER === 'google' && !config.GOOGLE_API_KEY) {
      throw new Error('GOOGLE_API_KEY is required when TEXT_PROVIDER is set to "google"');
    }
    if (config.TEXT_PROVIDER === 'akash' && !config.AKASH_CHAT_API_KEY) {
      throw new Error('AKASH_CHAT_API_KEY is required when TEXT_PROVIDER is set to "akash"');
    }

    // If using OpenRouter with Claude or Gemini models, check for additional recommended configurations
    if (config.TEXT_PROVIDER === 'openrouter') {
      const modelName = config.TEXT_MODEL?.toLowerCase() || '';
      if (modelName.includes('claude') || modelName.includes('gemini')) {
        logger.info(
          `Using ${modelName} with OpenRouter. This configuration supports document caching for improved performance.`
        );
      }
    }
    
    // If using Akash Chat API, enable caching for supported models
    if (config.TEXT_PROVIDER === 'openai' && config.OPENAI_BASE_URL?.includes('chatapi.akash.network')) {
      const modelName = config.TEXT_MODEL?.toLowerCase() || '';
      if (modelName.includes('deepseek') || modelName.includes('llama') || modelName.includes('qwen')) {
        logger.info(
          `Using ${modelName} with Akash Chat API. This configuration supports document caching for improved performance.`
        );
      }
    }
    
    // If using akash text provider directly
    if (config.TEXT_PROVIDER === 'akash') {
      const modelName = config.TEXT_MODEL?.toLowerCase() || '';
      if (modelName.includes('deepseek') || modelName.includes('llama') || modelName.includes('qwen')) {
        logger.info(
          `Using ${modelName} with Akash Chat API. This configuration supports document caching for improved performance.`
        );
      }
    }
  } else {
    // Log appropriate message based on where embedding config came from
    if (assumePluginOpenAI) {
      logger.info(
        'Contextual Knowledge is disabled. Using embedding configuration from plugin-openai.'
      );
    } else {
      logger.info('Contextual Knowledge is disabled. Using basic embedding-only configuration.');
    }
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
    case 'openai':
      // OpenAI typically allows 150,000 tokens per minute for embeddings
      // and up to 3,000 RPM for Tier 4+ accounts
      return {
        maxConcurrentRequests,
        requestsPerMinute: Math.min(requestsPerMinute, 3000),
        tokensPerMinute: Math.min(tokensPerMinute, 150000),
        provider: 'openai',
      };

    case 'google':
      // Google's default is 60 requests per minute
      return {
        maxConcurrentRequests,
        requestsPerMinute: Math.min(requestsPerMinute, 60),
        tokensPerMinute: Math.min(tokensPerMinute, 100000),
        provider: 'google',
      };
      
    case 'akash':
      // Akash Chat API rate limits - using more aggressive defaults
      return {
        maxConcurrentRequests: Math.min(maxConcurrentRequests, 100),
        requestsPerMinute: Math.min(requestsPerMinute, 500),
        tokensPerMinute: Math.min(tokensPerMinute, 500000),
        provider: 'akash',
      };

    default:
      // Use default values for unknown providers
      return {
        maxConcurrentRequests,
        requestsPerMinute,
        tokensPerMinute,
        provider: config.EMBEDDING_PROVIDER,
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
