import { Annotation, END } from "@langchain/langgraph";
import { BaseMessage, HumanMessage } from "@langchain/core/messages";
import { RunnableConfig, RunnableSequence } from "@langchain/core/runnables";
import { StateGraph, START } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import config from "../config/config.js";
import { researcherAgent } from "./agents/researcher.js";
import { chartGenAgent } from "./agents/chartGen.js";

const AgentState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  next: Annotation<string>({
    reducer: (x, y) => y ?? x ?? END,
    default: () => END,
  }),
});

const llm = new ChatOpenAI({
  modelName: config.openai.model,
  temperature: config.openai.temperature,
  openAIApiKey: config.openai.apiKey,
});

const supervisorPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    "You are a supervisor tasked with managing the following agents: researcher and chart_generator. Your job is to decide which agent should act next.\n\nYou MUST respond with EXACTLY one of these words:\n- researcher\n- chart_generator\n\nIf the conversation seems complete or requires research, respond with 'researcher' by default.",
  ],
  new MessagesPlaceholder("messages"),
  [
    "human",
    "Based on the above conversation, which agent should act next? Respond with EXACTLY either 'researcher' or 'chart_generator'.",
  ],
]);

const supervisorChain = RunnableSequence.from([
  supervisorPrompt,
  llm,
  (output) => {
    console.log("Supervisor output:", output.content);
    const response = output.content.toLowerCase().trim();
    if (response !== "researcher" && response !== "chart_generator") {
      console.log("Invalid response, defaulting to researcher");
      return { messages: [], next: "researcher" };
    }
    return {
      messages: [],
      next: response,
    };
  },
]);

// Nodes
const researcherNode = async (
  state: typeof AgentState.State,
  config?: RunnableConfig
) => {
  console.log("Researcher node activated");
  const result = await researcherAgent.invoke(state, config);
  const lastMessage = result.messages[result.messages.length - 1];
  return {
    messages: [
      new HumanMessage({ content: lastMessage.content, name: "Researcher" }),
    ],
  };
};

const chartGenNode = async (
  state: typeof AgentState.State,
  config?: RunnableConfig
) => {
  console.log("Chart generator node activated");
  const result = await chartGenAgent.invoke(state, config);
  const lastMessage = result.messages[result.messages.length - 1];
  return {
    messages: [
      new HumanMessage({
        content: lastMessage.content,
        name: "ChartGenerator",
      }),
    ],
  };
};

export function getWorkflowGraph() {
  const workflow = new StateGraph(AgentState)
    .addNode("researcher", researcherNode)
    .addNode("chart_generator", chartGenNode)
    .addNode("supervisor", supervisorChain);

  workflow
    .addEdge(START, "supervisor")
    .addEdge(["researcher", "chart_generator"], "supervisor")
    .addConditionalEdges("supervisor", (state: any) => state.next, [
      "researcher",
      "chart_generator",
    ]);

  return workflow.compile();
}
