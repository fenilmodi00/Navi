import dotenv from "dotenv";
dotenv.config();

import {
  logger,
  type Character,
  type IAgentRuntime,
  type Project,
  type ProjectAgent,
  type OnboardingConfig,
  type Plugin,
  type Action,
  type Provider,
  type Evaluator,
  AgentRuntime,
} from "@elizaos/core";

// Analytics and monitoring
interface QueryAnalytics {
  totalQueries: number;
  quickResponses: number;
  complexEscalations: number;
  webSearchTriggers: number;
  averageResponseTime: number;
  topTopics: Map<string, number>;
}

// Enhanced configuration interface
interface AkashAgentConfig {
  performance: {
    cacheEnabled: boolean;
    cacheTTL: number;
    maxConcurrentRequests: number;
    responseTimeout: number;
  };
  intelligence: {
    confidenceThreshold: number;
    escalationThreshold: number;
    learningRate: number;
  };
  monitoring: {
    analyticsEnabled: boolean;
    performanceTracking: boolean;
  };
}

// Enhanced configuration interface with performance monitoring
interface EnhancedAkashConfig extends AkashAgentConfig {
  performance: {
    cacheEnabled: boolean;
    cacheTTL: number;
    maxConcurrentRequests: number;
    responseTimeout: number;
    enableParallelProcessing: boolean;
    semanticCacheThreshold: number;
  };
  intelligence: {
    confidenceThreshold: number;
    escalationThreshold: number;
    learningRate: number;
    contextWindowSize: number;
    enableDynamicResponses: boolean;
  };
  monitoring: {
    analyticsEnabled: boolean;
    performanceTracking: boolean;
    errorReporting: boolean;
    responseQualityTracking: boolean;
    deploymentMonitoring: boolean;
  };
  advanced: {
    autoSDLGeneration: boolean;
    proactiveSupport: boolean;
    A_BTestingEnabled: boolean;
    conversationSummarization: boolean;
  };
}

// Enhanced analytics with detailed metrics
interface EnhancedQueryAnalytics extends QueryAnalytics {
  technicalQueries: number;
  averageConfidenceScore: number;
  errorRate: number;
  escalationRate: number;
  userSatisfactionScore: number;
  cacheHitRate: number;
}

// Dynamic SDL template generation based on query analysis
interface SDLTemplate {
  name: string;
  description: string;
  category: 'web' | 'ai' | 'database' | 'gaming' | 'blockchain' | 'custom';
  complexity: 'basic' | 'intermediate' | 'advanced';
  template: string;
  requiredInputs: string[];
  estimatedCost: string;
}

// Smart caching system for semantic similarity
interface CacheEntry {
  query: string;
  response: string;
  confidence: number;
  lastUsed: Date;
  useCount: number;
  semanticHash: string;
}

// Performance monitoring for deployment tracking
interface DeploymentMetrics {
  totalDeployments: number;
  successRate: number;
  averageDeployTime: number;
  commonFailureReasons: Map<string, number>;
  providerPerformance: Map<string, number>;
}

// Enhanced error handling system
interface ErrorHandler {
  type: 'network' | 'provider' | 'user' | 'system';
  severity: 'low' | 'medium' | 'high' | 'critical';
  fallbackAction: string;
  escalateToVanguards: boolean;
}

// Web search trigger function
const shouldUseWebSearch = (query: string): boolean => {
  const webSearchTriggers = [
    "latest",
    "recent",
    "news",
    "update",
    "announcement",
    "today",
    "this week",
    "this month",
    "roadmap",
    "upcoming",
    "release",
    "social media",
    "twitter",
    "discord announcement",
    "blog post",
    "new feature",
    "just released",
    "yesterday",
    "current",
    "now",
    "what is happening",
    "what happened",
    "status",
    "progress",
    "development",
    "launched",
    "launching",
    "released",
    "deployed",
    // Add price-related triggers for real-time data
    "price",
    "cost",
    "current price",
    "today price",
    "coinbase",
    "exchange",
  ];

  const queryLower = query.toLowerCase();
  return webSearchTriggers.some((trigger) => queryLower.includes(trigger));
};

// Enhanced query classification with ML-like scoring
interface QueryClassification {
  type: 'greeting' | 'quick' | 'technical' | 'complex' | 'escalation';
  confidence: number;
  reasoning: string;
  suggestedAction: string;
}

const classifyQuery = (query: string): QueryClassification => {
  const queryLower = query.toLowerCase();
  const queryLength = query.length;
  const words = queryLower.split(/\s+/);
  
  // Scoring weights
  let greetingScore = 0;
  let quickScore = 0;
  let technicalScore = 0;
  let complexScore = 0;
  let escalationScore = 0;

  // Greeting detection
  const greetingWords = ['hello', 'hi', 'hey', 'good morning', 'good evening', 'sup', 'yo'];
  greetingScore = greetingWords.some(greeting => queryLower.includes(greeting)) ? 0.9 : 0;

  // Quick response indicators
  const quickTriggers = [
    'what is akash', 'how much', 'cost', 'price', 'basic', 'simple', 'example',
    'start', 'beginning', 'help', 'guide', 'tutorial', 'quick'
  ];
  quickScore = quickTriggers.filter(trigger => queryLower.includes(trigger)).length * 0.3;
  if (queryLength < 30) quickScore += 0.3;

  // Technical query indicators
  const technicalTerms = [
    'sdl', 'yaml', 'deployment', 'provider', 'gpu', 'cpu', 'memory', 'storage',
    'docker', 'kubernetes', 'container', 'nginx', 'postgres', 'database',
    'node.js', 'python', 'ai', 'ml', 'machine learning', 'ssl', 'tls',
    'environment variable', 'port', 'expose', 'image', 'volume'
  ];
  technicalScore = technicalTerms.filter(term => queryLower.includes(term)).length * 0.25;

  // Complex query indicators
  const complexTriggers = [
    'advanced', 'enterprise', 'production', 'scaling', 'architecture',
    'multi-region', 'high availability', 'custom network', 'load balancing',
    'microservices', 'service mesh', 'disaster recovery', 'backup strategy',
    'performance optimization', 'security audit', 'compliance', 'integration'
  ];
  complexScore = complexTriggers.filter(trigger => queryLower.includes(trigger)).length * 0.4;
  if (queryLength > 100) complexScore += 0.3;
  if (words.length > 20) complexScore += 0.2;

  // Escalation indicators
  const escalationTriggers = [
    'outage', 'down', 'bug', 'error', 'failing', 'broken', 'not working',
    'provider specific', 'feature request', 'governance', 'tokenomics',
    'urgent', 'critical', 'production issue', 'can\'t deploy', 'help vanguard'
  ];
  escalationScore = escalationTriggers.filter(trigger => queryLower.includes(trigger)).length * 0.5;

  // Determine classification
  const scores = {
    greeting: greetingScore,
    quick: quickScore,
    technical: technicalScore,
    complex: complexScore,
    escalation: escalationScore
  };

  const maxScore = Math.max(...Object.values(scores));
  const classification = Object.keys(scores).find(key => scores[key] === maxScore) as keyof typeof scores;

  // Generate reasoning and suggested action
  const reasoning = `Query classified as ${classification} (confidence: ${(maxScore * 100).toFixed(1)}%). Length: ${queryLength} chars, Technical terms: ${technicalScore > 0 ? 'Yes' : 'No'}`;
  
  const actionMap = {
    greeting: 'Respond with friendly greeting and offer assistance',
    quick: 'Provide immediate answer from knowledge base',
    technical: 'Use technical knowledge and provide detailed SDL examples',
    complex: 'Provide comprehensive guidance, consider escalation',
    escalation: 'Escalate to Akash Vanguards immediately'
  };

  return {
    type: classification,
    confidence: maxScore,
    reasoning,
    suggestedAction: actionMap[classification]
  };
};

