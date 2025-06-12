import { logger } from "@elizaos/core";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
}

/**
 * Multi-level cache manager for Navi agent
 * Implements memory caching with TTL, LRU eviction, and performance tracking
 */
export class CacheManager {
  private memoryCache = new Map<string, CacheEntry<any>>();
  private stats: CacheStats = { hits: 0, misses: 0, size: 0, hitRate: 0 };
  private maxSize: number;
  private defaultTTL: number;
  private cleanupInterval: NodeJS.Timeout;

  constructor(
    options: {
      maxSize?: number;
      defaultTTL?: number;
      cleanupIntervalMs?: number;
    } = {},
  ) {
    this.maxSize = options.maxSize || 1000;
    this.defaultTTL = options.defaultTTL || 3600000; // 1 hour

    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, options.cleanupIntervalMs || 300000);

    logger.info(
      `CacheManager initialized - MaxSize: ${this.maxSize}, TTL: ${this.defaultTTL}ms`,
    );
  }

  /**
   * Get value from cache
   */
  get<T>(key: string): T | null {
    const entry = this.memoryCache.get(key);

    if (!entry) {
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.memoryCache.delete(key);
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // Update access stats
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.stats.hits++;
    this.updateHitRate();

    return entry.data;
  }

  /**
   * Set value in cache
   */
  set<T>(key: string, value: T, ttl?: number): void {
    const now = Date.now();
    const entry: CacheEntry<T> = {
      data: value,
      timestamp: now,
      ttl: ttl || this.defaultTTL,
      accessCount: 1,
      lastAccessed: now,
    };

    // Evict if at max capacity
    if (this.memoryCache.size >= this.maxSize && !this.memoryCache.has(key)) {
      this.evictLRU();
    }

    this.memoryCache.set(key, entry);
    this.stats.size = this.memoryCache.size;
  }

  /**
   * Check if key exists and is valid
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Delete specific key
   */
  delete(key: string): boolean {
    const deleted = this.memoryCache.delete(key);
    this.stats.size = this.memoryCache.size;
    return deleted;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.memoryCache.clear();
    this.stats = { hits: 0, misses: 0, size: 0, hitRate: 0 };
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Get or set with function execution
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T> | T,
    ttl?: number,
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await fetchFn();
    this.set(key, value, ttl);
    return value;
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.memoryCache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.memoryCache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.stats.size = this.memoryCache.size;
      logger.debug(`Cache cleanup: removed ${cleaned} expired entries`);
    }
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let oldestKey = "";
    let oldestTime = Date.now();

    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.memoryCache.delete(oldestKey);
      logger.debug(`Cache evicted LRU entry: ${oldestKey}`);
    }
  }

  /**
   * Update hit rate calculation
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }

  /**
   * Destroy cache manager
   */
  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.clear();
  }
}

/**
 * Specialized cache for different data types
 */
export class NaviCacheSystem {
  private responseCache: CacheManager;
  private knowledgeCache: CacheManager;
  private sdlTemplateCache: CacheManager;
  private webSearchCache: CacheManager;

  constructor() {
    // Response cache - shorter TTL for dynamic content
    this.responseCache = new CacheManager({
      maxSize: 500,
      defaultTTL: 1800000, // 30 minutes
    });

    // Knowledge cache - longer TTL for documentation
    this.knowledgeCache = new CacheManager({
      maxSize: 1000,
      defaultTTL: 7200000, // 2 hours
    });

    // SDL template cache - very long TTL for templates
    this.sdlTemplateCache = new CacheManager({
      maxSize: 200,
      defaultTTL: 86400000, // 24 hours
    });

    // Web search cache - medium TTL for external data
    this.webSearchCache = new CacheManager({
      maxSize: 300,
      defaultTTL: 3600000, // 1 hour
    });

    logger.info("NaviCacheSystem initialized with specialized caches");
  }

  // Response caching methods
  getCachedResponse(queryHash: string): string | null {
    return this.responseCache.get(queryHash);
  }

  setCachedResponse(queryHash: string, response: string, ttl?: number): void {
    this.responseCache.set(queryHash, response, ttl);
  }

  // Knowledge caching methods
  getCachedKnowledge(searchQuery: string): any | null {
    return this.knowledgeCache.get(searchQuery);
  }

  setCachedKnowledge(searchQuery: string, results: any, ttl?: number): void {
    this.knowledgeCache.set(searchQuery, results, ttl);
  }

  // SDL template caching methods
  getCachedSDLTemplate(templateType: string): string | null {
    return this.sdlTemplateCache.get(templateType);
  }

  setCachedSDLTemplate(templateType: string, template: string): void {
    this.sdlTemplateCache.set(templateType, template);
  }

  // Web search caching methods
  getCachedWebSearch(query: string): any | null {
    return this.webSearchCache.get(query);
  }

  setCachedWebSearch(query: string, results: any, ttl?: number): void {
    this.webSearchCache.set(query, results, ttl);
  }

  // Utility methods
  getAllStats() {
    return {
      response: this.responseCache.getStats(),
      knowledge: this.knowledgeCache.getStats(),
      sdlTemplate: this.sdlTemplateCache.getStats(),
      webSearch: this.webSearchCache.getStats(),
    };
  }

  clearAllCaches(): void {
    this.responseCache.clear();
    this.knowledgeCache.clear();
    this.sdlTemplateCache.clear();
    this.webSearchCache.clear();
  }

  destroy(): void {
    this.responseCache.destroy();
    this.knowledgeCache.destroy();
    this.sdlTemplateCache.destroy();
    this.webSearchCache.destroy();
  }
}

// Global cache instance
export const naviCache = new NaviCacheSystem();
