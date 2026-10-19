import { useRef, useState } from "react";
import { ArrowUp } from "lucide-react";
import styles from "./ChatInput.module.css";

// Render the responsive message composer and its send controls.
function ChatInput({ isLoading, handleSubmit, error }) {
  const [input, setInput] = useState("");
  const inputRef = useRef(null);

  // Send the message and clear the draft only after it succeeds.
  async function submitHandler(event) {
    event.preventDefault();
    if (!input.trim() || isLoading) return;

    const submitted = await handleSubmit(input.trim());
    if (submitted) {
      setInput("");
      if (inputRef.current) inputRef.current.style.height = "auto";
    }
  }

  // Keep the composer compact for short prompts and grow it for longer ones.
  function handleInputChange(event) {
    setInput(event.target.value);
    event.target.style.height = "auto";
    event.target.style.height = `${Math.min(event.target.scrollHeight, 200)}px`;
  }

  // Enter sends a prompt; Shift+Enter adds a line break.
  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      event.currentTarget.form.requestSubmit();
    }
  }

  return (
    <div className={styles.container}>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <form className={styles.form} onSubmit={submitHandler}>
        <textarea
          ref={inputRef}
          rows={1}
          className={styles.input}
          placeholder="Message ChatGPT"
          aria-label="Message"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          maxLength={12000}
          disabled={isLoading}
        />
        <button
          type="submit"
          className={styles.submitBtn}
          disabled={isLoading || !input.trim()}
          aria-label="Send message"
        >
          <ArrowUp size={18} />
        </button>
      </form>
      <p className={styles.disclaimer}>ChatGPT can make mistakes. Check important info.</p>
    </div>
  );
}

export default ChatInput;
