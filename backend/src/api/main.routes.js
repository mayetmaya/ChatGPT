import express from "express";
import authRouter from "./auth/auth.routes.js";
import chatRouter from "./chat/chat.routes.js";
const mainRouter = express.Router();

mainRouter.use("/auth", authRouter);
mainRouter.use("/chat", chatRouter);

export default mainRouter;
