"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Lock, MapPin, Phone, User, AlertCircle } from "lucide-react";
import { motion } from "motion/react";
import { PageShell } from "@/_components/page-shell";
import { AgroCapitalWordmark } from "@/_components/app-nav";
import { REGIONS_TOGO } from "@/_lib/utils";

export default function InscriptionPage() {
  const [nom, setNom] = useState("");
  const [region, setRegion] = useState<string>("Lomé");
  const [telephone, setTelephone] = useState("");
  const [role, setRole] = useState<"AGRICULTEUR" | "CLIENT">("AGRICULTEUR");
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreur(null);

    if (pin !== pinConfirm) {
      setErreur("Les deux codes PIN ne correspondent pas.");
      return;
    }

    setChargement(true);

    try {
      const res = await fetch("/api/auth/inscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom, region, telephone, pin, role }),
      });

      const json = await res.json();

      if (!res.ok) {
        setErreur(json.error ?? "Inscription impossible. Vérifiez vos informations.");
        return;
      }

      // Auto-connexion après inscription
      const loginRes = await fetch("/api/auth/connexion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telephone, pin }),
      });

      if (!loginRes.ok) {
        window.location.href = "/connexion";
        return;
      }

      // Rechargement complet pour activer la session
      window.location.href = "/";
    } catch {
      setErreur("Problème de connexion. Vérifiez votre réseau.");
    } finally {
      setChargement(false);
    }
  };

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
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">Créer mon compte</h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Inscrivez-vous en 1 minute pour accéder aux services.
          </p>
        </motion.header>

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

            {/* Type de compte */}
            <div className="form-control gap-2">
              <span className="label-text font-bold text-slate-800 dark:text-slate-200">Je suis</span>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("AGRICULTEUR")}
                  className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border-2 transition-all ${
                    role === "AGRICULTEUR"
                      ? "border-emerald-600 bg-emerald-50/50 text-emerald-900 font-extrabold"
                      : "border-slate-200 hover:border-slate-300 text-slate-600 font-bold"
                  }`}
                >
                  <span className="text-2xl mb-1">🌾</span>
                  <span className="text-xs sm:text-sm">Agriculteur</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole("CLIENT")}
                  className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border-2 transition-all ${
                    role === "CLIENT"
                      ? "border-emerald-600 bg-emerald-50/50 text-emerald-900 font-extrabold"
                      : "border-slate-200 hover:border-slate-300 text-slate-600 font-bold"
                  }`}
                >
                  <span className="text-2xl mb-1">🛒</span>
                  <span className="text-xs sm:text-sm">Client / Acheteur</span>
                </button>
              </div>
            </div>

            {/* Nom */}
            <div className="form-control gap-1.5">
              <label
                htmlFor="nom-input"
                className="label-text font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2"
              >
                <User size={16} className="text-emerald-600" />
                Nom et Prénom
              </label>
              <input
                id="nom-input"
                type="text"
                placeholder="Ex: Akouvi Mensah"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                className="input input-bordered input-lg w-full font-bold text-base text-slate-900 bg-slate-50/50 focus:bg-white border-slate-200 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 rounded-2xl transition-all"
                autoComplete="name"
                required
              />
            </div>

            {/* Région */}
            <div className="form-control gap-1.5">
              <label
                htmlFor="region-select"
                className="label-text font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2"
              >
                <MapPin size={16} className="text-emerald-600" />
                Votre région
              </label>
              <select
                id="region-select"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="select select-bordered select-lg w-full font-bold text-base text-slate-900 bg-slate-50/50 focus:bg-white border-slate-200 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 rounded-2xl transition-all"
                required
              >
                {REGIONS_TOGO.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* Téléphone */}
            <div className="form-control gap-1.5">
              <label
                htmlFor="reg-phone-input"
                className="label-text font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2"
              >
                <Phone size={16} className="text-emerald-600" />
                Numéro de téléphone
              </label>
              <input
                id="reg-phone-input"
                type="tel"
                inputMode="tel"
                placeholder="Ex: 90 12 34 56"
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                className="input input-bordered input-lg w-full font-bold text-lg text-slate-900 bg-slate-50/50 focus:bg-white border-slate-200 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 rounded-2xl transition-all"
                autoComplete="tel"
                required
              />
              <span className="text-[11px] text-slate-400 font-medium">Format togolais T-Money ou Flooz</span>
            </div>

            {/* PIN & Confirmation */}
            <div className="grid grid-cols-2 gap-3">
              <div className="form-control gap-1.5">
                <label
                  htmlFor="reg-pin-input"
                  className="label-text font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5"
                >
                  <Lock size={14} className="text-emerald-600" />
                  PIN (4-6 ch.)
                </label>
                <input
                  id="reg-pin-input"
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="••••"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="input input-bordered input-md w-full text-center text-xl font-extrabold tracking-widest text-slate-900 bg-slate-50/50 focus:bg-white border-slate-200 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 rounded-2xl transition-all"
                  autoComplete="new-password"
                  required
                />
              </div>

              <div className="form-control gap-1.5">
                <label
                  htmlFor="reg-pin-confirm"
                  className="label-text font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5"
                >
                  <Lock size={14} className="text-emerald-600" />
                  Confirmer PIN
                </label>
                <input
                  id="reg-pin-confirm"
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="••••"
                  value={pinConfirm}
                  onChange={(e) => setPinConfirm(e.target.value)}
                  className="input input-bordered input-md w-full text-center text-xl font-extrabold tracking-widest text-slate-900 bg-slate-50/50 focus:bg-white border-slate-200 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 rounded-2xl transition-all"
                  autoComplete="new-password"
                  required
                />
              </div>
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
                  Créer mon compte
                  <ArrowRight size={18} aria-hidden="true" />
                </>
              )}
            </button>
          </div>
        </motion.form>

        <div className="text-center pt-2">
          <p className="text-sm text-slate-500">Vous avez déjà un compte ?</p>
          <Link
            href="/connexion"
            className="text-sm font-extrabold text-emerald-600 hover:text-emerald-700 hover:underline mt-1 inline-block"
          >
            Se connecter →
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
