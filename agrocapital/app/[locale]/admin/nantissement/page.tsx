"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageShell } from "@/_components/page-shell";
import { formatFcfa, dateCourteFr } from "@/_lib/utils";
import { Building2, CheckCircle, XCircle, ArrowLeft, ShieldCheck, User, AlertTriangle } from "lucide-react";
import { useCurrentUser } from "@/_hooks/useCurrentUser";

type DemandeWarrantageAdmin = {
  id: string;
  montantDemande: number;
  montantDebloque: number | null;
  statut: "EN_ATTENTE" | "APPROUVEE" | "REJETEE" | "SOLDEE";
  createdAt: string;
  user: {
    id: string;
    nom: string;
    prenom: string | null;
    telephone: string;
    region: string;
  };
  stock: {
    id: string;
    culture: string;
    quantiteKg: number;
    valeurEstimee: number;
  };
};

export default function AdminWarrantageValidationPage() {
  const { user, isLoading } = useCurrentUser();
  const router = useRouter();
  const [demandes, setDemandes] = useState<DemandeWarrantageAdmin[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Redirection immédiate si non-ADMIN
  useEffect(() => {
    if (!isLoading && (!user || user.role !== "ADMIN")) {
      router.replace("/");
    }
  }, [user, isLoading, router]);

  const fetchDemandes = async () => {
    setLoadingData(true);
    try {
      const res = await fetch("/api/admin/nantissement");
      if (res.ok) {
        const json = await res.json();
        setDemandes(json.data.demandes ?? []);
      } else {
        const json = await res.json();
        setMessage(`⚠️ ${json.error ?? "Accès refusé"}`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (user?.role === "ADMIN") {
      fetchDemandes();
    }
  }, [user]);

  const handleTraiter = async (id: string, statut: "APPROUVEE" | "REJETEE") => {
    setProcessingId(id);
    setMessage(null);

    try {
      const res = await fetch(`/api/nantissement/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut }),
      });

      if (res.ok) {
        setMessage(
          statut === "APPROUVEE"
            ? "✓ Avance de trésorerie approuvée et créditée sur le portefeuille bancaire de l'agriculteur."
            : "✓ Demande rejetée et stock libéré."
        );
        fetchDemandes();
      } else {
        const json = await res.json();
        setMessage(`⚠️ ${json.error ?? "Erreur de traitement"}`);
      }
    } catch {
      setMessage("⚠️ Erreur réseau");
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading || (!user || user.role !== "ADMIN")) {
    return (
      <PageShell>
        <div className="flex flex-col items-center justify-center p-12 space-y-4">
          <span className="loading loading-spinner loading-lg text-emerald-600" />
          <p className="text-sm font-bold text-slate-500">Vérification des droits d'accès Administrateur / IMF...</p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="space-y-6 max-w-5xl mx-auto pb-12">
        <Link
          href="/nantissement"
          className="inline-flex items-center gap-2 text-sm font-bold text-emerald-600 hover:underline"
        >
          <ArrowLeft size={16} /> Espace Warrantage
        </Link>

        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-eyebrow flex items-center gap-1.5 text-emerald-700 font-extrabold">
              <Building2 size={16} /> Espace Validation Partenaire Financier (IMF)
            </p>
            <h1 className="mt-1 text-h1">Gestion des Dossiers de Warrantage</h1>
            <p className="mt-1 text-xs text-slate-500 font-medium">
              Point de contact avec notre institution partenaire FinAgro Partenaire (IMF Agréée). Validation et déboursement des avances de trésorerie sur stocks de céréales et légumineuses.
            </p>
          </div>
          <span className="badge bg-emerald-100 text-emerald-800 border border-emerald-200 font-extrabold px-3 py-2 rounded-full text-xs">
            <ShieldCheck size={14} className="mr-1" /> Accès Administrateur / IMF
          </span>
        </header>

        {message && (
          <div className="alert bg-slate-900 text-white border border-emerald-500/40 rounded-2xl text-xs font-bold p-4">
            <span>{message}</span>
          </div>
        )}

        {loadingData ? (
          <div className="flex justify-center p-12">
            <span className="loading loading-spinner loading-lg text-emerald-600" />
          </div>
        ) : demandes.length === 0 ? (
          <div className="card bg-white border border-slate-200 p-8 text-center space-y-2 rounded-3xl">
            <p className="text-sm font-bold text-slate-500">Aucun dossier de warrantage soumis pour le moment.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {demandes.map((d) => {
              const isEnAttente = d.statut === "EN_ATTENTE";
              return (
                <div
                  key={d.id}
                  className="card bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs space-y-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 font-bold">
                        <User size={20} />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-base text-slate-900 leading-snug">
                          {d.user.nom} {d.user.prenom ?? ""}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium">
                          Tél : <span className="font-bold text-slate-700">{d.user.telephone}</span> · Région : <span className="font-bold text-slate-700">{d.user.region}</span>
                        </p>
                      </div>
                    </div>
                    <span
                      className={`badge border-0 font-extrabold text-xs px-3 py-1.5 rounded-full ${
                        d.statut === "EN_ATTENTE"
                          ? "bg-amber-100 text-amber-800"
                          : d.statut === "APPROUVEE"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {d.statut === "EN_ATTENTE"
                        ? "⏳ En attente validation IMF"
                        : d.statut === "APPROUVEE"
                        ? "✓ Approuvée (Avance versée)"
                        : "✕ Rejetée (Stock libéré)"}
                    </span>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl text-xs">
                    <div>
                      <span className="text-slate-400 font-bold block">Stock de Garantie :</span>
                      <strong className="text-slate-900 font-extrabold text-sm block mt-0.5">
                        {d.stock.culture} ({d.stock.quantiteKg} kg)
                      </strong>
                      <span className="text-slate-500 font-medium">
                        Valeur estimée : {formatFcfa(d.stock.valeurEstimee)}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 font-bold block">Avance Demandée (70% max) :</span>
                      <strong className="text-emerald-700 font-black text-base block mt-0.5">
                        {formatFcfa(d.montantDemande)}
                      </strong>
                    </div>

                    <div>
                      <span className="text-slate-400 font-bold block">Date de la Demande :</span>
                      <span className="text-slate-700 font-bold block mt-0.5">
                        {dateCourteFr(d.createdAt)}
                      </span>
                    </div>
                  </div>

                  {isEnAttente && (
                    <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => handleTraiter(d.id, "REJETEE")}
                        disabled={processingId === d.id}
                        className="btn btn-ghost btn-sm text-rose-600 hover:bg-rose-50 font-bold rounded-xl gap-1"
                      >
                        <XCircle size={16} /> Rejeter Dossier
                      </button>
                      <button
                        onClick={() => handleTraiter(d.id, "APPROUVEE")}
                        disabled={processingId === d.id}
                        className="btn bg-emerald-600 hover:bg-emerald-700 text-white border-0 btn-sm font-extrabold rounded-xl shadow-md shadow-emerald-600/20 gap-1.5 px-5"
                      >
                        <CheckCircle size={16} /> Approuver & Libérer Avance (FinAgro)
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PageShell>
  );
}
