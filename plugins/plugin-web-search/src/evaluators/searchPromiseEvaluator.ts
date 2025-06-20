import {
    type Evaluator,
    type IAgentRuntime,
    type Memory,
    type State,
    elizaLogger
} from "@elizaos/core";
import { WebSearchService } from "../services/webSearchService";

/**
 * Determines if a query requires real-time information that isn't available in the knowledge base
 */
export function requiresRealTimeSearch(query: string): boolean {
    // Only search when explicitly asked
    const explicitSearchRequests = [
        'search for', 
        'search the web', 
        'do a web search',
        'look up',
        'find online',
        'what is the current',
        'what are the latest',
        'find me the latest',
        'find the most recent'
    ];
    
    // If user explicitly asks for a search, do it
    const isExplicitSearchRequest = explicitSearchRequests.some(phrase => 
        query.toLowerCase().includes(phrase)
    );
    
    if (isExplicitSearchRequest) {
        return true;
    }
    
    // Skip web search for Akash Accelerate event questions since we have this in the system prompt
    if (query.toLowerCase().includes('akash accelerate') && 
        (query.toLowerCase().includes('when') || 
         query.toLowerCase().includes('date') || 
         query.toLowerCase().includes('happening') || 
         query.toLowerCase().includes('schedule'))) {
        return false;
    }

    // Skip search for most standard questions - rely on embedded knowledge
    if (!query.toLowerCase().includes('current') && 
        !query.toLowerCase().includes('latest') && 
        !query.toLowerCase().includes('recent') &&
        !query.toLowerCase().includes('today') &&
        !query.toLowerCase().includes('now')) {
        return false;
    }
    
    // Real-time price/market data queries
    const priceQueries = [
        'current price', 'akt price', 'token price', 'price today', 'market cap',
        'trading volume', 'price chart', 'latest price', 'current value'
    ];
    
    // Real-time network statistics
    const networkStatsQueries = [
        'current provider', 'active provider', 'network stats', 'live stats',
        'current earning', 'provider earning', 'providers earning', 'earning right now',
        'network usage', 'active deployment', 'current deployment', 'network capacity', 
        'provider reward', 'how much', 'earning', 'making money'
    ];
    
    // Recent news and updates
    const newsQueries = [
        'latest news', 'recent update', 'announcement', 'new feature',
        'latest version', 'recent development', 'what\'s new', 'news about',
        'latest', 'recent'
    ];
    
    // Current network status
    const statusQueries = [
        'network status', 'is akash down', 'network health', 'current issue',
        'maintenance', 'network problem', 'akash down', 'is down', 'down'
    ];
    
    // Live deployment costs (as they fluctuate)
    const costQueries = [
        'current cost', 'deployment cost', 'pricing calculator', 'cost calculator',
        'current rate', 'provider rate'
    ];
    
    const allRealTimeQueries = [
        ...priceQueries,
        ...networkStatsQueries, 
        ...newsQueries,
        ...statusQueries,
        ...costQueries
    ];
    
    // Check if query contains real-time information needs
    const needsRealTime = allRealTimeQueries.some(keyword => query.includes(keyword));
    
    // Knowledge base topics that DON'T need web search
    const knowledgeBaseTopics = [
        'what is akash', 'how does akash work', 'akash architecture',
        'deploy application', 'create deployment', 'setup provider',
        'install akash', 'akash tutorial', 'akash guide', 'akash documentation',
        'persistent storage', 'data storage', 'like google drive',
        'akash vs', 'comparison', 'difference between',
        'how to use', 'getting started', 'beginner guide',
        'decentralized cloud', 'blockchain', 'container', 'kubernetes', 'docker',
        'ongoing deployment', 'my deployment', 'deployment status', 'check deployment',
        'manage deployment', 'deployment management', 'deployment cli', 'akash cli',
        'can i use akash', 'can i deploy', 'can akash', 'use akash',
        'remote pc', 'remote desktop', 'remote development', 'remote access',
        'capability', 'feature', 'support', 'possible', 'available'
    ];
    
    // Strong indicators that definitely need web search (prioritize over knowledge base)
    const definitelyNeedsWebSearch = [
        'akt price', 'token price', 'current price', 'price today',
        'provider earning', 'providers earning', 'earning right now',
        'network down', 'is down', 'akash down',
        'latest news', 'recent news', 'network news',
        'network stats', 'live stats', 'current stats'
    ];
    
    // If it definitely needs web search, do it regardless of knowledge base topics
    const definitelyNeeds = definitelyNeedsWebSearch.some(keyword => query.includes(keyword));
    if (definitelyNeeds) {
        return true;
    }
    
    // If it has real-time keywords but might be knowledge base topic
    if (needsRealTime) {
        const isKnowledgeBaseTopic = knowledgeBaseTopics.some(topic => query.includes(topic));
        
        // For knowledge base topics, only search if explicitly asking for "latest" updates/news
        if (isKnowledgeBaseTopic) {
            return query.includes('latest news') || query.includes('recent update') || 
                   query.includes('latest update') || query.includes('what\'s new') ||
                   (query.includes('latest') && query.includes('news'));
        }
        
        // If not a knowledge base topic and has real-time keywords, search
        return true;
    }
    
    return false;
}

