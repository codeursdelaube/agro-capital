"use client";

import { useEffect, useState, useCallback } from "react";
import { Bell, Check, Trash2, UserCheck } from "lucide-react";
import { PageShell } from "@/_components/page-shell";
import { dateCourteFr } from "@/_lib/utils";

type Notification = {
  id: string;
  type: string;
  titre: string;
  message: string;
  lu: boolean;
  createdAt: string;
};

type Suivi = {
  id: string;
  cultureSuivie: string | null;
  createdAt: string;
  followedUser: {
    id: string;
    nom: string;
    prenom: string | null;
    region: string;
  } | null;
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [suivis, setSuivis] = useState<Suivi[]>([]);
  const [totalNonLues, setTotalNonLues] = useState(0);
  const [loading, setLoading] = useState(true);
  const [onglet, setOnglet] = useState<"notifications" | "suivis">("notifications");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [resNotif, resSuivi] = await Promise.all([
        fetch("/api/notifications"),
        fetch("/api/notifications/suivis"),
      ]);

      if (resNotif.ok) {
        const json = await resNotif.json();
        setNotifications(json.data.notifications ?? []);
        setTotalNonLues(json.data.totalNonLues ?? 0);
      }
      if (resSuivi.ok) {
        const json = await resSuivi.json();
        setSuivis(json.data.suivis ?? []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToutMarquerLu = async () => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toutesLues: true }),
      });
      if (res.ok) loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSeDesabonner = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/suivis?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setSuivis((prev) => prev.filter((s) => s.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <PageShell>
        <div className="flex justify-center p-12">
          <span className="loading loading-spinner loading-lg text-primary" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-eyebrow">Alerte & Suivi</p>
            <h1 className="mt-1 text-h1">Notifications</h1>
          </div>
          {totalNonLues > 0 && (
            <button onClick={handleToutMarquerLu} className="btn btn-outline btn-xs gap-1">
              <Check size={14} /> Tout marquer comme lu
            </button>
          )}
        </header>

        {/* Onglets Notifications vs Suivis */}
        <div className="grid grid-cols-2 gap-2 bg-base-200 p-1.5 rounded-2xl">
          <button
            onClick={() => setOnglet("notifications")}
            className={`btn btn-md font-bold rounded-xl border-0 ${onglet === "notifications" ? "bg-white text-primary shadow-xs" : "btn-ghost"}`}
          >
            Mes Notifications {totalNonLues > 0 && <span className="badge badge-error badge-sm">{totalNonLues}</span>}
          </button>
          <button
            onClick={() => setOnglet("suivis")}
            className={`btn btn-md font-bold rounded-xl border-0 ${onglet === "suivis" ? "bg-white text-primary shadow-xs" : "btn-ghost"}`}
          >
            Mes Abonnements ({suivis.length})
          </button>
        </div>

        {/* Contenu */}
        {onglet === "notifications" ? (
          notifications.length === 0 ? (
            <div className="card bg-white p-8 text-center border border-base-200 space-y-2">
              <Bell size={40} className="mx-auto text-muted" />
              <p className="text-sm font-semibold text-muted">Aucune notification pour le moment.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`card border p-4 space-y-1 transition-all ${
                    !n.lu ? "bg-primary/5 border-primary/30" : "bg-white border-base-200"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-sm text-base-content">{n.titre}</h3>
                    <span className="text-[11px] text-muted">{dateCourteFr(n.createdAt)}</span>
                  </div>
                  <p className="text-xs text-muted">{n.message}</p>
                </div>
              ))}
            </div>
          )
        ) : suivis.length === 0 ? (
          <div className="card bg-white p-8 text-center border border-base-200 space-y-2">
            <UserCheck size={40} className="mx-auto text-muted" />
            <p className="text-sm font-semibold text-muted">Vous ne suivez aucun agriculteur ni aucune culture.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {suivis.map((s) => (
              <div key={s.id} className="card bg-white border border-base-200 p-4 flex-row justify-between items-center">
                <div>
                  <h3 className="font-bold text-sm text-base-content">
                    {s.followedUser ? `Agriculteur : ${s.followedUser.nom} (${s.followedUser.region})` : `Culture : ${s.cultureSuivie}`}
                  </h3>
                  <span className="text-xs text-muted">Suivi depuis le {dateCourteFr(s.createdAt)}</span>
                </div>
                <button onClick={() => handleSeDesabonner(s.id)} className="btn btn-ghost btn-xs text-error">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
