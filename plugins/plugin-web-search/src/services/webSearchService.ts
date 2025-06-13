import {
    Service,
    type IAgentRuntime,
    ServiceType,
    elizaLogger
} from "@elizaos/core";
import { tavily } from "@tavily/core";
import type { IWebSearchService, SearchOptions, SearchResponse } from "../types";

export type TavilyClient = ReturnType<typeof tavily>; // declaring manually because original package does not export its types

// List of official Akash Network documentation and community sites
const AKASH_OFFICIAL_DOMAINS = [
    'docs.akash.network',
    'akash.network',
    'github.com/akash-network',
    'forum.akash.network',
    'awesome.akash.network',
    'x.com/akashnet_',
    'twitter.com/akashnet_'
];

// List of social media domains to check for
const SOCIAL_MEDIA_DOMAINS = [
    'twitter.com',
    'x.com',
    'medium.com'
];

// Special events/topics with dedicated documentation links
const AKASH_SPECIAL_TOPICS = {
    "accelerate": {
        name: "Akash Accelerate",
        links: [
            {
                title: "Akash Accelerate Event Page",
                url: "https://akash.network/accelerate/",
                description: "Official event page for Akash Accelerate with details about upcoming events, speakers, and registration."
            },
            {
                title: "Akash Accelerate 2024 Recap",
                url: "https://akash.network/blog/akash-accelerate-2024-recap/",
                description: "A comprehensive recap of the Akash Accelerate 2024 event, including presentations, announcements, and highlights."
            },
            {
                title: "Akash Accelerate GitHub Resources",
                url: "https://github.com/akash-network/community/tree/main/sig-events/akash-accelerate",
                description: "GitHub repository with resources, slides, and materials from previous Akash Accelerate events."
            }
        ]
    },
    "supercloud": {
        name: "Akash Supercloud",
        links: [
            {
                title: "Akash Supercloud Documentation",
                url: "https://akash.network/docs/deployments/akash-console/",
                description: "Official documentation for Akash Supercloud features and deployment options."
            },
            {
                title: "Akash AI Supercloud Blog",
                url: "https://akash.network/blog/ai-supercloud/",
                description: "Blog post explaining the Akash AI Supercloud concept and its benefits."
            }
        ]
    },
    "gpu": {
        name: "Akash GPU",
        links: [
            {
                title: "GPU Deployments on Akash",
                url: "https://akash.network/docs/deployments/akash-console/gpu-deployment/",
                description: "Official documentation for deploying GPU workloads on Akash Network."
            },
            {
                title: "GPU Provider Operations",
                url: "https://akash.network/docs/providers/gpu-providers/",
                description: "Documentation for GPU providers on Akash Network."
            },
            {
                title: "Akash GPU Marketplace",
                url: "https://akash.network/marketplace/",
                description: "Akash GPU marketplace for finding available GPU providers and pricing."
            }
        ]
    },
    "pricing": {
        name: "Akash Pricing",
        links: [
            {
                title: "Akash Network Pricing",
                url: "https://akash.network/pricing/",
                description: "Official pricing information for Akash Network services."
            },
            {
                title: "Akash Network Cost Calculator",
                url: "https://akash.network/about/cloud-cost-calculator/",
                description: "Tool to calculate and compare costs between Akash and traditional cloud providers."
            }
        ]
    },
    "provider": {
        name: "Akash Providers",
        links: [
            {
                title: "Provider Documentation",
                url: "https://akash.network/docs/providers/",
                description: "Comprehensive documentation for Akash Network providers."
            },
            {
                title: "Provider Setup Guide",
                url: "https://akash.network/docs/providers/build-a-cloud-provider/",
                description: "Step-by-step guide for setting up and running an Akash provider."
            },
            {
                title: "Provider Rewards",
                url: "https://akash.network/docs/providers/provider-rewards/",
                description: "Information about the provider rewards program on Akash Network."
            }
        ]
    },
    "mainnet": {
        name: "Akash Mainnet",
        links: [
            {
                title: "Mainnet Documentation",
                url: "https://akash.network/docs/mainnet/",
                description: "Official documentation for Akash Mainnet including upgrade information."
            },
            {
                title: "Mainnet Release Notes",
                url: "https://github.com/akash-network/node/releases",
                description: "Release notes and changelog for Akash Network mainnet versions."
            }
        ]
    },
    "validator": {
        name: "Akash Validators",
        links: [
            {
                title: "Validator Documentation",
                url: "https://akash.network/docs/validators/",
                description: "Comprehensive documentation for Akash Network validators."
            },
            {
                title: "Validator Setup Guide",
                url: "https://akash.network/docs/validators/validator-deployment-guide/",
                description: "Step-by-step guide for setting up and running an Akash validator."
            }
        ]
    },
    "ambassador": {
        name: "Akash Ambassador Program",
        links: [
            {
                title: "Akash Community",
                url: "https://akash.network/community/",
                description: "Join the Akash community and learn about ambassador opportunities."
            },
            {
                title: "Akash Discord Community",
                url: "https://discord.gg/akash",
                description: "Official Akash Discord server for community engagement and support."
            },
            {
                title: "Akash Forum",
                url: "https://forum.akash.network/",
                description: "Official Akash community forum for discussions and governance."
            },
            {
                title: "Akash GitHub Community",
                url: "https://github.com/akash-network/community",
                description: "Community guidelines, events, and contribution opportunities."
            }
        ]
    },
    "provider-earnings": {
        name: "Provider Earnings & Setup",
        links: [
            {
                title: "Provider Documentation",
                url: "https://akash.network/docs/providers/",
                description: "Complete guide to becoming an Akash provider including requirements and setup."
            },
            {
                title: "Provider Economics",
                url: "https://akash.network/docs/providers/provider-rewards/",
                description: "Information about provider reward structures and economic considerations."
            },
            {
                title: "Akash Community Discord",
                url: "https://discord.gg/akash",
                description: "Join the provider community for real-world earnings discussions and support."
            }
        ]
    }
};

