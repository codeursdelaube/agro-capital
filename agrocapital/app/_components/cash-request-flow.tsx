"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ChevronLeft, ChevronRight, PlusCircle, Smartphone } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { formatFcfa } from "@/_lib/utils";

type Stock = {
  id: string;
  culture: string;
  quantiteKg: number;
  valeurEstimee: number;
  statut: string;
};

function Stepper({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-0" aria-label={`Étape ${current} sur ${total}`}>
      {Array.from({ length: total }, (_, i) => {
        const step = i + 1;
        const done = step < current;
        const active = step === current;
        return (
          <div key={step} className="flex items-center">
            <div
              className={[
                "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-all duration-300",
                active
                  ? "bg-primary text-white shadow-md scale-110"
                  : done
                  ? "bg-primary/20 text-primary"
                  : "bg-base-200 text-base-content/40",
              ].join(" ")}
              aria-current={active ? "step" : undefined}
            >
              {done ? <CheckCircle2 size={16} /> : step}
            </div>
            {step < total && (
              <div
                className={[
                  "h-0.5 w-10 transition-all duration-500",
                  done ? "bg-primary" : "bg-base-200",
                ].join(" ")}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function CashRequestFlow() {
  const [step, setStep] = useState(1);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loadingStocks, setLoadingStocks] = useState(true);
  const [selectedStockId, setSelectedStockId] = useState<string>("");
  const [montantDemande, setMontantDemande] = useState(100000);
  const [soumission, setSoumission] = useState(false);
  const [succes, setSucces] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    async function loadStocks() {
      try {
        const res = await fetch("/api/stocks");
        if (res.ok) {
          const json = await res.json();
          const items: Stock[] = json.data.stocks ?? [];
          setStocks(items);
          if (items.length > 0) {
            setSelectedStockId(items[0].id);
            setMontantDemande(Math.round(items[0].valeurEstimee * 0.7));
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingStocks(false);
      }
    }
    loadStocks();
  }, []);

  const selectedStock = stocks.find((s) => s.id === selectedStockId);
  const maxAutorise = selectedStock ? Math.round(selectedStock.valeurEstimee * 0.7) : 0;

  const handleStockChange = (stockId: string) => {
    setSelectedStockId(stockId);
    const target = stocks.find((s) => s.id === stockId);
    if (target) {
      setMontantDemande(Math.round(target.valeurEstimee * 0.7));
    }
  };

  const handleFinalSubmit = async () => {
    if (!selectedStockId) return;
    setSoumission(true);
    setErreur(null);

    try {
      const res = await fetch("/api/nantissement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stockId: selectedStockId,
          montantDemande,
          motif: "Financement pré-récolte / besoin de trésorerie",
        }),
      });

      if (res.ok) {
        setSucces(true);
      } else {
        const json = await res.json();
        setErreur(json.error ?? "Erreur lors de la soumission de la demande");
      }
    } catch {
      setErreur("Erreur réseau");
    } finally {
      setSoumission(false);
    }
  };

  if (loadingStocks) {
    return (
      <div className="flex justify-center p-8">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  if (stocks.length === 0) {
    return (
      <div className="card bg-white p-8 text-center space-y-4 border border-base-200">
        <h2 className="text-h2">Aucun stock disponible</h2>
        <p className="text-sm text-muted">
          Vous devez déclarer un stock physique de récolte avant de pouvoir effectuer une demande de nantissement.
        </p>
        <Link href="/stocks/nouveau" className="btn btn-primary btn-md mx-auto">
          <PlusCircle size={18} />
          Déclarer un stock
        </Link>
      </div>
    );
  }

  if (succes) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card bg-white shadow-sm border border-base-200 p-8 text-center space-y-5"
      >
        <CheckCircle2 size={56} className="text-primary mx-auto" />
        <div>
          <h2 className="text-h1">Demande soumise avec succès !</h2>
          <p className="mt-2 text-sm text-muted">
            Votre demande de nantissement de <strong>{formatFcfa(montantDemande)}</strong> adossée à votre stock de{" "}
            <strong>{selectedStock?.culture} ({selectedStock?.quantiteKg} kg)</strong> a été enregistrée.
          </p>
        </div>
        <div className="flex items-center justify-center gap-2 rounded-xl bg-base-200 px-4 py-3 text-sm font-semibold">
          <Smartphone size={18} className="text-primary" />
          Débloqué après validation directe sur votre portefeuille bancaire.
        </div>
      </motion.div>
    );
  }

  return (
    <section className="card bg-white shadow-sm border border-base-200">
      <div className="card-body gap-6 p-5">
        {erreur && (
          <div className="alert alert-error text-sm py-2">
            <span>{erreur}</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <Stepper current={step} total={3} />
          <span className="text-xs font-semibold text-muted">Étape {step}/3</span>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2 }}
            className="space-y-5"
          >
            {/* Étape 1 : Choisir le stock */}
            {step === 1 && (
              <>
                <div>
                  <h2 className="text-h2">Sélectionnez le stock en garantie</h2>
                  <p className="mt-1 text-sm text-muted">
                    Le stock servira de garantie jusqu&apos;à la vente finale.
                  </p>
                </div>
                <div className="space-y-3">
                  {stocks.map((s) => {
                    const isSelected = s.id === selectedStockId;
                    const dispo = s.statut === "DISPONIBLE";
                    return (
                      <label
                        key={s.id}
                        onClick={() => dispo && handleStockChange(s.id)}
                        className={`flex items-center gap-4 rounded-2xl border-2 p-4 transition-all ${
                          !dispo ? "opacity-50 cursor-not-allowed bg-base-200" : "cursor-pointer"
                        } ${isSelected ? "border-primary bg-primary/5 shadow-sm" : "border-base-200 bg-white"}`}
                      >
                        <input
                          type="radio"
                          name="stock-select"
                          checked={isSelected}
                          disabled={!dispo}
                          onChange={() => handleStockChange(s.id)}
                          className="radio radio-primary"
                        />
                        <div className="flex-1 min-w-0">
                          <strong className="block text-base-content text-base">
                            {s.culture} — {s.quantiteKg} kg
                          </strong>
                          <span className="mt-0.5 block text-sm text-muted">
                            Valeur estimée : <strong>{formatFcfa(s.valeurEstimee)}</strong> (Plafond prêt 70% : {formatFcfa(s.valeurEstimee * 0.7)})
                          </span>
                        </div>
                        <span className={`badge border-0 text-xs font-bold ${s.statut === "DISPONIBLE" ? "bg-primary/10 text-primary" : "bg-warning/20 text-yellow-800"}`}>
                          {s.statut}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </>
            )}

            {/* Étape 2 : Choix du montant */}
            {step === 2 && (
              <>
                <div>
                  <h2 className="text-h2">Combien souhaitez-vous débloquer ?</h2>
                  <p className="mt-1 text-sm text-muted">
                    Plafond légal avec décote (70% max de la valeur estimée de votre stock de {selectedStock?.culture}) :{" "}
                    <strong className="text-primary font-bold">{formatFcfa(maxAutorise)}</strong>
                  </p>
                </div>
                <div className="form-control gap-2">
                  <label className="label-text font-semibold">Montant en FCFA</label>
                  <input
                    type="number"
                    min={5000}
                    max={maxAutorise}
                    step={5000}
                    value={montantDemande}
                    onChange={(e) => setMontantDemande(Number(e.target.value))}
                    className="input input-bordered input-lg w-full text-xl font-bold"
                  />
                  <div className="flex justify-between text-xs text-muted">
                    <span>Min : {formatFcfa(5000)}</span>
                    <span className="text-primary font-bold">Max : {formatFcfa(maxAutorise)}</span>
                  </div>
                </div>
              </>
            )}

            {/* Étape 3 : Confirmation */}
            {step === 3 && (
              <>
                <div>
                  <h2 className="text-h2">Récapitulatif de votre demande</h2>
                  <p className="mt-1 text-sm text-muted">
                    Vérifiez les détails avant la transmission au service financier.
                  </p>
                </div>
                <dl className="rounded-2xl bg-base-200 p-4 space-y-3 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted">Stock nanti (Garantie)</dt>
                    <dd className="font-bold text-base-content">{selectedStock?.culture} ({selectedStock?.quantiteKg} kg)</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted">Valeur estimée du stock</dt>
                    <dd className="font-semibold text-base-content">{formatFcfa(selectedStock?.valeurEstimee ?? 0)}</dd>
                  </div>
                  <div className="h-px bg-base-300" />
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted">Avance sollicitée</dt>
                    <dd className="font-extrabold text-primary text-lg">{formatFcfa(montantDemande)}</dd>
                  </div>
                </dl>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="grid grid-cols-2 gap-3 pt-2">
          {step > 1 ? (
            <button onClick={() => setStep(step - 1)} className="btn btn-outline btn-lg">
              <ChevronLeft size={19} />
              Retour
            </button>
          ) : <span />}

          {step < 3 ? (
            <button onClick={() => setStep(step + 1)} className="btn btn-primary btn-lg col-start-2">
              Continuer
              <ChevronRight size={19} />
            </button>
          ) : (
            <button
              onClick={handleFinalSubmit}
              disabled={soumission || montantDemande > maxAutorise}
              className="btn btn-primary btn-lg col-start-2"
            >
              {soumission ? <span className="loading loading-spinner" /> : "Soumettre la demande"}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}