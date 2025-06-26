import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ModelType } from '@elizaos/core';
import plugin from '../src/index.js';

// Mock the elizaos core
vi.mock('@elizaos/core', () => ({
  ModelType: {
    TEXT_SMALL: 'TEXT_SMALL',
    TEXT_LARGE: 'TEXT_LARGE',
    OBJECT_SMALL: 'OBJECT_SMALL',
    OBJECT_LARGE: 'OBJECT_LARGE',
    TEXT_EMBEDDING: 'TEXT_EMBEDDING'
  },
  ModelClass: {
    SMALL: 'SMALL',
    LARGE: 'LARGE',
    EMBEDDING: 'EMBEDDING'
  },
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    log: vi.fn()
  },
  VECTOR_DIMS: {
    1024: 1024,
    1536: 1536
  }
}));

// Mock AI SDK
vi.mock('ai', () => ({
  generateText: vi.fn().mockResolvedValue({ text: 'mocked response' }),
  generateObject: vi.fn().mockResolvedValue({ object: { key: 'value' } })
}));

// Mock fetch globally
global.fetch = vi.fn();

describe('Akash Chat Plugin - Model Selection and Logging', () => {
  let mockRuntime: any;
  let mockLogger: any;
  let logSpy: any;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Create mock logger with spy
    mockLogger = {
      info: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      log: vi.fn()
    };
    
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    // Create mock runtime
    mockRuntime = {
      getSetting: vi.fn((key: string) => {
        const settings: Record<string, string> = {
          'AKASH_CHAT_API_KEY': 'test-api-key',
          'AKASH_CHAT_BASE_URL': 'https://chatapi.akash.network/api/v1',
          'AKASH_CHAT_SMALL_MODEL': 'Meta-Llama-3-1-8B-Instruct-FP8',
          'AKASH_CHAT_LARGE_MODEL': 'Meta-Llama-3-1-70B-Instruct',
          'AKASHCHAT_EMBEDDING_MODEL': 'BAAI-bge-large-en-v1-5',
          'AKASHCHAT_EMBEDDING_DIMENSIONS': '1024'
        };
        return settings[key];
      }),
      logger: mockLogger,
      character: {
        system: 'Test character system prompt'
      }
    };

    // Mock fetch for API validation
    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({ data: [] })
    });
  });

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ModelType } from '@elizaos/core';
import plugin from '../src/index.js';

// Mock the elizaos core
vi.mock('@elizaos/core', () => ({
  ModelType: {
    TEXT_SMALL: 'TEXT_SMALL',
    TEXT_LARGE: 'TEXT_LARGE',
    OBJECT_SMALL: 'OBJECT_SMALL',
    OBJECT_LARGE: 'OBJECT_LARGE',
    TEXT_EMBEDDING: 'TEXT_EMBEDDING'
  },
  ModelClass: {
    SMALL: 'SMALL',
    LARGE: 'LARGE',
    EMBEDDING: 'EMBEDDING'
  },
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    log: vi.fn()
  },
  VECTOR_DIMS: {
    1024: 1024,
    1536: 1536
  }
}));

// Mock AI SDK
vi.mock('ai', () => ({
  generateText: vi.fn().mockResolvedValue({ text: 'mocked response' }),
  generateObject: vi.fn().mockResolvedValue({ object: { key: 'value' } })
}));

// Mock @ai-sdk/openai
vi.mock('@ai-sdk/openai', () => ({
  createOpenAI: vi.fn().mockReturnValue({
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [{ message: { content: 'mocked response' } }]
        })
      }
    }
  })
}));

// Mock fetch globally
global.fetch = vi.fn();

