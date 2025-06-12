import crypto from "crypto";
import { naviCache } from "./cache-manager";

/**
 * Utility functions for query processing and caching
 */

/**
 * Generate a hash for query caching
 */
export function generateQueryHash(query: string, context?: string): string {
  const input = context ? `${query}:${context}` : query;
  return crypto
    .createHash("md5")
    .update(input.toLowerCase().trim())
    .digest("hex");
}

/**
 * Normalize query for better cache hits
 */
export function normalizeQuery(query: string): string {
  return query
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s]/g, "");
}

/**
 * Check if query is cacheable (avoid caching personal/dynamic content)
 */
export function isCacheable(query: string): boolean {
  const nonCacheablePatterns = [
    /my\s+deployment/i,
    /my\s+app/i,
    /my\s+project/i,
    /\b(password|key|secret|token)\b/i,
    /\b(personal|private)\b/i,
    /\b(ip|address|url|domain)\b.*\d/i,
  ];

  return !nonCacheablePatterns.some((pattern) => pattern.test(query));
}

/**
 * Determine cache TTL based on query type
 */
export function getCacheTTL(query: string): number {
  const lowerQuery = query.toLowerCase();

  // Very short TTL for status/current info
  if (
    lowerQuery.includes("status") ||
    lowerQuery.includes("down") ||
    lowerQuery.includes("latest")
  ) {
    return 300000; // 5 minutes
  }

  // Short TTL for network/provider info
  if (lowerQuery.includes("provider") || lowerQuery.includes("network")) {
    return 1800000; // 30 minutes
  }

  // Medium TTL for deployment help
  if (lowerQuery.includes("deploy") || lowerQuery.includes("error")) {
    return 3600000; // 1 hour
  }

  // Long TTL for documentation/tutorials
  if (
    lowerQuery.includes("how to") ||
    lowerQuery.includes("tutorial") ||
    lowerQuery.includes("guide")
  ) {
    return 7200000; // 2 hours
  }

  // Default TTL
  return 3600000; // 1 hour
}

/**
 * Pre-defined SDL templates for instant responses
 */
export const sdlTemplates = {
  basic: `version: '2.0'
services:
  app:
    image: nginx:latest
    expose:
      - port: 80
        to: [{ global: true }]
profiles:
  compute:
    app:
      resources:
        cpu: { units: 0.5 }
        memory: { size: 512Mi }
        storage: { size: 1Gi }
deployment:
  app:
    profile: compute
    count: 1`,

  nodejs: `version: '2.0'
services:
  nodejs-app:
    image: node:18
    env:
      - NODE_ENV=production
      - PORT=3000
    expose:
      - port: 3000
        as: 80
        to: [{ global: true }]
profiles:
  compute:
    nodejs-app:
      resources:
        cpu: { units: 1 }
        memory: { size: 1Gi }
        storage: { size: 2Gi }
deployment:
  nodejs-app:
    profile: compute
    count: 1`,

  python: `version: '2.0'
services:
  python-app:
    image: python:3.9
    env:
      - PYTHONUNBUFFERED=1
    expose:
      - port: 8000
        as: 80
        to: [{ global: true }]
profiles:
  compute:
    python-app:
      resources:
        cpu: { units: 1 }
        memory: { size: 1Gi }
        storage: { size: 2Gi }
deployment:
  python-app:
    profile: compute
    count: 1`,

  gpu: `version: '2.0'
services:
  ai-model:
    image: pytorch/pytorch:latest
    expose:
      - port: 8000
        as: 80
        to: [{ global: true }]
profiles:
  compute:
    ai-model:
      resources:
        cpu: { units: 4 }
        memory: { size: 8Gi }
        gpu:
          units: 1
          attributes:
            vendor:
              nvidia:
                - model: rtx4090
        storage: { size: 50Gi }
deployment:
  ai-model:
    profile: compute
    count: 1`,

  database: `version: '2.0'
services:
  postgres:
    image: postgres:15
    env:
      - POSTGRES_DB=myapp
      - POSTGRES_USER=admin
      - POSTGRES_PASSWORD=secure_password
    expose:
      - port: 5432
        to: [{ global: true }]
profiles:
  compute:
    postgres:
      resources:
        cpu: { units: 2 }
        memory: { size: 4Gi }
        storage:
          - size: 20Gi
            attributes:
              persistent: true
deployment:
  postgres:
    profile: compute
    count: 1`,
};

