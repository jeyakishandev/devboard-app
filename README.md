# DevBoard

Application de gestion de projets et tâches en équipe.

## 🚀 Stack technique

### Frontend
- **React + Vite + TypeScript**
- **TailwindCSS** pour le style
- **axios** avec `baseURL = VITE_API_URL`
- AuthContext stockant `token` et `user` dans `localStorage`
- Écran **Login** qui tente un login, puis fallback auto en register

### Backend
- **Express + TypeScript**
- **Sequelize** (PostgreSQL 16)
- **JWT** pour l’authentification
- Middlewares `security-lite` :
  - `corsLite`, `helmetLite`, `rateLimitLite`
- Routes :
  - `/auth/*` (login, register, profil…)
  - `/api/projects/*` (CRUD projets)
  - `/api/projects/:projectId/tasks/*` (CRUD tâches)
  - `/uploads` (statique)
  - `/health` et `/healthz` (endpoints de santé)

### Base de données
- PostgreSQL 16
- Schéma généré par Sequelize `sync` au boot :
  - **Users, Projects, Members, Tasks, Channels, Messages**
  - Enums `status` et `priority`

---

## 🐳 Dev containers

### docker-compose.dev.yml
- **db** : `postgres:16-alpine`
  - volume `dbdata`
  - healthcheck intégré
- **api** : build `./backend`
  - ports `3000:3000`
  - variables `DB_*`, `JWT_SECRET`, `FRONTEND_ORIGIN`
  - démarre avec `npm ci && npm run dev`
- **web** : build `./frontend`
  - port `5173`
  - `VITE_API_URL=http://localhost:3000`

---

## 🛠️ Historique des fixes clés
- Corrigé `ALTER TABLE channelId` (références + default incompatibles).
- Remplacé `bcrypt` manquant → helpers internes `hashPassword/verifyPassword`.
- Ajout endpoints santé `/health` et `/healthz`.
- Ajout deps manquantes dans l’image API (`jsonwebtoken`, `sequelize`, `pg`…).
- CORS & `VITE_API_URL` validés → front se connecte et authentifie correctement.
- Tests curl :
  - **Register/Login OK**
  - **Création projet & tâche OK**

---

## 🔬 Tests rapides (dev)

```bash
# Lancer containers
docker compose -f docker-compose.dev.yml up -d --build

# Vérifier l'API
curl -fsS http://localhost:3000/health

# Flux e2e
# 1. Register/Login → récupérer bearer token
# 2. POST /api/projects
# 3. POST /api/projects/:id/tasks
# 4. GET /api/projects/:id/tasks