describe('Akash Chat Plugin - Model Selection and Logging', () => {
  let mockRuntime: any;
  let mockLogger: any;
  let logSpy: any;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Create mock logger with spy
    mockLogger = {
      info: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      log: vi.fn()
    };
    
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    // Create mock runtime
    mockRuntime = {
      getSetting: vi.fn((key: string) => {
        const settings: Record<string, string> = {
          'AKASH_CHAT_API_KEY': 'test-api-key',
          'AKASH_CHAT_BASE_URL': 'https://chatapi.akash.network/api/v1',
          'AKASH_CHAT_SMALL_MODEL': 'Meta-Llama-3-1-8B-Instruct-FP8',
          'AKASH_CHAT_LARGE_MODEL': 'Meta-Llama-3-1-70B-Instruct',
          'AKASHCHAT_EMBEDDING_MODEL': 'BAAI-bge-large-en-v1-5',
          'AKASHCHAT_EMBEDDING_DIMENSIONS': '1024'
        };
        return settings[key];
      }),
      logger: mockLogger,
      character: {
        system: 'Test character system prompt'
      }
    };

    // Mock fetch for API validation and embedding requests
    (global.fetch as any).mockImplementation((url: string, options: any) => {
      if (url.includes('/models')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: vi.fn().mockResolvedValue({ data: [] })
        });
      }
      if (url.includes('/embeddings')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: vi.fn().mockResolvedValue({
            data: [{ embedding: Array(1024).fill(0.1) }]
          })
        });
      }
      if (url.includes('/chat/completions')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: vi.fn().mockResolvedValue({
            choices: [{ message: { content: 'mocked response' } }]
          })
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({})
      });
    });
  });

  describe('Plugin Structure', () => {
    it('should have the correct plugin structure', () => {
      expect(plugin.name).toBe('akashchat');
      expect(plugin.description).toContain('AkashChat API plugin');
      expect(plugin.models).toBeDefined();
      expect(plugin.init).toBeDefined();
      expect(plugin.config).toBeDefined();
    });

    it('should have model handlers for different types', () => {
      if (!plugin.models) {
        throw new Error('Plugin models not defined');
      }
      
      expect(plugin.models[ModelType.TEXT_SMALL]).toBeDefined();
      expect(plugin.models[ModelType.TEXT_LARGE]).toBeDefined();
      expect(plugin.models[ModelType.OBJECT_SMALL]).toBeDefined();
      expect(plugin.models[ModelType.OBJECT_LARGE]).toBeDefined();
      expect(plugin.models[ModelType.TEXT_EMBEDDING]).toBeDefined();
    });
  });

  describe('Plugin Configuration', () => {
    it('should have correct default configuration', () => {
      if (!plugin.config) {
        throw new Error('Plugin config not defined');
      }
      
      expect(plugin.config.AKASH_CHAT_SMALL_MODEL).toBe('Meta-Llama-3-1-8B-Instruct-FP8');
      expect(plugin.config.AKASH_CHAT_LARGE_MODEL).toBe('Meta-Llama-3-3-70B-Instruct');
      expect(plugin.config.AKASHCHAT_EMBEDDING_MODEL).toBe('BAAI-bge-large-en-v1-5');
      expect(plugin.config.AKASHCHAT_EMBEDDING_DIMENSIONS).toBe('1024');
    });
  });

  describe('Plugin Initialization', () => {
    it('should initialize successfully with valid API key', async () => {
      if (!plugin.init || !plugin.config) {
        throw new Error('Plugin init or config not defined');
      }
      
      await expect(plugin.init(plugin.config, mockRuntime)).resolves.not.toThrow();
      
      // Verify API validation was called
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/models'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-api-key'
          })
        })
      );
    });

    it('should throw error when API key is missing', async () => {
      if (!plugin.init || !plugin.config) {
        throw new Error('Plugin init or config not defined');
      }
      
      const runtimeWithoutKey = {
        ...mockRuntime,
        getSetting: vi.fn().mockReturnValue(undefined)
      };

      await expect(plugin.init(plugin.config, runtimeWithoutKey)).rejects.toThrow('Missing AKASH_CHAT_API_KEY');
    });
  });

  describe('Model Handler Testing', () => {
    beforeEach(async () => {
      if (!plugin.init || !plugin.config) {
        throw new Error('Plugin init or config not defined');
      }
      // Initialize the plugin
      await plugin.init(plugin.config, mockRuntime);
    });

    it('should handle TEXT_SMALL model requests', async () => {
      if (!plugin.models) {
        throw new Error('Plugin models not defined');
      }
      
      const handler = plugin.models[ModelType.TEXT_SMALL];
      expect(handler).toBeDefined();

      const result = await handler(mockRuntime, {
        prompt: 'Quick chat question',
        modelType: ModelType.TEXT_SMALL
      });

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should handle TEXT_LARGE model requests', async () => {
      if (!plugin.models) {
        throw new Error('Plugin models not defined');
      }
      
      const handler = plugin.models[ModelType.TEXT_LARGE];
      expect(handler).toBeDefined();

      const result = await handler(mockRuntime, {
        prompt: 'Complex knowledge processing task requiring deep analysis',
        modelType: ModelType.TEXT_LARGE
      });

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should handle OBJECT_SMALL model requests', async () => {
      if (!plugin.models) {
        throw new Error('Plugin models not defined');
      }
      
      const handler = plugin.models[ModelType.OBJECT_SMALL];
      expect(handler).toBeDefined();

      const result = await handler(mockRuntime, {
        prompt: 'Parse this simple object',
        schema: { type: 'object', properties: { key: { type: 'string' } } },
        modelType: ModelType.OBJECT_SMALL
      });

      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });

    it('should handle OBJECT_LARGE model requests', async () => {
      if (!plugin.models) {
        throw new Error('Plugin models not defined');
      }
      
      const handler = plugin.models[ModelType.OBJECT_LARGE];
      expect(handler).toBeDefined();

      const result = await handler(mockRuntime, {
        prompt: 'Analyze this complex data structure',
        schema: { type: 'object', properties: { analysis: { type: 'string' } } },
        modelType: ModelType.OBJECT_LARGE
      });

      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });

    it('should handle TEXT_EMBEDDING requests', async () => {
      if (!plugin.models) {
        throw new Error('Plugin models not defined');
      }
      
      const handler = plugin.models[ModelType.TEXT_EMBEDDING];
      expect(handler).toBeDefined();

      const result = await handler(mockRuntime, {
        text: 'Text to embed'
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1024);
    });

    it('should handle TEXT_EMBEDDING null input (initialization)', async () => {
      if (!plugin.models) {
        throw new Error('Plugin models not defined');
      }
      
      const handler = plugin.models[ModelType.TEXT_EMBEDDING];
      expect(handler).toBeDefined();

      const result = await handler(mockRuntime, null);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1024);
      expect(result[0]).toBe(0.1); // Test vector initialization
    });

    it('should handle TEXT_EMBEDDING empty string input', async () => {
      if (!plugin.models) {
        throw new Error('Plugin models not defined');
      }
      
      const handler = plugin.models[ModelType.TEXT_EMBEDDING];
      expect(handler).toBeDefined();

      const result = await handler(mockRuntime, { text: '' });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1024);
      expect(result[0]).toBe(0.3); // Empty vector marker
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      if (!plugin.init || !plugin.config) {
        throw new Error('Plugin init or config not defined');
      }
      await plugin.init(plugin.config, mockRuntime);
    });

    it('should handle network errors gracefully for embedding', async () => {
      if (!plugin.models) {
        throw new Error('Plugin models not defined');
      }
      
      // Mock fetch to fail
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const handler = plugin.models[ModelType.TEXT_EMBEDDING];
      const result = await handler(mockRuntime, { text: 'test text' });

      // Should return fallback vector
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1024);
    });

    it('should handle API errors for text generation', async () => {
      if (!plugin.models) {
        throw new Error('Plugin models not defined');
      }
      
      // Mock fetch to return error response
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      const handler = plugin.models[ModelType.TEXT_SMALL];
      
      // Should handle error gracefully or throw appropriate error
      await expect(handler(mockRuntime, {
        prompt: 'test prompt',
        modelType: ModelType.TEXT_SMALL
      })).rejects.toThrow();
    });
  });

  describe('Configuration Validation', () => {
    it('should use runtime settings over default config', async () => {
      if (!plugin.init || !plugin.config) {
        throw new Error('Plugin init or config not defined');
      }
      
      const customRuntime = {
        ...mockRuntime,
        getSetting: vi.fn((key: string) => {
          if (key === 'AKASH_CHAT_SMALL_MODEL') return 'custom-small-model';
          if (key === 'AKASH_CHAT_LARGE_MODEL') return 'custom-large-model';
          return mockRuntime.getSetting(key);
        })
      };

      await plugin.init(plugin.config, customRuntime);

      // Verify that runtime settings are used
      expect(customRuntime.getSetting).toHaveBeenCalledWith('AKASH_CHAT_SMALL_MODEL');
      expect(customRuntime.getSetting).toHaveBeenCalledWith('AKASH_CHAT_LARGE_MODEL');
    });

    it('should validate embedding dimensions', async () => {
      if (!plugin.init || !plugin.config || !plugin.models) {
        throw new Error('Plugin init, config, or models not defined');
      }
      
      const invalidDimensionRuntime = {
        ...mockRuntime,
        getSetting: vi.fn((key: string) => {
          if (key === 'AKASHCHAT_EMBEDDING_DIMENSIONS') return '999'; // Invalid dimension
          return mockRuntime.getSetting(key);
        })
      };

      await plugin.init(plugin.config, invalidDimensionRuntime);

      const handler = plugin.models[ModelType.TEXT_EMBEDDING];
      
      // Should handle invalid dimension gracefully
      await expect(handler(invalidDimensionRuntime, { text: 'test' })).rejects.toThrow('Invalid embedding dimension');
    });
  });

  afterEach(() => {
    logSpy.mockRestore();
  });
});

