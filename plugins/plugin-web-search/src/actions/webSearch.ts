import {
    type Action,
    type HandlerCallback,
    type IAgentRuntime,
    type Memory,
    type State,
    elizaLogger
} from "@elizaos/core";
import { encodingForModel, type TiktokenModel } from "js-tiktoken";
import { WebSearchService } from "../services/webSearchService";
import type { SearchResult } from "../types";

const DEFAULT_MAX_WEB_SEARCH_TOKENS = 4000;
const DEFAULT_MODEL_ENCODING = "gpt-4-turbo";

function getTotalTokensFromString(
    str: string,
    encodingName: TiktokenModel = DEFAULT_MODEL_ENCODING
) {
    const encoding = encodingForModel(encodingName);
    return encoding.encode(str).length;
}

function MaxTokens(
    data: string,
    maxTokens: number = DEFAULT_MAX_WEB_SEARCH_TOKENS
): string {
    if (getTotalTokensFromString(data) >= maxTokens) {
        return data.slice(0, maxTokens);
    }
    return data;
}

// Check if a URL is from Twitter/X
const isTwitterSource = (url: string): boolean => {
    return url.includes('twitter.com') || url.includes('x.com');
};

// Check if a URL is from a special topic (curated content)
const isSpecialTopicURL = (url: string): boolean => {
    // These URLs correspond to the curated links in AKASH_SPECIAL_TOPICS
    const specialURLs = [
        // Accelerate
        'akash.network/accelerate/',
        'akash.network/blog/akash-accelerate',
        'github.com/akash-network/community/tree/main/sig-events/akash-accelerate',
        
        // Supercloud
        'akash.network/docs/deployments/akash-console/',
        'akash.network/blog/ai-supercloud/',
        
        // GPU
        'akash.network/docs/deployments/akash-console/gpu-deployment/',
        'akash.network/docs/providers/gpu-providers/',
        'akash.network/marketplace/',
        
        // Pricing
        'akash.network/pricing/',
        'akash.network/about/cloud-cost-calculator/',
        
        // Provider
        'akash.network/docs/providers/',
        'akash.network/docs/providers/build-a-cloud-provider/',
        'akash.network/docs/providers/provider-rewards/',
        
        // Mainnet
        'akash.network/docs/mainnet/',
        'github.com/akash-network/node/releases',
        
        // Validator
        'akash.network/docs/validators/',
        'akash.network/docs/validators/validator-deployment-guide/',
        
        // Ambassador/Community
        'akash.network/community/',
        'discord.gg/akash',
        'forum.akash.network/',
        'github.com/akash-network/community',
        
        // Provider Earnings
        'akash.network/docs/providers/',
        'akash.network/docs/providers/provider-rewards/'
    ];
    return specialURLs.some(specialURL => url.includes(specialURL));
};

// Helper function to format search results in a more readable way
function formatSearchResults(results: SearchResult[]): string {
    if (!results || results.length === 0) {
        return "I couldn't find any relevant information.";
    }
    
    // Separate results by type
    const specialTopicResults = results.filter(result => isSpecialTopicURL(result.url));
    const twitterResults = results.filter(result => isTwitterSource(result.url) && !isSpecialTopicURL(result.url));
    const otherResults = results.filter(result => !isTwitterSource(result.url) && !isSpecialTopicURL(result.url));
    
    let formattedOutput = '';
    
    // Format special topic results first if they exist
    if (specialTopicResults.length > 0) {
        formattedOutput += "### Official Documentation\n\n";
        
        specialTopicResults.forEach((result) => {
            formattedOutput += `**[${result.title}](${result.url})**\n${result.content}\n\n`;
        });
    }
    
    // Format Twitter results next if they exist
    if (twitterResults.length > 0) {
        formattedOutput += "### Recent Twitter Updates\n\n";
        
        twitterResults.forEach((result, index) => {
            // Extract username from Twitter URL
            let username = 'akashnet_'; // Default
            const usernameMatch = result.url.match(/twitter\.com\/([^\/]+)/) || result.url.match(/x\.com\/([^\/]+)/);
            if (usernameMatch && usernameMatch[1]) {
                username = usernameMatch[1];
            }
            
            // Extract date if available - use more flexible patterns
            let date = '';
            const dateMatch = result.content.match(/(\d{1,2} [A-Za-z]{3} \d{4})|([A-Za-z]{3} \d{1,2}, \d{4})|(\d{1,2}[hm] ago)|(\d{1,2} hours? ago)|(\d{1,2} days? ago)|(\d{1,2} mins? ago)|(\d{1,2}\/\d{1,2}\/\d{2,4})|((Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2})/i);
            if (dateMatch) {
                date = ` (${dateMatch[0]})`;
            }
            
            // Format tweet content - clean up common patterns
            let content = result.content
                .replace(/http[s]?:\/\/t\.co\/\w+/g, '') // Remove t.co links
                .replace(/(\d+) replies (\d+) reposts (\d+) likes/gi, '') // Remove metrics
                .trim();
                
            if (content.length > 200) {
                content = content.substring(0, 200).trim() + '...';
            }
            
            formattedOutput += `**[@${username}${date}](${result.url})**\n${content}\n\n`;
        });
    }
    
    // Format other results
    if (otherResults.length > 0) {
        formattedOutput += otherResults.length > 0 && (specialTopicResults.length > 0 || twitterResults.length > 0) 
            ? "### Other Resources\n\n" 
            : "";
        
        otherResults.forEach((result, index) => {
            // Extract domain from URL for better readability
            const urlObj = new URL(result.url);
            const domain = urlObj.hostname;
            
            // Format the content to be more readable
            const content = result.content.substring(0, 200).trim() + (result.content.length > 200 ? '...' : '');
            
            formattedOutput += `**${index + 1}. [${result.title}](${result.url})** (${domain})\n${content}\n\n`;
        });
    }
    
    return formattedOutput;
}

