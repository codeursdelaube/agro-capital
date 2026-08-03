"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Lock, MapPin, Phone, User } from "lucide-react";
import { motion } from "motion/react";
import { PageShell } from "@/_components/page-shell";
import { AgroCapitalWordmark } from "@/_components/app-nav";
import { REGIONS_TOGO } from "@/_lib/utils";

export default function InscriptionPage() {
  const router = useRouter();
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
      await fetch("/api/auth/connexion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telephone, pin }),
      });

      router.push("/");
      router.refresh();
    } catch {
      setErreur("Problème de connexion. Vérifiez votre réseau.");
    } finally {
      setChargement(false);
    }
  };

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
          <h1 className="text-h1">Créer mon compte</h1>
          <p className="mt-2 text-sm text-muted">
            Inscrivez-vous en 1 minute pour valoriser vos récoltes.
          </p>
        </motion.header>

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

            {/* Type de compte */}
            <div className="form-control gap-2">
              <span className="label-text font-semibold text-base-content">Je suis</span>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("AGRICULTEUR")}
                  className={`btn btn-lg flex-col h-auto py-3 gap-1 ${
                    role === "AGRICULTEUR" ? "btn-primary" : "btn-outline border-base-300"
                  }`}
                >
                  <span className="text-xl">🌾</span>
                  <span className="text-sm">Agriculteur</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole("CLIENT")}
                  className={`btn btn-lg flex-col h-auto py-3 gap-1 ${
                    role === "CLIENT" ? "btn-primary" : "btn-outline border-base-300"
                  }`}
                >
                  <span className="text-xl">🛒</span>
                  <span className="text-sm">Client / Acheteur</span>
                </button>
              </div>
            </div>

            {/* Nom */}
            <div className="form-control gap-2">
              <label
                htmlFor="nom-input"
                className="label-text font-semibold text-base-content flex items-center gap-2"
              >
                <User size={18} className="text-primary" />
                Nom et Prénom
              </label>
              <input
                id="nom-input"
                type="text"
                placeholder="Ex: Akouvi Mensah"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                className="input input-bordered input-lg w-full text-base font-semibold"
                autoComplete="name"
                required
              />
            </div>

            {/* Région */}
            <div className="form-control gap-2">
              <label
                htmlFor="region-select"
                className="label-text font-semibold text-base-content flex items-center gap-2"
              >
                <MapPin size={18} className="text-primary" />
                Votre région
              </label>
              <select
                id="region-select"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="select select-bordered select-lg w-full font-semibold"
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
            <div className="form-control gap-2">
              <label
                htmlFor="reg-phone-input"
                className="label-text font-semibold text-base-content flex items-center gap-2"
              >
                <Phone size={18} className="text-primary" />
                Numéro de téléphone
              </label>
              <input
                id="reg-phone-input"
                type="tel"
                placeholder="Ex: 90123456"
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                className="input input-bordered input-lg w-full text-lg font-bold"
                autoComplete="tel"
                required
              />
              <span className="text-xs text-muted">Ce numéro sera utilisé pour vos paiements Mobile Money.</span>
            </div>

            {/* PIN */}
            <div className="form-control gap-2">
              <label
                htmlFor="reg-pin-input"
                className="label-text font-semibold text-base-content flex items-center gap-2"
              >
                <Lock size={18} className="text-primary" />
                Code secret PIN (4 à 6 chiffres)
              </label>
              <input
                id="reg-pin-input"
                type="password"
                inputMode="numeric"
                maxLength={6}
                placeholder="••••"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="input input-bordered input-lg w-full text-center text-2xl font-extrabold tracking-widest"
                autoComplete="new-password"
                required
              />
            </div>

            {/* Confirmation PIN */}
            <div className="form-control gap-2">
              <label
                htmlFor="reg-pin-confirm"
                className="label-text font-semibold text-base-content flex items-center gap-2"
              >
                <Lock size={18} className="text-primary" />
                Confirmez votre PIN
              </label>
              <input
                id="reg-pin-confirm"
                type="password"
                inputMode="numeric"
                maxLength={6}
                placeholder="••••"
                value={pinConfirm}
                onChange={(e) => setPinConfirm(e.target.value)}
                className="input input-bordered input-lg w-full text-center text-2xl font-extrabold tracking-widest"
                autoComplete="new-password"
                required
              />
              <span className="text-xs text-muted">Ce code vous protège lors des demandes de cash.</span>
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
                  Créer mon compte
                  <ArrowRight size={20} aria-hidden="true" />
                </>
              )}
            </button>
          </div>
        </motion.form>

        <div className="text-center pt-2">
          <p className="text-sm text-muted">Vous avez déjà un compte ?</p>
          <Link href="/connexion" className="link link-primary font-bold text-base mt-1 inline-block">
            Se connecter
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
