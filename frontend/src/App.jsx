import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import Sidebar from "./components/Sidebar/Sidebar";
import ChatHeader from "./components/ChatHeader/ChatHeader";
import MessageList from "./components/MessageList/MessageList";
import ChatInput from "./components/ChatInput/ChatInput";
import AuthScreen from "./components/AuthScreen/AuthScreen";

axios.defaults.baseURL = "/api";
axios.defaults.withCredentials = true;

// Coordinate authentication, chat history, and the active conversation.
function App() {
  // Restore the user's saved color theme before rendering the workspace.
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("chat-theme") === "dark" ? "dark" : "light";
    } catch {
      return "light";
    }
  });
  const [user, setUser] = useState(null);
  const [authStatus, setAuthStatus] = useState("loading");
  const [connectionError, setConnectionError] = useState("");
  const [authMode, setAuthMode] = useState(null);
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const messagesEndRef = useRef(null);

  // Apply the selected theme and keep it across browser sessions.
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("chat-theme", theme);
    } catch {
      // Theme remains available for this session when storage is unavailable.
    }
  }, [theme]);

  // Keep the newest message visible after chat updates.
  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    });
  }, []);

  // Clear private chat state when the session expires and continue as a guest.
  const handleUnauthorized = useCallback((error) => {
    if (error.response?.status !== 401) return false;

    setUser(null);
    setChats([]);
    setConversations([]);
    setActiveChatId(null);
    setIsLoadingChats(false);
    setAuthStatus("guest");
    return true;
  }, []);

  // Restore the signed-in user from the secure session cookie.
  useEffect(() => {
    let cancelled = false;
    axios
      .get("/auth/me")
      .then(({ data }) => {
        if (!cancelled) {
          setUser(data.data);
          setIsLoadingChats(true);
          setAuthStatus("authenticated");
        }
      })
      .catch((error) => {
        if (cancelled) return;
        if (error.response?.status === 401) {
          setAuthStatus("guest");
        } else {
          setConnectionError(
            "Couldn't reach the server. Check that the backend is running, then retry.",
          );
          setSubmitError(
            "Couldn't verify your account. You can still chat as a guest.",
          );
          setAuthStatus("guest");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Load the user's chat history and select a conversation.
  useEffect(() => {
    const userId = user?.id;
    if (!userId) return undefined;

    let cancelled = false;
    axios
      .get("/chat/chats")
      .then(({ data }) => {
        if (cancelled) return;
        const nextChats = data.data || [];
        setChats(nextChats);
        setActiveChatId((currentId) =>
          currentId && nextChats.some((chat) => chat.id === currentId)
            ? currentId
            : nextChats[0]?.id || null,
        );
      })
      .catch((error) => {
        if (!cancelled) {
          if (handleUnauthorized(error)) return;
          setSubmitError(
            error.response?.data?.message || "Couldn't load your chat history.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingChats(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id, handleUnauthorized]);

  // Load messages whenever the selected chat changes.
  useEffect(() => {
    const userId = user?.id;
    if (!userId || !activeChatId) return undefined;

    let cancelled = false;
    axios
      .get(`/chat/chats/${activeChatId}/messages`)
      .then(({ data }) => {
        if (!cancelled) {
          setConversations(data.data || []);
          scrollToBottom();
        }
      })
      .catch((error) => {
        if (!cancelled) {
          if (handleUnauthorized(error)) return;
          setSubmitError(
            error.response?.data?.message || "Couldn't load this conversation.",
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id, activeChatId, handleUnauthorized, scrollToBottom]);

  // Scroll after new messages or a response loading indicator appears.
  useEffect(() => {
    scrollToBottom();
  }, [conversations, isLoading, scrollToBottom]);

  // Toggle between the saved light and dark themes.
  function toggleTheme() {
    setTheme((current) => (current === "light" ? "dark" : "light"));
  }

  // Open the mobile drawer or collapse the desktop sidebar.
  function toggleSidebar() {
    if (window.matchMedia("(max-width: 760px)").matches) {
      setIsSidebarOpen((open) => !open);
    } else {
      setIsSidebarCollapsed((collapsed) => !collapsed);
    }
  }

  // Close the sidebar after navigation or a backdrop click.
  function closeSidebar() {
    setIsSidebarOpen(false);
  }

  // Expand or collapse the desktop sidebar.
  function toggleSidebarCollapse() {
    setIsSidebarCollapsed((collapsed) => !collapsed);
  }

  // Start the account workspace after successful sign-in or registration.
  function handleAuthenticated(authenticatedUser) {
    setChats([]);
    setConversations([]);
    setActiveChatId(null);
    setSubmitError("");
    setConnectionError("");
    setUser(authenticatedUser);
    setAuthMode(null);
    setIsLoadingChats(true);
    setAuthStatus("authenticated");
  }

  // Revoke the current session and keep the dashboard available as a guest.
  async function handleLogout() {
    try {
      await axios.post("/auth/logout");
      setUser(null);
      setChats([]);
      setConversations([]);
      setActiveChatId(null);
      setIsLoadingChats(false);
      setAuthStatus("guest");
      setIsSidebarOpen(false);
    } catch (error) {
      if (handleUnauthorized(error)) return;
      setSubmitError(
        error.response?.data?.message || "Couldn't sign out. Please try again.",
      );
    }
  }

  // Create and open a fresh, empty conversation.
  async function handleNewChat() {
    if (!user) {
      setActiveChatId(null);
      setConversations([]);
      setSubmitError("");
      setIsSidebarOpen(false);
      return;
    }

    try {
      const { data } = await axios.post("/chat/chats");
      const newChat = data.data;
      setChats((previous) => [newChat, ...previous]);
      setActiveChatId(newChat.id);
      setConversations([]);
      setSubmitError("");
      setIsSidebarOpen(false);
    } catch (error) {
      if (handleUnauthorized(error)) return;
      setSubmitError(
        error.response?.data?.message || "Couldn't start a new chat.",
      );
    }
  }

  // Switch the workspace to a conversation selected in the sidebar.
  function handleSelectChat(chatId) {
    setActiveChatId(chatId);
    setConversations([]);
    setSubmitError("");
    setIsSidebarOpen(false);
  }

  // Submit prompts to persistent account history or an ephemeral guest chat.
  async function handleSubmit(question) {
    if (!question.trim() || isLoading) return false;

    const tempUserMessage = {
      id: `pending-${Date.now()}`,
      content: question.trim(),
      role: "user",
    };
    setConversations((previous) => [...previous, tempUserMessage]);
    setSubmitError("");
    setIsLoading(true);
    let createdChat = null;

    try {
      if (!user) {
        const history = conversations
          .filter((message) => !String(message.id).startsWith("pending-"))
          .slice(-10)
          .map(({ role, content }) => ({ role, content }));
        const { data } = await axios.post("/chat/guest/messages", {
          question: question.trim(),
          history,
        });
        const timestamp = Date.now();
        setConversations((previous) => [
          ...previous.filter((message) => message.id !== tempUserMessage.id),
          { id: `guest-${timestamp}-user`, role: "user", content: question.trim() },
          {
            id: `guest-${timestamp}-assistant`,
            role: "assistant",
            content: data.data.text,
          },
        ]);
        return true;
      }

      let chatId = activeChatId;
      if (!chatId) {
        const { data } = await axios.post("/chat/chats");
        createdChat = data.data;
        chatId = createdChat.id;
      }

      const { data } = await axios.post(
        `/chat/chats/${chatId}/messages`,
        { question: question.trim() },
      );
      const { chat, userConversation, assistantConversation } = data.data;
      setChats((previous) => {
        const withoutCurrent = previous.filter((item) => item.id !== chat.id);
        return [chat, ...withoutCurrent];
      });
      setActiveChatId(chat.id);
      setConversations((previous) => [
        ...previous.filter((message) => message.id !== tempUserMessage.id),
        userConversation,
        assistantConversation,
      ]);
      return true;
    } catch (error) {
      setConversations((previous) =>
        previous.filter((message) => message.id !== tempUserMessage.id),
      );
      if (createdChat) {
        setChats((previous) => [createdChat, ...previous]);
        setActiveChatId(createdChat.id);
      }
      if (handleUnauthorized(error)) return false;
      setSubmitError(
        error.response?.data?.message ||
          error.message ||
          "Unable to send your message. Please try again.",
      );
      return false;
    } finally {
      setIsLoading(false);
    }
  }

  if (authStatus === "loading") {
    return <div className="startup">Opening ChatGPT…</div>;
  }

  return (
    <div className="app">
      {isSidebarOpen && (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Close navigation"
          onClick={closeSidebar}
        />
      )}
      <Sidebar
        chats={chats}
        activeChatId={activeChatId}
        user={user}
        isOpen={isSidebarOpen}
        isCollapsed={isSidebarCollapsed}
        isLoadingChats={isLoadingChats}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        onClose={closeSidebar}
        onToggleCollapse={toggleSidebarCollapse}
        onLogout={handleLogout}
        onOpenAuth={setAuthMode}
      />
      <main className="chat">
        <ChatHeader
          user={user}
          theme={theme}
          onToggleTheme={toggleTheme}
          onToggleSidebar={toggleSidebar}
          onOpenAuth={setAuthMode}
        />

        <MessageList
          isLoading={isLoading}
          conversations={conversations}
          messagesEndRef={messagesEndRef}
          onSuggestion={handleSubmit}
        />

        <ChatInput
          isLoading={isLoading}
          handleSubmit={handleSubmit}
          error={submitError}
        />
      </main>
      {authMode && (
        <AuthScreen
          initialMode={authMode}
          onClose={() => setAuthMode(null)}
          onAuthenticated={handleAuthenticated}
          connectionError={connectionError}
        />
      )}
    </div>
  );
}

export default App;