export const webSearch: Action = {
    name: "WEB_SEARCH",
    similes: [
        "SEARCH_WEB",
        "INTERNET_SEARCH",
        "LOOKUP",
        "QUERY_WEB",
        "FIND_ONLINE",
        "SEARCH_ENGINE",
        "WEB_LOOKUP",
        "ONLINE_SEARCH",
        "FIND_INFORMATION",
        "FETCH_INFO",
        "GET_LATEST",
        "SEARCH_FOR",
        "LOOK_UP"
    ],
    suppressInitialMessage: false,
    description:
        "Perform a web search to find current information, latest updates, or real-time data related to the user's query.",
    // eslint-disable-next-line
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        const tavilyApiKeyOk = !!runtime.getSetting("TAVILY_API_KEY");
        
        if (!tavilyApiKeyOk) {
            elizaLogger.warn("Web search validation failed: TAVILY_API_KEY not found");
            return false;
        }
        
        // Check if message content should trigger web search
        const text = message.content.text?.toLowerCase() || '';
        
        // Enhanced triggers including common user queries and follow-up search needs
        const webSearchTriggers = [
            // Time-based queries
            'latest', 'recent', 'news', 'update', 'announcement', 'today', 
            'this week', 'this month', 'roadmap', 'upcoming', 'release', 
            'current', 'now', 'yesterday', 'just released', 'new feature',
            'what is happening', 'what happened', 'status', 'progress',
            'development', 'launched', 'launching', 'released', 'deployed',
            
            // Media and content
            'social media', 'twitter', 'discord announcement', 'blog post',
            'tweet', 'tweeting', 'twitter updates', 'social updates',
            
            // Financial and pricing
            'price', 'cost', 'current price', 'today price', 'coinbase', 'exchange',
            'trading', 'market', 'value', 'worth', 'usd', 'dollar', 'token price',
            'akt price', 'akt cost', 'market cap', 'trading volume',
            
            // Technical operations
            'bridge', 'bridging', 'transfer', 'move tokens', 'send tokens',
            'ibc', 'cross-chain', 'osmosis', 'cosmos', 'keplr', 'withdraw', 'deposit',
            
            // Provider and deployment related
            'provider', 'providers', 'deployment cost', 'runtime cost', 'actual cost',
            'calculator', 'calculate cost', 'cost calculation', 'pricing tool',
            'provider earnings', 'provider rewards', 'marketplace',
            
            // Network and troubleshooting
            'down', 'offline', 'not working', 'issues', 'problem', 'error',
            'network status', 'mainnet', 'testnet', 'validator',
            
            // Search intent indicators
            'find', 'search', 'look up', 'check', 'verify', 'confirm',
            'get me', 'show me', 'tell me about recent', 'any updates',
            
            // Explicit search requests
            'web search', 'search the web', 'look online', 'check online',
            'find online', 'internet search', 'google it', 'search for'
        ];
        
        // Also check for explicit mentions of searching or finding current info
        const searchIntentPhrases = [
            'search for', 'find out', 'look up', 'check the', 'get current',
            'find the latest', 'search web', 'web search', 'internet search',
            'look online', 'check online', 'find online', 'verify online'
        ];
        
        const hasSearchTrigger = webSearchTriggers.some(trigger => text.includes(trigger));
        const hasSearchIntent = searchIntentPhrases.some(phrase => text.includes(phrase));
        
        elizaLogger.log(`Web search validation: text="${text}", hasSearchTrigger=${hasSearchTrigger}, hasSearchIntent=${hasSearchIntent}`);
        
        return hasSearchTrigger || hasSearchIntent;
    },
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        options: any,
        callback: HandlerCallback
    ) => {
        elizaLogger.log("Starting web search for message:", message.content.text);
        
        // Compose state first
        state = (await runtime.composeState(message)) as State;
        
        const webSearchPrompt = message.content.text;
        elizaLogger.log("Web search prompt:", webSearchPrompt);

        // Send initial response to let user know we're searching
        callback({
            text: "🔍 Searching for the latest information...",
            thought: "User is asking for current information that requires web search. I'll search and provide the results."
        });

        const webSearchService = new WebSearchService();
        
        try {
            await webSearchService.initialize(runtime);
            
            const searchResponse = await webSearchService.search(webSearchPrompt);
            
            if (searchResponse && searchResponse.results && searchResponse.results.length > 0) {
                elizaLogger.log(`Found ${searchResponse.results.length} search results`);
                
                // Check if we have an answer from the API
                const answer = searchResponse.answer 
                    ? `${searchResponse.answer}\n\n` 
                    : "Here's what I found:\n\n";
                
                // Format the results in a readable way
                const formattedResults = formatSearchResults(searchResponse.results);
                
                // Check if we have Twitter results
                const hasTwitterResults = searchResponse.results.some(result => 
                    isTwitterSource(result.url)
                );
                
                // Combine the answer and results
                let disclaimer = "\n\n*This information is based on current web search results and may need verification from official Akash sources.*";
                if (hasTwitterResults) {
                    disclaimer += " *Tweet content is from verified sources.*";
                }
                
                const responseText = `${answer}${formattedResults}${disclaimer}`;
                
                // Send the final response with search results
                callback({
                    text: MaxTokens(responseText, DEFAULT_MAX_WEB_SEARCH_TOKENS),
                    thought: "Successfully retrieved and formatted web search results for the user's query."
                });
                
                elizaLogger.log("Web search completed successfully");
            } else {
                elizaLogger.warn("Web search returned no results");
                callback({
                    text: "I searched for information about your query but couldn't find relevant results at the moment. This might be due to:\n\n" +
                          "• The topic being too specific or new\n" +
                          "• Temporary search service issues\n" +
                          "• Limited information available online\n\n" +
                          "Please try rephrasing your question or ask about a different aspect of the topic. For Akash-specific questions, I can also help using my knowledge base."
                });
            }
        } catch (error) {
            elizaLogger.error("Error during web search:", error);
            
            // Provide helpful error message to user
            const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
            
            callback({
                text: `I encountered an issue while searching for information: ${errorMessage}\n\n` +
                      "Please try again in a moment. If the problem persists, I can still help using my knowledge base for Akash Network questions."
            });
        }
    },
    examples: [
        [
            {
                name: '{{name1}}',
                content: {
                    text: "Find the latest news about SpaceX launches.",
                },
            },
            {
                name: '{{name2}}',
                content: {
                    text: "Here is the latest news about SpaceX launches:",
                    actions: ["WEB_SEARCH"],
                },
            },
        ],
        [
            {
                name: '{{name1}}',
                content: {
                    text: "Can you find details about the iPhone 16 release?",
                },
            },
            {
                name: '{{name2}}',
                content: {
                    text: "Here are the details I found about the iPhone 16 release:",
                    actions: ["WEB_SEARCH"],
                },
            },
        ],
        [
            {
                name: '{{name1}}',
                content: {
                    text: "What is the schedule for the next FIFA World Cup?",
                },
            },
            {
                name: '{{name2}}',
                content: {
                    text: "Here is the schedule for the next FIFA World Cup:",
                    actions: ["WEB_SEARCH"],
                },
            },
        ],
        [
            {
                name: '{{name1}}',
                content: { text: "Check the latest stock price of Tesla." },
            },
            {
                name: '{{name2}}',
                content: {
                    text: "Here is the latest stock price of Tesla I found:",
                    actions: ["WEB_SEARCH"],
                },
            },
        ],
        [
            {
                name: '{{name1}}',
                content: {
                    text: "What are the current trending movies in the US?",
                },
            },
            {
                name: '{{name2}}',
                content: {
                    text: "Here are the current trending movies in the US:",
                    actions: ["WEB_SEARCH"],
                },
            },
        ],
        [
            {
                name: '{{name1}}',
                content: {
                    text: "What is the latest score in the NBA finals?",
                },
            },
            {
                name: '{{name2}}',
                content: {
                    text: "Here is the latest score from the NBA finals:",
                    actions: ["WEB_SEARCH"],
                },
            },
        ],
        [
            {
                name: '{{name1}}',
                content: { text: "When is the next Apple keynote event?" },
            },
            {
                name: '{{name2}}',
                content: {
                    text: "Here is the information about the next Apple keynote event:",
                    actions: ["WEB_SEARCH"],
                },
            },
        ],
        [
            {
                name: '{{name1}}',
                content: { text: "What are the latest updates about Akash Network?" },
            },
            {
                name: '{{name2}}',
                content: {
                    text: "Let me search for the latest Akash Network updates for you:",
                    actions: ["WEB_SEARCH"],
                },
            },
        ],
        [
            {
                name: '{{name1}}',
                content: { text: "What is Akash Network tweeting about lately?" },
            },
            {
                name: '{{name2}}',
                content: {
                    text: "Let me check the recent tweets from Akash Network:",
                    actions: ["WEB_SEARCH"],
                },
            },
        ],
    ],
} as Action;