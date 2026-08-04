"use client";

import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { formatFcfa } from "@/_lib/utils";
import { Sparkles, TrendingUp, PieChart as PieIcon, BarChart3 } from "lucide-react";

export type CultureRadarSummary = {
  culture: string;
  prixActuel: number;
  prixPrevuJ15: number;
  tendance: "hausse" | "baisse" | "stable";
  scoreVente: number;
  confiance: number;
};

interface MarketRadarChartsProps {
  currentRadar: {
    culture: string;
    prixActuel: number;
    prixPrevuJ15: number;
    tendance: "hausse" | "baisse" | "stable";
    confiance: number;
    score: number;
    interpretation: string;
  };
  allCulturesData: CultureRadarSummary[];
}

const PIE_COLORS = ["#10b981", "#f59e0b", "#6366f1", "#ec4899", "#8b5cf6"];

export function MarketRadarCharts({ currentRadar, allCulturesData }: MarketRadarChartsProps) {
  // Données pour le diagramme circulaire (Pie Chart) : Répartition de l'Opportunité & Indice de Confiance
  const pieData = [
    { name: "Indice de Confiance IA", value: Math.round(currentRadar.confiance * 100), fill: "#10b981" },
    { name: "Marge de Sécurité", value: Math.max(0, 100 - Math.round(currentRadar.confiance * 100)), fill: "#e2e8f0" },
  ];

  // Données pour le diagramme circulaire des opportunités par culture
  const opportunitesPieData = allCulturesData.map((item, index) => ({
    name: item.culture,
    value: item.scoreVente,
    fill: PIE_COLORS[index % PIE_COLORS.length],
  }));

  // Données pour le diagramme en bâtons (Bar Chart) : Prix Actuel vs Prix Prévu J+15
  const barData = allCulturesData.map((item) => ({
    culture: item.culture,
    "Prix Actuel": item.prixActuel,
    "Prix Prévu (J+15)": item.prixPrevuJ15,
  }));

  const formatTooltipValue = (value: any) => [formatFcfa(Number(value)), ""];

  return (
    <div className="space-y-6">
      {/* SECTION 1 : DIAGRAMME EN BÂTONS (BAR CHART) */}
      <div className="card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl space-y-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 size={20} className="text-emerald-600" />
              Diagramme en Bâtons — Comparatif des Cours (Prix Actuel vs J+15)
            </h3>
            <p className="text-xs text-slate-500">
              Projections comparatives générées par l&apos;algorithme FastAPI Railway sur l&apos;ensemble des cultures.
            </p>
          </div>
          <span className="badge badge-sm bg-emerald-100 text-emerald-800 font-bold border-0">
            FastAPI Market-Radar
          </span>
        </div>

        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="culture" tick={{ fontSize: 12, fontWeight: 700 }} />
              <YAxis tickFormatter={(v) => `${v} F`} tick={{ fontSize: 11 }} />
              <Tooltip formatter={formatTooltipValue} />
              <Legend wrapperStyle={{ paddingTop: 10, fontSize: 12 }} />
              <Bar dataKey="Prix Actuel" fill="#94a3b8" radius={[8, 8, 0, 0]} maxBarSize={45} />
              <Bar dataKey="Prix Prévu (J+15)" fill="#10b981" radius={[8, 8, 0, 0]} maxBarSize={45} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* SECTION 2 : DIAGRAMMES CIRCULAIRES (PIE / DONUT CHARTS) */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Camembert 1 : Répartition des Scores d'Opportunité par Culture */}
        <div className="card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl space-y-4 shadow-xs">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <PieIcon size={18} className="text-amber-500" />
              Diagramme Circulaire — Score d&apos;Opportunité par Culture
            </h3>
            <p className="text-xs text-slate-500">
              Part relative du score de vente calculé sur 100 points pour chaque produit.
            </p>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={opportunitesPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {opportunitesPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(val: any) => [`${val} / 100 pts`, "Score Vente"]} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Camembert 2 : Jauge Circulaire de Confiance IA & Potentiel (Culture Active) */}
        <div className="card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl space-y-4 shadow-xs">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles size={18} className="text-emerald-600" />
              Indice de Confiance & Fiabilité — {currentRadar.culture}
            </h3>
            <p className="text-xs text-slate-500">
              Niveau de certitude statistique sur la tendance prédictive à J+15.
            </p>
          </div>

          <div className="h-64 w-full flex flex-col items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  startAngle={180}
                  endAngle={0}
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={2}
                  dataKey="value"
                >
                  <Cell fill="#10b981" />
                  <Cell fill="#cbd5e1" />
                </Pie>
                <Tooltip formatter={(val: any) => [`${val}%`, "Indice"]} />
              </PieChart>
            </ResponsiveContainer>

            <div className="absolute bottom-10 text-center">
              <span className="text-3xl font-black text-slate-900 dark:text-white">
                {Math.round(currentRadar.confiance * 100)}%
              </span>
              <span className="block text-[11px] font-bold text-emerald-600 uppercase">
                Confiance Agro-Pilot
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