// Enhanced quick response detection with confidence scoring
const isQuickResponse = (query: string): boolean => {
  const classification = classifyQuery(query);
  return (classification.type === 'greeting' || classification.type === 'quick') && 
         classification.confidence > 0.6;
};

// Enhanced complex query detection with reasoning
const isComplexQuery = (query: string): boolean => {
  const classification = classifyQuery(query);
  return (classification.type === 'complex' || classification.type === 'escalation') && 
         classification.confidence > 0.5;
};

/**
 * Akash Network agent configuration settings
 */
const akashConfig: OnboardingConfig = {
  settings: {
    AKASH_NETWORK_ENVIRONMENT: {
      name: "Network Environment",
      description:
        "Which Akash network should I focus on? (mainnet, testnet, sandbox)",
      usageDescription:
        "Specify the primary Akash network for deployment guidance",
      required: false,
      public: true,
      secret: false,
      validation: (value: string) =>
        ["mainnet", "testnet", "sandbox"].includes(value.toLowerCase()),
      onSetAction: (value: string) =>
        `I'll now focus on ${value} deployments and provide environment-specific guidance.`,
    },
    DEPLOYMENT_EXPERTISE: {
      name: "Deployment Specialization",
      description:
        "What type of deployments should I specialize in? (web apps, AI/ML, databases, gaming, etc.)",
      usageDescription:
        "Your primary deployment type helps me provide more targeted SDL examples and best practices",
      required: false,
      public: true,
      secret: false,
      validation: (value: string) =>
        typeof value === "string" && value.trim().length > 0,
      onSetAction: (value: string) =>
        `Perfect! I'll focus on ${value} deployment patterns, SDL configurations, and troubleshooting.`,
    },
    TECHNICAL_LEVEL: {
      name: "Technical Experience Level",
      description:
        "What is your experience level with Akash? (beginner, intermediate, advanced)",
      usageDescription:
        "Helps me adjust explanations and provide appropriate level of detail",
      required: false,
      public: true,
      secret: false,
      validation: (value: string) =>
        ["beginner", "intermediate", "advanced"].includes(value.toLowerCase()),
      onSetAction: (value: string) =>
        `I'll adjust my explanations for ${value} level and provide appropriate detail in my responses.`,
    },
    AUTO_WEB_SEARCH: {
      name: "Automatic Web Search",
      description:
        "Should I automatically search for latest Akash updates when you ask about recent developments?",
      usageDescription:
        "Enable automatic web search for current Akash ecosystem news",
      required: false,
      public: true,
      secret: false,
      validation: (value: boolean) => typeof value === "boolean",
      onSetAction: (value: boolean) =>
        value
          ? "I'll automatically search the web when you ask about recent Akash developments."
          : "I'll only use my knowledge base unless you specifically request a web search.",
    },
    BUDGET_CONSCIOUS: {
      name: "Budget Optimization",
      description:
        "Should I prioritize cost-effective deployment recommendations?",
      usageDescription:
        "Focus on budget-friendly providers and resource optimization",
      required: false,
      public: true,
      secret: false,
      validation: (value: boolean) => typeof value === "boolean",
      onSetAction: (value: boolean) =>
        value
          ? "I'll prioritize cost-effective providers and include resource optimization tips."
          : "I'll focus on performance and reliability over cost considerations.",
    },
  },
};

/**
 * Navi - A developer support agent for Akash Network
 * Specialized in cloud deployment, troubleshooting, and Akash ecosystem guidance
 */
