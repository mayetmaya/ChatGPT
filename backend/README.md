# Backend

## Local setup

1. Create a MySQL database and copy `.env.example` to `.env`. Set the database
   credentials and `GEMINI_API_KEY`; keep `.env` private.
2. Run `db/schema.sql` against that database before starting the server. This
   creates the user, session, chat, and message tables.
3. Install dependencies with `npm install`, then run `npm run dev`.
4. Start the frontend at `http://localhost:5173`. Set `FRONTEND_ORIGIN` to its
   exact origin if it uses a different host or port. The Vite development
   server proxies `/api` requests to `http://localhost:3777`.
5. For the Vercel deployment, configure the project root as `frontend`. Its
   `vercel.json` forwards `/api` requests to the backend so the browser uses a
   same-origin, persistent session cookie. Set `FRONTEND_ORIGIN` on the backend
   to the deployed frontend's exact HTTPS origin when using a custom domain.

Authentication uses a random, server-revocable session token in an HttpOnly,
SameSite=Lax cookie. The token itself is not stored in the database; only its
SHA-256 hash is stored. The cookie lasts seven days and is marked Secure in
production, so production must use HTTPS. The database must persist between
deployments for accounts and sessions to remain available.

## API

- `POST /api/auth/signup` — create an account and sign in.
- `POST /api/auth/login` — sign in.
- `POST /api/auth/logout` — revoke the current session.
- `GET /api/auth/me` — get the current account.
- `GET /api/chat/chats` / `POST /api/chat/chats` — list or start chats.
- `GET /api/chat/chats/:chatId/messages` — load a chat's messages.
- `POST /api/chat/chats/:chatId/messages` — send a message and receive a reply.

Chat and message endpoints require authentication and only return data owned by
the signed-in user. The original `conversations` table, if present, is left
untouched: its messages have no account owner, so they are not assigned to a new
account or exposed across users.
