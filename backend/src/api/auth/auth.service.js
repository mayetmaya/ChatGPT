import {
  createHash,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import db from "../../../db/db_config.js";
import { hashSessionToken } from "../../middleware/requireAuth.js";

const scrypt = promisify(scryptCallback);
const PASSWORD_BYTES = 64;
const SESSION_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;

// Build an HTTP error with the status expected by the API handler.
function createHttpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

// Hash a password with a fresh salt before storing it.
async function hashPassword(password) {
  const salt = randomBytes(16);
  const derivedKey = await scrypt(password, salt, PASSWORD_BYTES);

  return `${salt.toString("hex")}:${derivedKey.toString("hex")}`;
}

// Verify a password hash using a timing-safe comparison.
async function verifyPassword(password, storedHash) {
  const [saltHex, keyHex] = storedHash.split(":");
  if (!saltHex || !keyHex || !/^[a-f0-9]{128}$/i.test(keyHex)) {
    return false;
  }

  const salt = Buffer.from(saltHex, "hex");
  const expectedKey = Buffer.from(keyHex, "hex");
  if (salt.length !== 16 || expectedKey.length !== PASSWORD_BYTES) {
    return false;
  }

  const actualKey = await scrypt(password, salt, PASSWORD_BYTES);
  return timingSafeEqual(expectedKey, actualKey);
}

// Create a random session token and store only its digest.
async function createSession(connection, userId) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_LIFETIME_MS);

  await connection.execute(
    `INSERT INTO auth_sessions (user_id, token_hash, expires_at)
     VALUES (?, ?, ?)`,
    [userId, hashSessionToken(token), expiresAt],
  );

  return token;
}

// Validate and persist a new account, then create its initial session.
export async function registerUser({ name, email, password }) {
  const normalizedName = name.trim();
  const normalizedEmail = email.trim().toLowerCase();

  if (normalizedName.length < 2 || normalizedName.length > 60) {
    throw createHttpError(400, "Name must be between 2 and 60 characters.");
  }
  if (
    normalizedEmail.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
  ) {
    throw createHttpError(400, "Enter a valid email address.");
  }
  if (password.length < 8 || Buffer.byteLength(password, "utf8") > 1024) {
    throw createHttpError(400, "Password must be at least 8 characters.");
  }

  const passwordHash = await hashPassword(password);
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();
    const [result] = await connection.execute(
      "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
      [normalizedName, normalizedEmail, passwordHash],
    );
    const token = await createSession(connection, result.insertId);
    await connection.commit();

    return {
      token,
      user: { id: result.insertId, name: normalizedName, email: normalizedEmail },
    };
  } catch (error) {
    await connection.rollback();
    if (error.code === "ER_DUP_ENTRY") {
      throw createHttpError(409, "An account with this email already exists.");
    }
    throw error;
  } finally {
    connection.release();
  }
}

// Verify account credentials and issue a new session.
export async function loginUser({ email, password }) {
  const normalizedEmail = email.trim().toLowerCase();
  if (
    normalizedEmail.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) ||
    !password ||
    Buffer.byteLength(password, "utf8") > 1024
  ) {
    throw createHttpError(401, "Email or password is incorrect.");
  }

  const [rows] = await db.execute(
    "SELECT id, name, email, password_hash FROM users WHERE email = ?",
    [normalizedEmail],
  );
  const user = rows[0];
  let passwordMatches = false;
  if (user) {
    passwordMatches = await verifyPassword(password, user.password_hash);
  } else {
    await scrypt(password, Buffer.alloc(16), PASSWORD_BYTES);
  }

  if (!passwordMatches) {
    throw createHttpError(401, "Email or password is incorrect.");
  }

  const connection = await db.getConnection();
  try {
    const token = await createSession(connection, user.id);
    return {
      token,
      user: { id: user.id, name: user.name, email: user.email },
    };
  } finally {
    connection.release();
  }
}

// Revoke a session by deleting its stored token digest.
export async function deleteSession(token) {
  if (!token) return;

  await db.execute("DELETE FROM auth_sessions WHERE token_hash = ?", [
    createHash("sha256").update(token).digest("hex"),
  ]);
}