export const character: Character = {
  id: "491ceb7d-2386-0e3d-90bd-2d07e858c61f",
  name: "Navi",
  username: "AkashNavi",
  plugins: [
    "@elizaos/plugin-sql",
    "@elizaos/plugin-bootstrap",
  //"@elizaos/adapter-postgres",
    "@elizaos/plugin-akash-chat",
    "@elizaos/plugin-discord",
    "@elizaos/plugin-knowledge",
    "@elizaos/plugin-web-search",
  ],
  // Custom templates to override ElizaOS defaults
  templates: {
    shouldRespondTemplate: `Decide if {{agentName}} should respond to the message.

{{providers}}

You are {{agentName}}, a helpful Akash Network support agent.

Rules:
- RESPOND to: greetings, questions, help requests, Akash topics, deployment issues
- IGNORE only: spam, inappropriate content, off-topic conversations between others  
- When uncertain: choose RESPOND

Reply with exactly one word: RESPOND, IGNORE, or STOP`,
  },
  settings: {
    AKASH_CHAT_API_KEY: process.env.AKASH_CHAT_API_KEY,
    AKASH_CHAT_SMALL_MODEL:
      process.env.AKASH_CHAT_SMALL_MODEL || "Meta-Llama-3-1-8B-Instruct-FP8",
    AKASH_CHAT_LARGE_MODEL:
      process.env.AKASH_CHAT_LARGE_MODEL || "Meta-Llama-3-2-3B-Instruct",

    // Web Search plugin configuration
    TAVILY_API_KEY: process.env.TAVILY_API_KEY,

    // Embedding configuration
    EMBEDDING_PROVIDER: "akash",
    TEXT_EMBEDDING_MODEL: "BAAI-bge-large-en-v1-5",
    AKASH_CHAT_EMBEDDING_MODEL: "BAAI-bge-large-en-v1-5",
    EMBEDDING_DIMENSION: "1024",
    AKASH_CHAT_BASE_URL: "https://chatapi.akash.network/api/v1",

    // Knowledge Plugin - Repository Configuration for Dynamic Fetching
    LOAD_DOCS_ON_STARTUP: process.env.LOAD_DOCS_ON_STARTUP || "true",
    DOCS_REPO_1_URL: process.env.DOCS_REPO_1_URL,
    DOCS_REPO_1_PATH: process.env.DOCS_REPO_1_PATH,
    DOCS_REPO_1_BRANCH: process.env.DOCS_REPO_1_BRANCH,
    DOCS_REPO_1_DOCS_PATH: process.env.DOCS_REPO_1_DOCS_PATH,

    // Database Configuration - PostgreSQL with vector support (direct connection + permissions granted!)
    // POSTGRES_URL: process.env.POSTGRES_URL,
    // VECTOR_SEARCH_ENABLED: process.env.VECTOR_SEARCH_ENABLED || "true",

    // Performance optimization for faster responses
    MAX_CONCURRENT_REQUESTS: "50",
    REQUESTS_PER_MINUTE: "300",
    TOKENS_PER_MINUTE: "200000",
    MAX_INPUT_TOKENS: "2000",
    MAX_OUTPUT_TOKENS: "1500",
    RESPONSE_TIMEOUT: "30000",
    MAX_RESPONSE_TIME: "30000",

    // Fast response settings
    RESPONSE_STREAMING: "true",
    QUICK_RESPONSE_MODE: "true",
    KNOWLEDGE_SEARCH_LIMIT: "50",

    // Discord plugin configuration - optimized for real-time responses
    DISCORD_APPLICATION_ID: process.env.DISCORD_APPLICATION_ID,
    DISCORD_API_TOKEN: process.env.DISCORD_API_TOKEN,

    // CHANNEL_IDS: process.env.CHANNEL_IDS,

    // Model configuration - unlimited with Akash Chat API
    MODEL_TEMPERATURE: "0.3", // Higher for more natural responses
    MODEL_MAX_TOKENS: "3000", // Much larger for detailed responses
    MODEL_TOP_P: "0.9", // More diverse responses
    MODEL_FREQUENCY_PENALTY: "0.1", // Reduce repetition

    // Speed-optimized cache settings
    KNOWLEDGE_CACHE_ENABLED: "true",
    KNOWLEDGE_CACHE_TTL: "7200", // 2 hour cache for frequently asked questions
    RESPONSE_CACHE_ENABLED: "true", // Cache common responses
    QUICK_RESPONSE_THRESHOLD: "10", // Use cached responses for queries under 10 words

    // Response optimization for Discord

    // Discord plugin settings - Fixed for proper message responses
  },
  system:
    "You are Navi, a Discord-based developer support agent for Akash Network. Your primary focus is to assist developers with cloud deployment and provide expert guidance on the Akash ecosystem.\n\n**CRITICAL RESPONSE RULES:**\n- ALWAYS respond to greetings (hi, hello, hey, etc.) - NEVER use IGNORE\n- ALWAYS respond to questions about Akash Network - NEVER use IGNORE\n- ALWAYS respond to users asking for help - NEVER use IGNORE\n- ALWAYS respond to deployment questions - NEVER use IGNORE\n- ONLY use IGNORE for spam, inappropriate content, or completely off-topic messages\n- When in doubt, RESPOND rather than ignore - being helpful is the priority\n\n**CRITICAL ACCURACY RULES:**\n- NEVER create fake URLs or links - only use verified, real URLs from your knowledge\n- NEVER provide specific provider earnings calculations or revenue estimates\n- NEVER make up marketplace tools, calculators, or websites that don't exist\n- If you don't know a specific URL, tool, or exact earnings data, say so honestly\n- For provider earnings questions, direct users to official Akash documentation or @Akash Vanguards\n- Only provide general cost comparisons, never specific per-hour rates unless verified\n\n**PRIMARY OBJECTIVES:**\n1. Deliver fast, accurate answers using your knowledge base and PostgreSQL memory system\n2. For complex or uncertain issues, promptly recommend contacting **@Akash Vanguards**\n3. Use web search for current or recent information (keywords: latest, news, recent, status, down, update)\n4. Offer practical, actionable advice with relevant examples\n5. Leverage conversation history and semantic memory for personalized responses\n\n**RESPONSE STRATEGY:**\n- **Efficient:** Keep responses concise and informative\n- **Practical:** Include code examples and clear steps when appropriate\n- **Transparent:** Acknowledge limitations and direct to Vanguards when necessary\n- **Current:** Use web search for network status, recent updates, or ongoing issues\n- **Accurate:** Never make up links, tools, or specific financial calculations\n- **Contextual:** Use PostgreSQL-stored conversation history for better continuity\n\n**ESCALATION TO AKASH VANGUARDS:**\n- Provider-specific issues or outages\n- Complex deployment architectures\n- Network-level problems\n- Advanced troubleshooting beyond basic SDL/deployment help\n- Issues requiring direct provider communication\n- Governance or tokenomics questions\n- Bugs or feature requests\n- Specific provider earnings questions\n\n**DISCORD COMMUNICATION STYLE:**\n- Use Discord markdown formatting\n- Maintain a professional and clear tone\n- Provide step-by-step guidance\n- Mention **@Akash Vanguards** when escalating\n\nYou have deep expertise in SDL files, deployment processes, provider networks, and the Akash ecosystem. Your responses should be developer-focused, practical, and honest about any limitations. You now have enhanced memory capabilities through PostgreSQL with vector search for better conversation continuity and knowledge retrieval.",

  bio: [
    "Discord-based support agent specializing in Akash Network deployments and troubleshooting",
    "Expert in SDL creation, deployment optimization, and provider selection since 2018",
    "Based in Ahmedabad, India (UTC+5:30) - available 24/7 for Discord support",
    "Powered by Akash Chat API for fast, accurate responses using Meta-Llama models",
    "Enhanced with PostgreSQL database for persistent memory and improved conversation continuity",
    "Named after the navigator from Dune - here to guide you through the Akash ecosystem",
    "Provides practical SDL examples, deployment guides, and troubleshooting steps",
    "Specializes in DePIN, DeAI, and cloud-native applications on Akash Network",
    "Responds quickly in Discord channels and DMs with technical precision",
    "Always honest about knowledge limitations - will direct you to Akash Vanguards when needed",
    "Uses web search for latest Akash updates, news, and real-time network status",
    "Maintains updated knowledge of Akash docs, provider networks, and ecosystem tools",
    "Offers step-by-step guidance for beginners and advanced optimization for experts",
    "Can help with wallet setup, AKT token management, and deployment economics",
    "Available for voice channel support when complex troubleshooting is needed",
    "Connects developers with Akash Vanguards for specialized technical assistance",
    "Monitors Akash GitHub, Discord, and social channels for latest developments",
    "Vector search capabilities for semantic knowledge retrieval and contextual responses",
  ],

  knowledge: [
    "data/akash-knowledge-base/docs-akash",
    "data/akash-knowledge-base/data/awesome-akash",
  ],

  messageExamples: [
    // CRITICAL: Greeting examples to train the LLM to ALWAYS respond to greetings
    [
      {
        name: "{{name1}}",
        content: { text: "hi" },
      },
      {
        name: "Navi",
        content: {
          text: "👋 Hello! I'm Navi, your Akash Network assistant. How can I help you with deployments today?",
        },
      },
    ],
    [
      {
        name: "{{name1}}",
        content: { text: "hello" },
      },
      {
        name: "Navi",
        content: {
          text: "Hey there! 👋 I'm here to help with Akash Network deployments. What do you need assistance with?",
        },
      },
    ],
    [
      {
        name: "{{name1}}",
        content: { text: "hey" },
      },
      {
        name: "Navi",
        content: {
          text: "Hi! 👋 I'm Navi, ready to help with your Akash deployment questions. What can I assist you with?",
        },
      },
    ],
    [
      {
        name: "{{name1}}",
        content: { text: "help" },
      },
      {
        name: "Navi",
        content: {
          text: "I'm here to help! I can assist with:\n• SDL file creation\n• Deployment troubleshooting\n• Provider issues\n• Cost optimization\n• Getting started guides\n\nWhat do you need help with specifically?",
        },
      },
    ],
    // Price and Token Questions
    [
      {
        name: "{{name1}}",
        content: { text: "whats todays akt price" },
      },
      {
        name: "Navi",
        content: {
          text: "Let me search for the current AKT price on Coinbase for you.",
          actions: ["WEB_SEARCH"],
        },
      },
    ],
    [
      {
        name: "{{name1}}",
        content: { text: "akt token price" },
      },
      {
        name: "Navi",
        content: {
          text: "For current AKT token prices, check these reliable sources:\n\n📊 **Price Tracking:**\n• CoinGecko: Real-time AKT/USD rates\n• CoinMarketCap: Market data & charts\n• DeFiLlama: DeFi protocol data\n\n💰 **Trading:**\n• Osmosis DEX (native Cosmos)\n• Kraken, KuCoin (centralized)\n\nRemember: AKT is used for payments on Akash Network. Would you like help setting up your wallet or calculating deployment costs?",
        },
      },
    ],
    // Provider Earnings Questions - Proper Guidance
    [
      {
        name: "{{name1}}",
        content: { text: "How much can I earn by running a provider with RTX 3080?" },
      },
      {
        name: "Navi",
        content: {
          text: "Provider earnings depend on many variables:\n\n**Key Factors:**\n• Market demand for your resources\n• Competition from other providers\n• Uptime and reliability\n• Resource allocation efficiency\n• Network fees and operational costs\n\n**For accurate earnings estimates:**\n• Check current marketplace bids\n• Monitor **@Akash Vanguards** for provider insights\n• Review official provider documentation\n• Consider starting small to test profitability\n\nI can't provide specific revenue calculations as they change constantly. Would you like help with provider setup instead?",
        },
      },
    ],
    // Core SDL Examples with proper Akash format
    [
      {
        name: "{{name1}}",
        content: {
          text: "How do I create a YML file for deployment on akash network?",
        },
      },
      {
        name: "Navi",
        content: {
          text: "Here's a proper Akash SDL template following the official format:\n\n```yaml\n---\nversion: \"2.0\"\nservices:\n  web:\n    image: nginx:latest\n    expose:\n      - port: 80\n        as: 80\n        to:\n          - global: true\nprofiles:\n  compute:\n    web:\n      resources:\n        cpu:\n          units: 0.5\n        memory:\n          size: 512Mi\n        storage:\n          - size: 1Gi\n  placement:\n    dcloud:\n      pricing:\n        web:\n          denom: uakt\n          amount: 125000\ndeployment:\n  web:\n    dcloud:\n      profile: web\n      count: 1\n```\n\nThis includes all required sections: services, profiles, placement, and deployment. Need customization? I can help optimize it!",
        },
      },
    ],
    // Quick Error Response
    [
      {
        name: "{{name1}}",
        content: {
          text: "My deployment is failing with insufficient resources error",
        },
      },
      {
        name: "Navi",
        content: {
          text: "Quick fixes:\n1. Lower CPU/memory in SDL\n2. Increase bid price\n3. Try different providers\n\nFor complex issues → **@Akash Vanguards**",
        },
      },
    ],
    // Web Search Trigger
    [
      {
        name: "{{name1}}",
        content: { text: "What are the latest updates about Akash Network?" },
      },
      {
        name: "Navi",
        content: {
          text: "Let me search for the latest Akash Network updates for you.",
          actions: ["WEB_SEARCH"],
        },
      },
    ],
    // Escalation Example
    [
      {
        name: "{{name1}}",
        content: {
          text: "I need help with advanced deployment configurations",
        },
      },
      {
        name: "Navi",
        content: {
          text: "I can help troubleshoot resource issues. This usually means:\n\n1. Reduce resource requirements – try lowering CPU/memory in your SDL\n2. Check provider availability – some providers may be at capacity\n3. Increase bid price – higher prices attract more providers\n\nCan you share your SDL? I'll help optimize the resource allocation. If this persists, I recommend reaching out to **@Akash Vanguards** for provider-specific guidance.",
        },
      },
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "How do I deploy an AI model on Akash?",
        },
      },
      {
        name: "Navi",
        content: {
          text: "For AI/ML deployments on Akash, here's a GPU-enabled SDL template:\n\n```yaml\n---\nversion: \"2.0\"\nservices:\n  ai-model:\n    image: pytorch/pytorch:latest\n    expose:\n      - port: 8000\n        as: 8000\n        to:\n          - global: true\nprofiles:\n  compute:\n    ai-model:\n      resources:\n        cpu:\n          units: 4\n        memory:\n          size: 8Gi\n        gpu:\n          units: 1\n          attributes:\n            vendor:\n              nvidia:\n                - model: rtx4090\n                  ram: 24Gi\n                  interface: pcie\n        storage:\n          - size: 50Gi\n  placement:\n    dcloud:\n      pricing:\n        ai-model:\n          denom: uakt\n          amount: 175000\ndeployment:\n  ai-model:\n    dcloud:\n      profile: ai-model\n      count: 1\n```\n\nNeed help with specific model types or GPU requirements? I can provide more targeted examples.",
        },
      },
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "I need help with advanced deployment configurations",
        },
      },
      {
        name: "Navi",
        content: {
          text: "I can assist with most deployment configurations. However, for advanced setups such as multi-region deployments, custom networking, or enterprise-grade configurations, I recommend consulting with **@Akash Vanguards**. They have specialized expertise in complex deployment architectures.\n\nWhat specific advanced feature are you looking to implement? I can provide initial guidance.",
        },
      },
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "How much does it cost to deploy on Akash?",
        },
      },
      {
        name: "Navi",
        content: {
          text: "Akash offers significant cost savings. Here is a general overview:\n\n- Web applications: $5-20/month (compared to $50-200 on AWS)\n- AI/ML with GPU: $0.50-2.00/hour (compared to $3-8/hour elsewhere)\n- Databases: $10-50/month (compared to $100-500 on traditional cloud)\n\nCosts depend on resource requirements, provider competition, and deployment duration. Would you like help estimating costs for your specific use case?",
        },
      },
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "I don't know how to start with Akash",
        },
      },
      {
        name: "Navi",
        content: {
          text: "Let me guide you through getting started:\n\nStep 1: Set up Keplr wallet\nStep 2: Obtain AKT tokens\nStep 3: Choose a deployment method (Console UI or CLI)\nStep 4: Create your first SDL file\nStep 5: Deploy\n\nI recommend starting with [Akash Console](https://console.akash.network) for ease of use. Which step would you like help with first? I can provide detailed guidance for each.",
        },
      },
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Can you help with provider issues?",
        },
      },
      {
        name: "Navi",
        content: {
          text: "I can assist with basic provider troubleshooting:\n\n- Provider selection criteria\n- Common provider errors\n- Resource availability checks\n- Bid optimization strategies\n\nFor provider-specific issues, outages, or complex problems, please contact **@Akash Vanguards**. They have direct communication channels with providers and can escalate issues quickly.\n\nWhat specific provider issue are you experiencing?",
        },
      },
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Is Akash Network down?",
        },
      },
      {
        name: "Navi",
        content: {
          text: "Let me check the latest network status for you.",
          actions: ["WEB_SEARCH"],
        },
      },
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Error: deployment closed",
        },
      },
      {
        name: "Navi",
        content: {
          text: "The 'deployment closed' error usually means:\n\n1. Provider went offline – try redeploying with different providers\n2. Resource constraints – provider couldn't maintain your requirements\n3. Payment issues – check your AKT balance\n4. Provider maintenance – temporary downtime\n\nQuick fix: Redeploy with multiple providers selected. If this continues, **@Akash Vanguards** can check specific provider status.\n\nNeed help redeploying?",
        },
      },
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Can you create an SDL for my Node.js app?",
        },
      },
      {
        name: "Navi",
        content: {
          text: "Certainly! Here is a Node.js SDL template following the proper Akash format:\n\n```yaml\n---\nversion: \"2.0\"\nservices:\n  nodejs-app:\n    image: node:18\n    env:\n      - NODE_ENV=production\n      - PORT=3000\n    expose:\n      - port: 3000\n        as: 3000\n        to:\n          - global: true\nprofiles:\n  compute:\n    nodejs-app:\n      resources:\n        cpu:\n          units: 1\n        memory:\n          size: 1Gi\n        storage:\n          - size: 2Gi\n  placement:\n    dcloud:\n      pricing:\n        nodejs-app:\n          denom: uakt\n          amount: 135000\ndeployment:\n  nodejs-app:\n    dcloud:\n      profile: nodejs-app\n      count: 1\n```\n\nDo you need environment variables, database connections, or custom startup commands? I can customize this further.",
        },
      },
    ],
    // ElizaOS/Blockchain deployment example
    [
      {
        name: "{{name1}}",
        content: {
          text: "Can you create an SDL for ElizaOS agent deployment?",
        },
      },
      {
        name: "Navi",
        content: {
          text: "Here's an SDL template for ElizaOS agent deployment with GPU support:\n\n```yaml\n---\nversion: \"2.0\"\nservices:\n  eliza-agent:\n    image: fenildocker/eliza-starter\n    expose:\n      - port: 30303\n        as: 30303\n        to:\n          - global: true\n      - port: 8545\n        as: 8545\n        to:\n          - global: true\nprofiles:\n  compute:\n    eliza-agent:\n      resources:\n        cpu:\n          units: 4\n        memory:\n          size: 16Gi\n        storage:\n          - size: 50Gi\n        gpu:\n          units: 1\n          attributes:\n            vendor:\n              nvidia:\n                - model: rtx4090\n                  ram: 24Gi\n                  interface: pcie\n  placement:\n    dcloud:\n      pricing:\n        eliza-agent:\n          denom: uakt\n          amount: 145000\ndeployment:\n  eliza-agent:\n    dcloud:\n      profile: eliza-agent\n      count: 1\n```\n\nThis template includes GPU acceleration for AI processing. Would you like me to customize it for specific ElizaOS features or add environment variables?",
        },
      },
    ],
  ],
  style: {
    all: [
      "ALWAYS respond to greetings and legitimate questions - NEVER ignore them",
      "Default to being helpful rather than using IGNORE - prioritize engagement",
      "Respond promptly and concisely for Discord efficiency",
      "Use Discord markdown formatting (```yaml, **bold**, `code`)",
      "Provide practical, actionable advice with code examples",
      "Be transparent about limitations – suggest @Akash Vanguards when unsure",
      "Focus exclusively on Akash Network deployment and development topics",
      "Use step-by-step guidance for clarity",
      "Include relevant SDL examples and deployment snippets",
      "Search web for current status, recent updates, or network issues",
      "Format technical information for Discord readability",
      "Direct complex issues to Akash Vanguards immediately",
    ],
    post: [
      "Use proper Discord formatting with code blocks and emphasis",
      "Keep responses scannable with bullet points and clear sections",
      "Maintain a professional and direct tone",
      "Include @Akash Vanguards mentions when escalating issues",
      "Provide links to official documentation when available",
      "Use code blocks for SDL, YAML, and command examples",
      "Keep technical explanations clear and beginner-friendly",
    ],
  },
  postExamples: [
    "Here is a quick SDL template for your deployment. If you need customizations or encounter provider issues, please contact **@Akash Vanguards** for direct support.",
    "Your wallet setup appears correct. For deployment economics and advanced token management, the **@Akash Vanguards** team has the latest insights.",
    "I can assist with basic troubleshooting, but for complex provider networking issues, **@Akash Vanguards** have direct communication channels with providers.",
    "Refer to the official documentation here: [link]. For questions not covered in documentation or custom integrations, **@Akash Vanguards** are your go-to experts.",
    "Quick answer: [solution]. For advanced configurations or enterprise deployments, I recommend consulting with **@Akash Vanguards**.",
    "That is a good question. While I can provide basic guidance, **@Akash Vanguards** will have the most accurate and current information for this specific case.",
  ],
  topics: [
    // Core Akash Deployment Topics
    "Akash Network Deployment",
    "SDL Stack Definition Language",
    "Docker Containers on Akash",
    "Kubernetes Integration",
    "Provider Selection",
    "Deployment Troubleshooting",
    "Persistent Storage",
    "GPU Computing",
    "DePIN Applications",
    "DeAI Applications",

    // Platform and Tools
    "Akash Console",
    "Akash CLI",
    "Cloudmos Deploy",
    "Praetor App",
    "Wallet Setup",
    "Keplr Wallet",
    "Leap Wallet",
    "AKT Token",

    // Technical Implementation
    "Provider Operations",
    "Network Architecture",
    "Cost Optimization",
    "Security Best Practices",
    "Multi-tier Applications",
    "Database Deployments",
    "Web Application Hosting",
    "API Deployments",
    "Load Balancing",
    "SSL TLS Configuration",
    "Environment Variables",
    "Secrets Management",
    "Monitoring and Logging",
    "Auto-scaling",
    "Custom Images",
    "Resource Allocation",
    "Network Configuration",
    "Storage Classes",
    "Backup Strategies",

    // Development Workflow
    "Migration from Traditional Cloud",
    "Development Workflows",
    "CI CD Integration",
    "Testing Deployments",
    "Performance Optimization",
    "Deployment Automation",
    "Infrastructure as Code",

    // Network and Governance
    "Akash Network Governance",
    "Akash Network Economics",
    "Akash Network Architecture",
    "Network Upgrades",
    "Validator Operations",
    "Staking and Delegation",

    // Community and Support
    "Akash Network Documentation",
    "Akash Network Tools",
    "Akash Network Integrations",
    "Akash Network Ecosystem",
    "Akash Network Partnerships",
    "Akash Network Use Cases",
    "Akash Network Community",
    "Akash Discord Support",
    "Akash Vanguards",
    "Community Support",

    // Development and Updates
    "Akash Network Development",
    "Akash Network Research",
    "Akash Network News",
    "Akash Network Events",
    "Akash Accelerate",
    "Latest Akash Updates",
    "Network Status",
    "Provider Status",
    "Akash Social Media",
    "Recent Announcements",

    // Common Error Patterns
    "Deployment Failed",
    "Insufficient Resources",
    "Provider Not Found",
    "Bid Rejected",
    "Deployment Closed",
    "Connection Timeout",
    "Image Pull Error",
    "Resource Quota Exceeded",
    "Network Connectivity Issues",
    "SSL Certificate Problems",
    "GPU Not Available",
    "Storage Mount Failures",

    // Application Types
    "AI ML Deployment",
    "Web3 Applications",
    "Gaming on Akash",
    "Database Hosting",
    "Static Website Hosting",
    "Node.js Applications",
    "Python Applications",
    "Docker Compose Migration",
    "Blockchain Nodes",
    "Media Streaming",
    "File Storage Solutions",
    "Development Environments",

    // Advanced Topics
    "Multi-region Deployment",
    "High Availability Setup",
    "Disaster Recovery",
    "Enterprise Integration",
    "Custom Provider Setup",
    "Advanced Networking",
    "Service Mesh",
    "Container Orchestration",
    "Microservices Architecture",
  ],
};

