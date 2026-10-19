import { Menu, Moon, Sun } from "lucide-react";
import styles from "./ChatHeader.module.css";

// Render chat navigation controls, theme toggle, and account identity.
function ChatHeader({ user, theme, onToggleSidebar, onToggleTheme, onOpenAuth }) {
  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <button
          className={styles.menuButton}
          type="button"
          aria-label="Open navigation"
          onClick={onToggleSidebar}
        >
          <Menu size={20} />
        </button>
        <span className={styles.title}>ChatGPT</span>
      </div>

      <div className={styles.right}>
        <button
          className={styles.themeButton}
          type="button"
          onClick={onToggleTheme}
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
          {theme === "light" ? <Moon size={17} /> : <Sun size={17} />}
        </button>
        {user ? (
          <>
            <span className={styles.greeting}>Hi, {user.name.split(/\s+/)[0]}</span>
            <div className={styles.avatar} aria-hidden="true">
              {user.name
                .split(/\s+/)
                .slice(0, 2)
                .map((part) => part[0])
                .join("")
                .toUpperCase()}
            </div>
          </>
        ) : (
          <div className={styles.authActions}>
            <button type="button" onClick={() => onOpenAuth("login")}>Log in</button>
            <button type="button" onClick={() => onOpenAuth("signup")}>Sign up</button>
          </div>
        )}
      </div>
    </header>
  );
}

export default ChatHeader;
