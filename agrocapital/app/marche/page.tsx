"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowRight, Info, Sparkles, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { PageShell } from "@/_components/page-shell";
import { PriceChart, PrixPoint, PredictionPoint } from "@/_components/price-chart";
import { PedagogicTooltip } from "@/_components/tooltip";
import { formatFcfa } from "@/_lib/utils";

const CULTURES_LIST = ["Maïs", "Soja", "Riz", "Mil", "Niébé"];

type RadarData = {
  prediction: {
    culture: string;
    region: string;
    tendance: "hausse" | "baisse" | "stable";
    confiance: number;
    prix_actuel: number;
    prix_prevu_j15: number;
    recommandation: string;
    donnees_demo: boolean;
  };
  scoreVente: {
    culture: string;
    region: string;
    score: number;
    interpretation: "vendre_maintenant" | "attendre" | "neutre";
    justification: string;
    donnees_demo: boolean;
  };
};

export default function MarchePage() {
  const [culture, setCulture] = useState("Maïs");
  const [historique, setHistorique] = useState<PrixPoint[]>([]);
  const [predictions, setPredictions] = useState<PredictionPoint[]>([]);
  const [radar, setRadar] = useState<RadarData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [resPrix, resPred, resRadar] = await Promise.all([
        fetch(`/api/marche/prix?culture=${encodeURIComponent(culture)}`),
        fetch(`/api/marche/predictions?culture=${encodeURIComponent(culture)}`),
        fetch("/api/marche/radar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ culture }),
        }),
      ]);

      if (resPrix.ok) {
        const jsonPrix = await resPrix.json();
        setHistorique(jsonPrix.data.prix ?? []);
      }

      if (resPred.ok) {
        const jsonPred = await resPred.json();
        setPredictions(jsonPred.data.predictions ?? []);
      }

      if (resRadar.ok) {
        const jsonRadar = await resRadar.json();
        setRadar(jsonRadar.data ?? null);
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

  return (
    <PageShell>
      <div className="space-y-6">
        {/* En-tête */}
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-eyebrow">Market Radar & Agro-Pilot</p>
            <h1 className="mt-1 text-h1">Prix du marché & Opportunités</h1>
            <p className="mt-1 text-sm text-slate-500">
              Analyse prédictive des cours agricoles à J+15 et score d&apos;opportunité de vente.
            </p>
          </div>
        </header>

        {/* Sélecteur de culture */}
        <div className="form-control">
          <label
            className="label-text mb-2 block font-bold text-slate-800 dark:text-slate-200"
            htmlFor="culture-select"
          >
            Sélectionner une culture
          </label>
          <select
            id="culture-select"
            value={culture}
            onChange={(e) => setCulture(e.target.value)}
            className="select select-bordered select-lg w-full font-bold text-lg text-slate-900 bg-white dark:bg-slate-800 rounded-2xl border-slate-200"
            aria-label="Sélectionner une culture"
          >
            {CULTURES_LIST.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* WIDGET RADAR (PRÉDICTION FASTAPI + SCORE DE VENTE) */}
        {radar && (
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Carte 1 : Tendance & Prédiction J+15 */}
            <div className="card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Prédiction J+15
                </span>
                {radar.prediction.donnees_demo && (
                  <span className="badge badge-xs bg-slate-100 text-slate-500 font-semibold border-0">
                    données de démonstration
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div
                  className={`h-12 w-12 rounded-2xl flex items-center justify-center font-bold text-white shadow-md ${
                    radar.prediction.tendance === "hausse"
                      ? "bg-emerald-600"
                      : radar.prediction.tendance === "baisse"
                      ? "bg-rose-600"
                      : "bg-amber-500"
                  }`}
                >
                  {radar.prediction.tendance === "hausse" ? (
                    <TrendingUp size={24} />
                  ) : radar.prediction.tendance === "baisse" ? (
                    <TrendingDown size={24} />
                  ) : (
                    <Minus size={24} />
                  )}
                </div>

                <div>
                  <div className="flex items-baseline gap-2">
                    <strong className="text-2xl font-black text-slate-900 dark:text-white">
                      {formatFcfa(radar.prediction.prix_prevu_j15)}
                    </strong>
                    <span className="text-xs text-slate-400 font-semibold">/ kg</span>
                  </div>
                  <span className="text-xs font-bold text-slate-500 capitalize">
                    Tendance : {radar.prediction.tendance} (Confiance : {Math.round(radar.prediction.confiance * 100)}%)
                  </span>
                </div>
              </div>

              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                💡 <strong>Conseil :</strong> {radar.prediction.recommandation}
              </p>
            </div>

            {/* Carte 2 : Score d'opportunité de vente */}
            <div className="card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Score Moment de Vente
                </span>
                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full">
                  Score : {radar.scoreVente.score} / 100
                </span>
              </div>

              {/* Jauge visuelle */}
              <div className="space-y-1">
                <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      radar.scoreVente.score > 70
                        ? "bg-emerald-600"
                        : radar.scoreVente.score > 40
                        ? "bg-amber-500"
                        : "bg-rose-500"
                    }`}
                    style={{ width: `${radar.scoreVente.score}%` }}
                  />
                </div>
              </div>

              <div>
                <strong className="text-sm font-extrabold text-slate-900 dark:text-white block">
                  {radar.scoreVente.interpretation === "vendre_maintenant"
                    ? "🟢 Vendre maintenant : le prix est à son sommet !"
                    : radar.scoreVente.interpretation === "attendre"
                    ? "🟡 Patientez : le marché est en hausse pour les prochaines semaines"
                    : "⚪ Neutre : marché stable"}
                </strong>
                <p className="text-xs text-slate-500 mt-1">{radar.scoreVente.justification}</p>
              </div>
            </div>
          </div>
        )}

        {/* Carte graphique */}
        <section className="card bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Prix historique & Courbe prédictive</h2>
            <p className="text-xs text-slate-500">
              Évolution récente observée et projections futures pour : <strong>{culture}</strong>
            </p>
          </div>

          {loading ? (
            <div className="flex h-72 items-center justify-center">
              <span className="loading loading-spinner loading-lg text-emerald-600" />
            </div>
          ) : (
            <PriceChart historique={historique} predictions={predictions} />
          )}
        </section>

        {/* Bloc explicatif */}
        <div className="card bg-slate-900 text-white p-6 rounded-3xl space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-sm">
            <Sparkles size={18} /> Besoin de conseils plus personnalisés sur vos propres stocks ?
          </div>
          <p className="text-xs text-slate-300">
            Consultez votre assistant virtuel Agro-Pilot pour analyser le meilleur moment de vente lot par lot ou constituer un dossier de prêt bancaire.
          </p>
          <Link
            href="/agro-pilot"
            className="btn bg-emerald-600 hover:bg-emerald-700 text-white border-0 btn-md font-bold rounded-2xl w-fit inline-flex items-center gap-2 mt-1"
          >
            Ouvrir Agro-Pilot <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </PageShell>
  );
}