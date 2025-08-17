import { Router } from "express";
import { sequelize } from "../models";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    await sequelize.query("SELECT 1;");
    res.json({ ok: true, db: "up", ts: new Date().toISOString() });
  } catch (e: any) {
    res.status(500).json({ ok: false, db: "down", error: e?.message || "db error" });
  }
});

export default router;
