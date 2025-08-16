import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { login, register as signup } from "../api/auth";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../store/auth";

const schema = z.object({ email: z.string().email(), password: z.string().min(6) });
type FormValues = z.infer<typeof schema>;

export default function Login() {
  const { register, handleSubmit, formState: { errors }, setError } = useForm<FormValues>({ resolver: zodResolver(schema) });
  const nav = useNavigate();
  const { setAuth } = useAuth();

  const onSubmit = async (v: FormValues) => {
    try {
      const { token, user } = await login(v.email, v.password);
      setAuth(token, user); nav("/");
    } catch {
      // si pas de compte, création auto simple (expé junior)
      try {
        const username = v.email.split("@")[0];
        const { token, user } = await signup(username, v.email, v.password);
        setAuth(token, user); nav("/");
      } catch {
        setError("password", { message: "Identifiants invalides" });
      }
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 text-2xl font-bold">Connexion</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="card space-y-4">
        <div>
          <label className="label">Email</label>
          <input className="input" type="email" {...register("email")} />
          {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
        </div>
        <div>
          <label className="label">Mot de passe</label>
          <input className="input" type="password" {...register("password")} />
          {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
        </div>
        <button className="btn-primary" type="submit">Entrer</button>
      </form>
    </div>
  );
}
