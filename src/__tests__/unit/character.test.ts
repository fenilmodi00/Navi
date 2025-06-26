import { describe, it, expect } from 'vitest';
import { character } from '../../index.js';

describe('Navi Character Configuration', () => {
  it('should have valid character structure', () => {
    expect(character).toBeDefined();
    expect(character.name).toBe('Navi');
    expect(character.username).toBe('AkashNavi');
    expect(character.id).toBeDefined();
  });

  it('should have required plugins', () => {
    expect(character.plugins).toBeDefined();
    expect(character.plugins).toContain('@elizaos/plugin-bootstrap');
    expect(character.plugins).toContain('@elizaos/plugin-discord');
    expect(character.plugins).toContain('@elizaos/plugin-akash');
    expect(character.plugins).toContain('@elizaos/plugin-knowledge');
  });

  it('should have reasonable system prompt length', () => {
    expect(character.system).toBeDefined();
    expect(typeof character.system).toBe('string');
    
    if (character.system) {
      expect(character.system.length).toBeGreaterThan(0);
      // Check for reasonable length - warn if too long
      if (character.system.length > 5000) {
        console.warn('⚠️ System prompt is very long (' + character.system.length + ' chars). Consider reducing to under 2000 characters.');
      }
    }
  });

  it('should have reasonable number of message examples', () => {
    expect(character.messageExamples).toBeDefined();
    expect(Array.isArray(character.messageExamples)).toBe(true);
    
    if (character.messageExamples) {
      expect(character.messageExamples.length).toBeGreaterThan(0);
      // Check for reasonable count - warn if too many
      if (character.messageExamples.length > 20) {
        console.warn('⚠️ Too many message examples (' + character.messageExamples.length + '). Consider reducing to 5-10 focused examples.');
      }
    }
  });

  it('should have valid settings', () => {
    expect(character.settings).toBeDefined();
    
    if (character.settings) {
      expect(character.settings.AKASH_CHAT_BASE_URL).toBe('https://chatapi.akash.network/api/v1');
      expect(character.settings.EMBEDDING_PROVIDER).toBe('akash-chat');
      expect(character.settings.TEXT_PROVIDER).toBe('akash-chat');
    }
  });

  it('should have optimized performance settings', () => {
    expect(character.settings).toBeDefined();
    
    if (character.settings) {
      // Check for reasonable performance settings
      const maxConcurrent = parseInt(character.settings.MAX_CONCURRENT_REQUESTS as string);
      const requestsPerMin = parseInt(character.settings.REQUESTS_PER_MINUTE as string);
      const tokensPerMin = parseInt(character.settings.TOKENS_PER_MINUTE as string);
      
      expect(maxConcurrent).toBeLessThanOrEqual(10); // Reasonable limit
      expect(requestsPerMin).toBeLessThanOrEqual(60); // Avoid rate limiting
      expect(tokensPerMin).toBeLessThanOrEqual(50000); // Sustainable usage
    }
  });

  it('should have bio information', () => {
    expect(character.bio).toBeDefined();
    expect(Array.isArray(character.bio)).toBe(true);
    expect(character.bio.length).toBeGreaterThan(0);
  });

  it('should have style definitions', () => {
    expect(character.style).toBeDefined();
    
    if (character.style) {
      expect(character.style.all).toBeDefined();
      expect(Array.isArray(character.style.all)).toBe(true);
    }
  });

  it('should have topics list', () => {
    expect(character.topics).toBeDefined();
    expect(Array.isArray(character.topics)).toBe(true);
    expect(character.topics).toContain('SDL Stack Definition Language');
    expect(character.topics).toContain('Akash Network Deployment');
  });

  it('should have shouldRespondTemplate defined', () => {
    expect(character.templates).toBeDefined();
    
    if (character.templates) {
      expect(character.templates.shouldRespondTemplate).toBeDefined();
      expect(typeof character.templates.shouldRespondTemplate).toBe('string');
    }
  });
});
