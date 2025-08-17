import { Router } from "express";
import authRoutes from "./auth.routes";
import projectRoutes from "./project.routes";
import uploadRoutes from "./upload.routes";
import channelRoutes from "./channel.routes";
import healthRoutes from "./health.routes";     
import devRoutes from "./dev.routes"; 
import rtcRoutes from "./rtc";
const router = Router();

router.use("/auth", authRoutes);
router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/api/projects", projectRoutes);
router.use("/api/uploads", uploadRoutes);
router.use("/api/projects/:projectId/channels", channelRoutes);
router.use("/rtc", rtcRoutes);

if (process.env.NODE_ENV !== "production") {
  router.use("/dev", devRoutes);  // <— uniquement en dev
}
export default router;
