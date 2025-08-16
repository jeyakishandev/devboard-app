import { Router } from "express";
import authRoutes from "./auth.routes";
import projectRoutes from "./project.routes";
import uploadRoutes from "./upload.routes";
const router = Router();
router.use("/auth", authRoutes);
router.use("/api/projects", projectRoutes);
router.use("/api/uploads", uploadRoutes);
export default router;
