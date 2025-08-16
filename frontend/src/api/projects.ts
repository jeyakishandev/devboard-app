import { api } from "./client";

export type Project = {
  id: number;
  name: string;
  description?: string | null;
  status: "active" | "archived";
  visibility: "private" | "team";
  ownerId: number;
  createdAt: string;
};

export async function getMyProjects(): Promise<Project[]> {
  const { data } = await api.get("/api/projects");
  return data.data;
}

export async function createProject(payload: { name: string; description?: string; visibility?: "private"|"team" }) {
  const { data } = await api.post("/api/projects", payload);
  return data.data as Project;
}
