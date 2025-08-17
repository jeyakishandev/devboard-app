import { Router } from "express";
import jwt from "jsonwebtoken";

const router = Router();
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || "dev-key";
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || "dev-secret";

// Pour l’instant c’est un simple JWT, plus tard tu brancheras un vrai SFU
router.post("/token", (req, res) => {
  const user = (req as any).user; // injecté par ton middleware JWT
  const { projectId } = req.body || {};
  if (!user) return res.status(401).json({ error: "unauthorized" });
  if (!projectId) return res.status(400).json({ error: "projectId required" });

  const payload = { sub: String(user.id), name: user.username, projectId };
  const token = jwt.sign(payload, LIVEKIT_API_SECRET, {
    expiresIn: "15m",
    issuer: LIVEKIT_API_KEY,
  });
  return res.json({ token });
});

export default router;
