import { Router } from "express";
import authRoutes from "./auth.routes";
import projectRoutes from "./project.routes";

const router = Router();
router.use("/auth", authRoutes);
router.use("/api/projects", projectRoutes);
export default router;
