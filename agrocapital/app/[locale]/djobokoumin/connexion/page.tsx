"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Key, Lock, ArrowRight } from "lucide-react";
import { PageShell } from "@/_components/page-shell";

export default function AdminConnexionPage() {
  const router = useRouter();
  const [secretWord, setSecretWord] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secretWord, password }),
      });

      if (res.ok) {
        router.push("/djobokoumin");
        router.refresh();
      } else {
        const json = await res.json();
        setError(json.error ?? "Mot secret ou mot de passe incorrect");
      }
    } catch {
      setError("Erreur de connexion réseau");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell>
      <div className="max-w-md mx-auto py-12 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-900 text-emerald-400 shadow-xl border border-emerald-500/30">
            <ShieldCheck size={28} />
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Portail Secret Admin</h1>
          <p className="text-xs text-slate-500 font-semibold">
            Veuillez entrer le mot secret et le mot de passe d'administration.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card bg-white border border-slate-200/90 rounded-3xl shadow-lg p-6 space-y-4">
          {error && (
            <div className="alert bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold p-3 rounded-2xl">
              <span>{error}</span>
            </div>
          )}

          <div className="form-control gap-1.5">
            <label className="label-text font-bold text-xs text-slate-700 flex items-center gap-1.5">
              <Key size={14} className="text-emerald-600" /> Mot Secret Admin
            </label>
            <input
              type="password"
              placeholder="Mot secret..."
              value={secretWord}
              onChange={(e) => setSecretWord(e.target.value)}
              className="input input-bordered input-md font-mono text-sm font-bold rounded-2xl w-full"
              required
            />
          </div>

          <div className="form-control gap-1.5">
            <label className="label-text font-bold text-xs text-slate-700 flex items-center gap-1.5">
              <Lock size={14} className="text-emerald-600" /> Mot de Passe Admin
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input input-bordered input-md font-mono text-sm font-bold rounded-2xl w-full"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn bg-slate-900 hover:bg-black text-white border-0 btn-lg w-full font-extrabold rounded-2xl shadow-md gap-2 mt-2"
          >
            {loading ? <span className="loading loading-spinner loading-sm text-emerald-400" /> : (
              <>
                Déverrouiller l'Espace Admin
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
      </div>
    </PageShell>
  );
}
