import {
  deleteSession,
  loginUser,
  registerUser,
} from "./auth.service.js";
import { getSessionCookie } from "../../middleware/requireAuth.js";

const SESSION_COOKIE_NAME = "chat_session";
const SESSION_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

// Attach the authenticated session token as an HttpOnly cookie.
function setSessionCookie(res, token) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader(
    "Set-Cookie",
    `${SESSION_COOKIE_NAME}=${token}; HttpOnly; Path=/api; SameSite=Lax; Max-Age=${SESSION_COOKIE_MAX_AGE / 1000}${secure}`,
  );
}

// Expire the browser cookie after revoking the current session.
function clearSessionCookie(res) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader(
    "Set-Cookie",
    `${SESSION_COOKIE_NAME}=; HttpOnly; Path=/api; SameSite=Lax; Max-Age=0${secure}`,
  );
}

// Validate registration input, create the account, and start its session.
export async function registerController(req, res, next) {
  try {
    const { name, email, password } = req.body;
    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required.",
      });
    }

    const result = await registerUser({ name, email, password });
    setSessionCookie(res, result.token);
    return res.status(201).json({ success: true, data: result.user });
  } catch (error) {
    return next(error);
  }
}

// Authenticate credentials and issue a session cookie.
export async function loginController(req, res, next) {
  try {
    const { email, password } = req.body;
    if (typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const result = await loginUser({ email, password });
    setSessionCookie(res, result.token);
    return res.status(200).json({ success: true, data: result.user });
  } catch (error) {
    return next(error);
  }
}

// Revoke the current session and clear its browser cookie.
export async function logoutController(req, res, next) {
  try {
    await deleteSession(getSessionCookie(req));
    clearSessionCookie(res);
    return res.status(200).json({ success: true });
  } catch (error) {
    return next(error);
  }
}

// Return the authenticated account attached by the auth middleware.
export function currentUserController(req, res) {
  return res.status(200).json({ success: true, data: req.user });
}
