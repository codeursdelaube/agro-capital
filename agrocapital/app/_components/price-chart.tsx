"use client";

import {
  Area,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatFcfa } from "@/_lib/utils";

export type PrixPoint = {
  id?: string;
  culture: string;
  prix: number;
  date: string;
  source?: string;
};

export type PredictionPoint = {
  id?: string;
  culture: string;
  prixPrevu: number;
  tendance: string;
  confiance: number;
  recommandation: string;
  periodeOptimale?: string | null;
  dateExpiration: string;
};

interface PriceChartProps {
  historique: PrixPoint[];
  predictions: PredictionPoint[];
}

export function PriceChart({ historique, predictions }: PriceChartProps) {
  // Transformer les données pour Recharts
  const dataHistorique = historique.map((item) => {
    const d = new Date(item.date);
    const mois = d.toLocaleDateString("fr-FR", { month: "short" });
    return {
      label: mois,
      prix: item.prix,
      prediction: null,
      fourchette: null,
    };
  });

  const dataPredictions = predictions.map((item) => {
    return {
      label: item.periodeOptimale ?? "Futur",
      prix: null,
      prediction: item.prixPrevu,
      fourchette: [
        Math.round(item.prixPrevu * 0.9),
        Math.round(item.prixPrevu * 1.1),
      ],
    };
  });

  const chartData = [...dataHistorique, ...dataPredictions];

  if (chartData.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl bg-base-200 text-sm text-muted">
        Aucune donnée d&apos;historique disponible pour cette culture.
      </div>
    );
  }

  const formatTooltipValue = (
    value: number | string | ReadonlyArray<number | string> | undefined
  ): [string, string] => {
    const amount = Array.isArray(value) ? value[0] : value;
    return [
      amount === undefined || amount === null
        ? "—"
        : formatFcfa(Number(amount)),
      "Prix",
    ];
  };

  return (
    <div className="h-72 w-full" aria-label="Évolution du prix de la culture">
      <ResponsiveContainer>
        <LineChart
          data={chartData}
          margin={{ top: 12, right: 8, bottom: 0, left: -18 }}
        >
          <CartesianGrid stroke="#e5e7eb" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} />
          <YAxis
            tickFormatter={(v) => `${Math.round(v / 1000)}k`}
            tick={{ fontSize: 12 }}
          />
          <Tooltip formatter={formatTooltipValue} />
          <Legend />
          <Area
            type="monotone"
            dataKey="fourchette"
            stroke="none"
            fill="#facc15"
            fillOpacity={0.28}
            name="Fourchette estimée"
          />
          <Line
            type="monotone"
            dataKey="prix"
            stroke="#16a34a"
            strokeWidth={3}
            dot={{ r: 4 }}
            name="Prix observé"
            connectNulls={false}
          />
          <Line
            type="monotone"
            dataKey="prediction"
            stroke="#ca8a04"
            strokeWidth={3}
            strokeDasharray="7 5"
            dot={{ r: 4 }}
            name="Prédiction Agro-Pilot"
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
