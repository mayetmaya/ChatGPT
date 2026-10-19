import ChatMessage from "../ChatMessage/ChatMessage";
import styles from "./MessageList.module.css";
import { Bot } from "lucide-react";

// Render conversation messages, suggestions, and response loading state.
function MessageList({ conversations, isLoading, messagesEndRef, onSuggestion }) {
  return (
    <div className={styles.messages}>
      {conversations?.length === 0 && !isLoading ? (
        <div className={styles.empty}>
          <div className={styles.welcomeIcon}><Bot size={22} /></div>
          <h1>What can I help with?</h1>
          <p>Ask a question, explore an idea, or create something new.</p>
          <div className={styles.suggestions}>
            <button type="button" onClick={() => onSuggestion("Explain a tricky idea in a simple way.")}>
              Explain an idea
            </button>
            <button type="button" onClick={() => onSuggestion("Help me brainstorm some creative ideas.")}>
              Brainstorm
            </button>
            <button type="button" onClick={() => onSuggestion("Help me write a thoughtful message.")}>
              Help me write
            </button>
            <button type="button" onClick={() => onSuggestion("Help me plan my week.")}>
              Make a plan
            </button>
          </div>
        </div>
      ) : (
        conversations?.map((msg) => (
          <ChatMessage key={msg.id} role={msg.role} content={msg.content} />
        ))
      )}

      {isLoading && (
        <div className={styles.loadingContainer}>
          <div className={styles.loadingAvatar}>
            <Bot size={18} />
          </div>
          <div className={styles.loading} aria-label="Assistant is responding">
            <div className={styles.loadingDot} />
            <div className={styles.loadingDot} />
            <div className={styles.loadingDot} />
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}

export default MessageList;
