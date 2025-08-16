import { api } from "./client";

export type Task = {
  id: number;
  title: string;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high";
  descriptionMd?: string | null;
  createdAt: string;
};

export async function getTasks(projectId: number): Promise<Task[]> {
  const { data } = await api.get(`/api/projects/${projectId}/tasks`);
  return data.data;
}

export async function createTask(projectId: number, payload: Partial<Task>) {
  const { data } = await api.post(`/api/projects/${projectId}/tasks`, payload);
  return data.data as Task;
}
