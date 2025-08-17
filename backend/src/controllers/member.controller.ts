import { Request, Response } from "express";
import { Member, Project, User } from "../models";

// GET /api/projects/:id/members
export async function listMembers(req: Request, res: Response) {
  const projectId = Number(req.params.id);
  const members = await Member.findAll({ where: { projectId }, include: [{ model: User, attributes: ["id","username","email"] }] });
  res.json({ success: true, data: members });
}

// POST /api/projects/:id/members  { username, role? }
export async function addMember(req: Request, res: Response) {
  const projectId = Number(req.params.id);
  const { username, role = "collaborator" } = req.body || {};
  if (!username) return res.status(400).json({ success: false, error: "username required" });

  const user = await User.findOne({ where: { username } });
  if (!user) return res.status(404).json({ success: false, error: "User not found" });

  const existing = await Member.findOne({ where: { userId: user.id, projectId } });
  if (existing) return res.status(409).json({ success: false, error: "Already a member" });

  const m = await Member.create({
  userId: user.id,
  projectId,
  role: (role as "owner" | "collaborator") ?? "collaborator",
} as any);
const io = req.app.get("io");
if (io) (io as any).to(`project:${projectId}`).emit("member:added", { projectId, userId: user.id, username: user.username });
  res.status(201).json({ success: true, data: m });
}

// PATCH /api/projects/:id/members/:userId  { role }
export async function updateMember(req: Request, res: Response) {
  const projectId = Number(req.params.id);
  const userId = Number(req.params.userId);
  const { role } = req.body || {};
  const m = await Member.findOne({ where: { projectId, userId } });
  if (!m) return res.status(404).json({ success: false, error: "Member not found" });
  if (role) m.role = role;
  await m.save();
  res.json({ success: true, data: m });
}

// DELETE /api/projects/:id/members/:userId
export async function removeMember(req: Request, res: Response) {
  const projectId = Number(req.params.id);
  const userId = Number(req.params.userId);
  const m = await Member.findOne({ where: { projectId, userId } });
  if (!m) return res.status(404).json({ success: false, error: "Member not found" });
  await m.destroy();
  res.status(204).send();
}
