import {
  createChat,
  createMessage,
  generateAssistantAnswer,
  getChatMessages,
  getUserChats,
} from "../service/chat.service.js";

// Accept only safe positive integer chat identifiers.
function parseChatId(rawId) {
  if (!/^\d+$/.test(rawId)) return null;
  const id = Number(rawId);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

// Return the authenticated user's chat history.
export async function getChatsController(req, res, next) {
  try {
    const chats = await getUserChats(req.user.id);
    return res.status(200).json({ success: true, data: chats });
  } catch (error) {
    return next(error);
  }
}

// Create a blank chat for the authenticated user.
export async function createChatController(req, res, next) {
  try {
    const chat = await createChat(req.user.id);
    return res.status(201).json({ success: true, data: chat });
  } catch (error) {
    return next(error);
  }
}

// Load messages after validating ownership of the requested chat.
export async function getChatMessagesController(req, res, next) {
  try {
    const chatId = parseChatId(req.params.chatId);
    if (!chatId) {
      return res.status(400).json({
        success: false,
        message: "Invalid chat id.",
      });
    }

    const messages = await getChatMessages(req.user.id, chatId);
    return res.status(200).json({ success: true, data: messages });
  } catch (error) {
    return next(error);
  }
}

// Validate a prompt and return its user and assistant messages.
export async function createMessageController(req, res, next) {
  try {
    const chatId = parseChatId(req.params.chatId);
    if (!chatId) {
      return res.status(400).json({
        success: false,
        message: "Invalid chat id.",
      });
    }

    const { question } = req.body;
    if (
      typeof question !== "string" ||
      !question.trim() ||
      question.length > 12000
    ) {
      return res.status(400).json({
        success: false,
        message: "Enter a message of up to 12,000 characters.",
      });
    }

    const result = await createMessage(req.user.id, chatId, question.trim());
    return res.status(201).json({ success: true, data: result });
  } catch (error) {
    return next(error);
  }
}

// Generate an ephemeral reply for guests without saving conversation data.
export async function createGuestMessageController(req, res, next) {
  try {
    const body = req.body && typeof req.body === "object" ? req.body : {};
    const { question, history = [] } = body;
    if (
      typeof question !== "string" ||
      !question.trim() ||
      question.length > 12000
    ) {
      return res.status(400).json({
        success: false,
        message: "Enter a message of up to 12,000 characters.",
      });
    }
    if (
      !Array.isArray(history) ||
      history.length > 10 ||
      history.some(
        (message) =>
          !message ||
          !["user", "assistant"].includes(message.role) ||
          typeof message.content !== "string" ||
          !message.content.trim() ||
          message.content.length > 12000,
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Conversation history is invalid.",
      });
    }

    const result = await generateAssistantAnswer(history, question.trim());
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    return next(error);
  }
}
