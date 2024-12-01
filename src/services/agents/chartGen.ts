import { SystemMessage } from "@langchain/core/messages";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";
import { chartTool } from "../tools/chartTool.js";
import config from "../../config/config.js";

const llm = new ChatOpenAI({
  modelName: config.openai.model,
  temperature: config.openai.temperature,
  openAIApiKey: config.openai.apiKey,
});

export const chartGenAgent = createReactAgent({
  llm,
  tools: [chartTool],
  messageModifier: new SystemMessage(
    "You generate charts from numerical data. When you receive data, convert it into a chart format and use the generate_bar_chart tool."
  ),
});
