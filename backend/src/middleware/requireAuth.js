import { createHash } from "node:crypto";
import db from "../../db/db_config.js";

// Read the chat session token from the request cookie header.
export function getSessionCookie(req) {
  const cookie = req.headers.cookie
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("chat_session="));

  return cookie?.slice("chat_session=".length);
}

// Hash a session token before comparing or persisting it.
export function hashSessionToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

// Validate the session cookie and attach its account to the request.
export default async function requireAuth(req, res, next) {
  try {
    const token = getSessionCookie(req);
    if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) {
      return res.status(401).json({
        success: false,
        message: "Please sign in to continue.",
      });
    }

    const [rows] = await db.execute(
      `SELECT u.id, u.name, u.email
       FROM auth_sessions AS s
       JOIN users AS u ON u.id = s.user_id
       WHERE s.token_hash = ? AND s.expires_at > CURRENT_TIMESTAMP`,
      [hashSessionToken(token)],
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Your session has expired. Please sign in again.",
      });
    }

    req.user = rows[0];
    return next();
  } catch (error) {
    return next(error);
  }
}
