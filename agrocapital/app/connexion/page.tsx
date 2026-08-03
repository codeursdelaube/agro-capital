"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Lock, Phone } from "lucide-react";
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
        setErreur(json.error ?? "Numéro ou code incorrect.");
        return;
      }

      // Rechargement complet pour que le proxy lise le nouveau cookie de session
      // et redirige correctement selon le rôle
      window.location.href = from === "/" || from === "/connexion" || from === "/inscription"
        ? "/"
        : from;
    } catch {
      setErreur("Problème de connexion. Vérifiez votre réseau.");
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
      className="card bg-white shadow-sm border border-base-200"
    >
      <div className="card-body gap-5 p-6">
        {erreur && (
          <div role="alert" className="alert alert-error text-sm py-3">
            <span>{erreur}</span>
          </div>
        )}

        {/* Téléphone */}
        <div className="form-control gap-2">
          <label
            htmlFor="phone-input"
            className="label-text font-semibold text-base-content flex items-center gap-2"
          >
            <Phone size={18} className="text-primary" />
            Numéro de téléphone
          </label>
          <input
            id="phone-input"
            type="tel"
            placeholder="Ex: 90 12 34 56"
            value={telephone}
            onChange={(e) => setTelephone(e.target.value)}
            className="input input-bordered input-lg w-full text-lg font-bold"
            autoComplete="tel"
            required
          />
          <span className="text-xs text-muted">Format T-Money ou Flooz</span>
        </div>

        {/* PIN */}
        <div className="form-control gap-2">
          <label
            htmlFor="pin-input"
            className="label-text font-semibold text-base-content flex items-center gap-2"
          >
            <Lock size={18} className="text-primary" />
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
            className="input input-bordered input-lg w-full text-center text-2xl font-extrabold tracking-widest"
            autoComplete="current-password"
            required
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-lg w-full mt-2 text-lg"
          disabled={chargement}
        >
          {chargement ? (
            <span className="loading loading-spinner loading-sm" />
          ) : (
            <>
              Se connecter
              <ArrowRight size={20} aria-hidden="true" />
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
      <div className="space-y-6">
        <div className="flex justify-center pt-2">
          <AgroCapitalWordmark />
        </div>

        <motion.header
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-h1">Connexion</h1>
          <p className="mt-2 text-sm text-muted">
            Entrez votre numéro de téléphone et votre code secret à 4 chiffres.
          </p>
        </motion.header>

        <Suspense fallback={<div className="flex justify-center p-8"><span className="loading loading-spinner text-primary" /></div>}>
          <ConnexionForm />
        </Suspense>

        <div className="text-center pt-2">
          <p className="text-sm text-muted">Vous n&apos;avez pas encore de compte ?</p>
          <Link
            href="/inscription"
            className="link link-primary font-bold text-base mt-1 inline-block"
          >
            Créer mon compte Agro-Capital
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
