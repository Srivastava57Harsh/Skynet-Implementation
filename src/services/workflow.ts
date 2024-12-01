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
import { Conversation } from "../models/conversation.js";

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
    `You are a supervisor tasked with managing agents. You have access to conversation history.
    
    Previous conversations:
    {history}
    
    Current conversation:
    {current_message}
    
    Based on the context and history, decide which agent should act next:
    - researcher
    - chart_generator`
  ],
  new MessagesPlaceholder("messages"),
]);

const supervisorChain = RunnableSequence.from([
  {
    messages: (input: any) => input.messages,
    history: async () => {
      const conversations = await Conversation.find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();
      return conversations.length ? 
        conversations.map(c => `Q: ${c.userQuery}\nA: ${c.messages.map(m => m.content).join('\n')}`).join('\n\n') :
        "No previous conversations";
    },
    current_message: (input: any) => input.messages[input.messages.length - 1].content
  },
  supervisorPrompt,
  llm,
  (output) => {
    const response = output.content.toLowerCase().trim();
    return {
      messages: [],
      next: response === "chart_generator" ? "chart_generator" : "researcher"
    };
  }
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

export async function invokeWithHistory(message: string, sessionId: string) {
  // Get last 5 relevant conversations
  const history = await Conversation.find({}).sort({ createdAt: -1 }).limit(5);

  const historyContext = history
    .map(
      (conv) =>
        `User: ${conv.userQuery}\nResponse: ${conv.messages
          .map((m) => m.content)
          .join("\n")}`
    )
    .join("\n\n");

  const graph = getWorkflowGraph();
  return await graph.invoke({
    messages: [new HumanMessage({ content: message })],
    configurable: {
      history: historyContext,
      current_message: message,
    },
  });
}
