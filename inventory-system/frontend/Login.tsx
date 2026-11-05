import { FormEvent, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { getApiErrorMessage } from "@/api/client";

export function Login() {
  const { user, loading, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
      setError(getApiErrorMessage(err, "E-mail ou senha inválidos!"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink px-4 py-10">
      {/* Detalhes de fundo, so decorativos */}
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-steel/20 blur-3xl" />

      <div className="relative w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-accent" />
          <p className="font-display text-5xl font-semibold tracking-wide text-white">Auto Gama</p>
          <p className="mt-1 text-sm text-white/60">Controle de inventário</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-md bg-white p-6 shadow-2xl sm:p-7">
          {sessionExpired && (
            <p className="mb-4 rounded border border-accent/30 bg-accent-soft px-3 py-2 text-sm text-accent-dark">
              Sua sessão expirou. Faça login novamente!
            </p>
          )}
          <h1 className="mb-5 font-display text-2xl font-semibold text-ink">Entrar</h1>

          <label htmlFor="email" className="mb-1 block text-sm font-medium text-ink">
            E-mail
          </label>
          <input
            id="email"
            required
            type="email"
            autoFocus
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mb-4 h-12 w-full rounded border border-line px-3 text-base focus:border-accent sm:text-sm"
          />

          <label htmlFor="password" className="mb-1 block text-sm font-medium text-ink">
            Senha
          </label>
          <div className="relative mb-4">
            <input
              id="password"
              required
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 w-full rounded border border-line px-3 pr-16 text-base focus:border-accent sm:text-sm"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-1 top-1 h-10 rounded px-3 text-xs font-medium text-muted hover:text-ink"
            >
              {showPassword ? "Ocultar" : "Mostrar"}
            </button>
          </div>

          {error && (
            <p className="mb-4 rounded border border-danger/20 bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="h-12 w-full rounded bg-accent text-sm font-semibold text-white transition-colors hover:bg-accent-dark disabled:opacity-60"
          >
            {submitting ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
