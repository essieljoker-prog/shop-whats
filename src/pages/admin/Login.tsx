import { useState } from "react";
import { useNavigate } from "react-router";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/providers/trpc";
import { Logo } from "@/components/Logo";

export default function AdminLogin() {
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [error, setError] = useState("");
  const login = trpc.admin.login.useMutation({
    onSuccess: (user) => {
      utils.admin.me.setData(undefined, user);
      toast.success("Connexion réussie.");
      navigate("/admin", { replace: true });
    },
    onError: (e) => {
      const message = e.message || "Connexion impossible.";
      setError(message);
      toast.error(message);
    },
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-mist px-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setError("");
          login.mutate({ username, password });
        }}
        className="w-full max-w-sm rounded-2xl border bg-white p-7"
      >
        <Logo />
        <h1 className="font-display mt-6 text-[20px] font-bold">Espace administrateur</h1>
        <p className="mt-1 text-[14px] text-muted-foreground">
          Gestion du catalogue Manaaf.
        </p>

        <label className="mt-6 block text-[13px] font-medium">
          Identifiant
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
            className="mt-1.5 h-12 w-full rounded-xl border bg-white px-4 text-[15px] outline-none focus:border-brand-blue-700/40"
          />
        </label>
        <div className="mt-4">
          <label htmlFor="admin-password" className="block text-[13px] font-medium">
            Mot de passe
          </label>
          <span className="relative mt-1.5 block">
            <input
              id="admin-password"
              type={passwordVisible ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              className="h-12 w-full rounded-xl border bg-white px-4 pr-12 text-[15px] outline-none focus:border-brand-blue-700/40"
            />
            <button
              type="button"
              aria-label={passwordVisible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              aria-pressed={passwordVisible}
              onClick={() => setPasswordVisible((visible) => !visible)}
              className="absolute inset-y-0 right-1 flex w-10 items-center justify-center rounded-full text-muted-foreground hover:text-brand-blue-700"
            >
              {passwordVisible ? <EyeOff className="h-5 w-5" aria-hidden /> : <Eye className="h-5 w-5" aria-hidden />}
            </button>
          </span>
        </div>

        {error && (
          <p role="alert" className="mt-3 rounded-xl bg-red-50 px-3.5 py-2.5 text-[13px] text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={login.isPending}
          className="mt-6 h-[52px] w-full rounded-full bg-brand-blue-700 text-[15px] font-semibold text-white transition-colors hover:bg-brand-blue-800 disabled:opacity-60"
        >
          {login.isPending ? "Connexion…" : "Se connecter"}
        </button>
      </form>
    </div>
  );
}
