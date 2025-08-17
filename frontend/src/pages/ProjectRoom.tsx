import { useParams } from "react-router-dom";
import { useAuth } from "../store/auth";
import CallPanel from "../components/CallPanel";
import LivePad from "../components/LivePad";

export default function ProjectRoom() {
  const { id } = useParams<{ id: string }>();
  const projectId = Number(id);
  const { token } = useAuth();

  if (!token) return <div className="p-4">Veuillez vous connecter.</div>;
  if (!projectId) return <div className="p-4">Projet introuvable.</div>;

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Salle projet #{projectId}</h1>

      {/* Appel vocal + partage d'écran */}
      <CallPanel projectId={projectId} token={token} />

      {/* LivePad collaboratif */}
      <LivePad projectId={projectId} />

      {/* Astuce UX */}
      <p className="text-xs text-gray-500">
        Ouvre cette page dans un 2ᵉ onglet/navigateur pour tester la collaboration en temps réel.
      </p>
    </div>
  );
}
