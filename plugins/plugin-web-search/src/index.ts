import { webSearch } from "./actions/webSearch";
import { searchPromiseEvaluator } from "./evaluators/searchPromiseEvaluator";
import { WebSearchService } from "./services/webSearchService";

export const webSearchPlugin = {
    name: "webSearch",
    description: "Search the web and get news when agent decides to use WEB_SEARCH action",
    actions: [webSearch],
    evaluators: [searchPromiseEvaluator], // Only evaluator that executes search when agent promises to search
    providers: [],
    services: [new WebSearchService() as any],
    clients: [],
    adapters: [],
};

export default webSearchPlugin;
