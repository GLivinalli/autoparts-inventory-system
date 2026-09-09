import { FormEvent, useState } from "react";
import { changePassword } from "@/api/auth";
import { getApiErrorMessage } from "@/api/client";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";

export function ChangePassword() {
  const { logout } = useAuth();
  const { notify } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (newPassword.length < 8) return setError("A nova senha deve ter pelo menos 8 caracteres");
    if (newPassword !== confirmPassword) return setError("As senhas novas nao coincidem");

    setSubmitting(true);
    try {
      await changePassword(currentPassword, newPassword);
      notify("Senha alterada com sucesso. Faca login novamente.", "success");
      await logout();
    } catch (err) {
      setError(getApiErrorMessage(err, "Nao foi possivel trocar a senha"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="font-display text-3xl font-semibold text-ink">Trocar senha</h1>
      <p className="mb-5 text-sm text-muted">
        Voce sera desconectado depois de trocar, para entrar de novo ja com a senha nova.
      </p>
      <form onSubmit={handleSubmit} className="rounded border border-line bg-white p-5">
        <label className="mb-1 block text-sm font-medium text-ink">Senha atual</label>
        <input
          required
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="mb-3 h-11 w-full rounded border border-line px-3 text-sm focus:border-accent"
        />

        <label className="mb-1 block text-sm font-medium text-ink">Nova senha</label>
        <input
          required
          type="password"
          minLength={8}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="mb-3 h-11 w-full rounded border border-line px-3 text-sm focus:border-accent"
        />

        <label className="mb-1 block text-sm font-medium text-ink">Confirmar nova senha</label>
        <input
          required
          type="password"
          minLength={8}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="mb-4 h-11 w-full rounded border border-line px-3 text-sm focus:border-accent"
        />

        {error && <p className="mb-3 text-sm text-danger">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="h-11 w-full rounded bg-accent text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-60"
        >
          {submitting ? "Salvando..." : "Trocar senha"}
        </button>
      </form>
    </div>
  );
}
