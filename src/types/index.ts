import { BaseMessage } from "@langchain/core/messages";

export interface ChatRequest {
  message: string;
}

export interface ChatResponse {
  messages: Array<{
    content: string;
    name?: string;
  }>;
}

export interface AgentState {
  messages: BaseMessage[];
  next: string;
}
