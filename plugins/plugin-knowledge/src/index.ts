/**
 * Knowledge Plugin - Main Entry Point
 *
 * This file exports all the necessary functions and types for the Knowledge plugin.
 */
import type { Plugin, IAgentRuntime } from '@elizaos/core';
import { logger } from '@elizaos/core';
import { validateModelConfig, getKnowledgeConfig } from './config';
import { KnowledgeService } from './service';
import { knowledgeProvider } from './provider';
import knowledgeTestSuite from './tests';
import { knowledgeActions } from './actions';
import { knowledgeRoutes } from './routes';

/**
 * Knowledge Plugin - Provides Retrieval Augmented Generation capabilities
 */
export const knowledgePlugin: Plugin = {
  name: 'knowledge',
  description:
    'Plugin for Retrieval Augmented Generation, including knowledge management and embedding.',
  config: {
    // Token limits - these will be read from runtime settings during init
    MAX_INPUT_TOKENS: '4000',
    MAX_OUTPUT_TOKENS: '4096',

    // Contextual Knowledge settings
    CTX_KNOWLEDGE_ENABLED: 'false',
    
    // Document loading settings
    LOAD_DOCS_ON_STARTUP: 'true',
    
    // Git repository settings
    DOCS_REPOS: '',
  },
  async init(config: Record<string, string>, runtime?: IAgentRuntime) {
    try {
      // Validate the model configuration
      const validatedConfig = validateModelConfig(runtime);

      // Get the knowledge configuration
      const knowledgeConfig = getKnowledgeConfig(runtime, config);

      // Log the operational mode
      if (validatedConfig.CTX_KNOWLEDGE_ENABLED) {
        logger.info('Knowledge plugin: Contextual Knowledge mode enabled');
      } else {
        logger.info('Knowledge plugin: Basic Embedding mode');
      }

      if (runtime) {
        // Check if docs should be loaded on startup
        const loadDocsOnStartup = knowledgeConfig.LOAD_DOCS_ON_STARTUP;

        if (loadDocsOnStartup) {
          // Schedule document loading after service initialization
          setTimeout(async () => {
            try {
              const service = runtime.getService(KnowledgeService.serviceType);
              if (service instanceof KnowledgeService) {
                const { loadDocsFromPath } = await import('./docs-loader');
                
                // Create a combined config that includes repository settings
                const runtimeConfig: Record<string, string> = {
                  ...config,
                  DOCS_REPO_1_URL: knowledgeConfig.DOCS_REPO_1_URL ?? '',
                  DOCS_REPO_1_PATH: knowledgeConfig.DOCS_REPO_1_PATH ?? '',
                  DOCS_REPO_1_BRANCH: knowledgeConfig.DOCS_REPO_1_BRANCH ?? '',
                  DOCS_REPO_1_DOCS_PATH: knowledgeConfig.DOCS_REPO_1_DOCS_PATH ?? '',
                  DOCS_REPOS: knowledgeConfig.DOCS_REPOS ?? '',
                };
                
                const result = await loadDocsFromPath(service, runtime.agentId, undefined, runtimeConfig);
                if (result.successful > 0) {
                  logger.info(`Loaded ${result.successful} documents on startup`);
                }
              }
            } catch (error) {
              logger.error('Error loading documents on startup:', error);
            }
          }, 5000); // Delay to ensure services are fully initialized
        }
      }

      logger.info(
        'Knowledge Plugin initialized. Frontend panel should be discoverable via its public route.'
      );
    } catch (error) {
      logger.error('Failed to initialize Knowledge plugin:', error);
      throw error;
    }
  },
  services: [KnowledgeService],
  providers: [knowledgeProvider],
  routes: knowledgeRoutes,
  actions: knowledgeActions,
  tests: [knowledgeTestSuite],
};

export default knowledgePlugin;

export * from './types';
