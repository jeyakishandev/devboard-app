import { useEffect, useRef, useState } from "react";
import { connectSocket } from "../lib/socket";
import Spinner from "./Spinner";
import Banner from "./Banner";
import { uploadFile } from "../api/uploads";

type Msg = {
  id: number;
  content: string;
  userId: number;
  username?: string;
  createdAt: string;
  attachmentUrl?: string | null;
  attachmentMime?: string | null;
};

export default function ProjectChat({
  projectId,
  token,
  channelId, // <- optionnel (null => général)
}: { projectId: number; token: string; channelId?: number | null }) {
  const [socket, setSocket] = useState<ReturnType<typeof connectSocket> | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [sending, setSending] = useState(false);

  // déduplication persistante
  const seenRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    const s = connectSocket(token);
    setSocket(s);

    // rejoindre le chat (salon si channelId fourni, sinon #general)
    s.emit("join_project", { projectId, channelId: channelId ?? null }, (res: any) => {
      if (!res?.ok) return setErr(res?.error || "join failed");
      setMessages(res.history || []);
      seenRef.current = new Set((res.history || []).map((m: Msg) => m.id));
    });

    const onNew = (m: Msg) => {
      if (seenRef.current.has(m.id)) return;
      seenRef.current.add(m.id);
      setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
    };

    s.off("message:new");
    s.on("message:new", onNew);

    s.off("task:created");
    s.on("task:created", (e: any) => {
      const syntheticId = Date.now() + Math.floor(Math.random() * 1000);
      setMessages((prev) => [
        ...prev,
        { id: syntheticId, content: `🔔 Tâche créée: ${e.title}`, userId: 0, createdAt: new Date().toISOString() },
      ]);
    });

    s.off("member:added");
    s.on("member:added", (e: any) => {
      const syntheticId = Date.now() + Math.floor(Math.random() * 1000);
      setMessages((prev) => [
        ...prev,
        { id: syntheticId, content: `👥 Nouveau membre: ${e.username}`, userId: 0, createdAt: new Date().toISOString() },
      ]);
    });

    return () => {
      s.off("message:new", onNew);
      s.off("task:created");
      s.off("member:added");
      s.disconnect();
    };
  }, [projectId, token, channelId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = () => {
    const text = input.trim();
    if (!text || !socket) return;
    socket.emit(
      "message:send",
      { projectId, channelId: channelId ?? null, content: text },
      (ack: any) => {
        if (!ack?.ok) return setErr(ack?.error || "send failed");
        // on laisse "message:new" faire l’ajout
        setInput("");
      }
    );
  };

  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !socket) return;
    try {
      setSending(true);
      const up = await uploadFile(file);
      socket.emit(
        "message:send",
        {
          projectId,
          channelId: channelId ?? null,
          attachmentUrl: up.url,
          attachmentMime: up.mimetype,
        },
        (ack: any) => {
          if (!ack?.ok) return setErr(ack?.error || "send failed");
          // pas de setMessages ici non plus
        }
      );
    } catch (err: any) {
      setErr(err?.message || "Upload impossible");
    } finally {
      setSending(false);
      e.target.value = "";
    }
  };

  return (
    <div className="card">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-semibold">Chat du projet{channelId ? ` — salon #${channelId}` : " — #general"}</h3>
        {!socket && <Spinner />}
      </div>
      {err && (
        <div className="mb-2">
          <Banner kind="error">{err}</Banner>
        </div>
      )}
      <div className="h-64 overflow-y-auto rounded border bg-white p-3">
        {messages.map((m) => (
          <div key={m.id} className="mb-3 text-sm">
            <div>
              <span className="font-medium">{m.username ?? "system"}</span>
              <span className="mx-1 text-gray-400">·</span>
              <span className="text-gray-500">{new Date(m.createdAt).toLocaleTimeString()}</span>
            </div>
            {m.content && <div>{m.content}</div>}
            {m.attachmentUrl &&
              (/^image\//.test(m.attachmentMime || "") ? (
                <img src={m.attachmentUrl} alt="attachment" className="mt-2 max-h-48 rounded border" />
              ) : (
                <a
                  className="mt-2 inline-block text-blue-600 underline"
                  href={m.attachmentUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  📎 Télécharger la pièce jointe
                </a>
              ))}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="mt-2 flex gap-2">
        <input
          className="input flex-1"
          placeholder="Écrire un message…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => (e.key === "Enter" ? send() : undefined)}
        />
        <label className="btn" title="Envoyer un fichier">
          {sending ? "..." : "📎"}
          <input type="file" className="hidden" accept="image/*,.pdf,.txt" onChange={onPickFile} />
        </label>
        <button className="btn-primary" onClick={send}>Envoyer</button>
      </div>
    </div>
  );
}
