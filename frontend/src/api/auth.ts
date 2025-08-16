import { api } from "./client";

export async function login(email: string, password: string) {
  const { data } = await api.post("/auth/login", { email, password });
  return data.data as { token: string; user: { id: number; username: string; email: string } };
}

export async function register(username: string, email: string, password: string) {
  const { data } = await api.post("/auth/register", { username, email, password });
  return data.data as { token: string; user: { id: number; username: string; email: string } };
}
