import { useForm } from "react-hook-form";
import { login, register as signup } from "../api/auth";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../store/auth";

type FormValues = { email: string; password: string };

export default function Login() {
  const { register, handleSubmit, setError } = useForm<FormValues>();
  const nav = useNavigate();
  const { setAuth } = useAuth();

  const onSubmit = async (v: FormValues) => {
    try {
      const { token, user } = await login(v.email, v.password);
      setAuth(token, user);
      nav("/");
    } catch {
      try {
        const username = v.email.split("@")[0];
        const { token, user } = await signup(username, v.email, v.password);
        setAuth(token, user);
        nav("/");
      } catch {
        setError("password", { message: "Identifiants invalides" });
      }
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] grid place-items-center px-4">
      <div className="w-full max-w-md">
        <h1 className="mb-6 text-center text-2xl font-bold">Connexion</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="card space-y-4">
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" placeholder="you@email.com" {...register("email", { required: true })} />
          </div>
          <div>
            <label className="label">Mot de passe</label>
            <input className="input" type="password" placeholder="••••••••" {...register("password", { required: true, minLength: 6 })} />
          </div>
          <button className="btn-primary w-full" type="submit">Entrer</button>
        </form>
        <p className="mt-4 text-center text-xs text-gray-500">
          Astuce: si le compte n’existe pas, il sera créé automatiquement avec ces identifiants.
        </p>
      </div>
    </div>
  );
}
