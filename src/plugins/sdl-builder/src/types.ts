// SDL Template types
export interface SDLTemplate {
  name: string;
  description: string;
  category: 'web' | 'ai' | 'database' | 'gaming' | 'blockchain' | 'custom';
  complexity: 'basic' | 'intermediate' | 'advanced';
  template: string;
  requiredInputs: string[];
  estimatedCost: string;
  tags?: string[];
}

// SDL Generation Request
export interface SDLGenerationRequest {
  deploymentType: string;
  complexity: 'basic' | 'intermediate' | 'advanced';
  requirements?: {
    image?: string;
    cpu?: string;
    memory?: string;
    storage?: string;
    gpu?: boolean;
    gpuModel?: string;
    ports?: number[];
    env?: Record<string, string>;
    replicas?: number;
  };
  customizations?: {
    addRedis?: boolean;
    addPostgres?: boolean;
    addLoadBalancer?: boolean;
    enableSSL?: boolean;
  };
}

// SDL Validation Result
export interface SDLValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
  score?: number;
}

// SDL Generation Response
export interface SDLGenerationResponse {
  template: SDLTemplate;
  validation: SDLValidationResult;
  optimizations: string[];
  estimatedCost: {
    monthly: string;
    hourly?: string;
    comparison?: string;
  };
}

// Cache Entry for semantic similarity
export interface SDLCacheEntry {
  query: string;
  response: SDLGenerationResponse;
  confidence: number;
  lastUsed: Date;
  useCount: number;
  semanticHash: string;
}

// Performance metrics
export interface SDLGenerationMetrics {
  totalGenerations: number;
  averageGenerationTime: number;
  cacheHitRate: number;
  popularTemplates: Map<string, number>;
  errorRate: number;
}

// Plugin configuration
export interface SDLBuilderConfig {
  enableCaching: boolean;
  cacheSize: number;
  cacheTTL: number;
  enableMetrics: boolean;
  defaultPricing: {
    basic: number;
    intermediate: number;
    advanced: number;
  };
  templateRepository?: string;
}
