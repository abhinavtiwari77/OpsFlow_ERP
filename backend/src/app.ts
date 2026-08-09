import express from "express";
import cors from "cors";
import morgan from "morgan";
import authRoutes from "./routes/auth.routes";
import customerRoutes from "./routes/customer.routes";
import productRoutes from "./routes/product.routes";
import challanRoutes from "./routes/challan.routes";
import statsRoutes from "./routes/stats.routes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

export const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN || "*").split(",").map((o) => o.trim());

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());
app.use(morgan("dev"));

import { prisma } from "./lib/prisma";

app.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", database: "connected", time: new Date().toISOString() });
  } catch (error) {
    res.status(503).json({ status: "error", database: "disconnected", time: new Date().toISOString() });
  }
});

app.use("/auth", authRoutes);
app.use("/customers", customerRoutes);
app.use("/products", productRoutes);
app.use("/challans", challanRoutes);
app.use("/stats", statsRoutes);

app.use(notFoundHandler);
app.use(errorHandler);
