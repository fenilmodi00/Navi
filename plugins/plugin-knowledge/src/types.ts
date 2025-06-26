import { UUID } from '@elizaos/core';
import z from 'zod';

// Schema for validating model configuration
export const ModelConfigSchema = z.object({
  // Provider configuration
  // NOTE: If EMBEDDING_PROVIDER is not specified, the plugin automatically assumes
  // plugin-akash-chat is being used and will use AKASH_CHAT_API_KEY for configuration
  EMBEDDING_PROVIDER: z.enum(['akash-chat']).optional(),
  TEXT_PROVIDER: z.enum(['akash-chat']).optional(),

  // API keys
  AKASH_CHAT_API_KEY: z.string().optional(),

  // Base URLs (optional for most providers)
  AKASH_CHAT_BASE_URL: z.string().optional(),

  // Model names
  TEXT_EMBEDDING_MODEL: z.string(),
  TEXT_MODEL: z.string().optional(),
  CTX_KNOWLEDGE_MODEL: z.string().optional(), // Large model for knowledge processing

  // Token limits
  MAX_INPUT_TOKENS: z
    .string()
    .or(z.number())
    .transform((val) => (typeof val === 'string' ? parseInt(val, 10) : val)),
  MAX_OUTPUT_TOKENS: z
    .string()
    .or(z.number())
    .optional()
    .transform((val) => (val ? (typeof val === 'string' ? parseInt(val, 10) : val) : 4096)),

  // Embedding dimension
  // Default: 1536 dimensions for most embedding models
  EMBEDDING_DIMENSION: z
    .string()
    .or(z.number())
    .optional()
    .transform((val) => (val ? (typeof val === 'string' ? parseInt(val, 10) : val) : 1536)),

  // Contextual Knowledge settings
  CTX_KNOWLEDGE_ENABLED: z.boolean().default(false),
});

export type ModelConfig = z.infer<typeof ModelConfigSchema>;

/**
 * Interface for provider rate limits
 */
export interface ProviderRateLimits {
  // Maximum concurrent requests recommended for this provider
  maxConcurrentRequests: number;
  // Maximum requests per minute allowed
  requestsPerMinute: number;
  // Maximum tokens per minute allowed (if applicable)
  tokensPerMinute?: number;
  // Name of the provider
  provider: string;
}

/**
 * Options for text generation overrides
 */
export interface TextGenerationOptions {
  provider?: 'akash-chat';
  modelName?: string;
  maxTokens?: number;
  /**
   * Document to cache for contextual retrieval.
   * When provided, this enables prompt caching where supported by the provider.
   * The document is cached and subsequent requests will reuse the cached document,
   * potentially reducing costs for multiple operations on the same document.
   * Most effective with contextual retrieval for Knowledge applications.
   */
  cacheDocument?: string;

  /**
   * Options for controlling the cache behavior.
   * Currently supports { type: 'ephemeral' } which sets up a temporary cache.
   * Cache expires after approximately 5 minutes.
   * This can reduce costs by up to 90% for reads after the initial cache write.
   */
  cacheOptions?: {
    type: 'ephemeral';
  };
  /**
   * Whether to automatically detect and enable caching for contextual retrieval.
   * Default is true for supported models with document-chunk prompts.
   * Set to false to disable automatic caching detection.
   */
  autoCacheContextualRetrieval?: boolean;
}

/**
 * Options for adding knowledge to the system
 */
export interface AddKnowledgeOptions {
  /** Agent ID from the frontend - if not provided, will use runtime.agentId */
  agentId?: UUID;
  worldId: UUID;
  roomId: UUID;
  entityId: UUID;
  /** Client-provided document ID */
  clientDocumentId: UUID;
  /** MIME type of the file */
  contentType: string;
  /** Original filename */
  originalFilename: string;
  /**
   * Content of the document. Should be:
   * - Base64 encoded string for binary files (PDFs, DOCXs, etc)
   * - Plain text for text files
   */
  content: string;
  /**
   * Optional metadata to associate with the knowledge
   * Used for storing additional information like source URL
   */
  metadata?: Record<string, unknown>;
}

// Extend the core service types with knowledge service
declare module '@elizaos/core' {
  interface ServiceTypeRegistry {
    KNOWLEDGE: 'knowledge';
  }
}

// Export service type constant
export const KnowledgeServiceType = {
  KNOWLEDGE: 'knowledge' as const,
} satisfies Partial<import('@elizaos/core').ServiceTypeRegistry>;

export interface KnowledgeDocumentMetadata extends Record<string, any> {
  type: string; // e.g., 'document', 'website_content'
  source: string; // e.g., 'upload', 'web_scrape', path to file
  title?: string;
  filename?: string;
  fileExt?: string;
  fileType?: string; // MIME type
  fileSize?: number;
  url?: string; // if applicable
  timestamp: number; // creation/ingestion timestamp
  documentId?: string; // if from an external system
  // Add other relevant metadata fields
}

export interface KnowledgeConfig {
  CTX_KNOWLEDGE_ENABLED: boolean;
  LOAD_DOCS_ON_STARTUP: boolean;
  MAX_INPUT_TOKENS?: string | number;
  MAX_OUTPUT_TOKENS?: string | number;
  EMBEDDING_PROVIDER?: string;
  TEXT_PROVIDER?: string;
  TEXT_EMBEDDING_MODEL?: string;
  // Add any other plugin-specific configurations
}

export interface LoadResult {
  successful: number;
  failed: number;
  errors?: Array<{ filename: string; error: string }>;
}

/**
 * Extends the base MemoryMetadata from @elizaos/core with additional fields
 */
export interface ExtendedMemoryMetadata extends Record<string, any> {
  type?: string;
  title?: string;
  filename?: string;
  path?: string;
  description?: string;
  fileExt?: string;
  timestamp?: number;
  contentType?: string;
  documentId?: string;
  source?: string;
  fileType?: string;
  fileSize?: number;
  position?: number; // For fragments
  originalFilename?: string;
  url?: string; // For web content
}
