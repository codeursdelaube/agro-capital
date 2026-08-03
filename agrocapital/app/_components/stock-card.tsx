"use client";

import { PackageCheck, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";
import { formatFcfa, STATUT_STOCK_LABEL } from "@/_lib/utils";

export type StockItem = {
  id: string;
  culture: string;
  quantiteKg: number;
  valeurEstimee: number;
  statut: string;
  notes?: string | null;
};

export function StockCard({ stock, index = 0 }: { stock: StockItem; index?: number }) {
  const isGarantie = stock.statut === "NANTI";

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3, delay: index * 0.08 }}
      className="card bg-white shadow-sm border border-base-200 hover:shadow-md transition-shadow duration-200"
    >
      <div className="card-body gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-h2">{stock.culture}</h3>
            <p className="mt-1 text-sm text-muted">
              {stock.quantiteKg} kg
            </p>
          </div>
          <span
            className={[
              "badge border-0 text-xs font-bold px-3 py-1",
              isGarantie
                ? "bg-warning/20 text-yellow-800"
                : stock.statut === "DISPONIBLE"
                ? "bg-primary/10 text-primary"
                : "bg-base-200 text-base-content/70",
            ].join(" ")}
          >
            {STATUT_STOCK_LABEL[stock.statut] ?? stock.statut}
          </span>
        </div>

        <p className="text-hero text-primary">{formatFcfa(stock.valeurEstimee)}</p>

        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
          {stock.notes && (
            <span className="flex items-center gap-1.5 truncate max-w-full">
              <PackageCheck size={14} aria-hidden="true" />
              {stock.notes}
            </span>
          )}
          {isGarantie && (
            <span className="flex items-center gap-1.5 text-warning font-semibold">
              <ShieldCheck size={14} aria-hidden="true" />
              Garantie nantissement active
            </span>
          )}
        </div>
      </div>
    </motion.article>
  );
}