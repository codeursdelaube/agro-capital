"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Edit3,
  LogOut,
  MapPin,
  Phone,
  User as UserIcon,
} from "lucide-react";
import { motion } from "motion/react";
import { PageShell } from "@/_components/page-shell";
import { useCurrentUser } from "@/_hooks/useCurrentUser";
import { initiales, REGIONS_TOGO } from "@/_lib/utils";

export default function ProfilPage() {
  const router = useRouter();
  const { user, isLoading, refetch } = useCurrentUser();

  const [isEditing, setIsEditing] = useState(false);
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [region, setRegion] = useState("Lomé");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setNom(user.nom);
      setPrenom(user.prenom ?? "");
      setRegion(user.region);
    }
  }, [user]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/auth/profil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom, prenom, region }),
      });

      if (res.ok) {
        setMessage("Profil mis à jour avec succès");
        setIsEditing(false);
        refetch();
      } else {
        const json = await res.json();
        setMessage(json.error ?? "Erreur lors de la mise à jour");
      }
    } catch {
      setMessage("Erreur réseau");
    } finally {
      setSaving(false);
    }
  };

  const handleDeconnexion = async () => {
    await fetch("/api/auth/profil", { method: "DELETE" });
    router.push("/connexion");
    router.refresh();
  };

  if (isLoading) {
    return (
      <PageShell>
        <div className="flex justify-center items-center py-20">
          <span className="loading loading-spinner loading-lg text-primary" />
        </div>
      </PageShell>
    );
  }

  if (!user) {
    return (
      <PageShell>
        <div className="card bg-white p-8 text-center space-y-4">
          <p className="text-muted">Vous n&apos;êtes pas connecté.</p>
          <button
            onClick={() => router.push("/connexion")}
            className="btn btn-primary btn-md mx-auto"
          >
            Se connecter
          </button>
        </div>
      </PageShell>
    );
  }

  const userInitials = initiales(user.nom, user.prenom);

  return (
    <PageShell>
      <div className="space-y-6">
        <header>
          <p className="text-eyebrow">Mon compte</p>
          <h1 className="mt-2 text-h1">Mon profil</h1>
        </header>

        {message && (
          <div role="alert" className="alert alert-info text-sm py-3">
            <span>{message}</span>
          </div>
        )}

        {/* Carte Identité */}
        <section className="card bg-white shadow-sm border border-base-200">
          <div className="card-body gap-5 p-5">
            <div className="flex items-center gap-4">
              <motion.div
                whileHover={{ scale: 1.06 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary text-xl font-extrabold text-white shadow-sm"
                aria-label={`Initiales de ${user.nom}`}
              >
                {userInitials}
              </motion.div>
              <div>
                <h2 className="text-h2">
                  {user.nom} {user.prenom}
                </h2>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
                  <MapPin size={14} aria-hidden="true" />
                  Région : {user.region}
                </p>
                <span className="badge badge-sm badge-outline mt-1 font-bold text-primary">
                  {user.role}
                </span>
              </div>
            </div>

            <div className="h-px bg-base-200" />

            {!isEditing ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                    <Phone size={17} aria-hidden="true" />
                  </span>
                  <div>
                    <small className="block text-xs font-semibold text-muted">
                      Numéro de téléphone
                    </small>
                    <strong className="text-base-content">{user.telephone}</strong>
                  </div>
                  <CheckCircle2
                    size={20}
                    className="text-primary shrink-0 ml-auto"
                    aria-label="Vérifié"
                  />
                </div>

                <button
                  onClick={() => setIsEditing(true)}
                  className="btn btn-outline w-full mt-1"
                >
                  <Edit3 size={17} aria-hidden="true" />
                  Modifier mes informations
                </button>
              </div>
            ) : (
              <form onSubmit={handleUpdate} className="space-y-4">
                <div className="form-control gap-1">
                  <label htmlFor="nom" className="label-text font-semibold">Nom</label>
                  <input
                    id="nom"
                    type="text"
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    className="input input-bordered w-full"
                    required
                  />
                </div>
                <div className="form-control gap-1">
                  <label htmlFor="prenom" className="label-text font-semibold">Prénom</label>
                  <input
                    id="prenom"
                    type="text"
                    value={prenom}
                    onChange={(e) => setPrenom(e.target.value)}
                    className="input input-bordered w-full"
                  />
                </div>
                <div className="form-control gap-1">
                  <label htmlFor="region" className="label-text font-semibold">Région</label>
                  <select
                    id="region"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="select select-bordered w-full"
                  >
                    {REGIONS_TOGO.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="btn btn-ghost flex-1"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary flex-1"
                    disabled={saving}
                  >
                    {saving ? <span className="loading loading-spinner" /> : "Enregistrer"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>

        {/* Sécurité */}
        <section className="card overflow-hidden bg-primary/5 border border-primary/15">
          <div className="flex items-center gap-4 p-5">
            <div className="flex-1">
              <h2 className="text-h2 text-base-content">
                Vos informations sont protégées
              </h2>
              <p className="mt-2 text-sm text-muted">
                Votre numéro est utilisé uniquement pour vos paiements et vos commandes.
              </p>
            </div>
            <div className="shrink-0">
              <Image
                src="/illustartion3.png"
                alt="Protection des données"
                width={400}
                height={400}
                className="h-28 w-28 object-contain"
              />
            </div>
          </div>
        </section>

        {/* Déconnexion */}
        <button
          onClick={handleDeconnexion}
          className="btn btn-error btn-outline w-full"
        >
          <LogOut size={18} />
          Se déconnecter
        </button>
      </div>
    </PageShell>
  );
}