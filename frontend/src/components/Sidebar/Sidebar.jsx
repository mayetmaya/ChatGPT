import { useMemo, useState } from "react";
import {
  Compass,
  FolderKanban,
  Grid2X2,
  Image as ImageIcon,
  Library,
  Bot,
  LogOut,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  X,
} from "lucide-react";
import styles from "./Sidebar.module.css";

// Render chat navigation, placeholder tools, and account actions.
function Sidebar({
  chats,
  activeChatId,
  user,
  isOpen,
  isCollapsed,
  isLoadingChats,
  onNewChat,
  onSelectChat,
  onClose,
  onToggleCollapse,
  onLogout,
  onOpenAuth,
}) {
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");
  // Filter the user's chat history by the search field.
  const filteredChats = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return chats;
    return chats.filter((chat) => chat.title.toLowerCase().includes(query));
  }, [chats, search]);
  // Derive a compact avatar label from the account name.
  const initials = user?.name
    ?.split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  // Explain when a presentational sidebar shortcut is not available yet.
  function showNotice(message) {
    setNotice(message);
    if (isCollapsed) onToggleCollapse();
  }

  return (
    <aside
      className={`${styles.sidebar} ${isOpen ? styles.open : ""} ${
        isCollapsed ? styles.collapsed : ""
      }`}
    >
      <div className={styles.top}>
        <div className={styles.header}>
          <a className={styles.brand} href="#" aria-label="ChatGPT home">
            <span className={styles.brandIcon}><Bot size={19} /></span>
            <span className={styles.brandName}>ChatGPT</span>
          </a>
          <button
            className={`${styles.iconBtn} ${styles.mobileClose}`}
            onClick={onClose}
            type="button"
            aria-label="Close navigation"
          >
            <X size={19} />
          </button>
          <button
            className={`${styles.iconBtn} ${styles.desktopCollapse}`}
            onClick={onToggleCollapse}
            type="button"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <PanelIcon collapsed={isCollapsed} />
          </button>
        </div>

        <button
          className={styles.newChat}
          onClick={onNewChat}
          type="button"
          title={isCollapsed ? "New chat" : undefined}
        >
          <Plus size={18} strokeWidth={2.2} />
          <span className={styles.actionLabel}>New chat</span>
        </button>

        <nav className={styles.tools} aria-label="More tools">
          <button type="button" className={styles.tool} title="Explore GPTs" onClick={() => showNotice("Explore GPTs is coming soon.")}>
            <Compass size={17} /><span className={styles.actionLabel}>Explore GPTs</span>
          </button>
          <button type="button" className={styles.tool} title="Images" onClick={() => showNotice("Images is coming soon.")}>
            <ImageIcon size={17} /><span className={styles.actionLabel}>Images</span>
          </button>
          <button type="button" className={styles.tool} title="Projects" onClick={() => showNotice("Projects is coming soon.")}>
            <FolderKanban size={17} /><span className={styles.actionLabel}>Projects</span>
          </button>
          <button type="button" className={styles.tool} title="Library" onClick={() => showNotice("Library is coming soon.")}>
            <Library size={17} /><span className={styles.actionLabel}>Library</span>
          </button>
          <button type="button" className={styles.tool} title="Apps" onClick={() => showNotice("Apps is coming soon.")}>
            <Grid2X2 size={17} /><span className={styles.actionLabel}>Apps</span>
          </button>
        </nav>

        <label className={styles.search}>
          <Search size={16} onClick={() => isCollapsed && onToggleCollapse()} />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={isCollapsed ? "" : "Search chats"}
            aria-label="Search chat history"
            title={isCollapsed ? "Search chats" : undefined}
            onClick={() => isCollapsed && onToggleCollapse()}
          />
        </label>

        {notice && !isCollapsed && (
          <div className={styles.notice} role="status">
            <span>{notice}</span>
            <button type="button" onClick={() => setNotice("")} aria-label="Dismiss notice">
              <X size={14} />
            </button>
          </div>
        )}

        <div className={styles.history}>
          <div className={`${styles.sectionLabel} ${styles.actionLabel}`}>Chat history</div>
          {isLoadingChats ? (
            <p className={styles.historyMessage}>Loading your chats…</p>
          ) : filteredChats.length ? (
            <ul className={styles.chatList}>
              {filteredChats.map((chat) => (
                <li key={chat.id}>
                  <button
                    type="button"
                    className={`${styles.chatItem} ${
                      activeChatId === chat.id ? styles.active : ""
                    }`}
                    onClick={() => onSelectChat(chat.id)}
                    title={chat.title}
                  >
                    <MessageSquare size={15} />
                    <span className={styles.actionLabel}>{chat.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className={`${styles.historyMessage} ${styles.actionLabel}`}>
              {search
                ? "No matching chats."
                : user
                  ? "Your conversations will show up here."
                  : "Sign in to save your conversations."}
            </p>
          )}
        </div>
      </div>

      <div className={styles.footer}>
        {user ? (
          <div className={styles.user}>
            <div className={styles.avatar}>{initials}</div>
            <div className={`${styles.userInfo} ${styles.actionLabel}`}>
              <span className={styles.userName}>{user.name}</span>
              <span className={styles.userEmail}>{user.email}</span>
            </div>
            <button
              className={styles.signOut}
              onClick={onLogout}
              type="button"
              aria-label="Sign out of your account"
              title="Sign out"
            >
              <LogOut size={17} />
              <span className={styles.actionLabel}>Sign out</span>
            </button>
          </div>
        ) : (
          <div className={styles.guestActions}>
            <p className={`${styles.guestMessage} ${styles.actionLabel}`}>
              Sign in to save your chat history.
            </p>
            <div className={styles.guestButtons}>
              <button type="button" onClick={() => onOpenAuth("login")}>Log in</button>
              <button type="button" onClick={() => onOpenAuth("signup")}>Sign up</button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

// Choose the sidebar control icon for its current state.
function PanelIcon({ collapsed }) {
  return collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />;
}

export default Sidebar;
