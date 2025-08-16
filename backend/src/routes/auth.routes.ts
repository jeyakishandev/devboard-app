import { Router } from "express";
import { register, registerValidators, login, loginValidators } from "../controllers/auth.controller";

const router = Router();

router.post("/register", registerValidators, register);
router.post("/login", loginValidators, login);

export default router;
