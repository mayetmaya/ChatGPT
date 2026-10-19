// Match the frontend's production, preview, local, or explicitly configured origin.
export function isAllowedFrontendOrigin(origin) {
  const allowedOrigins = new Set([
    "https://generative-ai-ten.vercel.app",
    "http://localhost:5173",
  ]);
  if (process.env.FRONTEND_ORIGIN) {
    allowedOrigins.add(process.env.FRONTEND_ORIGIN.replace(/\/$/, ""));
  }

  if (allowedOrigins.has(origin)) return true;

  try {
    const parsedOrigin = new URL(origin);
    return (
      parsedOrigin.protocol === "https:" &&
      parsedOrigin.origin === origin &&
      parsedOrigin.hostname.endsWith(".vercel.app")
    );
  } catch {
    return false;
  }
}

// Reject state-changing requests from origins outside the configured frontend.
export default function requireFrontendOrigin(req, res, next) {
  const origin = req.get("Origin");

  if (origin && !isAllowedFrontendOrigin(origin)) {
    return res.status(403).json({
      success: false,
      message: "Request origin is not allowed.",
    });
  }

  return next();
}
