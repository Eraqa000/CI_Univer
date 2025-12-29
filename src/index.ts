import "./env";

import express, { Request, Response } from "express";
import cors from "cors";

import authRoutes from "./routes/auth";
import meRoutes from "./routes/me";
import aiRoutes from "./routes/ai";

import adminRoutes from "./routes/adminRoutes"

const app = express();

// ✅ middleware
app.use(cors());
app.use(express.json());

// ✅ routes
app.use("/auth", authRoutes);
app.use("/me", meRoutes);
app.use("/ai", aiRoutes);
app.use("/admin", adminRoutes)

// ✅ healthcheck (очень важно для Render)
app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

// 🔑 ВАЖНО: PORT из env
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
