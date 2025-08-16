import { sequelize } from "../config/database";
import { User } from "./user.model";
import { Project } from "./project.model";
import { Member } from "./member.model";
import { Task } from "./task.model";
import { Message } from "./message.model";

User.hasMany(Project, { as: "ownedProjects", foreignKey: "ownerId" });
Project.belongsTo(User, { as: "owner", foreignKey: "ownerId" });

User.belongsToMany(Project, { through: Member, foreignKey: "userId" });
Project.belongsToMany(User, { through: Member, foreignKey: "projectId" });
Member.belongsTo(User, { foreignKey: "userId" });
Member.belongsTo(Project, { foreignKey: "projectId" });

Task.belongsTo(Project, { foreignKey: "projectId" });
Task.belongsTo(User, { as: "assignee", foreignKey: "assignedToId" });
Task.belongsTo(User, { as: "creator", foreignKey: "createdById" });

Message.belongsTo(Project, { foreignKey: "projectId" });
Message.belongsTo(User, { foreignKey: "userId" });

export async function syncModels() {
  await sequelize.sync({ alter: true }); // junior-friendly (pour dev). En prod -> migrations.
}

export { sequelize, User, Project, Member, Task, Message };
