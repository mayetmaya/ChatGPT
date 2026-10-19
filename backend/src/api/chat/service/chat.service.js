import db from "../../../../db/db_config.js";
import { GoogleGenAI } from "@google/genai";

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
const geminiApiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;

// Create an API error with an HTTP status code.
function createHttpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

// Build a Gemini client when the required API key is configured.
function getGeminiClient() {
  if (!geminiApiKey) {
    throw createHttpError(
      500,
      "Gemini API key is missing. Set GEMINI_API_KEY in backend/.env.",
    );
  }

  return new GoogleGenAI({ apiKey: geminiApiKey });
}

// Generate an assistant response using the current chat's recent messages.
export async function generateAssistantAnswer(historyRows, question) {
  const history = historyRows.map((row) => ({
    role: row.role === "assistant" ? "model" : "user",
    parts: [{ text: row.content }],
  }));

  history.push({ role: "user", parts: [{ text: question }] });

  try {
    const response = await getGeminiClient().models.generateContent({
      model: GEMINI_MODEL,
      contents: history,
    });

    if (!response.text) {
      throw createHttpError(502, "The AI service returned an empty response.");
    }
    return {
      text: response.text,
      totalTokens: response.usageMetadata?.totalTokenCount || 0,
    };
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) {
      throw createHttpError(
        502,
        "Gemini rejected the API key. Check GEMINI_API_KEY in backend/.env.",
      );
    }
    throw error;
  }
}

// Fetch chats owned by a user, with the most recent first.
export async function getUserChats(userId) {
  const [rows] = await db.execute(
    `SELECT id, title, created_at, updated_at
     FROM chats WHERE user_id = ? ORDER BY updated_at DESC, id DESC`,
    [userId],
  );
  return rows;
}

// Create and return a blank chat belonging to the user.
export async function createChat(userId) {
  const [result] = await db.execute(
    "INSERT INTO chats (user_id) VALUES (?)",
    [userId],
  );

  const [rows] = await db.execute(
    "SELECT id, title, created_at, updated_at FROM chats WHERE id = ? AND user_id = ?",
    [result.insertId, userId],
  );
  return rows[0];
}

// Verify chat ownership before allowing access to its data.
async function getOwnedChat(userId, chatId) {
  const [rows] = await db.execute(
    "SELECT id, title FROM chats WHERE id = ? AND user_id = ?",
    [chatId, userId],
  );
  if (rows.length === 0) {
    throw createHttpError(404, "Chat not found.");
  }
  return rows[0];
}

// Return all messages for a chat owned by the user.
export async function getChatMessages(userId, chatId) {
  await getOwnedChat(userId, chatId);
  const [rows] = await db.execute(
    `SELECT id, role, content, token_count, created_at
     FROM messages WHERE chat_id = ? ORDER BY id ASC`,
    [chatId],
  );
  return rows;
}

// Generate a reply and persist both messages to the owned chat.
export async function createMessage(userId, chatId, question) {
  await getOwnedChat(userId, chatId);
  const [historyRows] = await db.execute(
    `SELECT role, content FROM messages
     WHERE chat_id = ? ORDER BY id DESC LIMIT 10`,
    [chatId],
  );
  historyRows.reverse();

  const { text, totalTokens } = await generateAssistantAnswer(
    historyRows,
    question,
  );

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [userResult] = await connection.execute(
      "INSERT INTO messages (chat_id, role, content) VALUES (?, 'user', ?)",
      [chatId, question],
    );
    const [assistantResult] = await connection.execute(
      `INSERT INTO messages (chat_id, role, content, token_count)
       VALUES (?, 'assistant', ?, ?)`,
      [chatId, text, totalTokens],
    );
    await connection.execute(
      `UPDATE chats SET title = IF(title = 'New chat', ?, title)
       WHERE id = ? AND user_id = ?`,
      [question.slice(0, 120), chatId, userId],
    );

    const [[userConversation]] = await connection.execute(
      "SELECT id, role, content, created_at FROM messages WHERE id = ?",
      [userResult.insertId],
    );
    const [[assistantConversation]] = await connection.execute(
      "SELECT id, role, content, created_at FROM messages WHERE id = ?",
      [assistantResult.insertId],
    );
    const [[updatedChat]] = await connection.execute(
      "SELECT id, title, created_at, updated_at FROM chats WHERE id = ? AND user_id = ?",
      [chatId, userId],
    );
    await connection.commit();

    return { chat: updatedChat, userConversation, assistantConversation };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
