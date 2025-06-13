import {
    type Evaluator,
    type IAgentRuntime,
    type Memory,
    type State,
    elizaLogger
} from "@elizaos/core";
import { WebSearchService } from "../services/webSearchService";

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
        
        // Check if the agent promised to search
        const searchPromises = [
            'searching now',
            'will search',
            'let me search',
            'i\'ll search',
            'searching for',
            'web search',
            'will share findings',
            'i\'ll fetch',
            'via web search',
            'searching',
            'will find',
            'looking up',
            'let me pull',
            'i\'ll pull',
            'let me check',
            'checking for',
            'let me find',
            'finding information',
            'getting the latest',
            'pulling fresh',
            'will share results'
        ];
        
        const hasPromise = searchPromises.some(promise => text.includes(promise));
        
        elizaLogger.log(`Search promise evaluator: hasPromise=${hasPromise} for text: ${text}`);
        
        return hasPromise;
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
            
            for (let i = recentMessages.length - 1; i >= 0; i--) {
                const mem = recentMessages[i];
                if (mem.entityId !== runtime.agentId) {
                    // This is a user message, extract search terms
                    const userText = mem.content.text || '';
                    
                    // Extract key search terms from user question
                    if (userText.toLowerCase().includes('cost') || userText.toLowerCase().includes('calculator')) {
                        searchQuery = `Akash Network deployment cost calculator provider pricing tools`;
                        break;
                    } else if (userText.toLowerCase().includes('provider') && userText.toLowerCase().includes('earning')) {
                        searchQuery = `Akash Network provider earnings rewards income calculation guide`;
                        break;
                    } else if (userText.toLowerCase().includes('provider') && userText.toLowerCase().includes('setup')) {
                        searchQuery = `Akash Network provider setup guide worker configuration documentation`;
                        break;
                    } else if (userText.toLowerCase().includes('price') || userText.toLowerCase().includes('akt')) {
                        searchQuery = `AKT token price current value Akash Network market`;
                        break;
                    } else {
                        // General Akash query
                        searchQuery = `Akash Network ${userText}`;
                        break;
                    }
                }
            }
            
            if (!searchQuery) {
                searchQuery = "Akash Network latest updates documentation";
            }
            
            elizaLogger.log(`Executing automatic search with query: ${searchQuery}`);
            
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
                
                formattedResults += "*This information is based on current web search results.*";
                
                // Create a new memory with the search results
                await runtime.createMemory({
                    id: crypto.randomUUID(),
                    entityId: runtime.agentId,
                    agentId: runtime.agentId,
                    roomId: message.roomId,
                    content: {
                        text: formattedResults,
                        action: "WEB_SEARCH_RESULTS"
                    },
                    createdAt: Date.now()
                }, "messages");
                
                elizaLogger.log("Automatic search completed and results posted");
                
            } else {
                elizaLogger.warn("Automatic search returned no results");
                
                // Post a message indicating no results found
                await runtime.createMemory({
                    id: crypto.randomUUID(),
                    entityId: runtime.agentId,
                    agentId: runtime.agentId,
                    roomId: message.roomId,
                    content: {
                        text: "I searched for information but couldn't find specific results at the moment. Let me help you with what I know from my knowledge base instead.",
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
                    text: "I encountered an issue while searching. Let me help you with the information I have in my knowledge base.",
                    action: "SEARCH_ERROR"
                },
                createdAt: Date.now()
            }, "messages");
        }
    },
    
    examples: [
        {
            prompt: "User asked about provider costs and agent responded with 'searching now'",
            messages: [
                {
                    name: "User",
                    content: { text: "What are the current provider earnings on Akash?" }
                },
                {
                    name: "Navi", 
                    content: { text: "I'll search for the latest provider earnings information. Searching now..." }
                }
            ],
            outcome: "Execute web search for 'Akash Network provider earnings rewards income calculation guide' and post results"
        }
    ]
};
