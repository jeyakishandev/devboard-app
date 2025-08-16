import { Router } from "express";
import { register, login } from "../controllers/auth.controller";

const router = Router();

// IMPORTANT : passer directement des fonctions, pas des tableaux,
// pas d'appel immédiat, pas d'undefined.
router.post("/register", register);
router.post("/login", login);

export default router;

