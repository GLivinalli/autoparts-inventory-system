import { FormEvent, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { getApiErrorMessage } from "@/api/client";

export function Login() {
  const { user, loading, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("session_expired")) {
      setSessionExpired(true);
      sessionStorage.removeItem("session_expired");
    }
  }, []);

  

  if (!loading && user) return <Navigate to="/" replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(getApiErrorMessage(err, "E-mail ou senha invalidos"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="font-display text-4xl font-semibold text-white">AutoParts</p>
          <p className="mt-1 text-sm text-white/60">Controle de inventario de pecas automotivas</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-md bg-white p-6 shadow-lg">
          <h1 className="mb-5 font-display text-2xl font-semibold text-ink">Entrar</h1>

          <label className="mb-1 block text-sm font-medium text-ink">E-mail</label>
          <input
            required
            type="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mb-4 h-11 w-full rounded border border-line px-3 text-sm focus:border-accent"
          />

          <label className="mb-1 block text-sm font-medium text-ink">Senha</label>
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mb-4 h-11 w-full rounded border border-line px-3 text-sm focus:border-accent"
          />

          {error && <p className="mb-4 text-sm text-danger">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="h-11 w-full rounded bg-accent text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-60"
          >
            {submitting ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
