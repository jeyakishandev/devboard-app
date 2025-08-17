import { useEffect, useRef, useState } from "react";
import { connectSocket } from "../lib/socket";

type Device = { deviceId: string; label: string };

export default function CallPanel({ projectId, token }: { projectId: number; token: string }) {
  const [socket, setSocket] = useState<ReturnType<typeof connectSocket> | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localRef = useRef<HTMLVideoElement>(null);
  const remoteRef = useRef<HTMLVideoElement>(null);

  const [inCall, setInCall] = useState(false);
  const [micEnabled, setMicEnabled] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [mics, setMics] = useState<Device[]>([]);
  const [currentMicId, setCurrentMicId] = useState<string | undefined>(undefined);

  const iceServers: RTCIceServer[] = (() => {
    const list: RTCIceServer[] = [{ urls: "stun:stun.l.google.com:19302" }];
    const turnUrl = import.meta.env.VITE_TURN_URL;
    const turnUser = import.meta.env.VITE_TURN_USERNAME;
    const turnCred = import.meta.env.VITE_TURN_CREDENTIAL;
    if (turnUrl && turnUser && turnCred) list.push({ urls: turnUrl, username: turnUser, credential: turnCred });
    return list;
  })();

  const enumerateMics = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true, video: false }).then(s => s.getTracks().forEach(t => t.stop()));
    } catch {}
    const devs = await navigator.mediaDevices.enumerateDevices();
    const onlyMics = devs.filter(d => d.kind === "audioinput").map(d => ({ deviceId: d.deviceId, label: d.label || "Micro" }));
    setMics(onlyMics);
    if (!currentMicId && onlyMics[0]) setCurrentMicId(onlyMics[0].deviceId);
  };

  const getMicStream = async (deviceId?: string) => {
    return navigator.mediaDevices.getUserMedia({
      audio: {
        deviceId: deviceId ? { exact: deviceId } : undefined,
        echoCancellation: true, noiseSuppression: true, autoGainControl: true,
        channelCount: 1, sampleRate: 48000,
      },
      video: false,
    });
  };

  const cleanupPeer = () => {
    try {
      pcRef.current?.getSenders().forEach(s => s.track?.stop());
      pcRef.current?.getReceivers().forEach(r => r.track?.stop());
      pcRef.current?.close();
    } catch {}
    pcRef.current = null;
    if (localRef.current) localRef.current.srcObject = null;
    if (remoteRef.current) remoteRef.current.srcObject = null;
    setInCall(false);
    setSharing(false);
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

    pc.addTransceiver("video", { direction: "recvonly" });
    pc.onnegotiationneeded = async () => { try { await negotiate(); } catch {} };
    pc.onicecandidate = (e) => { if (e.candidate && socket) socket.emit("call:signal", { projectId, data: { candidate: e.candidate } }); };
    pc.onconnectionstatechange = () => { if (["failed","closed"].includes(pc.connectionState)) cleanupPeer(); };
    pc.ontrack = (e) => {
      const stream = e.streams?.[0] ?? new MediaStream([e.track]);
      if (remoteRef.current) { remoteRef.current.srcObject = stream; (remoteRef.current as HTMLVideoElement).play().catch(()=>{}); }
    };

    const audio = await getMicStream(currentMicId);
    if (localRef.current) localRef.current.srcObject = audio;
    audio.getTracks().forEach(t => pc.addTrack(t, audio));

    if (isCaller) await negotiate();
    return pc;
  };

  const toggleMute = () => {
    const senders = pcRef.current?.getSenders().filter(s => s.track?.kind === "audio") || [];
    const next = !micEnabled;
    senders.forEach(s => { if (s.track) s.track.enabled = next; });
    setMicEnabled(next);
  };

  const switchMic = async (deviceId: string) => {
    setCurrentMicId(deviceId);
    if (!pcRef.current) return;
    const newStream = await getMicStream(deviceId);
    const newTrack = newStream.getAudioTracks()[0];
    const sender = pcRef.current.getSenders().find(s => s.track?.kind === "audio");
    if (sender && newTrack) {
      await sender.replaceTrack(newTrack);
      if (localRef.current) localRef.current.srcObject = newStream;
      try { await negotiate(); } catch {}
    }
  };

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
    const stream = await getMicStream(currentMicId);
    if (localRef.current) localRef.current.srcObject = stream;
    try { await negotiate(); } catch {}
  };

  useEffect(() => { enumerateMics().catch(()=>{}); }, []);

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
  }, [projectId, token, currentMicId]);

  return (
    <div className="card">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-semibold">Appel vocal</h3>
        <div className="flex items-center gap-2">
          <select className="input" value={currentMicId} onChange={(e) => switchMic(e.target.value)} disabled={!inCall}>
            {mics.map(m => <option key={m.deviceId} value={m.deviceId}>{m.label}</option>)}
          </select>
          <button className="btn" onClick={toggleMute} disabled={!inCall}>{micEnabled ? "🔇 Couper" : "🎤 Rétablir"}</button>
          {!sharing ? (
            <button className="btn" onClick={shareScreen} disabled={!inCall}>🖥️ Partager écran</button>
          ) : (
            <button className="btn" onClick={stopShare} disabled={!inCall}>⛔️ Stop partage</button>
          )}
          <button className="btn" onClick={cleanupPeer} disabled={!inCall}>☎️ Raccrocher</button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><div className="text-xs text-gray-500 mb-1">Moi</div><video ref={localRef} autoPlay muted playsInline className="rounded border w-full" /></div>
        <div><div className="text-xs text-gray-500 mb-1">Collègue</div><video ref={remoteRef} autoPlay playsInline className="rounded border w-full" /></div>
      </div>
    </div>
  );
}