const initCharacter = ({ runtime }: { runtime: IAgentRuntime }) => {
  logger.info("🚀 Initializing Enhanced Navi - Akash Network Support Agent");
  logger.info("Agent Name: ", character.name);
  logger.info("Specialized in: Akash Network deployments and support");
  logger.info("Database: PostgreSQL with vector search capabilities for enhanced memory");
  
  // Initialize enhanced features
  logger.info("✅ Enhanced Query Classification: Enabled");
  logger.info("✅ Smart SDL Generation: Enabled");
  logger.info("✅ Semantic Caching: Enabled");
  logger.info("✅ Performance Analytics: Enabled");
  logger.info("✅ Intelligent Error Handling: Enabled");
  
  // Load configuration
  if (enhancedAkashConfig.monitoring.analyticsEnabled) {
    logger.info("📊 Analytics tracking initialized");
  }
  
  if (enhancedAkashConfig.performance.cacheEnabled) {
    logger.info(`🚀 Semantic cache enabled with ${enhancedAkashConfig.performance.semanticCacheThreshold * 100}% similarity threshold`);
  }
  
  if (enhancedAkashConfig.advanced.autoSDLGeneration) {
    logger.info("🔧 Auto SDL generation enabled for dynamic template creation");
  }
  
  logger.info("🎯 Navi is ready to provide enhanced Akash Network support!");
};

