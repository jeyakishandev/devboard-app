// ProjectDetail.tsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import ReactMarkdown from "react-markdown";

import { getTasks, createTask, type Task } from "../api/tasks";
import Spinner from "../components/Spinner";
import Banner from "../components/Banner";
import { useAuth } from "../store/auth";
import ProjectChat from "../components/ProjectChat";
import CallPanel from "../components/CallPanel";

// 👉 ajouts pour salons et owner
import { getProject, type Project } from "../api/projects";
import { getChannels, createChannel, type Channel } from "../api/channels";

export default function ProjectDetail() {
  const { id } = useParams();
  const projectId = Number(id);
  const { token, user } = useAuth();

  // tâches (inchangé)
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const { register, handleSubmit, reset } = useForm<{ title: string; descriptionMd?: string }>();
  const [creating, setCreating] = useState(false);

  // ▼ salons + owner
  const [project, setProject] = useState<Project | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChan, setActiveChan] = useState<number | null>(null); // null = #general
  const [loadingMeta, setLoadingMeta] = useState(true);

  const isOwner = !!project && !!user && user.id === project.ownerId;
  const [newChan, setNewChan] = useState("");

  // charge tâches
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const list = await getTasks(projectId);
        setTasks(list);
        setErr(null);
      } catch {
        setErr("Impossible de charger les tâches.");
      } finally {
        setLoading(false);
      }
    })();
  }, [projectId]);

  // charge projet + salons
  useEffect(() => {
    (async () => {
      try {
        setLoadingMeta(true);
        const [p, list] = await Promise.all([
          getProject(projectId),
          getChannels(projectId),
        ]);
        setProject(p);
        setChannels(list);
      } catch {
        setErr("Impossible de charger les infos du projet / salons.");
      } finally {
        setLoadingMeta(false);
      }
    })();
  }, [projectId]);

  const onCreate = async (v: { title: string; descriptionMd?: string }) => {
    try {
      setCreating(true);
      const t = await createTask(projectId, { title: v.title, descriptionMd: v.descriptionMd });
      setTasks((prev) => [t, ...prev]);
      reset();
      setErr(null);
    } catch {
      setErr("Création de la tâche impossible.");
    } finally {
      setCreating(false);
    }
  };

  const onCreateChannel = async () => {
    try {
      const name = newChan.trim();
      if (!name) return;
      const ch = await createChannel(projectId, name); // 403 si pas owner (backend)
      setChannels((prev) => [...prev, ch]);
      setActiveChan(ch.id); // on bascule dessus
      setNewChan("");
    } catch (e: any) {
      setErr(e?.response?.data?.error || "Création du salon refusée (owner-only).");
    }
  };

  if (loadingMeta) {
    return (
      <div className="p-4 flex items-center gap-2 text-sm text-gray-600">
        <Spinner /> Chargement du projet…
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] py-8 space-y-6">
      {/* En-tête + lien Membres */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">
          Projet #{projectId}{project ? ` — ${project.name}` : ""}
        </h1>
        <Link to={`/projects/${projectId}/members`} className="btn-ghost">👥 Membres</Link>
      </div>

      {/* Barre d’onglets salons */}
      <div className="card">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            className={`btn ${activeChan === null ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setActiveChan(null)}
          >
            #general
          </button>
          {channels.map((c) => (
            <button
              key={c.id}
              className={`btn ${activeChan === c.id ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setActiveChan(c.id)}
            >
              #{c.name}
            </button>
          ))}
          {/* Création d’un salon — visible uniquement pour l’owner */}
          {isOwner && (
            <div className="ml-auto flex gap-2">
              <input
                className="input"
                placeholder="nouveau salon (ex: backend)"
                value={newChan}
                onChange={(e) => setNewChan(e.target.value)}
              />
              <button className="btn" onClick={onCreateChannel} disabled={!newChan.trim()}>
                Créer
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Formulaire nouvelle tâche */}
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

      {/* Liste des tâches */}
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
                  <ReactMarkdown>{t.descriptionMd}</ReactMarkdown>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Chat du salon actif (ou général) */}
      {token && (
        <ProjectChat
          projectId={projectId}
          token={token}
          channelId={activeChan} // null => #general
        />
      )}

      {/* Appel vocal / partage écran (lié au projet, pas au salon) */}
      {token && <CallPanel projectId={projectId} token={token} />}
    </div>
  );
}
