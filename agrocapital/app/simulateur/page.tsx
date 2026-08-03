"use client";

import { useState, useEffect } from "react";
import { Clock3, HandCoins } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { PageShell } from "@/_components/page-shell";
import { formatFcfa } from "@/_lib/utils";

export default function SimulateurPage() {
  const [quantiteKg, setQuantiteKg] = useState(1000);
  const [prixActuel, setPrixActuel] = useState(150); // FCFA / kg
  const [prixPrevu, setPrixPrevu] = useState(210);  // FCFA / kg
  const [culture, setCulture] = useState("Maïs");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const resPred = await fetch(`/api/marche/predictions?culture=${culture}`);
        if (resPred.ok) {
          const json = await resPred.json();
          const preds = json.data?.predictions ?? [];
          if (preds.length > 0) {
            setPrixPrevu(preds[0].prixPrevu);
            setPrixActuel(Math.round(preds[0].prixPrevu * 0.8));
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [culture]);

  const gainActuel = quantiteKg * prixActuel;
  const gainFutur = quantiteKg * prixPrevu;
  const difference = gainFutur - gainActuel;

  return (
    <PageShell>
      <div className="space-y-6">
        <header>
          <p className="text-eyebrow">Simulateur de vente</p>
          <h1 className="mt-2 text-h1">Vendre maintenant ou attendre ?</h1>
          <p className="mt-2 text-sm text-muted">
            Ajustez la quantité et comparez vos recettes selon les prédictions d&apos;Agro-Pilot.
          </p>
        </header>

        {/* Culture */}
        <div className="form-control">
          <label htmlFor="culture" className="label-text font-semibold mb-1">Culture concernée</label>
          <select
            id="culture"
            value={culture}
            onChange={(e) => setCulture(e.target.value)}
            className="select select-bordered select-lg font-bold w-full"
          >
            <option value="Maïs">Maïs</option>
            <option value="Soja">Soja</option>
            <option value="Riz">Riz</option>
            <option value="Niébé">Niébé</option>
          </select>
        </div>

        {/* Slider Quantité */}
        <div className="card bg-white shadow-sm border border-base-200">
          <div className="card-body p-5 gap-4">
            <div className="flex items-center justify-between">
              <label htmlFor="quantite-range" className="font-semibold text-base-content">
                Quantité en stock (kg)
              </label>
              <span className="text-hero text-primary">{quantiteKg} kg</span>
            </div>
            <input
              id="quantite-range"
              className="range range-primary w-full"
              type="range"
              min={100}
              max={10000}
              step={100}
              value={quantiteKg}
              onChange={(e) => setQuantiteKg(Number(e.target.value))}
              aria-label="Quantité en kg"
            />
            <div className="flex justify-between text-xs text-muted">
              <span>100 kg</span>
              <span>10 000 kg (10 tonnes)</span>
            </div>
          </div>
        </div>

        {/* Comparaison */}
        <section aria-label="Comparaison des recettes">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Vendre maintenant */}
            <article className="card bg-white shadow-sm border border-base-200">
              <div className="card-body gap-3 p-5">
                <span className="flex items-center gap-2 text-sm font-semibold text-muted">
                  <HandCoins size={17} aria-hidden="true" />
                  Vendre maintenant
                </span>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={gainActuel}
                    initial={{ opacity: 0.5, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15 }}
                    className="text-hero text-base-content"
                  >
                    {formatFcfa(gainActuel)}
                  </motion.p>
                </AnimatePresence>
                <p className="text-sm text-muted">
                  Prix moyen actuel : {formatFcfa(prixActuel)} / kg
                </p>
              </div>
            </article>

            {/* Attendre */}
            <article className="card bg-primary/5 shadow-sm border border-primary/20">
              <div className="card-body gap-3 p-5">
                <span className="flex items-center gap-2 text-sm font-semibold text-primary">
                  <Clock3 size={17} aria-hidden="true" />
                  Attendre le pic estimé
                </span>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={gainFutur}
                    initial={{ opacity: 0.5, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15 }}
                    className="text-hero text-primary"
                  >
                    {formatFcfa(gainFutur)}
                  </motion.p>
                </AnimatePresence>
                <p className="text-sm text-muted">
                  Prix prédictif Agro-Pilot : {formatFcfa(prixPrevu)} / kg
                </p>
              </div>
            </article>
          </div>
        </section>

        {/* Gain net potentiel */}
        <section className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-5 text-center">
          <p className="text-sm font-medium text-muted">Gain supplémentaire en attendant</p>
          <AnimatePresence mode="wait">
            <motion.p
              key={difference}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              className="mt-2 text-hero text-primary"
            >
              + {formatFcfa(difference)}
            </motion.p>
          </AnimatePresence>
          <p className="mt-2 text-xs text-muted">
            Grâce à Agro-Capital, débloquez du cash par nantissement pour attendre ce moment !
          </p>
        </section>
      </div>
    </PageShell>
  );
}