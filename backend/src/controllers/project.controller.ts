import { Response } from "express";
import { Op } from "sequelize";
import { AuthRequest } from "../middleware/auth";
import { Member, Project, Task, User } from "../models";

// =============== Projects ===============
export async function listMyProjects(req: AuthRequest, res: Response) {
  const userId = req.user!.id;

  const owned = await Project.findAll({
    where: { ownerId: userId },
    order: [["createdAt", "DESC"]],
  });

  const memberOf = await Project.findAll({
    include: [{
    model: User,
    through: { attributes: [] },
    where: { id: userId },
    required: true,
  }],
    order: [["createdAt", "DESC"]],
  });

  const map = new Map<number, Project>();
  [...owned, ...memberOf].forEach((p) => map.set(p.id, p));
  res.json({ success: true, data: Array.from(map.values()) });
}

export async function createProject(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const { name, description, visibility = "team" } = req.body;
    if (!name) return res.status(400).json({ success: false, error: "name is required" });

    const project = await Project.create({
  name,
  description,
  visibility,
  ownerId: userId,
  status: "active",
} as any);
    return res.status(201).json({ success: true, data: project });
  } catch (e) {
    console.error("[createProject] error:", e);
    return res.status(500).json({ success: false, error: "internal error" });
  }
}

export async function getProjectById(req: AuthRequest, res: Response) {
  const userId = req.user!.id;
  const id = Number(req.params.id);
  const project = await Project.findByPk(id);
  if (!project) return res.status(404).json({ success: false, error: "Project not found" });

  const isOwner = project.ownerId === userId;
  const isMember = await Member.findOne({ where: { userId, projectId: id } });
  if (!isOwner && !isMember) return res.status(403).json({ success: false, error: "Forbidden" });

  res.json({ success: true, data: project });
}

export async function updateProject(req: AuthRequest, res: Response) {
  const userId = req.user!.id;
  const id = Number(req.params.id);
  const project = await Project.findByPk(id);
  if (!project) return res.status(404).json({ success: false, error: "Project not found" });
  if (project.ownerId !== userId) return res.status(403).json({ success: false, error: "Owner only" });

  const allowed = ["name", "description", "status", "visibility"] as const;
  allowed.forEach((k) => {
    if (req.body[k] !== undefined) (project as any)[k] = req.body[k];
  });
  await project.save();
  res.json({ success: true, data: project });
}

export async function deleteProject(req: AuthRequest, res: Response) {
  const userId = req.user!.id;
  const id = Number(req.params.id);
  const project = await Project.findByPk(id);
  if (!project) return res.status(404).json({ success: false, error: "Project not found" });
  if (project.ownerId !== userId) return res.status(403).json({ success: false, error: "Owner only" });

  await project.destroy();
  res.status(204).send();
}

// =============== Tasks ===============
async function ensureAccess(userId: number, projectId: number) {
  const p = await Project.findByPk(projectId);
  if (!p) return { project: null as Project | null, allowed: false };
  if (p.ownerId === userId) return { project: p, allowed: true };
  const m = await Member.findOne({ where: { userId, projectId } });
  return { project: p, allowed: Boolean(m) };
}

export async function listTasks(req: AuthRequest, res: Response) {
  const userId = req.user!.id;
  const projectId = Number(req.params.projectId);
  const { allowed } = await ensureAccess(userId, projectId);
  if (!allowed) return res.status(403).json({ success: false, error: "Forbidden" });

  const where: any = { projectId };
  const { status, assignee, q } = req.query;
  if (status) where.status = status;
  if (assignee) where.assignedToId = Number(assignee);
  if (q) where.title = { [Op.iLike]: `%${q}%` };

  const tasks = await Task.findAll({ where, order: [["createdAt", "DESC"]] });
  res.json({ success: true, data: tasks });
}

export async function createTask(req: AuthRequest, res: Response) {
  const userId = req.user!.id;
  const projectId = Number(req.params.projectId);
  const { allowed } = await ensureAccess(userId, projectId);
  if (!allowed) return res.status(403).json({ success: false, error: "Forbidden" });

  const { title, descriptionMd, status = "todo", priority = "medium", dueDate, assignedToId } = req.body;
  if (!title) return res.status(400).json({ success: false, error: "title is required" });

  const t = await Task.create({
  projectId,
  title,
  descriptionMd: descriptionMd ?? null,
  status,
  priority,
  dueDate: dueDate ? new Date(dueDate) : null,
  assignedToId: assignedToId ?? null,
  createdById: userId,
} as any);
const io = req.app.get("io");
if (io) (io as any).to(`project:${projectId}`).emit("task:created", { projectId, taskId: t.id, title: t.title });

  res.status(201).json({ success: true, data: t });
}

export async function getTaskById(req: AuthRequest, res: Response) {
  const userId = req.user!.id;
  const projectId = Number(req.params.projectId);
  const taskId = Number(req.params.taskId);
  const { allowed } = await ensureAccess(userId, projectId);
  if (!allowed) return res.status(403).json({ success: false, error: "Forbidden" });

  const t = await Task.findOne({ where: { id: taskId, projectId } });
  if (!t) return res.status(404).json({ success: false, error: "Task not found" });
  res.json({ success: true, data: t });
}

export async function updateTask(req: AuthRequest, res: Response) {
  const userId = req.user!.id;
  const projectId = Number(req.params.projectId);
  const taskId = Number(req.params.taskId);
  const { allowed } = await ensureAccess(userId, projectId);
  if (!allowed) return res.status(403).json({ success: false, error: "Forbidden" });

  const t = await Task.findOne({ where: { id: taskId, projectId } });
  if (!t) return res.status(404).json({ success: false, error: "Task not found" });

  const fields = ["title", "descriptionMd", "status", "priority", "dueDate", "assignedToId"] as const;
  fields.forEach((k) => {
    if (req.body[k] !== undefined) {
      (t as any)[k] = k === "dueDate" && req.body[k] ? new Date(req.body[k]) : req.body[k];
    }
  });
  await t.save();
  res.json({ success: true, data: t });
}

export async function deleteTask(req: AuthRequest, res: Response) {
  const userId = req.user!.id;
  const projectId = Number(req.params.projectId);
  const taskId = Number(req.params.taskId);
  const { allowed } = await ensureAccess(userId, projectId);
  if (!allowed) return res.status(403).json({ success: false, error: "Forbidden" });

  const t = await Task.findOne({ where: { id: taskId, projectId } });
  if (!t) return res.status(404).json({ success: false, error: "Task not found" });

  await t.destroy();
  res.status(204).send();
}