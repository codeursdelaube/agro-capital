"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowRight, Info, Sparkles, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { PageShell } from "@/_components/page-shell";
import { PriceChart, PrixPoint, PredictionPoint } from "@/_components/price-chart";
import { PedagogicTooltip } from "@/_components/tooltip";
import { formatFcfa } from "@/_lib/utils";
import { useTranslations } from "next-intl";

import { MarketRadarCharts, CultureRadarSummary } from "@/_components/market-radar-charts";

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
  const t = useTranslations("Marche");
  const [culture, setCulture] = useState("Maïs");
  const [historique, setHistorique] = useState<PrixPoint[]>([]);
  const [predictions, setPredictions] = useState<PredictionPoint[]>([]);
  const [radar, setRadar] = useState<RadarData | null>(null);
  const [allCulturesData, setAllCulturesData] = useState<CultureRadarSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Récupération des données pour la culture sélectionnée
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

      // 2. Récupération des prédictions FastAPI pour toutes les cultures (Bâtons et Camemberts)
      const radarPromises = CULTURES_LIST.map(async (c) => {
        try {
          const res = await fetch("/api/marche/radar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ culture: c }),
          });
          if (res.ok) {
            const json = await res.json();
            const data = json.data;
            if (data?.prediction && data?.scoreVente) {
              return {
                culture: c,
                prixActuel: data.prediction.prix_actuel,
                prixPrevuJ15: data.prediction.prix_prevu_j15,
                tendance: data.prediction.tendance,
                scoreVente: data.scoreVente.score,
                confiance: data.prediction.confiance,
              } as CultureRadarSummary;
            }
          }
        } catch {
          // Fallback silencieux en cas d'erreur ponctuelle
        }
        return null;
      });

      const results = await Promise.all(radarPromises);
      const validResults = results.filter((r): r is CultureRadarSummary => r !== null);
      setAllCulturesData(validResults);
    } catch (e) {
      console.error("Erreur lors de la récupération des prix et du radar", e);
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
            <p className="text-eyebrow">{t("eyebrow")}</p>
            <h1 className="mt-1 text-h1">{t("title")}</h1>
            <p className="mt-1 text-sm text-slate-500">
              {t("subtitle")}
            </p>
          </div>
        </header>

        {/* Sélecteur de culture */}
        <div className="form-control">
          <label
            className="label-text mb-2 block font-bold text-slate-800 dark:text-slate-200"
            htmlFor="culture-select"
          >
            {t("selectCropLabel")}
          </label>
          <select
            id="culture-select"
            value={culture}
            onChange={(e) => setCulture(e.target.value)}
            className="select select-bordered select-lg w-full font-bold text-lg text-slate-900 bg-white dark:bg-slate-800 rounded-2xl border-slate-200"
            aria-label={t("selectCropLabel")}
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
                  {t("pred15d")}
                </span>
                {radar.prediction.donnees_demo && (
                  <span className="badge badge-xs bg-slate-100 text-slate-500 font-semibold border-0">
                    {t("demoData")}
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
                    {t("trend", { tendance: radar.prediction.tendance, confiance: Math.round(radar.prediction.confiance * 100) })}
                  </span>
                </div>
              </div>

              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                💡 <strong>{t("advice")}</strong> {radar.prediction.recommandation}
              </p>
            </div>

            {/* Carte 2 : Score d'opportunité de vente */}
            <div className="card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {t("scoreSellingTime")}
                </span>
                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full">
                  {t("score", { score: radar.scoreVente.score })}
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
                    ? t("sellNow")
                    : radar.scoreVente.interpretation === "attendre"
                    ? t("wait")
                    : t("neutral")}
                </strong>
                <p className="text-xs text-slate-500 mt-1">{radar.scoreVente.justification}</p>
              </div>
            </div>
          </div>
        )}

        {/* DIAGRAMMES CIRCULAIRE ET EN BÂTONS (FASTAPI MARKET-RADAR) */}
        {radar && allCulturesData.length > 0 && (
          <MarketRadarCharts
            currentRadar={{
              culture: radar.prediction.culture,
              prixActuel: radar.prediction.prix_actuel,
              prixPrevuJ15: radar.prediction.prix_prevu_j15,
              tendance: radar.prediction.tendance,
              confiance: radar.prediction.confiance,
              score: radar.scoreVente.score,
              interpretation: radar.scoreVente.interpretation,
            }}
            allCulturesData={allCulturesData}
          />
        )}

        {/* Carte graphique */}
        <section className="card bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t("chartTitle")}</h2>
            <p className="text-xs text-slate-500">
              {t("chartSubtitle", { culture })}
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
            <Sparkles size={18} /> {t("needMoreAdvice")}
          </div>
          <p className="text-xs text-slate-300">
            {t("needMoreAdviceSubtitle")}
          </p>
          <Link
            href="/agro-pilot"
            className="btn bg-emerald-600 hover:bg-emerald-700 text-white border-0 btn-md font-bold rounded-2xl w-fit inline-flex items-center gap-2 mt-1"
          >
            {t("openAgroPilot")} <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </PageShell>
  );
}