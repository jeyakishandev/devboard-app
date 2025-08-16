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

  // ICE servers: STUN par défaut + TURN optionnel via .env
  const iceServers = (() => {
    const list: RTCIceServer[] = [{ urls: "stun:stun.l.google.com:19302" }];
    const turnUrl = import.meta.env.VITE_TURN_URL;
    const turnUser = import.meta.env.VITE_TURN_USERNAME;
    const turnCred = import.meta.env.VITE_TURN_CREDENTIAL;
    if (turnUrl && turnUser && turnCred) {
      list.push({ urls: turnUrl, username: turnUser, credential: turnCred });
    }
    return list;
  })();

  useEffect(() => {
    // recense les micros dispo
    navigator.mediaDevices.enumerateDevices().then(devs => {
      const onlyMics = devs.filter(d => d.kind === "audioinput")
        .map(d => ({ deviceId: d.deviceId, label: d.label || "Micro" }));
      setMics(onlyMics);
      if (!currentMicId && onlyMics[0]) setCurrentMicId(onlyMics[0].deviceId);
    }).catch(() => {});

    const s = connectSocket(token);
    setSocket(s);

    s.emit("call:join", { projectId });

    s.off("call:user-joined");
    s.on("call:user-joined", async () => { await startPeer(true); });

    s.off("call:signal");
    s.on("call:signal", async ({ from, data }: any) => {
      const pc = pcRef.current ?? (await startPeer(false));
      if (data?.type === "offer") {
        await pc.setRemoteDescription(new RTCSessionDescription(data));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        s.emit("call:signal", { projectId, targetSid: from, data: answer });
      } else if (data?.type === "answer") {
        await pc.setRemoteDescription(new RTCSessionDescription(data));
      } else if (data?.candidate) {
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
    });

    s.off("call:user-left");
    s.on("call:user-left", () => endPeer());

    return () => {
      s.emit("call:leave", { projectId });
      endPeer();
      s.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, token]);

  async function startPeer(isCaller: boolean) {
    if (pcRef.current) return pcRef.current;
    setInCall(true);

    const pc = new RTCPeerConnection({ iceServers });
    pcRef.current = pc;

    // audio input avec traitement “propre”
    const audio = await getMicStream(currentMicId);
    if (localRef.current) localRef.current.srcObject = audio;
    audio.getTracks().forEach(t => pc.addTrack(t, audio));

    // remote
    pc.ontrack = (e) => {
      if (remoteRef.current) {
        remoteRef.current.srcObject = e.streams[0];
        // certains navigateurs veulent un play() manuel
        (remoteRef.current as HTMLVideoElement).play().catch(() => {});
      }
    };

    // ICE candidates
    pc.onicecandidate = (e) => {
      if (e.candidate && socket) {
        socket.emit("call:signal", { projectId, data: { candidate: e.candidate } });
      }
    };

    if (isCaller && socket) {
      const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
      await pc.setLocalDescription(offer);
      socket.emit("call:signal", { projectId, data: offer });
    }
    return pc;
  }

  function endPeer() {
    setInCall(false);
    setSharing(false);
    try {
      pcRef.current?.getSenders().forEach(s => s.track?.stop());
      pcRef.current?.close();
    } catch {}
    pcRef.current = null;
    if (localRef.current) localRef.current.srcObject = null;
    if (remoteRef.current) remoteRef.current.srcObject = null;
  }

  function toggleMute() {
    const senders = pcRef.current?.getSenders().filter(s => s.track?.kind === "audio") || [];
    senders.forEach(s => { if (s.track) s.track.enabled = !micEnabled; });
    setMicEnabled(v => !v);
  }

  async function switchMic(deviceId: string) {
    setCurrentMicId(deviceId);
    if (!pcRef.current) return;
    const newStream = await getMicStream(deviceId);
    const newTrack = newStream.getAudioTracks()[0];
    const sender = pcRef.current.getSenders().find(s => s.track?.kind === "audio");
    if (sender && newTrack) {
      await sender.replaceTrack(newTrack);
      if (localRef.current) localRef.current.srcObject = newStream;
    }
  }

  async function shareScreen() {
    if (!pcRef.current || sharing) return;
    // onglet Chrome => audio possible; sinon la plupart du temps video seule.
    const display: MediaStream = await (navigator.mediaDevices as any).getDisplayMedia({ video: true, audio: false });
    const screenTrack = display.getVideoTracks()[0];

    const sender = pcRef.current.getSenders().find(s => s.track?.kind === "video");
    if (sender) await sender.replaceTrack(screenTrack);
    else pcRef.current.addTrack(screenTrack, display);

    setSharing(true);

    // preview locale écran (optionnel)
    if (localRef.current) localRef.current.srcObject = display;

    screenTrack.onended = () => {
      stopShare();
    };
  }

  function stopShare() {
    if (!pcRef.current || !sharing) return;
    // retire la piste vidéo (revient à l’audio seul)
    const sender = pcRef.current.getSenders().find(s => s.track?.kind === "video");
    try { sender?.replaceTrack(null as any); } catch {}
    setSharing(false);
    // remet la preview locale sur le micro
    getMicStream(currentMicId).then(stream => {
      if (localRef.current) localRef.current.srcObject = stream;
    });
  }

  async function getMicStream(deviceId?: string) {
    const constraints: MediaStreamConstraints = {
      audio: {
        deviceId: deviceId ? { exact: deviceId } : undefined,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        channelCount: 1,
        sampleRate: 48000
      },
      video: false
    };
    return await navigator.mediaDevices.getUserMedia(constraints);
  }

  return (
    <div className="card">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-semibold">Appel vocal</h3>
        <div className="flex items-center gap-2">
          <select
            className="input"
            value={currentMicId}
            onChange={(e) => switchMic(e.target.value)}
            disabled={!inCall}
          >
            {mics.map(m => <option key={m.deviceId} value={m.deviceId}>{m.label}</option>)}
          </select>
          <button className="btn" onClick={toggleMute} disabled={!inCall}>
            {micEnabled ? "🔇 Couper" : "🎤 Rétablir"}
          </button>
          {!sharing ? (
            <button className="btn" onClick={shareScreen} disabled={!inCall}>🖥️ Partager écran</button>
          ) : (
            <button className="btn" onClick={stopShare} disabled={!inCall}>⛔️ Stop partage</button>
          )}
          <button className="btn" onClick={endPeer} disabled={!inCall}>☎️ Raccrocher</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-xs text-gray-500 mb-1">Moi</div>
          <video ref={localRef} autoPlay muted playsInline className="rounded border w-full" />
        </div>
        <div>
          <div className="text-xs text-gray-500 mb-1">Collègue</div>
          <video ref={remoteRef} autoPlay playsInline className="rounded border w-full" />
        </div>
      </div>
    </div>
  );
}
