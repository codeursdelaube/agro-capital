"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Lock, Phone, AlertCircle } from "lucide-react";
import { motion } from "motion/react";
import { PageShell } from "@/_components/page-shell";
import { AgroCapitalWordmark } from "@/_components/app-nav";

function ConnexionForm() {
  const searchParams = useSearchParams();
  const from = searchParams.get("from") ?? "/";

  const [telephone, setTelephone] = useState("");
  const [pin, setPin] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreur(null);
    setChargement(true);

    try {
      const res = await fetch("/api/auth/connexion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telephone, pin }),
      });

      const json = await res.json();

      if (!res.ok) {
        setErreur(json.error ?? "Numéro de téléphone ou code PIN incorrect.");
        return;
      }

      // Rechargement complet pour synchronisation du cookie de session
      window.location.href = from === "/" || from === "/connexion" || from === "/inscription"
        ? "/"
        : from;
    } catch {
      setErreur("Problème de réseau. Veuillez vérifier votre connexion.");
    } finally {
      setChargement(false);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 }}
      onSubmit={handleSubmit}
      className="card bg-white shadow-xl shadow-slate-200/50 border border-slate-100 dark:border-slate-800 rounded-3xl"
    >
      <div className="card-body gap-5 p-6 sm:p-8">
        {erreur && (
          <div className="flex items-center gap-3 rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs sm:text-sm font-semibold text-rose-700">
            <AlertCircle size={18} className="shrink-0 text-rose-600" />
            <span>{erreur}</span>
          </div>
        )}

        <div className="form-control gap-1.5">
          <label
            htmlFor="phone-input"
            className="label-text font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2"
          >
            <Phone size={16} className="text-emerald-600" />
            Numéro de téléphone
          </label>
          <input
            id="phone-input"
            type="tel"
            inputMode="tel"
            placeholder="Ex: 90 12 34 56"
            value={telephone}
            onChange={(e) => setTelephone(e.target.value)}
            className="input input-bordered input-lg w-full font-bold text-lg text-slate-900 bg-slate-50/50 focus:bg-white border-slate-200 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 rounded-2xl transition-all"
            autoComplete="username"
            required
          />
          <span className="text-[11px] text-slate-400 font-medium">Format togolais T-Money ou Flooz</span>
        </div>

        <div className="form-control gap-1.5">
          <label
            htmlFor="pin-input"
            className="label-text font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2"
          >
            <Lock size={16} className="text-emerald-600" />
            Code secret PIN (4 à 6 chiffres)
          </label>
          <input
            id="pin-input"
            type="password"
            inputMode="numeric"
            maxLength={6}
            placeholder="••••"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="input input-bordered input-lg w-full text-center text-2xl font-extrabold tracking-widest text-slate-900 bg-slate-50/50 focus:bg-white border-slate-200 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 rounded-2xl transition-all"
            autoComplete="current-password"
            required
          />
        </div>

        <button
          type="submit"
          className="btn bg-emerald-600 hover:bg-emerald-700 text-white border-0 btn-lg w-full mt-2 text-base font-extrabold shadow-lg shadow-emerald-600/25 rounded-2xl transition-all active:scale-98"
          disabled={chargement}
        >
          {chargement ? (
            <span className="loading loading-spinner loading-sm" />
          ) : (
            <>
              Se connecter
              <ArrowRight size={18} aria-hidden="true" />
            </>
          )}
        </button>
      </div>
    </motion.form>
  );
}

export default function ConnexionPage() {
  return (
    <PageShell>
      <div className="mx-auto w-full max-w-md space-y-6 py-4">
        <div className="flex justify-center pt-2">
          <AgroCapitalWordmark />
        </div>

        <motion.header
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">Connexion</h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Entrez votre numéro de téléphone et votre code secret PIN.
          </p>
        </motion.header>

        <Suspense fallback={<div className="flex justify-center p-8"><span className="loading loading-spinner text-emerald-600" /></div>}>
          <ConnexionForm />
        </Suspense>

        <div className="text-center pt-2">
          <p className="text-sm text-slate-500">Vous n&apos;avez pas encore de compte ?</p>
          <Link
            href="/inscription"
            className="text-sm font-extrabold text-emerald-600 hover:text-emerald-700 hover:underline mt-1 inline-block"
          >
            Créer mon compte Agro-Capital →
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
