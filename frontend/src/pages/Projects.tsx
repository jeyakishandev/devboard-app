import { useEffect, useState } from "react";
import { createProject, getMyProjects, Project } from "../api/projects";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const { register, handleSubmit, reset } = useForm<{ name: string; description?: string }>();

  useEffect(() => { (async () => setProjects(await getMyProjects()))(); }, []);

  const onCreate = async (v: { name: string; description?: string }) => {
    const p = await createProject(v);
    setProjects((prev) => [p, ...prev]);
    reset();
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="mb-3 text-lg font-semibold">Créer un projet</h2>
        <form onSubmit={handleSubmit(onCreate)} className="grid gap-3 md:grid-cols-3">
          <input className="input md:col-span-1" placeholder="Nom du projet" {...register("name", { required: true })} />
          <input className="input md:col-span-1" placeholder="Description (optionnel)" {...register("description")} />
          <button className="btn-primary md:col-span-1" type="submit">Créer</button>
        </form>
      </div>

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
        {projects.length === 0 && <p className="text-sm text-gray-600">Aucun projet pour l’instant.</p>}
      </div>
    </div>
  );
}
