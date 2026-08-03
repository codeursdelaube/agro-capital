"use client";

import { useEffect, useState } from "react";
import { Wallet, Landmark, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { PageShell } from "@/_components/page-shell";
import { formatFcfa, dateCourteFr } from "@/_lib/utils";

type Mouvement = {
  id: string;
  montant: number;
  type: string;
  description: string | null;
  createdAt: string;
};

type Portefeuille = {
  id: string;
  solde: number;
  mouvements: Mouvement[];
};

export default function PortefeuillesPage() {
  const [numerique, setNumerique] = useState<Portefeuille | null>(null);
  const [bancaire, setBancaire] = useState<Portefeuille | null>(null);
  const [loading, setLoading] = useState(true);
  const [onglet, setOnglet] = useState<"numerique" | "bancaire">("numerique");

  useEffect(() => {
    async function load() {
      try {
        const [resNum, resBan] = await Promise.all([
          fetch("/api/portefeuilles/numerique"),
          fetch("/api/portefeuilles/bancaire"),
        ]);

        if (resNum.ok) {
          const json = await resNum.json();
          setNumerique(json.data);
        }
        if (resBan.ok) {
          const json = await resBan.json();
          setBancaire(json.data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <PageShell>
        <div className="flex justify-center p-12">
          <span className="loading loading-spinner loading-lg text-primary" />
        </div>
      </PageShell>
    );
  }

  const portActif = onglet === "numerique" ? numerique : bancaire;

  return (
    <PageShell>
      <div className="space-y-6">
        <header>
          <p className="text-eyebrow">Trésorerie & finances</p>
          <h1 className="mt-1 text-h1">Mes Portefeuilles</h1>
        </header>

        {/* Cartes résumé des 2 portefeuilles */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setOnglet("numerique")}
            className={`card p-4 text-left border-2 transition-all ${
              onglet === "numerique"
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-base-200 bg-white"
            }`}
          >
            <div className="flex items-center gap-2 text-primary font-bold text-xs">
              <Wallet size={16} /> Ventes & Recettes
            </div>
            <p className="text-xl font-extrabold text-base-content mt-2">
              {formatFcfa(numerique?.solde ?? 0)}
            </p>
            <span className="text-[11px] text-muted font-medium">Portefeuille numérique</span>
          </button>

          <button
            onClick={() => setOnglet("bancaire")}
            className={`card p-4 text-left border-2 transition-all ${
              onglet === "bancaire"
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-base-200 bg-white"
            }`}
          >
            <div className="flex items-center gap-2 text-primary font-bold text-xs">
              <Landmark size={16} /> Prêts & Nantissement
            </div>
            <p className="text-xl font-extrabold text-base-content mt-2">
              {formatFcfa(bancaire?.solde ?? 0)}
            </p>
            <span className="text-[11px] text-muted font-medium">Portefeuille bancaire</span>
          </button>
        </div>

        {/* Historique des mouvements */}
        <section className="card bg-white border border-base-200 p-5 space-y-4 shadow-xs">
          <h2 className="text-h2 flex items-center gap-2">
            Historique des mouvements ({onglet === "numerique" ? "Recettes Ventes" : "Prêts Nantissement"})
          </h2>

          {!portActif || portActif.mouvements.length === 0 ? (
            <p className="text-sm text-muted text-center py-6">Aucun mouvement enregistré pour le moment.</p>
          ) : (
            <div className="space-y-3">
              {portActif.mouvements.map((m) => {
                const estCredit = m.montant > 0 || m.type === "CREDIT" || m.type === "DECAISSEMENT_PRET" || m.type === "VENTE";
                return (
                  <div key={m.id} className="flex justify-between items-center p-3 rounded-xl bg-base-100">
                    <div className="flex items-center gap-3">
                      <span className={`flex h-9 w-9 items-center justify-center rounded-xl font-bold ${estCredit ? "bg-success/15 text-success" : "bg-error/15 text-error"}`}>
                        {estCredit ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                      </span>
                      <div>
                        <strong className="block text-sm text-base-content">{m.description ?? m.type}</strong>
                        <span className="text-xs text-muted">{dateCourteFr(m.createdAt)}</span>
                      </div>
                    </div>
                    <span className={`font-extrabold text-sm ${estCredit ? "text-success" : "text-base-content"}`}>
                      {estCredit ? "+" : ""}{formatFcfa(m.montant)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </PageShell>
  );
}
