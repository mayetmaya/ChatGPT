import express from "express";
import { rateLimit } from "express-rate-limit";
import requireAuth from "../../middleware/requireAuth.js";
import requireFrontendOrigin from "../../middleware/requireFrontendOrigin.js";
import {
  createChatController,
  createGuestMessageController,
  createMessageController,
  getChatMessagesController,
  getChatsController,
} from "./controller/chat.controller.js";

const chatRouter = express.Router();
const guestMessageLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many guest messages. Try again in 15 minutes.",
  },
});

chatRouter.post(
  "/guest/messages",
  requireFrontendOrigin,
  guestMessageLimiter,
  createGuestMessageController,
);
chatRouter.use(requireAuth);
chatRouter.get("/chats", getChatsController);
chatRouter.post("/chats", requireFrontendOrigin, createChatController);
chatRouter.get("/chats/:chatId/messages", getChatMessagesController);
chatRouter.post(
  "/chats/:chatId/messages",
  requireFrontendOrigin,
  createMessageController,
);

export default chatRouter;