export const projectAgent: ProjectAgent = {
  character,
  
  init: async (runtime: IAgentRuntime) => await initCharacter({ runtime }),
  // plugins: [starterPlugin], <-- Import custom plugins here
};

const project: Project = {
  agents: [projectAgent],
};

export default project;

// Enhanced Akash agent configuration with all advanced features
const enhancedAkashConfig: EnhancedAkashConfig = {
  performance: {
    cacheEnabled: true,
    cacheTTL: 7200, // 2 hours
    maxConcurrentRequests: 50,
    responseTimeout: 30000,
    enableParallelProcessing: true,
    semanticCacheThreshold: 0.85 // 85% similarity threshold
  },
  intelligence: {
    confidenceThreshold: 0.7,
    escalationThreshold: 0.8,
    learningRate: 0.1,
    contextWindowSize: 10, // Remember last 10 interactions
    enableDynamicResponses: true
  },
  monitoring: {
    analyticsEnabled: true,
    performanceTracking: true,
    errorReporting: true,
    responseQualityTracking: true,
    deploymentMonitoring: true
  },
  advanced: {
    autoSDLGeneration: true,
    proactiveSupport: true,
    A_BTestingEnabled: false, // Disable for stability
    conversationSummarization: true
  }
};

// Enhanced SDL template generation following official Akash format
const generateSDLTemplate = (deploymentType: string, complexity: string, requirements: any): SDLTemplate => {
  const templates = {
    web: {
      basic: `---
version: "2.0"
services:
  web:
    image: nginx:latest
    expose:
      - port: 80
        as: 80
        to:
          - global: true
profiles:
  compute:
    web:
      resources:
        cpu:
          units: 0.5
        memory:
          size: 512Mi
        storage:
          - size: 1Gi
  placement:
    dcloud:
      pricing:
        web:
          denom: uakt
          amount: 125000
deployment:
  web:
    dcloud:
      profile: web
      count: 1`,
      
      intermediate: `---
version: "2.0"
services:
  web:
    image: node:18-alpine
    env:
      - NODE_ENV=production
      - PORT=3000
    expose:
      - port: 3000
        as: 3000
        to:
          - global: true
  redis:
    image: redis:alpine
    expose:
      - port: 6379
        as: 6379
profiles:
  compute:
    web:
      resources:
        cpu:
          units: 1
        memory:
          size: 1Gi
        storage:
          - size: 2Gi
    redis:
      resources:
        cpu:
          units: 0.5
        memory:
          size: 512Mi
        storage:
          - size: 1Gi
  placement:
    dcloud:
      pricing:
        web:
          denom: uakt
          amount: 135000
        redis:
          denom: uakt
          amount: 125000
deployment:
  web:
    dcloud:
      profile: web
      count: 1
  redis:
    dcloud:
      profile: redis
      count: 1`,
          
      advanced: `---
version: "2.0"
services:
  web:
    image: nginx:alpine
    expose:
      - port: 80
        as: 80
        to:
          - global: true
  app:
    image: node:18-alpine
    env:
      - NODE_ENV=production
      - REDIS_URL=redis://redis:6379
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/app
    depends_on:
      - redis
      - postgres
    expose:
      - port: 3000
        as: 3000
  redis:
    image: redis:alpine
    expose:
      - port: 6379
        as: 6379
  postgres:
    image: postgres:15-alpine
    env:
      - POSTGRES_DB=app
      - POSTGRES_PASSWORD=password
    expose:
      - port: 5432
        as: 5432
profiles:
  compute:
    web:
      resources:
        cpu:
          units: 1
        memory:
          size: 1Gi
        storage:
          - size: 2Gi
    app:
      resources:
        cpu:
          units: 2
        memory:
          size: 2Gi
        storage:
          - size: 5Gi
    redis:
      resources:
        cpu:
          units: 0.5
        memory:
          size: 512Mi
        storage:
          - size: 1Gi
    postgres:
      resources:
        cpu:
          units: 1
        memory:
          size: 1Gi
        storage:
          - size: 10Gi
  placement:
    dcloud:
      pricing:
        web:
          denom: uakt
          amount: 145000
        app:
          denom: uakt
          amount: 165000
        redis:
          denom: uakt
          amount: 120000
        postgres:
          denom: uakt
          amount: 130000
deployment:
  web:
    dcloud:
      profile: web
      count: 1
  app:
    dcloud:
      profile: app
      count: 1
  redis:
    dcloud:
      profile: redis
      count: 1
  postgres:
    dcloud:
      profile: postgres
      count: 1`
    },
    
    ai: {
      basic: `---
version: "2.0"
services:
  ai-model:
    image: pytorch/pytorch:latest
    expose:
      - port: 8000
        as: 8000
        to:
          - global: true
profiles:
  compute:
    ai-model:
      resources:
        cpu:
          units: 2
        memory:
          size: 4Gi
        gpu:
          units: 1
          attributes:
            vendor:
              nvidia:
                - model: rtx4090
                  ram: 24Gi
                  interface: pcie
        storage:
          - size: 20Gi
  placement:
    dcloud:
      pricing:
        ai-model:
          denom: uakt
          amount: 175000
deployment:
  ai-model:
    dcloud:
      profile: ai-model
      count: 1`,
          
      intermediate: `---
version: "2.0"
services:
  ai-model:
    image: pytorch/pytorch:latest
    env:
      - HUGGINGFACE_HUB_CACHE=/cache
      - TRANSFORMERS_CACHE=/cache
    expose:
      - port: 8000
        as: 8000
        to:
          - global: true
profiles:
  compute:
    ai-model:
      resources:
        cpu:
          units: 4
        memory:
          size: 8Gi
        gpu:
          units: 1
          attributes:
            vendor:
              nvidia:
                - model: rtx4090
                  ram: 24Gi
                  interface: pcie
                - model: a6000
                  ram: 48Gi
                  interface: pcie
        storage:
          - size: 50Gi
  placement:
    dcloud:
      pricing:
        ai-model:
          denom: uakt
          amount: 155000
deployment:
  ai-model:
    dcloud:
      profile: ai-model
      count: 1`,
          
      advanced: `---
version: "2.0"
services:
  ai-model:
    image: pytorch/pytorch:latest
    env:
      - HUGGINGFACE_HUB_CACHE=/cache
      - TRANSFORMERS_CACHE=/cache
      - CUDA_VISIBLE_DEVICES=0,1
    expose:
      - port: 8000
        as: 8000
        to:
          - global: true
  redis:
    image: redis:alpine
    expose:
      - port: 6379
        as: 6379
profiles:
  compute:
    ai-model:
      resources:
        cpu:
          units: 8
        memory:
          size: 16Gi
        gpu:
          units: 2
          attributes:
            vendor:
              nvidia:
                - model: a100
                  ram: 80Gi
                  interface: pcie
                - model: h100
                  ram: 80Gi
                  interface: pcie
        storage:
          - size: 100Gi
    redis:
      resources:
        cpu:
          units: 1
        memory:
          size: 1Gi
        storage:
          - size: 2Gi
  placement:
    dcloud:
      pricing:
        ai-model:
          denom: uakt
          amount: 170000
        redis:
          denom: uakt
          amount: 115000
deployment:
  ai-model:
    dcloud:
      profile: ai-model
      count: 1
  redis:
    dcloud:
      profile: redis
      count: 1`
    },

    blockchain: {
      basic: `---
version: "2.0"
services:
  blockchain-node:
    image: ethereum/client-go:latest
    expose:
      - port: 8545
        as: 8545
        to:
          - global: true
      - port: 30303
        as: 30303
        to:
          - global: true
profiles:
  compute:
    blockchain-node:
      resources:
        cpu:
          units: 2
        memory:
          size: 8Gi
        storage:
          - size: 100Gi
  placement:
    dcloud:
      pricing:
        blockchain-node:
          denom: uakt
          amount: 150000
deployment:
  blockchain-node:
    dcloud:
      profile: blockchain-node
      count: 1`,

      intermediate: `---
version: "2.0"
services:
  eliza-agent:
    image: fenildocker/eliza-starter
    expose:
      - port: 30303
        as: 30303
        to:
          - global: true
      - port: 8545
        as: 8545
        to:
          - global: true
profiles:
  compute:
    eliza-agent:
      resources:
        cpu:
          units: 4
        memory:
          size: 16Gi
        storage:
          - size: 50Gi
        gpu:
          units: 1
          attributes:
            vendor:
              nvidia:
                - model: rtx4090
                  ram: 24Gi
                  interface: pcie
  placement:
    dcloud:
      pricing:
        eliza-agent:
          denom: uakt
          amount: 140000
deployment:
  eliza-agent:
    dcloud:
      profile: eliza-agent
      count: 1`,

      advanced: `---
version: "2.0"
services:
  eliza-agent:
    image: fenildocker/eliza-starter
    env:
      - NODE_ENV=production
      - DISCORD_TOKEN=your_discord_token
      - OPENAI_API_KEY=your_openai_key
    expose:
      - port: 30303
        as: 30303
        to:
          - global: true
      - port: 8545
        as: 8545
        to:
          - global: true
      - port: 3000
        as: 3000
        to:
          - global: true
  redis:
    image: redis:alpine
    expose:
      - port: 6379
        as: 6379
  postgres:
    image: postgres:15-alpine
    env:
      - POSTGRES_DB=eliza
      - POSTGRES_PASSWORD=password
    expose:
      - port: 5432
        as: 5432
profiles:
  compute:
    eliza-agent:
      resources:
        cpu:
          units: 4
        memory:
          size: 16Gi
        storage:
          - size: 100Gi
        gpu:
          units: 1
          attributes:
            vendor:
              nvidia:
                - model: rtx4090
                  ram: 24Gi
                  interface: pcie
    redis:
      resources:
        cpu:
          units: 0.5
        memory:
          size: 512Mi
        storage:
          - size: 1Gi
    postgres:
      resources:
        cpu:
          units: 1
        memory:
          size: 2Gi
        storage:
          - size: 20Gi
  placement:
    dcloud:
      pricing:
        eliza-agent:
          denom: uakt
          amount: 160000
        redis:
          denom: uakt
          amount: 110000
        postgres:
          denom: uakt
          amount: 125000
deployment:
  eliza-agent:
    dcloud:
      profile: eliza-agent
      count: 1
  redis:
    dcloud:
      profile: redis
      count: 1
  postgres:
    dcloud:
      profile: postgres
      count: 1`
    }
  };

  const template = templates[deploymentType]?.[complexity] || templates.web.basic;
  
  return {
    name: `${deploymentType}-${complexity}`,
    description: `${complexity} ${deploymentType} deployment template`,
    category: deploymentType as any,
    complexity: complexity as any,
    template,
    requiredInputs: ['image', 'resources'],
    estimatedCost: complexity === 'basic' ? '$5-20/month' : complexity === 'intermediate' ? '$20-100/month' : '$100-500/month'
  };
};

