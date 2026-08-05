"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageShell } from "@/_components/page-shell";
import { ShieldCheck, Users, Search, Ban, CheckCircle, LogOut, Phone, MapPin } from "lucide-react";
import { dateCourteFr } from "@/_lib/utils";

type UtilisateurAdmin = {
  id: string;
  telephone: string;
  nom: string;
  prenom: string | null;
  region: string;
  role: "AGRICULTEUR" | "CLIENT" | "ADMIN";
  actif: boolean;
  createdAt: string;
  _count?: {
    stocks: number;
    commandesAcheteur: number;
    commandesVendeur: number;
    demandesNantissement: number;
  };
};

export default function AdminUtilisateursPage() {
  const router = useRouter();
  const [utilisateurs, setUtilisateurs] = useState<UtilisateurAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFiltre, setRoleFiltre] = useState<string>("");
  const [recherche, setRecherche] = useState<string>("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const fetchUtilisateurs = async () => {
    setLoading(true);
    try {
      const url = new URL("/api/admin/utilisateurs", window.location.origin);
      if (roleFiltre) url.searchParams.set("role", roleFiltre);
      if (recherche) url.searchParams.set("q", recherche);

      const res = await fetch(url.toString());
      if (res.ok) {
        const json = await res.json();
        setUtilisateurs(json.data.utilisateurs ?? []);
      } else if (res.status === 401 || res.status === 403) {
        router.replace("/djobokoumin/connexion");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUtilisateurs();
  }, [roleFiltre]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUtilisateurs();
  };

  const handleToggleActif = async (id: string, nouvelEtatActif: boolean) => {
    setProcessingId(id);
    setMessage(null);

    try {
      const res = await fetch(`/api/admin/utilisateurs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actif: nouvelEtatActif }),
      });

      if (res.ok) {
        setMessage(
          nouvelEtatActif
            ? "✓ Compte réactivé avec succès."
            : "🛑 Compte banni avec succès. La session active a été supprimée."
        );
        fetchUtilisateurs();
      } else {
        const json = await res.json();
        setMessage(`⚠️ ${json.error ?? "Erreur lors de la modification"}`);
      }
    } catch {
      setMessage("⚠️ Erreur réseau");
    } finally {
      setProcessingId(null);
    }
  };

  const handleLogoutAdmin = async () => {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.replace("/");
  };

  return (
    <PageShell>
      <div className="space-y-6 max-w-5xl mx-auto pb-12">
        {/* Navigation Admin Bar */}
        <div className="card bg-slate-900 text-white p-4 rounded-3xl border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
              <Users size={22} />
            </div>
            <div>
              <h1 className="font-extrabold text-lg text-white">Gestion des Utilisateurs & Bannissements</h1>
              <p className="text-xs text-slate-400 font-medium">Contrôle d'accès des comptes agriculteurs et clients</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
            <Link href="/djobokoumin" className="btn btn-sm bg-slate-800 hover:bg-slate-700 text-slate-200 border-0 rounded-xl">
              📊 Tableau de bord
            </Link>
            <Link href="/djobokoumin/nantissement" className="btn btn-sm bg-slate-800 hover:bg-slate-700 text-slate-200 border-0 rounded-xl">
              📋 Validation Warrantage
            </Link>
            <Link href="/djobokoumin/utilisateurs" className="btn btn-sm bg-emerald-600 hover:bg-emerald-700 text-white border-0 rounded-xl">
              👥 Utilisateurs
            </Link>
            <button onClick={handleLogoutAdmin} className="btn btn-sm btn-ghost text-rose-400 hover:bg-rose-950/50 rounded-xl gap-1">
              <LogOut size={14} /> Déconnexion
            </button>
          </div>
        </div>

        {message && (
          <div className="alert bg-slate-900 text-white border border-emerald-500/40 rounded-2xl text-xs font-bold p-4">
            <span>{message}</span>
          </div>
        )}

        {/* Filtres & Recherche */}
        <div className="card bg-white border border-slate-200 rounded-3xl p-4 shadow-xs flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
            <input
              type="text"
              placeholder="Rechercher par nom, prénom ou téléphone..."
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              className="input input-bordered input-sm rounded-xl font-bold flex-1"
            />
            <button type="submit" className="btn btn-emerald bg-emerald-600 hover:bg-emerald-700 text-white border-0 btn-sm rounded-xl font-bold gap-1">
              <Search size={14} /> Rechercher
            </button>
          </form>

          <div className="flex items-center gap-2 text-xs font-bold shrink-0">
            <button
              onClick={() => setRoleFiltre("")}
              className={`btn btn-xs rounded-lg ${!roleFiltre ? "bg-slate-900 text-white" : "btn-ghost"}`}
            >
              Tous ({utilisateurs.length})
            </button>
            <button
              onClick={() => setRoleFiltre("AGRICULTEUR")}
              className={`btn btn-xs rounded-lg ${roleFiltre === "AGRICULTEUR" ? "bg-emerald-600 text-white" : "btn-ghost text-emerald-700"}`}
            >
              Agriculteurs
            </button>
            <button
              onClick={() => setRoleFiltre("CLIENT")}
              className={`btn btn-xs rounded-lg ${roleFiltre === "CLIENT" ? "bg-blue-600 text-white" : "btn-ghost text-blue-700"}`}
            >
              Clients
            </button>
          </div>
        </div>

        {/* Liste des utilisateurs */}
        {loading ? (
          <div className="flex justify-center p-12">
            <span className="loading loading-spinner loading-lg text-emerald-600" />
          </div>
        ) : utilisateurs.length === 0 ? (
          <div className="card bg-white border border-slate-200 p-8 text-center rounded-3xl">
            <p className="text-sm font-bold text-slate-500">Aucun utilisateur trouvé.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {utilisateurs.map((u) => (
              <div
                key={u.id}
                className={`card bg-white border rounded-3xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                  !u.actif ? "border-rose-200 bg-rose-50/20" : "border-slate-200/90"
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <strong className="text-slate-900 font-extrabold text-base">
                      {u.nom} {u.prenom ?? ""}
                    </strong>
                    <span
                      className={`badge border-0 font-extrabold text-[11px] ${
                        u.role === "AGRICULTEUR"
                          ? "bg-emerald-100 text-emerald-800"
                          : u.role === "ADMIN"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {u.role}
                    </span>
                    <span
                      className={`badge border-0 font-bold text-[11px] ${
                        u.actif ? "bg-emerald-500/10 text-emerald-700" : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {u.actif ? "🟢 Actif" : "🛑 Banni"}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
                    <span className="flex items-center gap-1">
                      <Phone size={13} className="text-slate-400" /> {u.telephone}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin size={13} className="text-slate-400" /> {u.region}
                    </span>
                    <span>Inscrit le {dateCourteFr(u.createdAt)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                  {u.role !== "ADMIN" && (
                    u.actif ? (
                      <button
                        onClick={() => handleToggleActif(u.id, false)}
                        disabled={processingId === u.id}
                        className="btn btn-outline btn-error btn-xs font-bold rounded-xl gap-1"
                      >
                        <Ban size={14} /> Bannir le compte
                      </button>
                    ) : (
                      <button
                        onClick={() => handleToggleActif(u.id, true)}
                        disabled={processingId === u.id}
                        className="btn bg-emerald-600 hover:bg-emerald-700 text-white border-0 btn-xs font-bold rounded-xl gap-1"
                      >
                        <CheckCircle size={14} /> Réactiver le compte
                      </button>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
