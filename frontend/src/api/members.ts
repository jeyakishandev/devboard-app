import { api } from "./client";

export type Member = {
  id: number;
  userId: number;
  projectId: number;
  role: "owner" | "collaborator";
  User?: { id: number; username: string; email: string };
};

export async function listMembers(projectId: number): Promise<Member[]> {
  const { data } = await api.get(`/api/projects/${projectId}/members`);
  return data.data;
}

export async function addMember(projectId: number, username: string, role: "collaborator" | "owner" = "collaborator") {
  const { data } = await api.post(`/api/projects/${projectId}/members`, { username, role });
  return data.data as Member;
}

export async function updateMemberRole(projectId: number, userId: number, role: "owner" | "collaborator") {
  const { data } = await api.patch(`/api/projects/${projectId}/members/${userId}`, { role });
  return data.data as Member;
}

export async function removeMember(projectId: number, userId: number) {
  await api.delete(`/api/projects/${projectId}/members/${userId}`);
}
