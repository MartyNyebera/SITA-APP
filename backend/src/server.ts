import "dotenv/config";
import express from "express";
import http from "http";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";

import authRouter from "./routes/auth";
import usersRouter from "./routes/users";
import driversRouter from "./routes/drivers";
import ridesRouter from "./routes/rides";
import adminRouter from "./routes/admin";
import { initSocketServer } from "./socket/trackingServer";

const app = express();
const httpServer = http.createServer(app);

// ─── Security middleware ──────────────────────────────────────
app.use(helmet());

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:5173"];
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

// ─── Rate limiting ────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, message: "Too many requests, please try again later." },
});
app.use("/api", limiter);

// ─── Body parsing ─────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ─── Static uploads ──────────────────────────────────────────
const uploadDir = process.env.UPLOAD_DIR || "uploads";
app.use("/uploads", express.static(path.resolve(uploadDir)));

// ─── Health check ─────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ success: true, message: "SITA Backend is running", timestamp: new Date().toISOString() });
});

// ─── API Routes ───────────────────────────────────────────────
app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/drivers", driversRouter);
app.use("/api/rides", ridesRouter);
app.use("/api/admin", adminRouter);

// ─── 404 handler ─────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// ─── Global error handler ─────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("[Server Error]", err.message);
  res.status(500).json({ success: false, message: "Internal server error" });
});

// ─── Socket.IO ────────────────────────────────────────────────
initSocketServer(httpServer);

// ─── Start server ─────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || "3000");
httpServer.listen(PORT, "127.0.0.1", () => {
  console.log(`\n🛺 SITA Backend running on http://127.0.0.1:${PORT}`);
  console.log(`📡 Socket.IO ready on ws://127.0.0.1:${PORT}`);
  console.log(`🏥 Health: http://127.0.0.1:${PORT}/health\n`);
});

export default app;
