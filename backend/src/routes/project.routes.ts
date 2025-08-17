import { Router } from "express";
import { auth } from "../middleware/auth";
import * as ctrl from "../controllers/project.controller";
import { memberOnly, ownerOnly } from "../middleware/role";
import * as members from "../controllers/member.controller";

const r = Router();
r.use(auth(true));

// Projects
r.get("/", ctrl.listMyProjects);
r.post("/", ctrl.createProject);
r.get("/:id", ctrl.getProjectById);
r.patch("/:id", ctrl.updateProject);
r.delete("/:id", ctrl.deleteProject);

// Tasks
r.get("/:projectId/tasks", ctrl.listTasks);
r.post("/:projectId/tasks", ctrl.createTask);
r.get("/:projectId/tasks/:taskId", ctrl.getTaskById);
r.patch("/:projectId/tasks/:taskId", ctrl.updateTask);
r.delete("/:projectId/tasks/:taskId", ctrl.deleteTask);

// Membres d’un projet
r.get("/:id/members", memberOnly(), members.listMembers);
r.post("/:id/members", ownerOnly(), members.addMember);
r.patch("/:id/members/:userId", ownerOnly(), members.updateMember);
r.delete("/:id/members/:userId", ownerOnly(), members.removeMember);

export default r;
