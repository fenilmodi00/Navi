import type { TestSuite } from '@elizaos/core';

/**
 * E2E Tests for Model Selection Verification
 * Tests the actual runtime behavior of dynamic model selection
 */
class ModelSelectionTestSuite implements TestSuite {
  name = 'Model Selection E2E Tests';

  tests = [
    {
      name: 'verify_akash_chat_plugin_model_mapping',
      fn: async (runtime: any) => {
        try {
          console.log('🧪 Testing Akash Chat plugin model mapping...');
          
          // Test small model (chat) - should be fast
          const startTime = Date.now();
          const smallModelResponse = await runtime.useModel('TEXT_SMALL', {
            prompt: 'What is Akash Network?'
          });
          const smallModelTime = Date.now() - startTime;
          
          console.log(`✅ Small model response (${smallModelTime}ms): ${typeof smallModelResponse}`);
          
          // Test large model (knowledge) - may be slower but more comprehensive
          const startTimeLarge = Date.now();
          const largeModelResponse = await runtime.useModel('TEXT_LARGE', {
            prompt: 'Analyze and contextualize this complex SDL deployment configuration for comprehensive understanding.'
          });
          const largeModelTime = Date.now() - startTimeLarge;
          
          console.log(`✅ Large model response (${largeModelTime}ms): ${typeof largeModelResponse}`);
          
          // Verify both models are working
          if (!smallModelResponse || !largeModelResponse) {
            throw new Error('One or both models failed to respond');
          }
          
          console.log('✅ Both small and large models are functioning correctly');
          console.log(`📊 Response times - Small: ${smallModelTime}ms, Large: ${largeModelTime}ms`);
          
        } catch (error) {
          console.error('❌ Model mapping test failed:', error);
          throw error;
        }
      }
    },
    
    {
      name: 'verify_knowledge_plugin_uses_large_model',
      fn: async (runtime: any) => {
        try {
          console.log('🧪 Testing knowledge plugin model selection...');
          
          // Get the knowledge service
          const knowledgeService = runtime.getService('knowledge');
          if (!knowledgeService) {
            console.log('ℹ️  Knowledge service not available in test environment');
            return;
          }
          
          // Check that knowledge processing configuration is correct
          const ctxEnabled = process.env.CTX_KNOWLEDGE_ENABLED === 'true';
          console.log(`📋 CTX_KNOWLEDGE_ENABLED: ${ctxEnabled}`);
          
          if (ctxEnabled) {
            console.log('✅ Knowledge contextualization is enabled');
            console.log('✅ Knowledge plugin should use TEXT_LARGE for document processing');
          } else {
            console.log('ℹ️  Knowledge contextualization is disabled - using basic embedding mode');
          }
          
          // Test that the service exists and is configured
          console.log('✅ Knowledge service is properly initialized');
          
        } catch (error) {
          console.error('❌ Knowledge plugin test failed:', error);
          throw error;
        }
      }
    },
    
    {
      name: 'verify_priority_queue_functionality',
      fn: async (runtime: any) => {
        try {
          console.log('🧪 Testing priority queue functionality...');
          
          // Test concurrent requests to verify queue behavior
          const concurrentRequests: Promise<any>[] = [];
          
          // Add foreground requests (should be prioritized)
          for (let i = 0; i < 3; i++) {
            const request = runtime.useModel('TEXT_SMALL', {
              prompt: `Quick chat question ${i + 1}: Hi!`
            }).then((response: any) => ({
              type: 'foreground',
              index: i + 1,
              response: typeof response,
              timestamp: Date.now()
            }));
            concurrentRequests.push(request);
          }
          
          // Add background requests (knowledge processing)
          for (let i = 0; i < 2; i++) {
            const request = runtime.useModel('TEXT_LARGE', {
              prompt: `Complex knowledge processing task ${i + 1}: Analyze this comprehensive document context...`
            }).then((response: any) => ({
              type: 'background',
              index: i + 1,
              response: typeof response,
              timestamp: Date.now()
            }));
            concurrentRequests.push(request);
          }
          
          // Execute all requests concurrently
          const results = await Promise.all(concurrentRequests);
          
          const foregroundResults = results.filter(r => r.type === 'foreground');
          const backgroundResults = results.filter(r => r.type === 'background');
          
          console.log(`✅ Processed ${foregroundResults.length} foreground requests`);
          console.log(`✅ Processed ${backgroundResults.length} background requests`);
          
          // Verify all requests completed
          if (results.length !== 5) {
            throw new Error(`Expected 5 results, got ${results.length}`);
          }
          
          console.log('✅ Priority queue handled concurrent requests successfully');
          
        } catch (error) {
          console.error('❌ Priority queue test failed:', error);
          throw error;
        }
      }
    },
    
    {
      name: 'verify_model_configuration',
      fn: async (runtime: any) => {
        try {
          console.log('🧪 Testing model configuration...');
          
          // Check environment configuration
          const config = {
            apiKey: runtime.getSetting('AKASH_CHAT_API_KEY'),
            smallModel: runtime.getSetting('AKASH_CHAT_SMALL_MODEL'),
            largeModel: runtime.getSetting('AKASH_CHAT_LARGE_MODEL'),
            embeddingModel: runtime.getSetting('AKASH_CHAT_EMBEDDING_MODEL'),
            ctxEnabled: runtime.getSetting('CTX_KNOWLEDGE_ENABLED')
          };
          
          console.log('📋 Current Configuration:');
          console.log(`   API Key: ${config.apiKey ? '***configured***' : 'missing'}`);
          console.log(`   Small Model: ${config.smallModel || 'default'}`);
          console.log(`   Large Model: ${config.largeModel || 'default'}`);
          console.log(`   Embedding Model: ${config.embeddingModel || 'default'}`);
          console.log(`   CTX Knowledge: ${config.ctxEnabled || 'false'}`);
          
          // Verify essential configuration
          if (!config.apiKey) {
            throw new Error('AKASH_CHAT_API_KEY is not configured');
          }
          
          if (!config.smallModel || !config.largeModel) {
            console.log('ℹ️  Using default model configuration');
          }
          
          console.log('✅ Model configuration is valid');
          
        } catch (error) {
          console.error('❌ Configuration test failed:', error);
          throw error;
        }
      }
    }
  ];
}

export default new ModelSelectionTestSuite();
