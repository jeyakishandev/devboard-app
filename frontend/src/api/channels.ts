import { api } from "./client";

export type Channel = { id: number; projectId: number; name: string };

export async function getChannels(projectId: number): Promise<Channel[]> {
  const { data } = await api.get(`/api/projects/${projectId}/channels`);
  return data.data;
}

export async function createChannel(projectId: number, name: string): Promise<Channel> {
  const { data } = await api.post(`/api/projects/${projectId}/channels`, { name });
  return data.data;
}