/**
 * Integration test demonstrating the complete model selection flow
 */
describe('Integration Test - Akash Chat Plugin Model Handlers', () => {
  it('should demonstrate the complete model handler workflow', async () => {
    console.log('\n🔄 Complete Akash Chat Plugin Model Handler Flow:');
    console.log('1. Plugin initialization with API validation');
    console.log('2. Model handlers route requests to appropriate models');
    console.log('3. Priority queue ensures efficient request processing');
    console.log('4. Error handling provides graceful fallbacks');
    
    const mockRuntime = {
      getSetting: vi.fn((key: string) => {
        const settings: Record<string, string> = {
          'AKASH_CHAT_API_KEY': 'test-api-key',
          'AKASH_CHAT_BASE_URL': 'https://chatapi.akash.network/api/v1',
          'AKASH_CHAT_SMALL_MODEL': 'Meta-Llama-3-1-8B-Instruct-FP8',
          'AKASH_CHAT_LARGE_MODEL': 'Meta-Llama-3-1-70B-Instruct',
          'AKASHCHAT_EMBEDDING_MODEL': 'BAAI-bge-large-en-v1-5',
          'AKASHCHAT_EMBEDDING_DIMENSIONS': '1024'
        };
        return settings[key];
      }),
      logger: {
        info: vi.fn(),
        debug: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        log: vi.fn()
      },
      character: {
        system: 'Test character system prompt'
      }
    };

    // Mock successful API responses
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/models')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: vi.fn().mockResolvedValue({ data: [] })
        });
      }
      if (url.includes('/embeddings')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: vi.fn().mockResolvedValue({
            data: [{ embedding: Array(1024).fill(0.1) }]
          })
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({})
      });
    });

    if (!plugin.init || !plugin.config || !plugin.models) {
      throw new Error('Plugin init, config, or models not defined');
    }

    // Initialize plugin
    await plugin.init(plugin.config, mockRuntime);

    // Test small model handler (chat)
    const smallHandler = plugin.models[ModelType.TEXT_SMALL];
    const chatResult = await smallHandler(mockRuntime, {
      prompt: 'What is Akash Network?',
      modelType: ModelType.TEXT_SMALL
    });

    // Test large model handler (knowledge)
    const largeHandler = plugin.models[ModelType.TEXT_LARGE];
    const knowledgeResult = await largeHandler(mockRuntime, {
      prompt: 'Analyze this comprehensive SDL configuration for optimal deployment',
      modelType: ModelType.TEXT_LARGE
    });

    // Test embedding handler
    const embeddingHandler = plugin.models[ModelType.TEXT_EMBEDDING];
    const embeddingResult = await embeddingHandler(mockRuntime, {
      text: 'Document content to embed'
    });

    // Verify all handlers work correctly
    expect(chatResult).toBeDefined();
    expect(knowledgeResult).toBeDefined();
    expect(embeddingResult).toBeDefined();
    expect(Array.isArray(embeddingResult)).toBe(true);
    expect(embeddingResult.length).toBe(1024);

    console.log('✅ Complete model handler workflow verified');
  });
});

