# ChatGPT Clone

A full-stack chat application with a React/Vite frontend and a Node.js backend. The project is organized as two separate applications: `frontend` for the user interface and `backend` for authentication and chat APIs.

## Project structure

```text
ChatGPT_clone/
├── backend/
│   ├── db/
│   │   ├── db_config.js
│   │   └── schema.sql
│   ├── src/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   └── chat/
│   │   └── middleware/
│   ├── .env.example
│   ├── index.js
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   └── components/
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── .gitignore
└── README.md
```

## Requirements

- Node.js and npm
- A SQL database configured for this project
- Git

## Getting started

Run the commands below from the project root. Use two terminals so the backend and frontend can run at the same time.

### 1. Configure the database and backend environment

1. Create a database using your database tool.
2. Apply `backend/db/schema.sql` to that database.
3. Create the backend environment file from the example:

   **Windows PowerShell**
   ```powershell
   Copy-Item backend/.env.example backend/.env
   ```

   **macOS/Linux/Git Bash**
   ```bash
   cp backend/.env.example backend/.env
   ```

4. Edit `backend/.env` and enter your local database connection details and any other values required by `backend/.env.example`.

Do not commit `backend/.env` or put passwords, tokens, or API keys in source code. Keep placeholder values in `.env.example` so other developers know which variables are required.

### 2. Install and start the backend

```bash
cd backend
npm install
npm run dev
```

If `npm run dev` is not listed in `backend/package.json`, run `npm run` to see the available scripts and use the appropriate start script.

### 3. Install and start the frontend

Open a second terminal from the project root:

```bash
cd frontend
npm install
npm run dev
```

If `npm run dev` is not listed in `frontend/package.json`, run `npm run` to see the available scripts. Vite normally prints the local frontend URL in the terminal.

## Development notes

- The dashboard and guest chat are available without an account. Guest conversations exist only in the current browser session and are not saved; signing in or creating an account stores conversations in the database for later access.
- Guest chat requests are limited to 20 messages per IP address every 15 minutes.
- Keep backend dependencies and scripts in `backend/package.json`.
- Keep frontend dependencies and scripts in `frontend/package.json`.
- Keep both package lock files in Git so installs can be reproduced.
- Commit source code, SQL schema changes, and `.env.example` files; do not commit `node_modules`, build output, local environment files, or secrets.
- Update this README when setup steps, environment variables, or application features change.
