import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Task, getTasks, createTask } from "../api/tasks";
import { useForm } from "react-hook-form";
import ReactMarkdown from "react-markdown";

export default function ProjectDetail() {
  const { id } = useParams();
  const projectId = Number(id);
  const [tasks, setTasks] = useState<Task[]>([]);
  const { register, handleSubmit, reset } = useForm<{ title: string; descriptionMd?: string }>();

  useEffect(() => { (async () => setTasks(await getTasks(projectId)))(); }, [projectId]);

  const onCreate = async (v: { title: string; descriptionMd?: string }) => {
    const t = await createTask(projectId, { title: v.title, descriptionMd: v.descriptionMd });
    setTasks((prev) => [t, ...prev]); reset();
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="mb-3 text-lg font-semibold">Nouvelle tâche</h2>
        <form onSubmit={handleSubmit(onCreate)} className="grid gap-3 md:grid-cols-3">
          <input className="input md:col-span-1" placeholder="Titre" {...register("title", { required: true })} />
          <input className="input md:col-span-1" placeholder="Description (Markdown)" {...register("descriptionMd")} />
          <button className="btn-primary md:col-span-1" type="submit">Ajouter</button>
        </form>
      </div>

      <div className="grid gap-3">
        {tasks.map((t) => (
          <div key={t.id} className="card">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{t.title}</h3>
              <span className="rounded-full bg-gray-100 px-2 py-1 text-xs">{t.status}</span>
            </div>
            {t.descriptionMd && (
              <div className="prose mt-2 max-w-none">
                <ReactMarkdown>{t.descriptionMd}</ReactMarkdown>
              </div>
            )}
          </div>
        ))}
        {tasks.length === 0 && <p className="text-sm text-gray-600">Aucune tâche pour le moment.</p>}
      </div>
    </div>
  );
}
