import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { type Task, getTasks, createTask } from "../api/tasks";
import { useForm } from "react-hook-form";
import Spinner from "../components/Spinner";
import Banner from "../components/Banner";
// Si react-markdown cause souci, commentez les 2 lignes suivantes et utilisez le fallback <p> plus bas.
import ReactMarkdown from "react-markdown";

export default function ProjectDetail() {
  const { id } = useParams();
  const projectId = Number(id);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const { register, handleSubmit, reset } = useForm<{ title: string; descriptionMd?: string }>();
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const list = await getTasks(projectId);
        setTasks(list);
      } catch {
        setErr("Impossible de charger les tâches.");
      } finally {
        setLoading(false);
      }
    })();
  }, [projectId]);

  const onCreate = async (v: { title: string; descriptionMd?: string }) => {
    try {
      setCreating(true);
      const t = await createTask(projectId, { title: v.title, descriptionMd: v.descriptionMd });
      setTasks((prev) => [t, ...prev]);
      reset();
    } catch {
      setErr("Création de la tâche impossible.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] py-8 space-y-6">
      <div className="card">
        <h2 className="mb-3 text-lg font-semibold">Nouvelle tâche</h2>
        {err && <div className="mb-3"><Banner kind="error">{err}</Banner></div>}
        <form onSubmit={handleSubmit(onCreate)} className="grid gap-3 md:grid-cols-3">
          <input className="input md:col-span-1" placeholder="Titre" {...register("title", { required: true })} />
          <input className="input md:col-span-1" placeholder="Description (Markdown)" {...register("descriptionMd")} />
          <button className="btn-primary md:col-span-1" type="submit" disabled={creating}>
            {creating ? <><Spinner /> Ajout…</> : "Ajouter"}
          </button>
        </form>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-600"><Spinner /> Chargement des tâches…</div>
      ) : tasks.length === 0 ? (
        <Banner>Aucune tâche pour le moment — ajoutez-en une ci-dessus 👆</Banner>
      ) : (
        <div className="grid gap-3">
          {tasks.map((t) => (
            <div key={t.id} className="card">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{t.title}</h3>
                <span className="rounded-full bg-gray-100 px-2 py-1 text-xs">{t.status}</span>
              </div>
              {t.descriptionMd && (
                <div className="prose mt-2 max-w-none">
                  {/* Fallback si ReactMarkdown gêne:
                  <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">{t.descriptionMd}</p>
                  */}
                  <ReactMarkdown>{t.descriptionMd}</ReactMarkdown>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
