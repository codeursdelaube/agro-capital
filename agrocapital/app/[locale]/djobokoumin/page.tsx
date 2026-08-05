"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck, ArrowUpRight, UserCheck, LogOut } from "lucide-react";
import { PageShell } from "@/_components/page-shell";
import { dateCourteFr } from "@/_lib/utils";

type AdminStats = {
  totalUtilisateurs: number;
  totalAgriculteurs: number;
  totalClients: number;
  demandesAttente: number;
  demandesApprouvees: number;
  derniersInscrits: {
    id: string;
    nom: string;
    prenom: string | null;
    telephone: string;
    role: string;
    region: string;
    createdAt: string;
  }[];
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) {
        const json = await res.json();
        setStats(json.data);
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
    fetchStats();
  }, []);

  const handleLogoutAdmin = async () => {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.replace("/");
  };

  return (
    <PageShell>
      <div className="max-w-6xl mx-auto space-y-6 pb-12">
        {/* Navigation Admin Bar */}
        <div className="card bg-slate-900 text-white p-4 rounded-3xl border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h1 className="font-extrabold text-lg text-white">Portail Secret Admin — Agro-Capital</h1>
              <p className="text-xs text-slate-400 font-medium">Administration générale & Point de contact FinAgro IMF</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
            <Link href="/djobokoumin" className="btn btn-sm bg-emerald-600 hover:bg-emerald-700 text-white border-0 rounded-xl">
              📊 Tableau de bord
            </Link>
            <Link href="/djobokoumin/nantissement" className="btn btn-sm bg-slate-800 hover:bg-slate-700 text-slate-200 border-0 rounded-xl">
              📋 Validation Warrantage
            </Link>
            <Link href="/djobokoumin/utilisateurs" className="btn btn-sm bg-slate-800 hover:bg-slate-700 text-slate-200 border-0 rounded-xl">
              👥 Utilisateurs
            </Link>
            <button onClick={handleLogoutAdmin} className="btn btn-sm btn-ghost text-rose-400 hover:bg-rose-950/50 rounded-xl gap-1">
              <LogOut size={14} /> Déconnexion
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center p-12">
            <span className="loading loading-spinner loading-lg text-emerald-600" />
          </div>
        ) : stats ? (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="card bg-white border border-slate-200 p-5 rounded-3xl shadow-xs space-y-2">
                <span className="text-xs font-extrabold text-slate-400 block uppercase tracking-wider">Demandes en attente</span>
                <strong className="text-3xl font-black text-amber-600 block">{stats.demandesAttente}</strong>
                <Link href="/djobokoumin/nantissement" className="inline-flex items-center text-xs font-bold text-emerald-600 hover:underline gap-1 pt-1">
                  Valider les dossiers <ArrowUpRight size={14} />
                </Link>
              </div>

              <div className="card bg-white border border-slate-200 p-5 rounded-3xl shadow-xs space-y-2">
                <span className="text-xs font-extrabold text-slate-400 block uppercase tracking-wider">Total Utilisateurs</span>
                <strong className="text-3xl font-black text-slate-900 block">{stats.totalUtilisateurs}</strong>
                <span className="text-xs text-slate-500 font-medium block">Comptes enregistrés</span>
              </div>

              <div className="card bg-white border border-slate-200 p-5 rounded-3xl shadow-xs space-y-2">
                <span className="text-xs font-extrabold text-slate-400 block uppercase tracking-wider">Agriculteurs</span>
                <strong className="text-3xl font-black text-emerald-700 block">{stats.totalAgriculteurs}</strong>
                <span className="text-xs text-slate-500 font-medium block">Producteurs locaux</span>
              </div>

              <div className="card bg-white border border-slate-200 p-5 rounded-3xl shadow-xs space-y-2">
                <span className="text-xs font-extrabold text-slate-400 block uppercase tracking-wider">Acheteurs / Clients</span>
                <strong className="text-3xl font-black text-blue-700 block">{stats.totalClients}</strong>
                <span className="text-xs text-slate-500 font-medium block">Acheteurs enregistrés</span>
              </div>
            </div>

            {/* Dernières Inscriptions */}
            <div className="card bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                  <UserCheck size={18} className="text-emerald-600" /> Dernières inscriptions
                </h2>
                <Link href="/djobokoumin/utilisateurs" className="text-xs font-bold text-emerald-600 hover:underline">
                  Voir tous les utilisateurs →
                </Link>
              </div>

              <div className="divide-y divide-slate-100">
                {stats.derniersInscrits.map((u) => (
                  <div key={u.id} className="py-3 flex items-center justify-between text-xs gap-3">
                    <div>
                      <strong className="font-bold text-slate-900 block text-sm">{u.nom} {u.prenom ?? ""}</strong>
                      <span className="text-slate-500 font-medium">Tél : {u.telephone} · Région : {u.region}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`badge border-0 font-extrabold text-[11px] ${u.role === "AGRICULTEUR" ? "bg-emerald-100 text-emerald-800" : u.role === "ADMIN" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"}`}>
                        {u.role}
                      </span>
                      <span className="text-slate-400 font-medium text-[11px]">{dateCourteFr(u.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </PageShell>
  );
}
