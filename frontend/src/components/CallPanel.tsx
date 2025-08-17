import { useEffect, useRef, useState } from "react";
import { connectSocket } from "../lib/socket";
import CallPointerOverlay from "./CallPointerOverlay";

type Device = { deviceId: string; label: string };
type PointerPayload = { x: number; y: number };

export default function CallPanel({ projectId, token }: { projectId: number; token: string }) {
  const [socket, setSocket] = useState<ReturnType<typeof connectSocket> | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const pointerDcRef = useRef<RTCDataChannel | null>(null);

  const localRef = useRef<HTMLVideoElement>(null);
  const remoteRef = useRef<HTMLVideoElement>(null);
  const remoteWrapRef = useRef<HTMLDivElement>(null); // pour overlay

  const [inCall, setInCall] = useState(false);
  const [micEnabled, setMicEnabled] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [pointerOn, setPointerOn] = useState(false);
  const [remotePointer, setRemotePointer] = useState<PointerPayload | null>(null);

  const [mics, setMics] = useState<Device[]>([]);
  const [currentMicId, setCurrentMicId] = useState<string | undefined>(undefined);

  const iceServers: RTCIceServer[] = [{ urls: "stun:stun.l.google.com:19302" }];

  // --- throttle simple pour la souris
  const lastSentRef = useRef<number>(0);
  const THROTTLE_MS = 30;
  const sendPointer = (p: PointerPayload) => {
    const now = Date.now();
    if (now - lastSentRef.current < THROTTLE_MS) return;
    lastSentRef.current = now;
    pointerDcRef.current?.readyState === "open" && pointerDcRef.current.send(JSON.stringify({ t: "ptr", ...p }));
  };

  // … (garde tes helpers enumerateMics, getMicStream, cleanupPeer, negotiate identiques à la version précédente)

  const cleanupPeer = () => {
    try {
      pointerDcRef.current?.close();
      pointerDcRef.current = null;
      pcRef.current?.getSenders().forEach(s => s.track?.stop());
      pcRef.current?.getReceivers().forEach(r => r.track?.stop());
      pcRef.current?.close();
    } catch {}
    pcRef.current = null;
    if (localRef.current) localRef.current.srcObject = null;
    if (remoteRef.current) remoteRef.current.srcObject = null;
    setInCall(false);
    setSharing(false);
    setPointerOn(false);
    setRemotePointer(null);
  };

  const negotiate = async () => {
    const pc = pcRef.current, s = socket;
    if (!pc || !s) return;
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    s.emit("call:signal", { projectId, data: offer });
  };

  const startPeer = async (isCaller: boolean) => {
    if (pcRef.current) return pcRef.current;

    const pc = new RTCPeerConnection({ iceServers });
    pcRef.current = pc;
    setInCall(true);

    // receveur vidéo par défaut
    pc.addTransceiver("video", { direction: "recvonly" });

    // DataChannel pointer
    if (isCaller) {
      const dc = pc.createDataChannel("pointer", { ordered: true });
      pointerDcRef.current = dc;
      dc.onopen = () => {};
      dc.onclose = () => {};
    } else {
      pc.ondatachannel = (e) => {
        if (e.channel.label === "pointer") {
          pointerDcRef.current = e.channel;
          e.channel.onmessage = (ev) => {
            try {
              const msg = JSON.parse(ev.data);
              if (msg?.t === "ptr" && typeof msg.x === "number" && typeof msg.y === "number") {
                setRemotePointer({ x: msg.x, y: msg.y });
              }
            } catch {}
          };
        }
      };
    }

    pc.onnegotiationneeded = async () => { try { await negotiate(); } catch {} };
    pc.onicecandidate = (e) => { if (e.candidate && socket) socket.emit("call:signal", { projectId, data: { candidate: e.candidate } }); };
    pc.onconnectionstatechange = () => { if (["failed","closed"].includes(pc.connectionState)) cleanupPeer(); };

    pc.ontrack = (e) => {
      const stream = e.streams?.[0] ?? new MediaStream([e.track]);
      if (remoteRef.current) {
        remoteRef.current.srcObject = stream;
        (remoteRef.current as HTMLVideoElement).play().catch(()=>{});
      }
    };

    // audio local
    const audio = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1, sampleRate: 48000 },
      video: false,
    });
    if (localRef.current) localRef.current.srcObject = audio;
    audio.getTracks().forEach(t => pc.addTrack(t, audio));

    if (isCaller) await negotiate();
    return pc;
  };

  // capture de la souris sur la preview locale quand le partage est actif
  const onLocalMouseMove: React.MouseEventHandler<HTMLVideoElement> = (e) => {
    if (!pointerOn || !sharing) return;
    const rect = (e.target as HTMLVideoElement).getBoundingClientRect();
    const x = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
    const y = Math.min(Math.max((e.clientY - rect.top) / rect.height, 0), 1);
    sendPointer({ x, y });
  };

  // share screen (identique, on renégocie après)
  const shareScreen = async () => {
    if (!pcRef.current || sharing) return;
    const display: MediaStream = await (navigator.mediaDevices as any).getDisplayMedia({ video: true, audio: false });
    const screenTrack = display.getVideoTracks()[0];
    const sender = pcRef.current.getSenders().find(s => s.track?.kind === "video");
    if (sender) await sender.replaceTrack(screenTrack); else pcRef.current.addTrack(screenTrack, display);
    setSharing(true);
    if (localRef.current) localRef.current.srcObject = display;
    screenTrack.onended = stopShare;
    try { await negotiate(); } catch {}
  };

  const stopShare = async () => {
    if (!pcRef.current || !sharing) return;
    const sender = pcRef.current.getSenders().find(s => s.track?.kind === "video");
    try { await sender?.replaceTrack(null as any); } catch {}
    setSharing(false);
    setPointerOn(false);
    // remet l’audio local en preview
    const audio = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    if (localRef.current) localRef.current.srcObject = audio;
    try { await negotiate(); } catch {}
  };

  // … conserve le reste (toggleMute, switchMic, lifecycle socket: join/signal/left)

  useEffect(() => {
    const s = connectSocket(token);
    setSocket(s);
    s.emit("call:join", { projectId });

    const onJoined = async () => { await startPeer(true); };
    const onSignal = async ({ from, data }: any) => {
      const pc = pcRef.current ?? (await startPeer(false));
      if (data?.type === "offer") {
        await pc.setRemoteDescription(new RTCSessionDescription(data));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        s.emit("call:signal", { projectId, targetSid: from, data: answer });
      } else if (data?.type === "answer") {
        if (!pc.currentRemoteDescription) await pc.setRemoteDescription(new RTCSessionDescription(data));
      } else if (data?.candidate) {
        try { await pc.addIceCandidate(new RTCIceCandidate(data.candidate)); } catch {}
      }
    };
    const onLeft = () => cleanupPeer();

    s.off("call:user-joined"); s.on("call:user-joined", onJoined);
    s.off("call:signal"); s.on("call:signal", onSignal);
    s.off("call:user-left"); s.on("call:user-left", onLeft);

    return () => { try { s.emit("call:leave", { projectId }); } catch {} cleanupPeer(); s.disconnect(); };
  }, [projectId, token]);

  return (
    <div className="card">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-semibold">Appel vocal</h3>
        <div className="flex items-center gap-2">
          <button className="btn" onClick={() => setPointerOn(p => !p)} disabled={!inCall || !sharing}>
            {pointerOn ? "🖱️ Pointer ON" : "🖱️ Pointer OFF"}
          </button>
          {!sharing ? (
            <button className="btn" onClick={shareScreen} disabled={!inCall}>🖥️ Partager écran</button>
          ) : (
            <button className="btn" onClick={stopShare} disabled={!inCall}>⛔️ Stop partage</button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-xs text-gray-500 mb-1">Moi</div>
          <div className="relative">
            <video ref={localRef} onMouseMove={onLocalMouseMove} autoPlay muted playsInline className="rounded border w-full" />
          </div>
        </div>

        <div>
          <div className="text-xs text-gray-500 mb-1">Collègue</div>
          <div ref={remoteWrapRef} className="relative">
            <video ref={remoteRef} autoPlay playsInline className="rounded border w-full" />
            {/* Overlay au-dessus de la vidéo distante */}
            <div className="absolute inset-0">
              <CallPointerOverlay active={true} pointer={remotePointer} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