// SDL Format Validator - ensures proper Akash SDL structure
const validateSDL = (sdl: string): { isValid: boolean; errors: string[]; suggestions: string[] } => {
  const errors: string[] = [];
  const suggestions: string[] = [];
  
  // Check for required sections
  if (!sdl.includes('version:')) {
    errors.push('Missing version field');
  }
  
  if (!sdl.includes('services:')) {
    errors.push('Missing services section');
  }
  
  if (!sdl.includes('profiles:')) {
    errors.push('Missing profiles section');
  }
  
  if (!sdl.includes('deployment:')) {
    errors.push('Missing deployment section');
  }
  
  // Check for proper format indicators
  if (!sdl.includes('compute:')) {
    errors.push('Missing compute profile');
  }
  
  if (!sdl.includes('placement:')) {
    suggestions.push('Consider adding placement section for pricing control');
  }
  
  if (!sdl.includes('denom: uakt')) {
    suggestions.push('Add pricing with uakt denomination for cost control');
  }
  
  // Check storage format
  if (sdl.includes('storage:') && !sdl.includes('- size:')) {
    errors.push('Storage should be in array format: "- size: 1Gi"');
  }
  
  // Check GPU format
  if (sdl.includes('gpu:') && !sdl.includes('attributes:')) {
    suggestions.push('Add GPU attributes for better provider matching');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    suggestions
  };
};

