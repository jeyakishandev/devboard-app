import express from "express";          // ← assure-toi que c’est bien importé
import cors from "cors";                // ← idem
import routes from "./routes";
import path from "path";
import { corsLite, helmetLite, rateLimitLite } from "../src/middleware/security-lite";

const app = express();

// --- Healthchecks (avant le reste pour éviter tout effet de middleware) ---
app.get("/healthz", (_req, res) => {
  // si tu veux pinger Sequelize, remplace par un try { await sequelize.authenticate() } catch {}
  res.status(200).json({ status: "ok" });
});
app.get("/health", (_req, res) => {
  res.json({ success: true, data: { status: "ok" } });
});

// CORS : origine autorisée depuis l'env (fallback http://localhost:5173)
const ORIGINS = (process.env.FRONTEND_ORIGIN ?? "http://localhost:5173")
  .split(",")
  .map(s => s.trim());

app.use(cors({ origin: (origin, cb) => {
  if (!origin) return cb(null, true);         // curl / tests locales
  cb(null, ORIGINS.includes(origin));
}, credentials: true }));

app.use(helmetLite());

// Rate limit seulement sur /auth/*
app.use("/auth", rateLimitLite({ windowMs: 15 * 60 * 1000, max: 100 }));

// parsers (évite les doublons)
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
// Si tu utilises corsLite, tu peux retirer ce cors() global pour éviter double headers
// app.use(cors());

// IMPORTANT: monter les routes ici
app.use("/", routes);
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// --- Mini docs JSON (sans swagger) ---
app.get("/api/docs.json", (_req, res) => {
  res.json({
    name: "DevBoard API (lite docs)",
    auth: {
      register: { method: "POST", path: "/auth/register", body: ["username","email","password"] },
      login:    { method: "POST", path: "/auth/login",    body: ["email","password"] },
    },
    projects: {
      list:     { method: "GET",    path: "/api/projects" },
      create:   { method: "POST",   path: "/api/projects", body: ["name","description?","visibility?"] },
      get:      { method: "GET",    path: "/api/projects/:id" },
      update:   { method: "PUT",    path: "/api/projects/:id" },
      delete:   { method: "DELETE", path: "/api/projects/:id" },
    },
    tasks: {
      list:     { method: "GET",  path: "/api/tasks?projectId=:id" },
      create:   { method: "POST", path: "/api/projects/:id/tasks", body: ["title","descriptionMd?"] },
      update:   { method: "PUT",  path: "/api/tasks/:taskId" },
      delete:   { method: "DELETE", path: "/api/tasks/:taskId" },
    },
    members: {
      list:   { method: "GET",  path: "/api/projects/:id/members" },
      add:    { method: "POST", path: "/api/projects/:id/members", body: ["username","role"] },
      update: { method: "PUT",  path: "/api/projects/:id/members/:memberId", body: ["role"] },
      remove: { method: "DELETE", path: "/api/projects/:id/members/:memberId" },
    },
    channels: {
      list:   { method: "GET",  path: "/api/projects/:id/channels" },
      create: { method: "POST", path: "/api/projects/:id/channels", body: ["name (owner-only)"] },
    },
    chat_socketio: {
      join:  { event: "join_project", payload: "{ projectId, channelId? }" },
      send:  { event: "message:send", payload: "{ projectId, channelId?, content?|attachmentUrl? }" },
      other: ["task:created", "member:added", "call:* (webrtc)"],
    },
    uploads: {
      post: { method: "POST", path: "/api/uploads", body: ["file"] }
    }
  });
});

export default app;
