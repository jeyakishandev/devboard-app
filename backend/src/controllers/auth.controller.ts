import { Request, Response } from "express";
import { User } from "../models";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import { body, validationResult } from "express-validator";

export const registerValidators = [
  body("username").isString().isLength({ min: 3, max: 50 }),
  body("email").isEmail(),
  body("password").isLength({ min: 6 }),
];

export async function register(req: Request, res: Response) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, error: errors.array() });

  const { username, email, password } = req.body;
  const exists = await User.findOne({ where: { email } });
  if (exists) return res.status(409).json({ success: false, error: "Email already used" });

  const passwordHash = await argon2.hash(password);
  const user = await User.create({ username, email, passwordHash });

  const token = jwt.sign(
    { id: user.id, email: user.email, username: user.username },
    process.env.JWT_SECRET as string,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
  );
  return res.json({ success: true, data: { token, user: { id: user.id, username, email } } });
}

export const loginValidators = [body("email").isEmail(), body("password").isLength({ min: 6 })];

export async function login(req: Request, res: Response) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, error: errors.array() });

  const { email, password } = req.body;
  const user = await User.findOne({ where: { email } });
  if (!user) return res.status(401).json({ success: false, error: "Invalid credentials" });

  const ok = await argon2.verify(user.passwordHash, password);
  if (!ok) return res.status(401).json({ success: false, error: "Invalid credentials" });

  const token = jwt.sign(
    { id: user.id, email: user.email, username: user.username },
    process.env.JWT_SECRET as string,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
  );
  return res.json({
    success: true,
    data: { token, user: { id: user.id, username: user.username, email: user.email } },
  });
}