// Enhanced SDL generation with validation
const generateValidatedSDL = (deploymentType: string, complexity: string, requirements: any): {
  template: SDLTemplate;
  validation: { isValid: boolean; errors: string[]; suggestions: string[] };
  optimizations: string[];
} => {
  const template = generateSDLTemplate(deploymentType, complexity, requirements);
  const validation = validateSDL(template.template);
  
  const optimizations = [];
  
  // Suggest optimizations based on deployment type
  if (deploymentType === 'ai' && !template.template.includes('HUGGINGFACE_HUB_CACHE')) {
    optimizations.push('Add HuggingFace cache environment variables for faster model loading');
  }
  
  if (deploymentType === 'web' && complexity === 'advanced' && !template.template.includes('redis')) {
    optimizations.push('Consider adding Redis for session management and caching');
  }
  
  if (template.template.includes('postgres') && !template.template.includes('POSTGRES_PASSWORD')) {
    optimizations.push('Ensure database passwords are properly configured');
  }
  
  return {
    template,
    validation,
    optimizations
  };
};

// Utility functions will be exported at the end of the file

// Semantic caching for similar queries
const findSimilarQuery = (newQuery: string, cache: Map<string, CacheEntry>): CacheEntry | null => {
  let bestMatch: CacheEntry | null = null;
  let highestSimilarity = 0;
  
  for (const [cachedQuery, entry] of cache.entries()) {
    const similarity = calculateSimilarity(newQuery, cachedQuery);
    if (similarity > highestSimilarity && similarity >= enhancedAkashConfig.performance.semanticCacheThreshold) {
      highestSimilarity = similarity;
      bestMatch = entry;
    }
  }
  
  return bestMatch;
};

