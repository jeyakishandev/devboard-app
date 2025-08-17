import { Router } from "express";
import { sequelize, User, Project, Member, Channel, Message } from "../models";
import { hashPassword } from "../lib/password";

const router = Router();

// route dispo UNIQUEMENT hors prod
router.post("/seed", async (_req, res) => {
  try {
    if (process.env.NODE_ENV === "production") {
      return res.status(403).json({ ok: false, error: "forbidden in production" });
    }

    // 1) Users
    const pass = "pass1234";
    const [u1] = await User.findOrCreate({
      where: { email: "demo@example.com" },
      defaults: {
        username: "demo",
        email: "demo@example.com",
        passwordHash: await hashPassword(pass),
      },
    });
    const [u2] = await User.findOrCreate({
      where: { email: "alice@example.com" },
      defaults: {
        username: "alice",
        email: "alice@example.com",
        passwordHash: await hashPassword(pass),
      },
    });

    // 2) Projet (owner = demo)
    const [p] = await Project.findOrCreate({
      where: { name: "Mon Projet" },
      defaults: {
        name: "Mon Projet",
        description: "Projet de démo",
        ownerId: u1.id,
      },
    });

    // 3) Membres (owner déjà géré par ownerId ; on ajoute alice en collaborator)
    await Member.findOrCreate({
      where: { userId: u2.id, projectId: p.id },
      defaults: { userId: u2.id, projectId: p.id, role: "collaborator" as any },
    });

    // 4) Canal par défaut
    const [general] = await Channel.findOrCreate({
      where: { projectId: p.id, name: "général" },
      defaults: { projectId: p.id, name: "général" },
    });

    // 5) Quelques messages
    await Message.findOrCreate({
      where: { projectId: p.id, userId: u1.id, body: "Bienvenue sur le projet !" },
      defaults: { projectId: p.id, userId: u1.id, body: "Bienvenue sur le projet !", channelId: general.id },
    });
    await Message.findOrCreate({
      where: { projectId: p.id, userId: u2.id, body: "Salut 👋" },
      defaults: { projectId: p.id, userId: u2.id, body: "Salut 👋", channelId: general.id },
    });

    return res.json({
      ok: true,
      users: [
        { email: "demo@example.com", password: pass },
        { email: "alice@example.com", password: pass },
      ],
      project: { id: p.id, name: p.name },
      channel: { id: general.id, name: general.name },
    });
  } catch (err: any) {
    console.error("[dev/seed] error:", err);
    return res.status(500).json({ ok: false, error: err?.message || "seed failed" });
  }
});

export default router;
