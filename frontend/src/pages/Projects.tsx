import { useEffect, useState } from "react";
import { createProject, getMyProjects, type Project } from "../api/projects";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import Spinner from "../components/Spinner";
import Banner from "../components/Banner";

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const { register, handleSubmit, reset } = useForm<{ name: string; description?: string }>();
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const list = await getMyProjects();
        setProjects(list);
      } catch {
        setErr("Impossible de charger vos projets.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const onCreate = async (v: { name: string; description?: string }) => {
    try {
      setCreating(true);
      const p = await createProject(v);
      setProjects((prev) => [p, ...prev]);
      reset();
    } catch {
      setErr("Création du projet impossible.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] py-8 space-y-6">
      <div className="card">
        <h2 className="mb-3 text-lg font-semibold">Créer un projet</h2>
        {err && <div className="mb-3"><Banner kind="error">{err}</Banner></div>}
        <form onSubmit={handleSubmit(onCreate)} className="grid gap-3 md:grid-cols-3">
          <input className="input md:col-span-1" placeholder="Nom du projet" {...register("name", { required: true })} />
          <input className="input md:col-span-1" placeholder="Description (optionnel)" {...register("description")} />
          <button className="btn-primary md:col-span-1" type="submit" disabled={creating}>
            {creating ? <><Spinner /> Création…</> : "Créer"}
          </button>
        </form>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-600"><Spinner /> Chargement des projets…</div>
      ) : projects.length === 0 ? (
        <Banner>Pas encore de projet — créez-en un ci-dessus 👆</Banner>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {projects.map((p) => (
            <Link key={p.id} to={`/projects/${p.id}`} className="card hover:shadow-md">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">{p.name}</h3>
                <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">{p.status}</span>
              </div>
              {p.description && <p className="mt-2 text-sm text-gray-600">{p.description}</p>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