// Helper function to check if a URL is from an official Akash source
const isAkashOfficialSource = (url: string): boolean => {
    return AKASH_OFFICIAL_DOMAINS.some(domain => url.includes(domain));
};

// Helper function to check if a URL is from social media
const isSocialMediaSource = (url: string): boolean => {
    return SOCIAL_MEDIA_DOMAINS.some(domain => url.includes(domain));
};

// Helper function to enhance query with Akash-specific terms
const enhanceAkashQuery = (query: string): string => {
    // Check if query already mentions Akash
    const containsAkash = query.toLowerCase().includes('akash');
    
    // If query doesn't explicitly mention Akash, add it
    if (!containsAkash) {
        return `${query} Akash Network`;
    }
    
    return query;
};

// Helper function to determine if a query is about recent updates or news
const isRecentUpdatesQuery = (query: string): boolean => {
    const updateTerms = [
        'latest', 'recent', 'news', 'update', 'announcement', 
        'today', 'this week', 'this month', 'new', 'latest',
        'twitter', 'tweet', 'social media', 'announcement'
    ];
    
    const queryLower = query.toLowerCase();
    return updateTerms.some(term => queryLower.includes(term));
};

// Helper function to check if a query is about a special topic
const getSpecialTopicFromQuery = (query: string): {name: string, links: any[]} | null => {
    const queryLower = query.toLowerCase();
    
    // Check if this is an AKT token price query - these should use web search
    const isAKTTokenPriceQuery = (
        (queryLower.includes("akt") && queryLower.includes("price")) ||
        (queryLower.includes("akt") && queryLower.includes("cost")) ||
        (queryLower.includes("token") && queryLower.includes("price")) ||
        queryLower.includes("current") || queryLower.includes("live") || 
        queryLower.includes("now") || queryLower.includes("today") ||
        queryLower.includes("usd") || queryLower.includes("dollar") ||
        queryLower.includes("market") || queryLower.includes("trading") ||
        queryLower.includes("exchange") || queryLower.includes("coinbase")
    );
    
    // If this is an AKT token price query, return null to allow web search
    if (isAKTTokenPriceQuery) {
        return null;
    }
    
    // Special cases for common synonyms and related terms (Akash Network service pricing)
    if (queryLower.includes("cost") || queryLower.includes("price") || 
        queryLower.includes("expensive") || queryLower.includes("cheap") ||
        queryLower.includes("budget") || queryLower.includes("fee")) {
        return AKASH_SPECIAL_TOPICS["pricing"];
    }
    
    if (queryLower.includes("graphic") || queryLower.includes("cuda") || 
        queryLower.includes("video card") || queryLower.includes("nvidia") ||
        queryLower.includes("amd") || queryLower.includes("ml") || 
        queryLower.includes("machine learning") || queryLower.includes("ai compute")) {
        return AKASH_SPECIAL_TOPICS["gpu"];
    }
    
    if (queryLower.includes("become provider") || queryLower.includes("run provider") ||
        queryLower.includes("set up provider") || queryLower.includes("create provider") ||
        queryLower.includes("hosting provider") || queryLower.includes("provide resources")) {
        return AKASH_SPECIAL_TOPICS["provider"];
    }
    
    if (queryLower.includes("run validator") || queryLower.includes("become validator") ||
        queryLower.includes("validator node") || queryLower.includes("staking") ||
        queryLower.includes("validate")) {
        return AKASH_SPECIAL_TOPICS["validator"];
    }
    
    if (queryLower.includes("ambassador") || queryLower.includes("insider") || 
        queryLower.includes("community program") || queryLower.includes("community member") ||
        queryLower.includes("contribute") || queryLower.includes("discord") ||
        queryLower.includes("forum")) {
        return AKASH_SPECIAL_TOPICS["ambassador"];
    }
    
    if (queryLower.includes("earnings") || queryLower.includes("provider earnings") || 
        queryLower.includes("how much earn") || queryLower.includes("provider income") ||
        queryLower.includes("provider revenue") || queryLower.includes("profitability") ||
        queryLower.includes("provider rewards") || (queryLower.includes("earn") && queryLower.includes("provider"))) {
        return AKASH_SPECIAL_TOPICS["provider-earnings"];
    }
    
    // Standard matching against topics
    for (const [key, value] of Object.entries(AKASH_SPECIAL_TOPICS)) {
        if (queryLower.includes(key)) {
            return value;
        }
    }
    
    return null;
};

