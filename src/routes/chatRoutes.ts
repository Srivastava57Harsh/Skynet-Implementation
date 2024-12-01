import { Router, Request, Response } from "express";
import { chat } from "../controllers/chatController.js";
import { ChatRequest } from "../types/index.js";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  await chat(req as Request<{}, {}, ChatRequest>, res);
});

export default router;
