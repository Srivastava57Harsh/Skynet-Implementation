import { SystemMessage } from "@langchain/core/messages";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";
import { searchTool } from "../tools/searchTool.js";
import config from "../../config/config.js";

const llm = new ChatOpenAI({
  modelName: config.openai.model,
  temperature: config.openai.temperature,
  openAIApiKey: config.openai.apiKey,
});

export const researcherAgent = createReactAgent({
  llm,
  tools: [searchTool],
  messageModifier: new SystemMessage(
    "You are a web researcher. Use the Tavily search engine to find accurate and up-to-date information. Always provide sources."
  ),
});
