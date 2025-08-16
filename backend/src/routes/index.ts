import { Router } from "express";
import authRoutes from "./auth.routes";

const router = Router();

router.use("/auth", authRoutes);
// (les autres routes arriveront aux étapes suivantes)

export default router;
