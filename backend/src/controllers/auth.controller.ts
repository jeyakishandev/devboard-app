import { Request, Response } from "express";
import { hashPassword, verifyPassword } from "../lib/password";

import jwt from "jsonwebtoken";
import { User } from "../models";

const JWT_SECRET = process.env.JWT_SECRET || "devboard-secret";
const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

// POST /auth/register
export async function register(req: Request, res: Response) {
  try {
    const { username, email, password } = req.body || {};
    if (!username || !email || !password)
      return res.status(400).json({ success: false, error: "username, email, password requis" });
    if (!isEmail(email))
      return res.status(400).json({ success: false, error: "email invalide" });

    const exists = await User.findOne({ where: { email } });
    if (exists) return res.status(409).json({ success: false, error: "Email déjà utilisé" });

    const passwordHash = await hashPassword(password);

    // cast pour satisfaire les types stricts si 'id' est requis dans ton modèle
    const user = await User.create({ username, email, passwordHash } as any);

    const token = (jwt as any).sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      success: true,
      data: { token, user: { id: user.id, username: user.username, email: user.email } },
    });
  } catch (e) {
    console.error("[register] error:", e);
    return res.status(500).json({ success: false, error: "Erreur interne (register)" });
  }
}

// POST /auth/login
export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ success: false, error: "email et password requis" });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ success: false, error: "Identifiants invalides" });
    }

    // Supporte passwordHash OU password_hash (selon ton modèle)
    const hash: string | undefined =
      (user as any).passwordHash ?? (user as any).password_hash;

    if (!hash || typeof hash !== "string") {
      console.warn("[login] missing password hash", { userId: user.id, email: user.email });
      return res.status(401).json({ success: false, error: "Identifiants invalides" });
    }

    const ok = await verifyPassword(password, user.passwordHash);
if (!ok) return res.status(401).json({ success: false, error: "Identifiants invalides" });


    const token = (jwt as any).sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      success: true,
      data: { token, user: { id: user.id, username: user.username, email: user.email } },
    });
  } catch (e) {
    console.error("[login] error:", e);
    return res.status(500).json({ success: false, error: "ERR_LOGIN" });
  }
}

