import { webSearch } from "./actions/webSearch";
import { searchPromiseEvaluator } from "./evaluators/searchPromiseEvaluator";
import { WebSearchService } from "./services/webSearchService";

export const webSearchPlugin = {
    name: "webSearch",
    description: "Search the web and get news with automatic promise fulfillment",
    actions: [webSearch],
    evaluators: [searchPromiseEvaluator],
    providers: [],
    services: [new WebSearchService() as any],
    clients: [],
    adapters: [],
};

export default webSearchPlugin;
