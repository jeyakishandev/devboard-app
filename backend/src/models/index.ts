// ⚠️ dotenv en tout premier
import 'dotenv/config';

import { sequelize } from '../config/database';
import { User } from './user.model';
import { Project } from './project.model';
import { Member } from './member.model';
import { Task } from './task.model';
import { Message } from './message.model';
import Channel from "./channel.model";

// Associations
User.hasMany(Project, { as: 'ownedProjects', foreignKey: 'ownerId' });
Project.belongsTo(User, { as: 'owner', foreignKey: 'ownerId' });

Member.belongsTo(User,    { foreignKey: "userId",    onDelete: "CASCADE", onUpdate: "CASCADE" });
Member.belongsTo(Project, { foreignKey: "projectId", onDelete: "CASCADE", onUpdate: "CASCADE" });
User.belongsToMany(Project,   { through: Member, foreignKey: "userId" });
Project.belongsToMany(User,   { through: Member, foreignKey: "projectId" });

Member.belongsTo(User, { foreignKey: 'userId' });
Member.belongsTo(Project, { foreignKey: 'projectId' });

Task.belongsTo(Project, { foreignKey: 'projectId' });
Task.belongsTo(User, { as: 'assignee', foreignKey: 'assignedToId' });
Task.belongsTo(User, { as: 'creator', foreignKey: 'createdById' });

Message.belongsTo(Project, { foreignKey: 'projectId' });
Message.belongsTo(User, { foreignKey: 'userId' });

Project.hasMany(Channel, { foreignKey: "projectId" });
Channel.belongsTo(Project, { foreignKey: "projectId" });

Message.belongsTo(Channel, { foreignKey: "channelId" });
Channel.hasMany(Message, { foreignKey: "channelId" });

export async function syncModels() {
  // en dev: alter true (simple pour un junior) ; en prod -> migrations
  await sequelize.sync({ alter: true });
}

export { sequelize, User, Project, Member, Task, Message, Channel };
