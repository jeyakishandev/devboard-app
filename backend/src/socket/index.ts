import { Server } from "socket.io";
import { socketAuth } from "./auth";
import { Member, Message, Project, User } from "../models";

const room = (projectId: number) => `project:${projectId}`;
// room de chat : général si channelId est null/undefined
const chatRoom = (projectId: number, channelId?: number | null) =>
  `${room(projectId)}:chat:${channelId ?? "general"}`;

// --- ACL projet ---
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

    // --- JOIN (chat général par défaut, salon si channelId fourni) ---
    socket.on(
      "join_project",
      async (
        payload: { projectId: number; channelId?: number | null },
        ack?: (res: any) => void
      ) => {
        const projectId = Number(payload?.projectId);
        const channelId = payload?.channelId ?? null;
        if (!projectId) return ack?.({ ok: false, error: "projectId required" });

        const allowed = await canAccess(user.id, projectId);
        if (!allowed) return ack?.({ ok: false, error: "forbidden" });

        // Toujours rejoindre la room projet de base pour les autres events (tasks, members, etc.)
        socket.join(room(projectId));

        // Quitter toute ancienne room de chat de ce projet, puis rejoindre la bonne
        for (const r of socket.rooms) {
          if (r.startsWith(`${room(projectId)}:chat:`)) socket.leave(r);
        }
        socket.join(chatRoom(projectId, channelId));

        // Historique (filtré par salon si channelId != null, sinon général = NULL)
        const where: any = { projectId, channelId }; // null => IS NULL
        const history = await Message.findAll({
          where,
          order: [["createdAt", "DESC"]],
          limit: 30,
          include: [{ model: User, attributes: ["id", "username"] }],
        });

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

    // --- SEND MESSAGE (général par défaut, sinon salon) ---
    socket.on(
      "message:send",
      async (
        payload: {
          projectId: number;
          channelId?: number | null;
          content?: string;
          attachmentUrl?: string | null;
          attachmentMime?: string | null;
        },
        ack?: (res: any) => void
      ) => {
        const projectId = Number(payload?.projectId);
        const channelId = payload?.channelId ?? null;
        const content = (payload?.content || "").trim();
        const hasAttachment = Boolean(payload?.attachmentUrl);

        if (!projectId || (!content && !hasAttachment)) {
          return ack?.({ ok: false, error: "invalid payload" });
        }

        const allowed = await canAccess(user.id, projectId);
        if (!allowed) return ack?.({ ok: false, error: "forbidden" });

        const msg = await Message.create(
          {
            projectId,
            userId: user.id,
            channelId, // <- NULL = général
            body: content || null,
            content: content || null,
            attachmentUrl: payload?.attachmentUrl ?? null,
            attachmentMime: payload?.attachmentMime ?? null,
          } as any
        );

        const created =
          (msg as any).createdAt instanceof Date
            ? (msg as any).createdAt.toISOString()
            : new Date().toISOString();

        const text =
          (typeof (msg as any).get === "function"
            ? (msg as any).get("content") ?? (msg as any).get("body")
            : null) ??
          (msg as any).content ??
          (msg as any).body ??
          "";

        const dto = {
          id: msg.id,
          content: text,
          userId: user.id,
          username: user.email?.split("@")[0],
          createdAt: created,
          attachmentUrl: (msg as any).attachmentUrl ?? null,
          attachmentMime: (msg as any).attachmentMime ?? null,
        };

        // Broadcast uniquement dans la room du chat visé (général ou salon)
        io.to(chatRoom(projectId, channelId)).emit("message:new", dto);
        ack?.({ ok: true, data: dto }); // ok de garder data pour debug, le client n'est pas obligé de l'utiliser
      }
    );

    // --- APPEL (WebRTC) ---
    const callRoom = (projectId: number) => `${room(projectId)}:call`;

    socket.on("call:join", ({ projectId }: { projectId: number }) => {
      if (!projectId) return;
      socket.join(callRoom(projectId));
      socket.to(callRoom(projectId)).emit("call:user-joined", { sid: socket.id });
    });

    socket.on(
      "call:signal",
      ({
        projectId,
        targetSid,
        data,
      }: {
        projectId: number;
        targetSid?: string | null;
        data: any;
      }) => {
        if (!projectId || !data) return;
        if (targetSid) {
          socket.to(targetSid).emit("call:signal", { from: socket.id, data });
        } else {
          socket.to(callRoom(projectId)).emit("call:signal", { from: socket.id, data });
        }
      }
    );

    socket.on("call:leave", ({ projectId }: { projectId: number }) => {
      if (!projectId) return;
      socket.leave(callRoom(projectId));
      socket.to(callRoom(projectId)).emit("call:user-left", { sid: socket.id });
    });
  });
}