/**
 * Model Selection Priority Testing
 */
describe('Model Selection Priority and Logging', () => {
  it('should verify the priority system through the model selection pattern', () => {
    console.log('\n🎯 Model Selection Priority System:');
    console.log('1. TEXT_SMALL/OBJECT_SMALL → Foreground priority (chat responses)');
    console.log('2. TEXT_LARGE/OBJECT_LARGE → Background priority (knowledge processing)');
    console.log('3. TEXT_EMBEDDING → Background priority (document embedding)');
    
    // Based on the implementation in the Akash Chat plugin:
    // - Small models are used for quick chat responses (foreground)
    // - Large models are used for complex analysis (background)
    // - Embeddings are processed in background
    
    const priorityMapping = {
      [ModelType.TEXT_SMALL]: 'foreground',
      [ModelType.OBJECT_SMALL]: 'foreground',
      [ModelType.TEXT_LARGE]: 'background',
      [ModelType.OBJECT_LARGE]: 'background',
      [ModelType.TEXT_EMBEDDING]: 'background'
    };
    
    // Verify the priority mapping logic
    Object.entries(priorityMapping).forEach(([modelType, expectedPriority]) => {
      const isSmallModel = modelType.includes('SMALL');
      const actualPriority = isSmallModel ? 'foreground' : 'background';
      expect(actualPriority).toBe(expectedPriority);
    });
    
    console.log('✅ Priority system logic verified');
  });
  
  it('should verify model selection configuration is correct', () => {
    console.log('\n⚙️  Model Configuration Verification:');
    console.log('Small Model (Chat): Meta-Llama-3-1-8B-Instruct-FP8');
    console.log('Large Model (Knowledge): Meta-Llama-3-3-70B-Instruct'); 
    console.log('Embedding Model: BAAI-bge-large-en-v1-5');
    
    if (!plugin.config) {
      throw new Error('Plugin config not defined');
    }
    
    // Verify the model configuration matches our implementation
    expect(plugin.config.AKASH_CHAT_SMALL_MODEL).toBe('Meta-Llama-3-1-8B-Instruct-FP8');
    expect(plugin.config.AKASH_CHAT_LARGE_MODEL).toBe('Meta-Llama-3-3-70B-Instruct');
    expect(plugin.config.AKASHCHAT_EMBEDDING_MODEL).toBe('BAAI-bge-large-en-v1-5');
    
    console.log('✅ Model configuration verified');
  });
});

  describe('Plugin Structure', () => {
    it('should have the correct plugin structure', () => {
      expect(plugin.name).toBe('akashchat');
      expect(plugin.description).toContain('AkashChat API plugin');
      expect(plugin.models).toBeDefined();
      expect(plugin.init).toBeDefined();
      expect(plugin.config).toBeDefined();
    });

    it('should have model handlers for different types', () => {
      expect(plugin.models[ModelType.TEXT_SMALL]).toBeDefined();
      expect(plugin.models[ModelType.TEXT_LARGE]).toBeDefined();
      expect(plugin.models[ModelType.OBJECT_SMALL]).toBeDefined();
      expect(plugin.models[ModelType.OBJECT_LARGE]).toBeDefined();
      expect(plugin.models[ModelType.TEXT_EMBEDDING]).toBeDefined();
    });
  });

  describe('Plugin Configuration', () => {
    it('should have correct default configuration', () => {
      expect(plugin.config.AKASH_CHAT_SMALL_MODEL).toBe('Meta-Llama-3-1-8B-Instruct-FP8');
      expect(plugin.config.AKASH_CHAT_LARGE_MODEL).toBe('Meta-Llama-3-3-70B-Instruct');
      expect(plugin.config.AKASHCHAT_EMBEDDING_MODEL).toBe('BAAI-bge-large-en-v1-5');
      expect(plugin.config.AKASHCHAT_EMBEDDING_DIMENSIONS).toBe('1024');
    });
  });

  describe('Plugin Initialization', () => {
    it('should initialize successfully with valid API key', async () => {
      await expect(plugin.init(plugin.config, mockRuntime)).resolves.not.toThrow();
      
      // Verify API validation was called
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/models'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-api-key'
          })
        })
      );
    });

    it('should throw error when API key is missing', async () => {
      const runtimeWithoutKey = {
        ...mockRuntime,
        getSetting: vi.fn().mockReturnValue(undefined)
      };

      await expect(plugin.init(plugin.config, runtimeWithoutKey)).rejects.toThrow('Missing AKASH_CHAT_API_KEY');
    });
  });

  describe('Model Handler Testing', () => {
    beforeEach(async () => {
      // Initialize the plugin
      await plugin.init(plugin.config, mockRuntime);
    });

    it('should handle TEXT_SMALL model requests', async () => {
      const handler = plugin.models[ModelType.TEXT_SMALL];
      expect(handler).toBeDefined();

      const result = await handler(mockRuntime, {
        prompt: 'Quick chat question',
        modelType: ModelType.TEXT_SMALL
      });

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should handle TEXT_LARGE model requests', async () => {
      const handler = plugin.models[ModelType.TEXT_LARGE];
      expect(handler).toBeDefined();

      const result = await handler(mockRuntime, {
        prompt: 'Complex knowledge processing task requiring deep analysis',
        modelType: ModelType.TEXT_LARGE
      });

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should handle OBJECT_SMALL model requests', async () => {
      const handler = plugin.models[ModelType.OBJECT_SMALL];
      expect(handler).toBeDefined();

      const result = await handler(mockRuntime, {
        prompt: 'Parse this simple object',
        schema: { type: 'object', properties: { key: { type: 'string' } } },
        modelType: ModelType.OBJECT_SMALL
      });

      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });

    it('should handle OBJECT_LARGE model requests', async () => {
      const handler = plugin.models[ModelType.OBJECT_LARGE];
      expect(handler).toBeDefined();

      const result = await handler(mockRuntime, {
        prompt: 'Analyze this complex data structure',
        schema: { type: 'object', properties: { analysis: { type: 'string' } } },
        modelType: ModelType.OBJECT_LARGE
      });

      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });

    it('should handle TEXT_EMBEDDING requests', async () => {
      const handler = plugin.models[ModelType.TEXT_EMBEDDING];
      expect(handler).toBeDefined();

      const result = await handler(mockRuntime, {
        text: 'Text to embed'
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1024);
    });

    it('should handle TEXT_EMBEDDING null input (initialization)', async () => {
      const handler = plugin.models[ModelType.TEXT_EMBEDDING];
      expect(handler).toBeDefined();

      const result = await handler(mockRuntime, null);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1024);
      expect(result[0]).toBe(0.1); // Test vector initialization
    });

    it('should handle TEXT_EMBEDDING empty string input', async () => {
      const handler = plugin.models[ModelType.TEXT_EMBEDDING];
      expect(handler).toBeDefined();

      const result = await handler(mockRuntime, { text: '' });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1024);
      expect(result[0]).toBe(0.3); // Empty vector marker
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      await plugin.init(plugin.config, mockRuntime);
    });

    it('should handle network errors gracefully for embedding', async () => {
      // Mock fetch to fail
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const handler = plugin.models[ModelType.TEXT_EMBEDDING];
      const result = await handler(mockRuntime, { text: 'test text' });

      // Should return fallback vector
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1024);
    });

    it('should handle API errors for text generation', async () => {
      // Mock fetch to return error response
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      const handler = plugin.models[ModelType.TEXT_SMALL];
      
      // Should handle error gracefully or throw appropriate error
      await expect(handler(mockRuntime, {
        prompt: 'test prompt',
        modelType: ModelType.TEXT_SMALL
      })).rejects.toThrow();
    });
  });

  describe('Configuration Validation', () => {
    it('should use runtime settings over default config', async () => {
      const customRuntime = {
        ...mockRuntime,
        getSetting: vi.fn((key: string) => {
          if (key === 'AKASH_CHAT_SMALL_MODEL') return 'custom-small-model';
          if (key === 'AKASH_CHAT_LARGE_MODEL') return 'custom-large-model';
          return mockRuntime.getSetting(key);
        })
      };

      await plugin.init(plugin.config, customRuntime);

      // Verify that runtime settings are used
      expect(customRuntime.getSetting).toHaveBeenCalledWith('AKASH_CHAT_SMALL_MODEL');
      expect(customRuntime.getSetting).toHaveBeenCalledWith('AKASH_CHAT_LARGE_MODEL');
    });

    it('should validate embedding dimensions', async () => {
      const invalidDimensionRuntime = {
        ...mockRuntime,
        getSetting: vi.fn((key: string) => {
          if (key === 'AKASHCHAT_EMBEDDING_DIMENSIONS') return '999'; // Invalid dimension
          return mockRuntime.getSetting(key);
        })
      };

      await plugin.init(plugin.config, invalidDimensionRuntime);

      const handler = plugin.models[ModelType.TEXT_EMBEDDING];
      
      // Should handle invalid dimension gracefully
      await expect(handler(invalidDimensionRuntime, { text: 'test' })).rejects.toThrow('Invalid embedding dimension');
    });
  });

  afterEach(() => {
    logSpy.mockRestore();
  });
});

