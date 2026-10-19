import express from "express";
import { rateLimit } from "express-rate-limit";
import {
  currentUserController,
  loginController,
  logoutController,
  registerController,
} from "./auth.controller.js";
import requireAuth from "../../middleware/requireAuth.js";
import requireFrontendOrigin from "../../middleware/requireFrontendOrigin.js";

const authRouter = express.Router();
const authAttemptLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many account attempts. Try again in 15 minutes.",
  },
});

authRouter.post(
  "/signup",
  requireFrontendOrigin,
  authAttemptLimiter,
  registerController,
);
authRouter.post(
  "/login",
  requireFrontendOrigin,
  authAttemptLimiter,
  loginController,
);
authRouter.post("/logout", requireFrontendOrigin, requireAuth, logoutController);
authRouter.get("/me", requireAuth, currentUserController);

export default authRouter;
