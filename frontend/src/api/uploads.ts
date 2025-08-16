import { api } from "./client";

export async function uploadFile(file: File) {
  const form = new FormData();
  form.append("file", file);
  try {
    const { data } = await api.post("/api/uploads", form); // ne pas forcer Content-Type
    return data.data as {
      url: string; relativeUrl: string; mimetype: string; size: number; filename: string
    };
  } catch (e: any) {
    // Propage le message serveur pour l’afficher dans l’UI
    const msg = e?.response?.data?.error || e?.message || "Upload error";
    throw new Error(msg);
  }
}

