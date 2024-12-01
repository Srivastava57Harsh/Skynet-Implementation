import { Router, Request, Response } from "express";
import { chat } from "../controllers/chatController.js";
import { ChatRequest } from "../types/index.js";
import { Conversation } from "../models/conversation.js";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  await chat(req as Request<{}, {}, ChatRequest>, res);
});

router.get("/history", async (req: Request, res: Response) => {
  try {
    const conversations = await Conversation.find({})
      .sort({ createdAt: -1 })
      .limit(10);
    res.json(conversations);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

//@ts-ignore
router.get("/history", async (req: Request, res: Response) => {
  try {
    const conversation = await Conversation.findOne({
      sessionId: req.params.sessionId,
    });
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }
    res.json(conversation);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch conversation" });
  }
});

export default router;
