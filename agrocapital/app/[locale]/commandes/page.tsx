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
    photoUrl?: string | null;
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

import { useTranslations } from "next-intl";

export default function CommandesPage() {
  const t = useTranslations("Commandes");
  const tc = useTranslations("Common");
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
        setMsgPaiement(t("paymentSuccess"));
        setTimeout(() => {
          setCommandePaiement(null);
          loadCommandes();
        }, 1500);
      } else {
        setMsgPaiement(json.error ?? t("paymentRefused"));
      }
    } catch {
      setMsgPaiement(tc("networkError"));
    } finally {
      setPayerState(false);
    }
  };

  return (
    <PageShell>
      <div className="space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-eyebrow">{t("eyebrow")}</p>
            <h1 className="mt-1 text-h1">{t("title")}</h1>
          </div>
        </header>

        {/* Sélecteur de rôle (Vendeur vs Acheteur) */}
        <div className="grid grid-cols-2 gap-2 bg-base-200 p-1.5 rounded-2xl">
          <button
            onClick={() => setRoleVue("vendeur")}
            className={`btn btn-md font-bold rounded-xl border-0 ${roleVue === "vendeur" ? "bg-white text-primary shadow-xs" : "btn-ghost"}`}
          >
            {t("receivedVendor")}
          </button>
          <button
            onClick={() => setRoleVue("acheteur")}
            className={`btn btn-md font-bold rounded-xl border-0 ${roleVue === "acheteur" ? "bg-white text-primary shadow-xs" : "btn-ghost"}`}
          >
            {t("myPurchasesBuyer")}
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
            <p className="text-sm font-semibold text-muted">{t("noOrders")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {commandes.map((c) => {
              const photoSrc =
                c.produit.photoUrl ||
                (c.produit.culture?.toLowerCase().includes("maï") || c.produit.culture?.toLowerCase().includes("corn")
                  ? "/illustartion1.png"
                  : c.produit.culture?.toLowerCase().includes("manioc") || c.produit.culture?.toLowerCase().includes("cassava")
                  ? "/illustartion3.png"
                  : "/illustartion2.png");

              return (
                <div key={c.id} className="card bg-white border border-base-200 p-5 space-y-4 shadow-xs">
                  <div className="flex gap-4 items-start">
                    <div className="h-16 w-16 shrink-0 rounded-2xl bg-slate-100 overflow-hidden border border-slate-200">
                      <img src={photoSrc} alt={c.produit.nom} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <span className="text-xs text-muted font-bold block">{dateCourteFr(c.createdAt)}</span>
                          <h3 className="font-extrabold text-base text-slate-900 truncate">{c.produit.nom}</h3>
                          <p className="text-xs text-muted">
                            {roleVue === "vendeur" ? t("clientInfo", { nom: c.acheteur.nom, tel: c.acheteur.telephone }) : t("vendorInfo", { nom: c.vendeur.nom, tel: c.vendeur.telephone })}
                          </p>
                        </div>
                        <span className={`badge ${statutCommandeBadge(c.statut)} font-bold text-xs p-2 shrink-0`}>
                          {STATUT_COMMANDE_LABEL[c.statut] ?? c.statut}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-baseline bg-base-100 p-3 rounded-xl">
                    <div>
                      <span className="text-xs text-muted block">{t("quantity")}</span>
                      <strong className="text-base font-bold">{c.quantite} {c.produit.uniteMesure}</strong>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-muted block">{t("totalAmount")}</span>
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
                        <CheckCircle size={16} /> {t("confirmOrder")}
                      </button>
                    )}

                    {roleVue === "vendeur" && c.statut === "CONFIRMEE" && (
                      <button
                        onClick={() => handleChangerStatut(c.id, "EN_LIVRAISON")}
                        className="btn btn-primary btn-sm font-bold flex-1"
                      >
                        <Truck size={16} /> {t("shipOrder")}
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
                        <Smartphone size={16} /> {t("payAtDelivery")}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modale Paiement Mobile Money */}
        {commandePaiement && (
          <dialog className="modal modal-open">
            <div className="modal-box bg-white p-6 space-y-4">
              <h3 className="font-bold text-lg">{t("paymentModalTitle")}</h3>
              <p className="text-xs text-muted">
                {t("paymentModalSubtitle", { amount: formatFcfa(commandePaiement.montantTotal), product: commandePaiement.produit.nom })}
              </p>

              {msgPaiement && (
                <div className={`alert text-xs py-2 ${msgPaiement.includes("réussi") || msgPaiement.includes("successful") ? "alert-success" : "alert-error"}`}>
                  <span>{msgPaiement}</span>
                </div>
              )}

              <form onSubmit={handlePayerMobileMoney} className="space-y-3">
                <div className="form-control gap-1">
                  <label htmlFor="mm-op" className="label-text text-xs font-bold">{t("operatorLabel")}</label>
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
                  <label htmlFor="mm-num" className="label-text text-xs font-bold">{t("payerPhoneLabel")}</label>
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
                    {tc("cancel")}
                  </button>
                  <button
                    type="submit"
                    disabled={payerState}
                    className="btn btn-primary flex-1 font-bold"
                  >
                    {payerState ? <span className="loading loading-spinner" /> : t("validatePayment")}
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
