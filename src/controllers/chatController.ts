import { Request, Response } from "express";
import { HumanMessage } from "@langchain/core/messages";
import { ChatRequest, ChatResponse } from "../types/index.js";
import { getWorkflowGraph } from "../services/workflow.js";

const graph = getWorkflowGraph();

export const chat = async (
  req: Request<{}, {}, ChatRequest>,
  res: Response
) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    console.log("Processing request:", message);

    const result = await graph.invoke({
      messages: [new HumanMessage({ content: message })],
    });

    const response: ChatResponse = {
      messages: result.messages.map((msg: any) => ({
        content: msg.content,
        name: msg.name || "AI",
      })),
    };

    return res.json(response);
  } catch (error) {
    console.error("Chat controller error:", error);

    if (error instanceof Error) {
      return res.status(500).json({
        error: "Processing failed",
        message: error.message,
      });
    }

    return res.status(500).json({
      error: "An unexpected error occurred",
    });
  }
};