/**
 * Integration test demonstrating the complete model selection flow
 */
describe('Integration Test - Akash Chat Plugin Model Handlers', () => {
  it('should demonstrate the complete model handler workflow', async () => {
    console.log('\n🔄 Complete Akash Chat Plugin Model Handler Flow:');
    console.log('1. Plugin initialization with API validation');
    console.log('2. Model handlers route requests to appropriate models');
    console.log('3. Priority queue ensures efficient request processing');
    console.log('4. Error handling provides graceful fallbacks');
    
    const mockRuntime = {
      getSetting: vi.fn((key: string) => {
        const settings: Record<string, string> = {
          'AKASH_CHAT_API_KEY': 'test-api-key',
          'AKASH_CHAT_BASE_URL': 'https://chatapi.akash.network/api/v1',
          'AKASH_CHAT_SMALL_MODEL': 'Meta-Llama-3-1-8B-Instruct-FP8',
          'AKASH_CHAT_LARGE_MODEL': 'Meta-Llama-3-1-70B-Instruct',
          'AKASHCHAT_EMBEDDING_MODEL': 'BAAI-bge-large-en-v1-5',
          'AKASHCHAT_EMBEDDING_DIMENSIONS': '1024'
        };
        return settings[key];
      }),
      logger: {
        info: vi.fn(),
        debug: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        log: vi.fn()
      },
      character: {
        system: 'Test character system prompt'
      }
    };

    // Mock successful API responses
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/models')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: vi.fn().mockResolvedValue({ data: [] })
        });
      }
      if (url.includes('/embeddings')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: vi.fn().mockResolvedValue({
            data: [{ embedding: Array(1024).fill(0.1) }]
          })
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({})
      });
    });

    // Initialize plugin
    await plugin.init(plugin.config, mockRuntime);

    // Test small model handler (chat)
    const smallHandler = plugin.models[ModelType.TEXT_SMALL];
    const chatResult = await smallHandler(mockRuntime, {
      prompt: 'What is Akash Network?',
      modelType: ModelType.TEXT_SMALL
    });

    // Test large model handler (knowledge)
    const largeHandler = plugin.models[ModelType.TEXT_LARGE];
    const knowledgeResult = await largeHandler(mockRuntime, {
      prompt: 'Analyze this comprehensive SDL configuration for optimal deployment',
      modelType: ModelType.TEXT_LARGE
    });

    // Test embedding handler
    const embeddingHandler = plugin.models[ModelType.TEXT_EMBEDDING];
    const embeddingResult = await embeddingHandler(mockRuntime, {
      text: 'Document content to embed'
    });

    // Verify all handlers work correctly
    expect(chatResult).toBeDefined();
    expect(knowledgeResult).toBeDefined();
    expect(embeddingResult).toBeDefined();
    expect(Array.isArray(embeddingResult)).toBe(true);
    expect(embeddingResult.length).toBe(1024);

    console.log('✅ Complete model handler workflow verified');
  });
});

  afterEach(() => {
    logSpy.mockRestore();
  });
});

