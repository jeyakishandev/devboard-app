import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth";
import { Member, Project } from "../models";

export function requireOwner() {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    const projectId = Number(req.params.id || req.params.projectId);
    if (!userId || !projectId) return res.status(400).json({ success: false, error: "Bad request" });

    const project = await Project.findByPk(projectId);
    if (!project) return res.status(404).json({ success: false, error: "Project not found" });

    if (project.ownerId === userId) return next();

    return res.status(403).json({ success: false, error: "Owner role required" });
  };
}

export function requireProjectMember() {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    const projectId = Number(req.params.id || req.params.projectId);
    if (!userId || !projectId) return res.status(400).json({ success: false, error: "Bad request" });

    const member = await Member.findOne({ where: { userId, projectId } });
    // Owner has access even sans ligne Member
    const project = await Project.findByPk(projectId);
    if (project && project.ownerId === userId) return next();
    if (!member) return res.status(403).json({ success: false, error: "Project membership required" });

    return next();
  };
}
