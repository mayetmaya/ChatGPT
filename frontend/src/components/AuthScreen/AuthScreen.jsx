import { useState } from "react";
import { ArrowRight, Bot, LockKeyhole, X } from "lucide-react";
import axios from "axios";
import styles from "./AuthScreen.module.css";

// Offer sign-in and account creation without blocking the guest workspace.
function AuthScreen({ initialMode, onClose, onAuthenticated, connectionError }) {
  const [mode, setMode] = useState(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSignUp = mode === "signup";

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const { data } = await axios.post(
        `/auth/${mode}`,
        isSignUp ? { name, email, password } : { email, password },
      );
      onAuthenticated(data.data);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "We couldn't complete your request. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function switchMode(nextMode) {
    setMode(nextMode);
    setError("");
  }

  return (
    <div
      className={styles.overlay}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
      >
        <button
          className={styles.close}
          type="button"
          onClick={onClose}
          aria-label="Continue as a guest"
          title="Continue as a guest"
        >
          <X size={19} />
        </button>
        <div className={styles.brand}>
          <span className={styles.brandMark}><Bot size={21} /></span>
          <span>ChatGPT</span>
        </div>
        <div className={styles.formIcon}><LockKeyhole size={18} /></div>
        <h2 id="auth-title">{isSignUp ? "Create your account" : "Welcome back"}</h2>
        <p className={styles.subtitle}>
          {isSignUp
            ? "Sign up to save your conversations and pick up where you left off."
            : "Sign in to return to your saved conversations."}
        </p>

        <div className={styles.modeSwitch} aria-label="Account access">
          <button
            type="button"
            className={!isSignUp ? styles.modeActive : ""}
            aria-pressed={!isSignUp}
            onClick={() => switchMode("login")}
          >
            Log in
          </button>
          <button
            type="button"
            className={isSignUp ? styles.modeActive : ""}
            aria-pressed={isSignUp}
            onClick={() => switchMode("signup")}
          >
            Sign up
          </button>
        </div>

        {connectionError && <p className={styles.notice} role="status">{connectionError}</p>}
        {error && <p className={styles.error} role="alert">{error}</p>}

        <form className={styles.form} onSubmit={handleSubmit}>
          {isSignUp && (
            <label className={styles.field}>
              <span>Your name</span>
              <input
                autoComplete="name"
                name="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                minLength={2}
                maxLength={60}
                required
              />
            </label>
          )}
          <label className={styles.field}>
            <span>Email address</span>
            <input
              autoComplete="email"
              name="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              maxLength={254}
              required
            />
          </label>
          <label className={styles.field}>
            <span>Password</span>
            <input
              autoComplete={isSignUp ? "new-password" : "current-password"}
              name="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={isSignUp ? 8 : undefined}
              maxLength={128}
              required
            />
            {isSignUp && <small>Use at least 8 characters.</small>}
          </label>
          <button className={styles.submit} type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Please wait…" : isSignUp ? "Create account" : "Log in"}
            {!isSubmitting && <ArrowRight size={17} />}
          </button>
        </form>

        <p className={styles.switchPrompt}>
          {isSignUp ? "Already have an account?" : "New here?"}{" "}
          <button
            type="button"
            onClick={() => switchMode(isSignUp ? "login" : "signup")}
          >
            {isSignUp ? "Log in" : "Create an account"}
          </button>
        </p>
        <p className={styles.privacy}>Continue as a guest anytime by closing this window.</p>
      </section>
    </div>
  );
}

export default AuthScreen;
