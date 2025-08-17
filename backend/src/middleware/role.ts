import { NextFunction, Response } from "express";
import { AuthRequest } from "./auth";
import { Member, Project } from "../models";

export function memberOnly() {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const projectId = Number(req.params.id || req.params.projectId);
    const p = await Project.findByPk(projectId);
    if (!p) return res.status(404).json({ success: false, error: "Project not found" });
    if (p.ownerId === userId) return next();
    const m = await Member.findOne({ where: { userId, projectId } });
    if (!m) return res.status(403).json({ success: false, error: "Forbidden" });
    next();
  };
}

export function ownerOnly() {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const projectId = Number(req.params.id || req.params.projectId);
    const p = await Project.findByPk(projectId);
    if (!p) return res.status(404).json({ success: false, error: "Project not found" });
    if (p.ownerId !== userId) return res.status(403).json({ success: false, error: "Owner only" });
    next();
  };
}

