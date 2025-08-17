import { useEffect, useMemo, useRef, useState } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import Editor, { OnMount } from "@monaco-editor/react";
import { MonacoBinding } from "y-monaco";

/**
 * LivePad collaboratif (Monaco + Y.js + y-websocket).
 * Un document partagé par "roomId" (ex: project-42 ou project-42#channel-7).
 */

type Props = {
  projectId: number;
  channelId?: number | null;
  roomPrefix?: string; // par défaut "project"
  defaultLanguage?: "typescript" | "javascript" | "markdown" | "json";
};

export default function LivePad({
  projectId,
  channelId = null,
  roomPrefix = "project",
  defaultLanguage = "typescript",
}: Props) {
  const [status, setStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");
  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);

  const roomId = useMemo(() => {
    return channelId != null ? `${roomPrefix}-${projectId}#channel-${channelId}` : `${roomPrefix}-${projectId}`;
  }, [projectId, channelId, roomPrefix]);

  const ywsUrl = import.meta.env.VITE_YWS_URL || "ws://localhost:1234";

  // Y.js setup
  useEffect(() => {
    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    const provider = new WebsocketProvider(ywsUrl, roomId, ydoc, { connect: true });
    providerRef.current = provider;

    const onStatus = (e: any) => setStatus(e.status); // "connected" | "disconnected"
    provider.on("status", onStatus);

    return () => {
      provider.off("status", onStatus);
      provider.destroy();
      ydoc.destroy();
      ydocRef.current = null;
      providerRef.current = null;
    };
  }, [roomId, ywsUrl]);

  // Monaco mount → plug monaco-yjs
  const handleMount: OnMount = async (editor, monaco) => {
    // charge monaco-yjs dynamiquement pour éviter le poids upfront
    
    const ydoc = ydocRef.current!;
    const provider = providerRef.current!;
    const ytext = ydoc.getText("monaco"); // espace collaboratif

    // curseurs multiples
    const awareness = provider.awareness;
    awareness.setLocalStateField("user", {
      name: "dev", // TODO: injecter ton username
      color: "#4f46e5",
    });

    // langue par défaut cohérente
    monaco.editor.setModelLanguage(editor.getModel()!, defaultLanguage);

    // binding
    const binding = new MonacoBinding(ytext, editor.getModel()!, new Set([editor]), awareness);

    // Tweak UI
    editor.updateOptions({
      minimap: { enabled: false },
      tabSize: 2,
      insertSpaces: true,
      fontSize: 14,
      smoothScrolling: true,
      automaticLayout: true,
    });

    // Nettoyage au démontage React
    editor.onDidDispose(() => {
      binding.destroy();
    });
  };

  return (
    <div className="rounded border overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b">
        <div className="text-sm font-medium">Live Pad – {roomId}</div>
        <div className="text-xs">
          {status === "connected" ? "🟢 connecté" : status === "connecting" ? "🟡 connexion…" : "🔴 déconnecté"}
        </div>
      </div>
      <Editor
        height="50vh"
        defaultLanguage={defaultLanguage}
        defaultValue={`// Bienvenue sur le Live Pad\n// Tape ici et collabore en temps réel 🚀\n`}
        onMount={handleMount}
        options={{
          wordWrap: "on",
          renderWhitespace: "selection",
          scrollBeyondLastLine: false,
          padding: { top: 8, bottom: 8 },
        }}
      />
    </div>
  );
}
