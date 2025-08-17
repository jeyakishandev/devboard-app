import "dotenv/config";
import { sequelize, User, Project } from "../models";
import { hashPassword } from "../lib/password";

async function run() {
  // L’API crée/altère déjà le schéma. Ici on évite de resync pour ne pas provoquer d’ALTER foireux.
  await sequelize.authenticate();

  // User 1
  const pass1 = await hashPassword("secret123");
  const [u1] = await User.findOrCreate({
    where: { email: "demo@devboard.local" },
    defaults: {
      username: "demo",
      email: "demo@devboard.local",
      passwordHash: pass1,
    } as any, // cast simple pour éviter les blagues de typings Sequelize
  });

  // User 2
  const pass2 = await hashPassword("secret123");
  const [u2] = await User.findOrCreate({
    where: { email: "alice@devboard.local" },
    defaults: {
      username: "alice",
      email: "alice@devboard.local",
      passwordHash: pass2,
    } as any,
  });

  // Projet de test
  await Project.findOrCreate({
    where: { name: "DevBoard" },
    defaults: {
      name: "DevBoard",
      description: "Projet de test",
      ownerId: u1.id,
    } as any,
  });

  console.log("✅ Seed OK");
  await sequelize.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
