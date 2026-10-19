import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { User, Bot, Check, Copy } from "lucide-react";
import styles from "./ChatMessage.module.css";

// Render formatted code with syntax highlighting and a copy action.
const CodeBlock = ({ language, value }) => {
  // State to track whether the code has been copied
  const [copied, setCopied] = useState(false);

  // Copy the displayed code and show brief confirmation.
  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);

    // Reset copied state after 2 seconds
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={styles.codeBlockWrapper}>
      {/* Code block header */}
      <div className={styles.codeHeader}>
        {/* Display programming language */}
        <span className={styles.codeLanguage}>{language || "code"}</span>

        {/* Copy code button */}
        <button onClick={handleCopy} className={styles.copyBtn} type="button">
          {copied ? (
            <>
              <Check size={14} color="#10a37f" />
              <span style={{ color: "#10a37f" }}>Copied!</span>
            </>
          ) : (
            <>
              <Copy size={14} />
              <span>Copy code</span>
            </>
          )}
        </button>
      </div>

      {/* Display code with syntax highlighting */}
      <SyntaxHighlighter
        language={language || "text"}
        style={vscDarkPlus}
        customStyle={{
          margin: 0,
          borderRadius: "0 0 8px 8px",
          padding: "16px",
          fontSize: "14px",
          backgroundColor: "#0d0d0d",
        }}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
};

// Render a user or assistant message with the appropriate formatting.
function ChatMessage({ role, content }) {
  // Check if the message belongs to the user
  const isUser = role === "user";

  return (
    <div className={`${styles.message} ${styles[role]}`}>
      {/* Display user or bot avatar */}
      <div className={`${styles.avatar} ${styles[role]}`}>
        {isUser ? (
          <User size={20} color="white" />
        ) : (
          <Bot size={20} color="white" />
        )}
      </div>

      {/* Message content */}
      <div className={styles.content}>
        {isUser ? (
          // Display normal text for user messages
          content
        ) : (
          // Render Markdown content for bot messages
          <div className={styles.markdownBody}>
            <ReactMarkdown
              components={{
                // Customize how code blocks are displayed
                code({ node, inline, className, children, ...props }) {
                  // Detect the programming language
                  const match = /language-(\w+)/.exec(className || "");

                  // Convert code content into a string
                  const codeString = String(children).replace(/\n$/, "");

                  // Use custom CodeBlock for code blocks
                  return !inline && match ? (
                    <CodeBlock language={match[1]} value={codeString} />
                  ) : (
                    // Display inline code normally
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                },
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}

export default ChatMessage;