export class WebSearchService extends Service implements IWebSearchService {
    public tavilyClient: TavilyClient;
    private static _instance: WebSearchService;

    // Required implementation for Service
    public capabilityDescription = "Search the web for information";
    
    // Required implementation for Service
    public async stop(): Promise<void> {
        // Nothing to clean up
    }

    async initialize(_runtime: IAgentRuntime): Promise<void> {
        const apiKey = _runtime.getSetting("TAVILY_API_KEY") as string;
        if (!apiKey) {
            throw new Error("TAVILY_API_KEY is not set");
        }
        this.tavilyClient = tavily({ apiKey });
    }

    getInstance(): IWebSearchService {
        if (!WebSearchService._instance) {
            WebSearchService._instance = new WebSearchService();
        }
        return WebSearchService._instance;
    }

    static get serviceType(): string {
        return ServiceType.WEB_SEARCH;
    }

    async search(
        query: string,
        options?: SearchOptions,
    ): Promise<SearchResponse> {
        const timeout = parseInt(process.env.WEB_SEARCH_TIMEOUT || '20000'); // 20 second timeout
        const maxResults = parseInt(process.env.WEB_SEARCH_MAX_RESULTS || '5'); // Increase results
        
        elizaLogger.log(`Starting web search for: "${query}"`);
        elizaLogger.log(`Search settings - timeout: ${timeout}ms, maxResults: ${maxResults}`);
        
        // Check for special topics first
        const specialTopic = getSpecialTopicFromQuery(query);
        if (specialTopic) {
            elizaLogger.log(`Found special topic for query "${query}":`, specialTopic.name);
            
            // Return special topic links as search results
            const specialResults = specialTopic.links.map(link => ({
                title: link.title,
                url: link.url,
                content: link.description,
                publishedDate: undefined,
                score: 1.0
            }));
            
            return {
                results: specialResults,
                answer: `Here are the official resources for ${specialTopic.name}:`,
                query: query,
                responseTime: 0,
                images: []
            };
        }
        
        try {
            elizaLogger.log(`Performing Tavily search for: "${query}"`);
            
            // Simplified search - just do one search with timeout
            const searchPromise = this.tavilyClient.search(query, {
                includeAnswer: options?.includeAnswer || true,
                maxResults: maxResults,
                topic: options?.type || "general",
                searchDepth: "basic", // Use basic instead of advanced for speed
                includeImages: false,
                days: 7,
            });
            
            // Create timeout promise
            const timeoutPromise = new Promise<never>((_, reject) => {
                setTimeout(() => reject(new Error('Web search timeout')), timeout);
            });
            
            // Race between search and timeout
            const response = await Promise.race([searchPromise, timeoutPromise]);
            
            elizaLogger.log(`Web search completed successfully with ${response.results?.length || 0} results`);
            
            return response;
        } catch (error) {
            elizaLogger.error("Web search failed:", error);
            // Return a fallback response
            return {
                results: [],
                answer: `I couldn't search for current information about "${query}" right now. For the latest AKT price, you can check CoinGecko, CoinMarketCap, or your preferred crypto exchange. Is there anything about Akash Network deployments I can help you with instead?`,
                query: query,
                responseTime: 0,
                images: []
            };
        }
    }
    
