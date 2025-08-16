import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./store/auth";
import Login from "./pages/Login";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";

function PrivateRoute({ children }: { children: JSX.Element }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
}

function Navbar() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  return (
    <div className="sticky top-0 z-10 border-b bg-white/70 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <Link to="/" className="text-lg font-bold text-indigo-600">DevBoard</Link>
        <div className="flex items-center gap-3">
          {user && <span className="hidden text-sm text-gray-600 sm:inline">Salut, {user.username}</span>}
          {user ? (
            <button className="btn-ghost" onClick={logout}>Se déconnecter</button>
          ) : pathname !== "/login" ? (
            <Link to="/login" className="btn-ghost">Se connecter</Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <main className="mx-auto max-w-5xl px-4">{children}</main>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Shell>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<PrivateRoute><Projects /></PrivateRoute>} />
            <Route path="/projects/:id" element={<PrivateRoute><ProjectDetail /></PrivateRoute>} />
          </Routes>
        </Shell>
      </BrowserRouter>
    </AuthProvider>
  );
}

