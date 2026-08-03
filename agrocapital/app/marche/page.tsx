"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowRight, Info, Sparkles } from "lucide-react";
import { PageShell } from "@/_components/page-shell";
import { PriceChart, PrixPoint, PredictionPoint } from "@/_components/price-chart";
import { PedagogicTooltip } from "@/_components/tooltip";
import { formatFcfa } from "@/_lib/utils";

const CULTURES_LIST = ["Maïs", "Soja", "Riz", "Mil", "Niébé"];

export default function MarchePage() {
  const [culture, setCulture] = useState("Maïs");
  const [historique, setHistorique] = useState<PrixPoint[]>([]);
  const [predictions, setPredictions] = useState<PredictionPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [resPrix, resPred] = await Promise.all([
        fetch(`/api/marche/prix?culture=${encodeURIComponent(culture)}`),
        fetch(`/api/marche/predictions?culture=${encodeURIComponent(culture)}`),
      ]);

      if (resPrix.ok) {
        const jsonPrix = await resPrix.json();
        setHistorique(jsonPrix.data.prix ?? []);
      }

      if (resPred.ok) {
        const jsonPred = await resPred.json();
        setPredictions(jsonPred.data.predictions ?? []);
      }
    } catch (e) {
      console.error("Erreur lors de la récupération des prix", e);
    } finally {
      setLoading(false);
    }
  }, [culture]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const meilleurePrediction = predictions[0];

  return (
    <PageShell>
      <div className="space-y-6">
        {/* En-tête */}
        <header>
          <p className="text-eyebrow">Market Radar (Agro-Pilot)</p>
          <h1 className="mt-2 text-h1">Prix du marché</h1>
          <p className="mt-2 text-sm text-muted">
            Consultez les prix réels observés et les prédictions générées par Agro-Pilot.
          </p>
        </header>

        {/* Sélecteur de culture */}
        <div className="form-control">
          <label
            className="label-text mb-2 block font-semibold text-base-content"
            htmlFor="culture-select"
          >
            Sélectionner une culture
          </label>
          <select
            id="culture-select"
            value={culture}
            onChange={(e) => setCulture(e.target.value)}
            className="select select-bordered select-lg w-full font-bold"
            aria-label="Sélectionner une culture"
          >
            {CULTURES_LIST.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Carte graphique */}
        <section className="card bg-white shadow-sm border border-base-200">
          <div className="card-body gap-5 p-5">
            <div>
              <h2 className="text-h2">Prix historique & Prédictions</h2>
              <p className="mt-1 text-sm text-muted">
                Évolution récente pour la culture : <strong>{culture}</strong>
              </p>
            </div>

            {loading ? (
              <div className="flex h-72 items-center justify-center">
                <span className="loading loading-spinner loading-lg text-primary" />
              </div>
            ) : (
              <PriceChart historique={historique} predictions={predictions} />
            )}

            {/* Légende pédagogique */}
            <div className="flex items-start gap-3 rounded-xl bg-secondary/10 border-l-4 border-secondary p-3 text-sm">
              <Info size={18} className="mt-0.5 shrink-0 text-yellow-700" aria-hidden="true" />
              <p className="font-medium text-base-content">
                <strong>Pointillés :</strong> ce sont des estimations Agro-Pilot, pas des certitudes. Le prix réel peut fluctuer.
              </p>
              <PedagogicTooltip
                label="Comprendre la prédiction de prix"
                text="Une prédiction de prix est une estimation basée sur les prix récents et la saisonnalité au Togo. Le prix réel dépend des récoltes et du marché."
              />
            </div>
          </div>
        </section>

        {/* Conseil Agro-Pilot */}
        <section className="card bg-white shadow-sm border-l-4 border-primary overflow-hidden">
          <div className="card-body p-5">
            <div className="flex items-center gap-1.5 text-primary text-xs font-bold uppercase tracking-wider">
              <Sparkles size={16} /> Recommandation Agro-Pilot
            </div>

            {meilleurePrediction ? (
              <>
                <h2 className="mt-2 text-h2 text-base-content">
                  Prix prévu :{" "}
                  <span className="text-primary">
                    {formatFcfa(meilleurePrediction.prixPrevu)}
                  </span>
                </h2>
                <p className="mt-2 text-sm text-base-content font-medium">
                  {meilleurePrediction.recommandation}
                </p>
                {meilleurePrediction.periodeOptimale && (
                  <p className="mt-1 text-xs text-muted">
                    Période optimale de vente : <strong>{meilleurePrediction.periodeOptimale}</strong> (Confiance : {Math.round(meilleurePrediction.confiance * 100)}%)
                  </p>
                )}
              </>
            ) : (
              <p className="mt-2 text-sm text-muted">
                Aucune prédiction active pour le moment pour le {culture}. Le service Agro-Pilot mettra bientôt à jour les estimations.
              </p>
            )}

            <Link href="/simulateur" className="btn btn-primary mt-5 w-full btn-lg">
              Simuler mon gain potentiel
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
        </section>
      </div>
    </PageShell>
  );
}