import { api } from "./client"

type User = { id: number; username: string; email: string };
type ApiEnvelope<T> = { success: boolean; data?: T; error?: string };

export async function login(email: string, password: string) {
  const res = await api.post<ApiEnvelope<{ token: string; user: User }>>(
    "/auth/login",
    { email, password }
  );

  if (!res.data?.success || !res.data.data) {
    throw new Error(res.data?.error || "Login failed");
  }
  return res.data.data; // { token, user }
}

export async function register(username: string, email: string, password: string) {
  const res = await api.post<ApiEnvelope<{ token: string; user: User }>>(
    "/auth/register",
    { username, email, password }
  );

  if (!res.data?.success || !res.data.data) {
    throw new Error(res.data?.error || "Register failed");
  }
  return res.data.data;
}