    // Helper method to combine and prioritize results from different searches
    private combineAndPrioritizeResults(
        specialTopicResults: any[], 
        docsResults: any[], 
        twitterResults: any[], 
        generalResults: any[],
        isUpdateQuery: boolean = false
    ): any[] {
        // Create a map to track URLs we've already included
        const includedUrls = new Map();
        const combinedResults = [];
        
        // Special topic results have the highest priority
        for (const result of specialTopicResults) {
            includedUrls.set(result.url, true);
            combinedResults.push(result);
        }
        
        // For update queries, prioritize Twitter results next
        if (isUpdateQuery && twitterResults.length > 0) {
            for (const result of twitterResults) {
                if (!includedUrls.has(result.url)) {
                    includedUrls.set(result.url, true);
                    combinedResults.push(result);
                }
            }
        }
        
        // Then add docs results
        for (const result of docsResults) {
            if (!includedUrls.has(result.url)) {
                includedUrls.set(result.url, true);
                combinedResults.push(result);
            }
        }
        
        // If not an update query, add social media results next
        if (!isUpdateQuery) {
            for (const result of generalResults) {
                if (!includedUrls.has(result.url) && isSocialMediaSource(result.url)) {
                    includedUrls.set(result.url, true);
                    combinedResults.push(result);
                }
            }
        }
        
        // Then add other official Akash sources from general results
        for (const result of generalResults) {
            if (!includedUrls.has(result.url) && isAkashOfficialSource(result.url)) {
                includedUrls.set(result.url, true);
                combinedResults.push(result);
            }
        }
        
        // Finally add other results until we reach the limit
        for (const result of generalResults) {
            if (!includedUrls.has(result.url)) {
                includedUrls.set(result.url, true);
                combinedResults.push(result);
            }
            
            // Limit to 8 total results
            if (combinedResults.length >= 8) {
                break;
            }
        }
        
        return combinedResults;
    }
}
