import express from "express";
import cors from "cors";
import routes from "./routes";
import path from "path";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ success: true, data: { status: "ok" } });
});

// IMPORTANT: monter les routes ici
app.use("/", routes);
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

export default app;
