import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import config from "../../config/config.js";

export const searchTool = new TavilySearchResults({
  apiKey: config.tavily.apiKey,
});