/**
 * Pre-defined quick responses for instant answers
 */
export const quickResponses = {
  greeting:
    "👋 Hey! I'm Navi, your Akash Network assistant. Need help with deployments?",

  gettingStarted: `🚀 **Quick Akash Start Guide:**
1. Set up [Keplr Wallet](https://wallet.keplr.app/)
2. Get AKT tokens
3. Use [Akash Console](https://console.akash.network)
4. Create your first deployment

Need detailed help with any step?`,

  deploymentError: `⚠️ **Quick Deployment Fixes:**
• **Insufficient resources** → Lower CPU/memory in SDL
• **No providers** → Increase bid price
• **Deployment closed** → Try different providers
• **Image pull error** → Check image name/tag

Still stuck? Share your error message!`,

  costs: `💰 **Akash vs Traditional Cloud:**
• **Web apps**: $5-20/month (vs $50-200 AWS)
• **AI/ML GPU**: $0.50-2/hour (vs $3-8/hour)
• **Databases**: $10-50/month (vs $100-500)

Need cost estimate for your project?`,

  escalation: `🎯 **For advanced help, contact @Akash Vanguards:**
• Provider-specific issues
• Complex architectures  
• Production deployments
• Network-level problems

What specific area do you need help with?`,
};

/**
 * Initialize cache with pre-computed responses
 */
export function initializeCache(): void {
  // Cache SDL templates
  Object.entries(sdlTemplates).forEach(([type, template]) => {
    naviCache.setCachedSDLTemplate(type, template);
  });

  // Cache common quick responses
  Object.entries(quickResponses).forEach(([type, response]) => {
    const hash = generateQueryHash(type);
    naviCache.setCachedResponse(hash, response, 86400000); // 24 hours
  });

  // Cache common query patterns
  const commonQueries = [
    { query: "how to create sdl", response: quickResponses.gettingStarted },
    { query: "deployment error", response: quickResponses.deploymentError },
    { query: "akash cost", response: quickResponses.costs },
    { query: "getting started", response: quickResponses.gettingStarted },
    { query: "hello", response: quickResponses.greeting },
    { query: "hi", response: quickResponses.greeting },
    { query: "help", response: quickResponses.greeting },
  ];

  commonQueries.forEach(({ query, response }) => {
    const hash = generateQueryHash(normalizeQuery(query));
    naviCache.setCachedResponse(hash, response, 86400000); // 24 hours
  });

  console.log("Cache initialized with pre-computed responses");
}

/**
 * Performance monitoring utilities
 */
export class PerformanceMonitor {
  private static timers = new Map<string, number>();

  static startTimer(label: string): void {
    this.timers.set(label, Date.now());
  }

  static endTimer(label: string): number {
    const start = this.timers.get(label);
    if (!start) return 0;

    const duration = Date.now() - start;
    this.timers.delete(label);
    return duration;
  }

  static logCacheStats(): void {
    const stats = naviCache.getAllStats();
    console.log("Cache Performance Stats:", {
      response: `${stats.response.hits}/${stats.response.hits + stats.response.misses} (${(stats.response.hitRate * 100).toFixed(1)}%)`,
      knowledge: `${stats.knowledge.hits}/${stats.knowledge.hits + stats.knowledge.misses} (${(stats.knowledge.hitRate * 100).toFixed(1)}%)`,
      sdlTemplate: `${stats.sdlTemplate.hits}/${stats.sdlTemplate.hits + stats.sdlTemplate.misses} (${(stats.sdlTemplate.hitRate * 100).toFixed(1)}%)`,
      webSearch: `${stats.webSearch.hits}/${stats.webSearch.hits + stats.webSearch.misses} (${(stats.webSearch.hitRate * 100).toFixed(1)}%)`,
    });
  }
}
