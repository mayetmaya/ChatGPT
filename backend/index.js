import "dotenv/config";
import express from "express";
import cors from "cors";

import db from "./db/db_config.js";
import mainRouter from "./src/api/main.routes.js";
import errorHandler from "./src/middleware/errorHandler.js";
import { isAllowedFrontendOrigin } from "./src/middleware/requireFrontendOrigin.js";

const app = express();

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow server-to-server or local automated test tools (no origin)
      if (!origin) return callback(null, true);

      if (isAllowedFrontendOrigin(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Blocked by CORS security policy"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  }),
);

// 2. Global body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint (Useful to keep Render web services awake)
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date() });
});

// 3. Routing (Note: This forces all routes from mainRouter to be prefixed with /api)
app.use("/api", mainRouter);

// 4. Global Error Handling Middleware (must be registered last)
app.use(errorHandler);

const PORT = process.env.PORT || 3777;

// 5. Orderly Startup Sequence
async function startServer() {
  try {
    // Verify database connection is alive before launching network interface
    const connection = await db.getConnection();
    console.log("🚀 Database connection successfully established.");
    connection.release();

    app.listen(PORT, () => {
      console.log(`📡 Server actively listening on port: ${PORT}`);
    });
  } catch (error) {
    console.error(
      "❌ Fatal: Failed to establish database connection during initialization:",
      error,
    );
    // Exit application loop since backend cannot perform functional logic without DB access
    process.exit(1);
  }
}

startServer();
