import { generateText as aiGenerateText, embed, GenerateTextResult } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { ModelConfig, TextGenerationOptions } from './types';
import { validateModelConfig } from './config';
import { logger } from '@elizaos/core';

// Re-export for backwards compatibility
export { validateModelConfig } from './config';
export { getProviderRateLimits } from './config';
export type { ModelConfig, ProviderRateLimits } from './types';

/**
 * Generates text embeddings using the Akash Chat API
 * @param text The text to embed
 * @returns The embedding vector
 */
export async function generateTextEmbedding(text: string): Promise<{ embedding: number[] }> {
  const config = validateModelConfig();
  const dimensions = config.EMBEDDING_DIMENSION;

  try {
    if (config.EMBEDDING_PROVIDER === 'akash-chat') {
      return await generateAkashChatEmbedding(text, config, dimensions);
    }

    throw new Error(`Unsupported embedding provider: ${config.EMBEDDING_PROVIDER}. Only akash-chat is supported.`);
  } catch (error) {
    logger.error(
      `[LLM Service - ${config.EMBEDDING_PROVIDER} Embedding] Error generating embedding:`,
      error
    );
    throw error;
  }
}

/**
 * Generates text embeddings in batches for improved performance
 * @param texts Array of texts to embed
 * @param batchSize Maximum number of texts to process in each batch (default: 20)
 * @returns Array of embedding results with success indicators
 */
export async function generateTextEmbeddingsBatch(
  texts: string[],
  batchSize: number = 20
): Promise<Array<{ embedding: number[] | null; success: boolean; error?: any; index: number }>> {
  const config = validateModelConfig();
  const results: Array<{ embedding: number[] | null; success: boolean; error?: any; index: number }> =
    [];

  logger.debug(`[LLM Service - Batch Embedding] Processing ${texts.length} texts in batches of ${batchSize}`);

  // Process texts in batches
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const batchStartIndex = i;

    logger.debug(
      `[LLM Service - Batch Embedding] Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(texts.length / batchSize)} (${batch.length} items)`
    );

    // Process batch in parallel
    const batchPromises = batch.map(async (text, batchIndex) => {
      const globalIndex = batchStartIndex + batchIndex;
      try {
        const result = await generateTextEmbedding(text);
        return {
          embedding: result.embedding,
          success: true,
          index: globalIndex,
        };
      } catch (error) {
        logger.error(
          `[LLM Service - Batch Embedding] Error generating embedding for item ${globalIndex}:`,
          error
        );
        return {
          embedding: null,
          success: false,
          error,
          index: globalIndex,
        };
      }
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    // Add a small delay between batches to respect rate limits
    if (i + batchSize < texts.length) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  const successCount = results.filter((r) => r.success).length;
  const failureCount = results.length - successCount;

  logger.debug(
    `[LLM Service - Batch Embedding] Batch processing complete. Success: ${successCount}, Failures: ${failureCount}`
  );

  return results;
}

/**
 * Generates an embedding using Akash Chat API
 */
async function generateAkashChatEmbedding(
  text: string,
  config: ModelConfig,
  dimensions: number
): Promise<{ embedding: number[] }> {
  const akashChat = createOpenAI({
    apiKey: config.AKASH_CHAT_API_KEY as string,
    baseURL: config.AKASH_CHAT_BASE_URL,
  });

  // Configure embedding model options if dimensions are specified
  const modelOptions: Record<string, any> = {};
  if (dimensions) {
    modelOptions.dimensions = dimensions;
  }

  const modelInstance = akashChat.embedding(config.TEXT_EMBEDDING_MODEL, modelOptions);

  const { embedding, usage } = await embed({
    model: modelInstance,
    value: text,
  });

  const totalTokens = (usage as { totalTokens?: number })?.totalTokens;
  const usageMessage = totalTokens ? `${totalTokens} total tokens` : 'Usage details N/A';
  logger.debug(
    `[LLM Service - Akash Chat Embedding] Generated using ${config.TEXT_EMBEDDING_MODEL}${
      modelOptions.dimensions ? ` with configured dimension ${modelOptions.dimensions}` : ''
    }. Usage: ${usageMessage}.`
  );

  return { embedding };
}

/**
 * Generates text using the Akash Chat API
 * @param prompt The prompt text
 * @param system Optional system message
 * @param overrideConfig Optional configuration overrides
 * @returns The generated text result
 *
 * @example
 * // Regular text generation
 * const response = await generateText("Summarize this article: " + articleText);
 *
 * @example
 * // Text generation with system prompt
 * const response = await generateText(
 *   "Summarize this article: " + articleText,
 *   "You are a helpful assistant specializing in concise summaries."
 * );
 */
export async function generateText(
  prompt: string,
  system?: string,
  overrideConfig?: TextGenerationOptions
): Promise<GenerateTextResult<any, any>> {
  const config = validateModelConfig();
  const provider = overrideConfig?.provider || config.TEXT_PROVIDER;
  const modelName = overrideConfig?.modelName || config.TEXT_MODEL;
  const maxTokens = overrideConfig?.maxTokens || config.MAX_OUTPUT_TOKENS;

  try {
    if (provider === 'akash-chat') {
      return await generateAkashChatText(prompt, system, modelName!, maxTokens);
    } else {
      throw new Error(`Unsupported text provider: ${provider}. Only akash-chat is supported.`);
    }
  } catch (error) {
    logger.error(`[LLM Service - ${provider}] Error generating text with ${modelName}:`, error);
    throw error;
  }
}

/**
 * Generates text using the Akash Chat API
 */
async function generateAkashChatText(
  prompt: string,
  system: string | undefined,
  modelName: string,
  maxTokens: number
): Promise<GenerateTextResult<any, any>> {
  const config = validateModelConfig();
  const akashChat = createOpenAI({
    apiKey: config.AKASH_CHAT_API_KEY as string,
    baseURL: config.AKASH_CHAT_BASE_URL,
  });

  const modelInstance = akashChat.chat(modelName);

  const result = await aiGenerateText({
    model: modelInstance,
    prompt: prompt,
    system: system,
    temperature: 0.3,
    maxTokens: maxTokens,
  });

  logger.debug(
    `[LLM Service - Akash Chat] Text generated with ${modelName}. Usage: ${result.usage.promptTokens} prompt tokens, ${result.usage.completionTokens} completion tokens.`
  );

  return result;
}
