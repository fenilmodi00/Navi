import { describe, it, expect } from 'vitest';

describe('Navi Agent E2E Tests', () => {
  it('should load character configuration', async () => {
    // Test that character can be imported and has required structure
    try {
      const { character } = await import('../../index.js');
      
      expect(character).toBeDefined();
      expect(character.name).toBe('Navi');
      expect(character.username).toBe('AkashNavi');
      expect(character.id).toBeDefined();
      
      console.log('✅ Character configuration loads successfully');
    } catch (error) {
      throw new Error(`Character loading failed: ${(error as Error).message}`);
    }
  });

  it('should have valid plugin references', async () => {
    try {
      const { character } = await import('../../index.js');
      
      expect(character.plugins).toBeDefined();
      expect(Array.isArray(character.plugins)).toBe(true);
      
      const requiredPlugins = [
        '@elizaos/plugin-bootstrap',
        '@elizaos/plugin-discord',
        '@elizaos/plugin-akash'
      ];

      for (const pluginName of requiredPlugins) {
        expect(character.plugins).toContain(pluginName);
      }
      
      console.log('✅ Plugin references are valid');
    } catch (error) {
      throw new Error(`Plugin validation failed: ${(error as Error).message}`);
    }
  });

  it('should have reasonable configuration', async () => {
    try {
      const { character } = await import('../../index.js');
      
      // Check system prompt length
      if (character.system && character.system.length > 5000) {
        console.warn('⚠️ System prompt is very long (' + character.system.length + ' chars). Consider reducing to under 2000 characters.');
      }
      
      // Check message examples count
      if (character.messageExamples && character.messageExamples.length > 20) {
        console.warn('⚠️ Too many message examples (' + character.messageExamples.length + '). Consider reducing to 5-10 focused examples.');
      }
      
      // Check performance settings
      if (character.settings) {
        const maxConcurrent = parseInt(character.settings.MAX_CONCURRENT_REQUESTS as string);
        const requestsPerMin = parseInt(character.settings.REQUESTS_PER_MINUTE as string);
        
        if (maxConcurrent > 10) {
          console.warn('⚠️ MAX_CONCURRENT_REQUESTS is high (' + maxConcurrent + '). Consider reducing to 5-10.');
        }
        
        if (requestsPerMin > 60) {
          console.warn('⚠️ REQUESTS_PER_MINUTE is high (' + requestsPerMin + '). Consider reducing to 30-60.');
        }
      }
      
      console.log('✅ Configuration validation completed');
    } catch (error) {
      throw new Error(`Configuration validation failed: ${(error as Error).message}`);
    }
  });

  it('should have required templates', async () => {
    try {
      const { character } = await import('../../index.js');
      
      expect(character.templates).toBeDefined();
      
      if (character.templates) {
        expect(character.templates.shouldRespondTemplate).toBeDefined();
        expect(typeof character.templates.shouldRespondTemplate).toBe('string');
      }
      
      console.log('✅ Required templates are present');
    } catch (error) {
      throw new Error(`Template validation failed: ${(error as Error).message}`);
    }
  });

  it('should have comprehensive bio and topics', async () => {
    try {
      const { character } = await import('../../index.js');
      
      expect(character.bio).toBeDefined();
      expect(Array.isArray(character.bio)).toBe(true);
      expect(character.bio.length).toBeGreaterThan(0);
      
      expect(character.topics).toBeDefined();
      expect(Array.isArray(character.topics)).toBe(true);
      expect(character.topics).toContain('SDL Stack Definition Language');
      expect(character.topics).toContain('Akash Network Deployment');
      
      console.log('✅ Bio and topics are comprehensive');
    } catch (error) {
      throw new Error(`Bio/topics validation failed: ${(error as Error).message}`);
    }
  });
});
