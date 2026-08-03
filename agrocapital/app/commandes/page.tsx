"use client";

import { useEffect, useState, useCallback } from "react";
import { ShoppingBag, CheckCircle, Smartphone, Truck } from "lucide-react";
import { PageShell } from "@/_components/page-shell";
import { formatFcfa, STATUT_COMMANDE_LABEL, statutCommandeBadge, dateCourteFr } from "@/_lib/utils";

type Commande = {
  id: string;
  quantite: number;
  montantTotal: number;
  statut: string;
  modePaiement: string | null;
  createdAt: string;
  produit: {
    nom: string;
    culture: string;
    uniteMesure: string;
  };
  acheteur: {
    id: string;
    nom: string;
    telephone: string;
    region: string;
  };
  vendeur: {
    id: string;
    nom: string;
    telephone: string;
    region: string;
  };
};

export default function CommandesPage() {
  const [roleVue, setRoleVue] = useState<"acheteur" | "vendeur">("vendeur");
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [loading, setLoading] = useState(true);

  // Modale de paiement mobile money pour acheteur
  const [commandePaiement, setCommandePaiement] = useState<Commande | null>(null);
  const [operateur, setOperateur] = useState<"TMONEY" | "FLOOZ">("TMONEY");
  const [numero, setNumero] = useState("");
  const [payerState, setPayerState] = useState(false);
  const [msgPaiement, setMsgPaiement] = useState<string | null>(null);

  const loadCommandes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/marketplace/commandes?role=${roleVue}`);
      if (res.ok) {
        const json = await res.json();
        setCommandes(json.data.commandes ?? []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [roleVue]);

  useEffect(() => {
    loadCommandes();
  }, [loadCommandes]);

  const handleChangerStatut = async (id: string, nouveauStatut: string) => {
    try {
      const res = await fetch(`/api/marketplace/commandes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut: nouveauStatut }),
      });

      if (res.ok) {
        loadCommandes();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePayerMobileMoney = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandePaiement) return;

    setPayerState(true);
    setMsgPaiement(null);

    try {
      const res = await fetch("/api/paiement/mobile-money", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commandeId: commandePaiement.id,
          operateur,
          numeroCible: numero,
          montant: commandePaiement.montantTotal,
        }),
      });

      const json = await res.json();
      if (res.ok) {
        setMsgPaiement("Paiement réussi ! Commande livrée et validée.");
        setTimeout(() => {
          setCommandePaiement(null);
          loadCommandes();
        }, 1500);
      } else {
        setMsgPaiement(json.error ?? "Paiement refusé — simulation sandbox");
      }
    } catch {
      setMsgPaiement("Erreur réseau");
    } finally {
      setPayerState(false);
    }
  };

  return (
    <PageShell>
      <div className="space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-eyebrow">Marketplace & Livraisons</p>
            <h1 className="mt-1 text-h1">Gestion des Commandes</h1>
          </div>
        </header>

        {/* Sélecteur de rôle (Vendeur vs Acheteur) */}
        <div className="grid grid-cols-2 gap-2 bg-base-200 p-1.5 rounded-2xl">
          <button
            onClick={() => setRoleVue("vendeur")}
            className={`btn btn-md font-bold rounded-xl border-0 ${roleVue === "vendeur" ? "bg-white text-primary shadow-xs" : "btn-ghost"}`}
          >
            Commandes reçues (Vendeur)
          </button>
          <button
            onClick={() => setRoleVue("acheteur")}
            className={`btn btn-md font-bold rounded-xl border-0 ${roleVue === "acheteur" ? "bg-white text-primary shadow-xs" : "btn-ghost"}`}
          >
            Mes achats (Acheteur)
          </button>
        </div>

        {/* Liste */}
        {loading ? (
          <div className="flex justify-center p-12">
            <span className="loading loading-spinner loading-lg text-primary" />
          </div>
        ) : commandes.length === 0 ? (
          <div className="card bg-white p-8 text-center border border-base-200 space-y-2">
            <ShoppingBag size={40} className="mx-auto text-muted" />
            <p className="text-sm font-semibold text-muted">Aucune commande enregistrée sous ce profil.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {commandes.map((c) => (
              <div key={c.id} className="card bg-white border border-base-200 p-5 space-y-4 shadow-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs text-muted font-bold block">{dateCourteFr(c.createdAt)}</span>
                    <h3 className="font-bold text-lg text-base-content">{c.produit.nom}</h3>
                    <p className="text-xs text-muted">
                      {roleVue === "vendeur" ? `Client : ${c.acheteur.nom} (${c.acheteur.telephone})` : `Vendeur : ${c.vendeur.nom} (${c.vendeur.telephone})`}
                    </p>
                  </div>
                  <span className={`badge ${statutCommandeBadge(c.statut)} font-bold text-xs p-2`}>
                    {STATUT_COMMANDE_LABEL[c.statut] ?? c.statut}
                  </span>
                </div>

                <div className="flex justify-between items-baseline bg-base-100 p-3 rounded-xl">
                  <div>
                    <span className="text-xs text-muted block">Quantité :</span>
                    <strong className="text-base font-bold">{c.quantite} {c.produit.uniteMesure}</strong>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-muted block">Montant total :</span>
                    <strong className="text-lg font-extrabold text-primary">{formatFcfa(c.montantTotal)}</strong>
                  </div>
                </div>

                {/* Actions par machine à états */}
                <div className="flex flex-wrap gap-2 pt-2 border-t border-base-100">
                  {roleVue === "vendeur" && c.statut === "EN_ATTENTE" && (
                    <button
                      onClick={() => handleChangerStatut(c.id, "CONFIRMEE")}
                      className="btn btn-primary btn-sm font-bold flex-1"
                    >
                      <CheckCircle size={16} /> Confirmer la commande
                    </button>
                  )}

                  {roleVue === "vendeur" && c.statut === "CONFIRMEE" && (
                    <button
                      onClick={() => handleChangerStatut(c.id, "EN_LIVRAISON")}
                      className="btn btn-primary btn-sm font-bold flex-1"
                    >
                      <Truck size={16} /> Expédier / En livraison
                    </button>
                  )}

                  {roleVue === "acheteur" && (c.statut === "EN_LIVRAISON" || c.statut === "CONFIRMEE") && (
                    <button
                      onClick={() => {
                        setCommandePaiement(c);
                        setNumero(c.acheteur.telephone);
                        setMsgPaiement(null);
                      }}
                      className="btn btn-primary btn-sm font-bold flex-1"
                    >
                      <Smartphone size={16} /> Payer à la livraison (Mobile Money)
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modale Paiement Mobile Money */}
        {commandePaiement && (
          <dialog className="modal modal-open">
            <div className="modal-box bg-white p-6 space-y-4">
              <h3 className="font-bold text-lg">Paiement Mobile Money (Livraison)</h3>
              <p className="text-xs text-muted">
                Paiement direct de <strong>{formatFcfa(commandePaiement.montantTotal)}</strong> pour <strong>{commandePaiement.produit.nom}</strong>.
              </p>

              {msgPaiement && (
                <div className={`alert text-xs py-2 ${msgPaiement.includes("réussi") ? "alert-success" : "alert-error"}`}>
                  <span>{msgPaiement}</span>
                </div>
              )}

              <form onSubmit={handlePayerMobileMoney} className="space-y-3">
                <div className="form-control gap-1">
                  <label htmlFor="mm-op" className="label-text text-xs font-bold">Opérateur</label>
                  <select
                    id="mm-op"
                    value={operateur}
                    onChange={(e) => setOperateur(e.target.value as "TMONEY" | "FLOOZ")}
                    className="select select-bordered select-md w-full font-bold"
                  >
                    <option value="TMONEY">T-Money (Togo Cellulaire)</option>
                    <option value="FLOOZ">Flooz (Moov Africa)</option>
                  </select>
                </div>

                <div className="form-control gap-1">
                  <label htmlFor="mm-num" className="label-text text-xs font-bold">Numéro de téléphone payeur</label>
                  <input
                    id="mm-num"
                    type="tel"
                    value={numero}
                    onChange={(e) => setNumero(e.target.value)}
                    className="input input-bordered input-md w-full font-bold text-lg"
                    required
                  />
                </div>

                <div className="modal-action flex gap-2">
                  <button
                    type="button"
                    onClick={() => setCommandePaiement(null)}
                    className="btn btn-ghost flex-1"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={payerState}
                    className="btn btn-primary flex-1 font-bold"
                  >
                    {payerState ? <span className="loading loading-spinner" /> : "Valider le paiement"}
                  </button>
                </div>
              </form>
            </div>
          </dialog>
        )}
      </div>
    </PageShell>
  );
}
