import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { listMembers, addMember, updateMemberRole, removeMember, type Member } from "../api/members";
import Spinner from "../components/Spinner";
import Banner from "../components/Banner";
import { useForm } from "react-hook-form";

export default function ProjectMembers() {
  const { id } = useParams();
  const projectId = Number(id);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const { register, handleSubmit, reset } = useForm<{ username: string }>();
  const [adding, setAdding] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const data = await listMembers(projectId);
      setMembers(data);
      setErr(null);
    } catch {
      setErr("Impossible de charger les membres.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, [projectId]);

  const onAdd = async (v: { username: string }) => {
    try {
      setAdding(true);
      await addMember(projectId, v.username);
      reset();
      refresh();
    } catch (e) {
      setErr("Ajout impossible (utilisateur introuvable ou déjà membre).");
    } finally {
      setAdding(false);
    }
  };

  const onRoleChange = async (m: Member, role: "owner"|"collaborator") => {
    try {
      await updateMemberRole(projectId, m.userId, role);
      refresh();
    } catch {
      setErr("Mise à jour du rôle impossible (owner only).");
    }
  };

  const onRemove = async (m: Member) => {
    try {
      await removeMember(projectId, m.userId);
      refresh();
    } catch {
      setErr("Suppression impossible (owner only).");
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Membres du projet</h1>
        <Link to={`/projects/${projectId}`} className="btn-ghost">← Retour au projet</Link>
      </div>

      {err && <Banner kind="error">{err}</Banner>}

      <div className="card">
        <h2 className="mb-3 text-lg font-semibold">Ajouter un membre</h2>
        <form onSubmit={handleSubmit(onAdd)} className="flex gap-3">
          <input className="input" placeholder="username existant…" {...register("username", { required: true })} />
          <button className="btn-primary" disabled={adding}>{adding ? <>Ajout…</> : "Ajouter"}</button>
        </form>
        <p className="mt-2 text-xs text-gray-500">Seul le propriétaire peut ajouter des membres.</p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-600"><Spinner /> Chargement…</div>
      ) : members.length === 0 ? (
        <Banner>Pas encore de membres.</Banner>
      ) : (
        <div className="card">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="py-2">Utilisateur</th>
                <th className="py-2">Email</th>
                <th className="py-2">Rôle</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {members.map(m => (
                <tr key={m.id} className="border-t">
                  <td className="py-2">{m.User?.username ?? m.userId}</td>
                  <td className="py-2">{m.User?.email ?? "-"}</td>
                  <td className="py-2">
                    <select
                      className="input !py-1"
                      value={m.role}
                      onChange={(e) => onRoleChange(m, e.target.value as "owner"|"collaborator")}
                    >
                      <option value="collaborator">collaborator</option>
                      <option value="owner">owner</option>
                    </select>
                  </td>
                  <td className="py-2 text-right">
                    <button className="btn" onClick={() => onRemove(m)}>Retirer</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-xs text-gray-500">Le changement de rôle et la suppression sont réservés au propriétaire.</p>
        </div>
      )}
    </div>
  );
}