/**
 * This evaluator monitors agent responses and automatically executes
 * web searches when the agent promises to search for information
 */
export const searchPromiseEvaluator: Evaluator = {
    name: "SEARCH_PROMISE_EVALUATOR",
    description: "Detects when the agent promises to search and executes the search automatically",
    similes: ["AUTO_SEARCH", "PROMISE_FULFILLMENT", "SEARCH_EXECUTOR"],
    
    validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
        const tavilyApiKeyOk = !!runtime.getSetting("TAVILY_API_KEY");
        
        if (!tavilyApiKeyOk) {
            return false;
        }
        
        // Only evaluate agent responses, not user messages
        if (message.entityId !== runtime.agentId) {
            return false;
        }
        
        const text = message.content.text?.toLowerCase() || '';
        
        // Check if the agent promised to search - be VERY restrictive to avoid false positives
        const searchPromises = [
            'searching now',
            'let me search',
            'i\'ll search for',
            'searching for current',
            'searching for latest',
            'web search for',
            'getting the latest information',
            'checking current status',
            'finding recent updates'
        ];
        
        const hasPromise = searchPromises.some(promise => text.includes(promise));
        
        if (!hasPromise) {
            return false;
        }
        
        // Additional check: Don't trigger if the agent is already providing substantial knowledge-based content
        const hasSubstantialContent = text.length > 100 && (
            text.includes('akash network') || 
            text.includes('deployment') || 
            text.includes('provider') ||
            text.includes('you can') ||
            text.includes('to do this') ||
            text.includes('i can help') ||
            text.includes('i\'d be happy') ||
            text.includes('you\'ll need') ||
            text.includes('custom node') ||
            text.includes('comfyui') ||
            text.includes('setup') ||
            text.includes('configuration')
        );
        
        // If agent is providing substantial content without explicit search promises, don't trigger search
        if (hasSubstantialContent) {
            elizaLogger.log("Skipping search - agent already providing substantial knowledge-based response");
            return false;
        }
        
        // Get recent conversation context to understand what the user is asking about
        const recentMessages = await runtime.getMemories({
            roomId: message.roomId,
            count: 10,
            tableName: "messages"
        });
        
        // Check if there's already a recent response from the agent to the same question
        const recentAgentResponses = recentMessages.filter(msg => 
            msg.entityId === runtime.agentId && 
            msg.createdAt > Date.now() - 60000 // Within last 60 seconds
        );
        
        if (recentAgentResponses.length > 0) {
            elizaLogger.log("Skipping search - recent agent response already exists within 60 seconds");
            return false;
        }
        
        // Find the most recent user question
        let userQuestion = "";
        for (let i = recentMessages.length - 1; i >= 0; i--) {
            const mem = recentMessages[i];
            if (mem.entityId !== runtime.agentId) {
                userQuestion = mem.content.text?.toLowerCase() || '';
                break;
            }
        }
        
        // Skip web search for clearly knowledge-base questions even if agent mentions search
        const clearKnowledgeBaseQuestions = [
            'can i fund', 'can i transfer', 'how do i', 'what is', 'how does',
            'fund other', 'transfer to', 'send to', 'account management',
            'wallet', 'balance', 'transaction', 'ongoing deployment', 'my deployment',
            'deployment status', 'check deployment', 'manage deployment', 'deployment management',
            'what about my', 'how to check', 'view deployment', 'deployment command',
            'deployment cli', 'akash cli', 'can i use', 'can i deploy', 'can akash',
            'use akash for', 'use akash as', 'remote pc', 'remote desktop', 'data storage',
            'storage', 'persistent', 'capabilities', 'features', 'support'
        ];
        
        const isKnowledgeBaseQuestion = clearKnowledgeBaseQuestions.some(pattern => 
            userQuestion.includes(pattern)
        );
        
        if (isKnowledgeBaseQuestion) {
            elizaLogger.log("Skipping search - this is a knowledge base question about basic Akash concepts");
            return false;
        }
        
        // Only trigger web search for queries that need real-time/current information
        const needsRealTimeInfo = requiresRealTimeSearch(userQuestion);
        
        elizaLogger.log(`Search promise evaluator: hasPromise=${hasPromise}, needsRealTimeInfo=${needsRealTimeInfo} for question: ${userQuestion}`);
        
        return needsRealTimeInfo;
    },
    
    handler: async (runtime: IAgentRuntime, message: Memory): Promise<void> => {
        elizaLogger.log("Search promise detected, executing automatic search");
        
        try {
            // Get the conversation context to understand what to search for
            const recentMessages = await runtime.getMemories({
                roomId: message.roomId,
                count: 5,
                tableName: "messages"
            });
            
            // Find the user's question that triggered the search promise
            let searchQuery = "";
            let userQuestion = "";
            
            for (let i = recentMessages.length - 1; i >= 0; i--) {
                const mem = recentMessages[i];
                if (mem.entityId !== runtime.agentId) {
                    // This is a user message, extract search terms
                    userQuestion = mem.content.text || '';
                    const userText = userQuestion.toLowerCase();
                    
                    // Create targeted search queries based on the type of real-time information needed
                    if (userText.includes('akt price') || userText.includes('token price') || userText.includes('current price')) {
                        searchQuery = `AKT token current price live market value Akash Network`;
                    } else if (userText.includes('provider earning') || userText.includes('provider reward')) {
                        searchQuery = `Akash Network provider earnings rewards current income statistics`;
                    } else if (userText.includes('network stats') || userText.includes('active provider')) {
                        searchQuery = `Akash Network current statistics active providers network metrics`;
                    } else if (userText.includes('deployment cost') || userText.includes('cost calculator')) {
                        searchQuery = `Akash Network current deployment costs pricing calculator 2024`;
                    } else if (userText.includes('latest news') || userText.includes('recent update')) {
                        searchQuery = `Akash Network latest news updates announcements 2024`;
                    } else if (userText.includes('network status') || userText.includes('network health')) {
                        searchQuery = `Akash Network current status network health operational`;
                    } else {
                        // Fallback for other real-time queries
                        searchQuery = `Akash Network latest ${userText.replace(/[^\w\s]/g, '')}`;
                    }
                    break;
                }
            }
            
            if (!searchQuery) {
                searchQuery = `Akash Network current information ${userQuestion}`;
            }
            
            elizaLogger.log(`Executing targeted web search for real-time query: ${searchQuery}`);
            elizaLogger.log(`Original user question: ${userQuestion}`);
            
            // Initialize and execute web search
            const webSearchService = new WebSearchService();
            await webSearchService.initialize(runtime);
            
            const searchResponse = await webSearchService.search(searchQuery);
            
            if (searchResponse && searchResponse.results && searchResponse.results.length > 0) {
                elizaLogger.log(`Found ${searchResponse.results.length} search results`);
                
                // Format results
                let formattedResults = "Here are the search results I found:\n\n";
                
                searchResponse.results.slice(0, 3).forEach((result, index) => {
                    formattedResults += `**${index + 1}. [${result.title}](${result.url})**\n`;
                    formattedResults += `${result.content.substring(0, 150)}...\n\n`;
                });
                
                formattedResults += "*This information is based on current web search results and may need verification from official sources.*";
                
                // Create a new memory with the search results
                await runtime.createMemory({
                    id: crypto.randomUUID(),
                    entityId: runtime.agentId,
                    agentId: runtime.agentId,
                    roomId: message.roomId,
                    content: {
                        text: formattedResults,
                        action: "WEB_SEARCH_RESULTS",
                        metadata: {
                            searchQuery,
                            userQuestion,
                            resultCount: searchResponse.results.length
                        }
                    },
                    createdAt: Date.now()
                }, "messages");
                
                elizaLogger.log("Targeted web search completed and results posted");
                
            } else {
                elizaLogger.warn("Web search returned no results for real-time query");
                
                // Post a message indicating no results found
                await runtime.createMemory({
                    id: crypto.randomUUID(),
                    entityId: runtime.agentId,
                    agentId: runtime.agentId,
                    roomId: message.roomId,
                    content: {
                        text: "I couldn't find current information through web search at the moment. Let me help you with the information I have in my knowledge base instead.",
                        action: "SEARCH_NO_RESULTS"
                    },
                    createdAt: Date.now()
                }, "messages");
            }
            
        } catch (error) {
            elizaLogger.error("Error in automatic search execution:", error);
            
            // Post error message
            await runtime.createMemory({
                id: crypto.randomUUID(),
                entityId: runtime.agentId,
                agentId: runtime.agentId,
                roomId: message.roomId,
                content: {
                    text: "I encountered an issue while searching for current information. Let me help you with the information I have in my knowledge base.",
                    action: "SEARCH_ERROR"
                },
                createdAt: Date.now()
            }, "messages");
        }
    },
    
    examples: [
        {
            prompt: "User asked about current AKT price and agent responded with 'searching now'",
            messages: [
                {
                    name: "User",
                    content: { text: "What's the current AKT token price?" }
                },
                {
                    name: "Navi", 
                    content: { text: "I'll search for the latest AKT price information. Searching now..." }
                }
            ],
            outcome: "Execute web search for 'AKT token current price live market value Akash Network' and post results"
        },
        {
            prompt: "User asked about general Akash concept and agent responded with 'let me search'",
            messages: [
                {
                    name: "User",
                    content: { text: "What is Akash Network and how does it work?" }
                },
                {
                    name: "Navi", 
                    content: { text: "Let me search for information about Akash Network..." }
                }
            ],
            outcome: "Should NOT trigger web search as this is knowledge base information"
        },
        {
            prompt: "User asked about data storage like Google Drive and agent responded with 'searching'",
            messages: [
                {
                    name: "User",
                    content: { text: "Can I use Akash for data storage like Google Drive?" }
                },
                {
                    name: "Navi", 
                    content: { text: "I'll search for information about Akash storage capabilities. Searching..." }
                }
            ],
            outcome: "Should NOT trigger web search as persistent storage is covered in knowledge base"
        }
    ]
};