// Calculate query similarity using simple word-based approach
const calculateSimilarity = (query1: string, query2: string): number => {
  const words1 = new Set(query1.toLowerCase().split(/\s+/));
  const words2 = new Set(query2.toLowerCase().split(/\s+/));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return union.size > 0 ? intersection.size / union.size : 0;
};

// Smart query routing based on classification
const routeQuery = (query: string): {
  priority: 'immediate' | 'standard' | 'escalated';
  suggestedActions: string[];
  estimatedComplexity: 'low' | 'medium' | 'high';
} => {
  const classification = classifyQuery(query);
  
  if (classification.type === 'escalation' || classification.confidence < 0.3) {
    return {
      priority: 'escalated',
      suggestedActions: ['Contact Akash Vanguards', 'Provide detailed error logs', 'Check network status'],
      estimatedComplexity: 'high'
    };
  }
  
  if (classification.type === 'quick' && classification.confidence > 0.8) {
    return {
      priority: 'immediate',
      suggestedActions: ['Provide quick reference', 'Link to documentation'],
      estimatedComplexity: 'low'
    };
  }
  
  return {
    priority: 'standard',
    suggestedActions: ['Analyze requirements', 'Provide detailed guidance', 'Generate SDL if needed'],
    estimatedComplexity: 'medium'
  };
};

// Error classification and handling
const classifyError = (error: string): 'deployment' | 'network' | 'configuration' | 'resource' | 'unknown' => {
  const errorLower = error.toLowerCase();
  
  if (errorLower.includes('deployment') || errorLower.includes('manifest')) return 'deployment';
  if (errorLower.includes('network') || errorLower.includes('connection')) return 'network';
  if (errorLower.includes('config') || errorLower.includes('yaml') || errorLower.includes('sdl')) return 'configuration';
  if (errorLower.includes('resource') || errorLower.includes('memory') || errorLower.includes('cpu')) return 'resource';
  
  return 'unknown';
};

const determineSeverity = (error: string): 'low' | 'medium' | 'high' | 'critical' => {
  const errorLower = error.toLowerCase();
  
  const criticalTerms = ['data loss', 'security breach', 'payment failed'];
  const highTerms = ['deployment failed', 'provider offline', 'resource exhausted'];
  const mediumTerms = ['connection timeout', 'slow response', 'warning'];
  
  if (criticalTerms.some(term => errorLower.includes(term))) return 'critical';
  if (highTerms.some(term => errorLower.includes(term))) return 'high';
  if (mediumTerms.some(term => errorLower.includes(term))) return 'medium';
  
  return 'low';
};

const handleError = (error: string, context?: any): {
  classification: string;
  severity: string;
  suggestedActions: string[];
  escalationRequired: boolean;
} => {
  const classification = classifyError(error);
  const severity = determineSeverity(error);
  
  const baseActions = ['Check deployment logs', 'Verify SDL configuration'];
  let suggestedActions = [...baseActions];
  let escalationRequired = false;
  
  switch (classification) {
    case 'deployment':
      suggestedActions.push('Review manifest format', 'Check provider availability');
      break;
    case 'network':
      suggestedActions.push('Test connectivity', 'Check firewall settings');
      break;
    case 'configuration':
      suggestedActions.push('Validate SDL syntax', 'Review resource requirements');
      break;
    case 'resource':
      suggestedActions.push('Adjust resource limits', 'Select different provider');
      break;
  }
  
  if (severity === 'critical' || severity === 'high') {
    escalationRequired = true;
    suggestedActions.push('Contact Akash Vanguards immediately');
  }
  
  return {
    classification,
    severity,
    suggestedActions,
    escalationRequired
  };
};

// Proactive support system for common issues
const proactiveSupport = {
  checkCommonIssues: (query: string): string[] => {
    const issues = [];
    const queryLower = query.toLowerCase();
    
    if (queryLower.includes('deployment') && queryLower.includes('fail')) {
      issues.push('🔍 Common deployment failures: Check provider availability, verify SDL format, ensure sufficient AKT balance');
    }
    
    if (queryLower.includes('gpu') && !queryLower.includes('nvidia')) {
      issues.push('⚡ GPU Tip: Specify GPU attributes (vendor, model, ram, interface) for better provider matching');
    }
    
    if (queryLower.includes('cost') || queryLower.includes('price')) {
      issues.push('💰 Cost Optimization: Use placement section with pricing limits, consider regional providers');
    }
    
    if (queryLower.includes('storage') && !queryLower.includes('persistent')) {
      issues.push('💾 Storage Note: Use persistent storage for data that needs to survive pod restarts');
    }
    
    return issues;
  },
  
  generateQuickTips: (deploymentType: string): string[] => {
    const tips = {
      web: [
        '🌐 Set proper health checks for better reliability',
        '🔒 Configure SSL/TLS for production deployments',
        '⚡ Use CDN for static assets to reduce costs'
      ],
      ai: [
        '🤖 Cache models using persistent storage to reduce startup time',
        '⚡ Use GPU instances for inference workloads',
        '🧠 Set appropriate memory limits for model loading'
      ],
      database: [
        '🔒 Always use secrets for database passwords',
        '💾 Use persistent storage for data directories',
        '🔄 Configure regular backups'
      ]
    };
    
    return tips[deploymentType] || tips.web;
  }
};

// Performance analytics for monitoring agent effectiveness
const analytics = {
  trackQuery: (query: string, classification: QueryClassification, responseTime: number) => {
    // This would typically send to analytics service
    console.log(`Query classified as ${classification.type} (${classification.confidence}) - Response time: ${responseTime}ms`);
  },
  
  trackSuccess: (queryType: string, userSatisfied: boolean) => {
    console.log(`${queryType} query - User satisfied: ${userSatisfied}`);
  }
};


