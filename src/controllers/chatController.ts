import { Request, Response } from "express";
import { HumanMessage } from "@langchain/core/messages";
import { ChatRequest, ChatResponse } from "../types/index.js";
import { getWorkflowGraph, invokeWithHistory } from "../services/workflow.js";
import { Conversation } from "../models/conversation.js";
import { randomUUID } from "crypto";

const graph = getWorkflowGraph();

export const chat = async (
  req: Request<{}, {}, ChatRequest>,
  res: Response
) => {
  const sessionId = randomUUID();

  try {
    const { message } = req.body;

    // Create initial conversation record
    const conversation = await Conversation.create({
      sessionId,
      userQuery: message,
      intent: "pending", // Will be updated after processing
      messages: [
        {
          role: "user",
          content: message,
        },
      ],
    });

    // Use the new invoke with history
    const result = await invokeWithHistory(message, sessionId);

    const agentPath: string[] = [];
    const responses = result.messages.map((msg: any) => ({
      role: msg.name?.toLowerCase() || "ai",
      content: msg.content,
    }));

    // Extract metadata
    const metadata = {
      agentPath,
      searchQueries: result.intermediateSteps
        ?.filter((step: any) => step.action === "search")
        ?.map((step: any) => step.input),
      chartData: result.intermediateSteps?.find(
        (step: any) => step.action === "generate_bar_chart"
      )?.input,
      completedAt: new Date(),
    };

    // Update the conversation record
    await Conversation.findByIdAndUpdate(conversation._id, {
      $push: { messages: { $each: responses } },
      $set: {
        metadata,
        intent: message.toLowerCase().includes("chart")
          ? "visualization"
          : "general",
      },
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
