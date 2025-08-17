import { Router } from "express";
import { Channel } from "../models";
import { auth } from "../middleware/auth";
import { memberOnly, ownerOnly } from "../middleware/role";

const router = Router({ mergeParams: true });

// GET /api/projects/:projectId/channels  -> membres + owner
router.get("/", auth(true), memberOnly(), async (req, res) => {
  const projectId = Number(req.params.projectId);
  const list = await Channel.findAll({
    where: { projectId },
    attributes: ["id", "name", "projectId"],
    order: [["name", "ASC"]],
  });
  res.json({ success: true, data: list });
});

// POST /api/projects/:projectId/channels -> OWNER ONLY
router.post("/", auth(true), ownerOnly(), async (req, res) => {
  const projectId = Number(req.params.projectId);
  const name = String(req.body?.name || "").trim().slice(0, 50);
  if (!name) return res.status(400).json({ success: false, error: "Nom requis" });

  const ch = await Channel.create({ projectId, name } as any);
  res.status(201).json({ success: true, data: ch });
});

export default router;