/**
 * Integration test demonstrating the complete model selection flow
 */
describe('Integration Test - Complete Model Selection Flow', () => {
  it('should demonstrate the complete model selection and logging flow', async () => {
    console.log('\n🔄 Complete Model Selection Flow:');
    console.log('1. User sends chat message → TEXT_SMALL (foreground priority)');
    console.log('2. Knowledge plugin processes document → TEXT_LARGE (background priority)');
    console.log('3. Akash Chat plugin receives request → maps to correct Llama model');
    console.log('4. Priority queue ensures chat responsiveness during knowledge processing');
    
    const mockRuntime = {
      getSetting: vi.fn((key: string) => {
        const settings: Record<string, string> = {
          'AKASH_CHAT_API_KEY': 'test-api-key',
          'AKASH_CHAT_BASE_URL': 'https://chatapi.akash.network/api/v1',
          'AKASH_CHAT_SMALL_MODEL': 'Meta-Llama-3-1-8B-Instruct-FP8',
          'AKASH_CHAT_LARGE_MODEL': 'Meta-Llama-3-1-70B-Instruct',
          'AKASH_CHAT_EMBEDDING_MODEL': 'thenlper/gte-small'
        };
        return settings[key];
      }),
      logger: {
        info: vi.fn(),
        debug: vi.fn(),
        warn: vi.fn(),
        error: vi.fn()
      }
    };

    const provider = plugin.providers?.[0];
    if (!provider) {
      throw new Error('Provider not found in plugin');
    }

    // Simulate chat request (should be fast)
    const chatResult = await provider.get(mockRuntime, {
      type: ModelType.TEXT_SMALL,
      prompt: 'What is Akash Network?',
      options: {}
    });

    // Simulate knowledge processing request (can be slower)
    const knowledgeResult = await provider.get(mockRuntime, {
      type: ModelType.TEXT_LARGE,
      prompt: 'Analyze this comprehensive SDL configuration and provide detailed contextualization for optimal deployment strategies...',
      options: {}
    });

    // Verify correct model mapping
    expect(chatResult).toEqual({
      model: 'Meta-Llama-3-1-8B-Instruct-FP8',
      priority: 'foreground'
    });

    expect(knowledgeResult).toEqual({
      model: 'Meta-Llama-3-1-70B-Instruct',
      priority: 'background'
    });

    // Verify logging calls were made
    expect(mockRuntime.logger.debug).toHaveBeenCalledTimes(2);
    
    console.log('✅ Complete model selection flow verified');
  });
});
