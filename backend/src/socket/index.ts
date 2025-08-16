import { Server } from "socket.io";
import { socketAuth } from "./auth";
import { Member, Message, Project, User } from "../models";

const room = (projectId: number) => `project:${projectId}`;

async function canAccess(userId: number, projectId: number) {
  const p = await Project.findByPk(projectId);
  if (!p) return false;
  if (p.ownerId === userId) return true;
  const m = await Member.findOne({ where: { userId, projectId } });
  return Boolean(m);
}

export function registerSockets(io: Server) {
  io.use(socketAuth);

  io.on("connection", (socket) => {
    const user = (socket.data as any).user;

    // --- JOIN ---
   // --- JOIN ---
socket.on(
  "join_project",
  async (payload: { projectId: number }, ack?: (res: any) => void) => {
    const projectId = Number(payload?.projectId);
    if (!projectId) return ack?.({ ok: false, error: "projectId required" });

    const allowed = await canAccess(user.id, projectId);
    if (!allowed) return ack?.({ ok: false, error: "forbidden" });

    socket.join(room(projectId));

    const history = await Message.findAll({
      where: { projectId },
      order: [["createdAt", "DESC"]],
      limit: 30,
      include: [{ model: User, attributes: ["id", "username"] }],
    });

    // ✅ on déclare d'abord `items`, puis on le remplit via .map (pas de push)
    const items = history.reverse().map((m: any) => {
      const rawCreated = typeof m.get === "function" ? m.get("createdAt") : m.createdAt;
      const iso =
        rawCreated instanceof Date
          ? rawCreated.toISOString()
          : new Date(rawCreated ?? Date.now()).toISOString();

      const text =
        (typeof m.get === "function" ? m.get("content") ?? m.get("body") : null) ??
        m.content ??
        m.body ??
        "";

      const attachmentUrl =
        (typeof m.get === "function" ? m.get("attachmentUrl") : (m as any).attachmentUrl) ?? null;

      const attachmentMime =
        (typeof m.get === "function" ? m.get("attachmentMime") : (m as any).attachmentMime) ?? null;

      return {
        id: m.id,
        content: text,
        userId: m.userId,
        username: m.User?.username,
        createdAt: iso,
        attachmentUrl,
        attachmentMime,
      };
    });

    ack?.({ ok: true, history: items });
  }
);


    // --- SEND MESSAGE ---
    socket.on(
  "message:send",
  async (
    payload: { projectId: number; content?: string; attachmentUrl?: string; attachmentMime?: string },
    ack?: (res: any) => void
  ) => {
    const projectId = Number(payload?.projectId);
    const content = (payload?.content || "").trim();
    const hasAttachment = Boolean(payload?.attachmentUrl);
    if (!projectId || (!content && !hasAttachment)) return ack?.({ ok: false, error: "invalid payload" });

    const allowed = await canAccess(user.id, projectId);
    if (!allowed) return ack?.({ ok: false, error: "forbidden" });

    const msg = await Message.create(
      {
        projectId,
        userId: user.id,
        body: content || null,
        content: content || null,
        attachmentUrl: payload?.attachmentUrl || null,
        attachmentMime: payload?.attachmentMime || null,
      } as any
    );

    const created =
      (msg as any).createdAt instanceof Date ? (msg as any).createdAt.toISOString() : new Date().toISOString();

    const text =
      (typeof (msg as any).get === "function" ? (msg as any).get("content") ?? (msg as any).get("body") : null) ??
      (msg as any).content ??
      (msg as any).body ??
      "";

    const dto = {
      id: msg.id,
      content: text,
      userId: user.id,
      username: user.email?.split("@")[0],
      createdAt: created,
      attachmentUrl: (msg as any).attachmentUrl || null,
      attachmentMime: (msg as any).attachmentMime || null,
    };

    io.to(room(projectId)).emit("message:new", dto);
    ack?.({ ok: true, data: dto });
  }
);


  });
}
