"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Package, Sparkles } from "lucide-react";
import { PageShell } from "@/_components/page-shell";
import { CULTURES_COURANTES } from "@/_lib/utils";

export default function NouveauStockPage() {
  const router = useRouter();
  const [culture, setCulture] = useState("Maïs");
  const [quantiteKg, setQuantiteKg] = useState(1000);
  const [valeurEstimee, setValeurEstimee] = useState(180000);
  const [notes, setNotes] = useState("");
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setChargement(true);
    setErreur(null);

    try {
      const res = await fetch("/api/stocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          culture,
          quantiteKg: Number(quantiteKg),
          valeurEstimee: Number(valeurEstimee),
          notes: notes.trim() || undefined,
        }),
      });

      if (res.ok) {
        router.push("/nantissement");
        router.refresh();
      } else {
        const json = await res.json();
        setErreur(json.error ?? "Erreur lors de la déclaration du stock");
      }
    } catch {
      setErreur("Erreur réseau");
    } finally {
      setChargement(false);
    }
  };

  return (
    <PageShell>
      <div className="space-y-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Retour à l&apos;accueil
        </Link>

        <header>
          <p className="text-eyebrow">Stock brut de récolte</p>
          <h1 className="mt-2 text-h1">Déclarer un nouveau stock</h1>
          <p className="mt-2 text-sm text-muted">
            Enregistrez les quantités physiques conservées dans votre grenier ou magasin.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="card bg-white shadow-sm border border-base-200">
          <div className="card-body gap-5 p-6">
            {erreur && (
              <div className="alert alert-error text-sm py-2">
                <span>{erreur}</span>
              </div>
            )}

            {/* Culture */}
            <div className="form-control gap-2">
              <label
                htmlFor="culture-select"
                className="label-text font-semibold text-base-content flex items-center gap-2"
              >
                <Package size={18} className="text-primary" />
                Culture récoltée
              </label>
              <select
                id="culture-select"
                value={culture}
                onChange={(e) => setCulture(e.target.value)}
                className="select select-bordered select-lg w-full text-base font-bold"
              >
                {CULTURES_COURANTES.map((c) => {
                  const val = c.replace(/^[^\s]+\s/, ""); // Enlever l'émoji du nom de la culture
                  return (
                    <option key={val} value={val}>
                      {c}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Quantité en kg */}
            <div className="form-control gap-2">
              <label htmlFor="quantite-input" className="label-text font-semibold text-base-content">
                Quantité physique (en kg)
              </label>
              <input
                id="quantite-input"
                type="number"
                min={10}
                max={100000}
                value={quantiteKg}
                onChange={(e) => setQuantiteKg(Number(e.target.value))}
                className="input input-bordered input-lg w-full text-xl font-bold"
                required
              />
              <span className="text-xs text-muted">Astuce : 1 sac de 50 kg = 50 kg</span>
            </div>

            {/* Valeur estimée */}
            <div className="form-control gap-2">
              <label htmlFor="valeur-input" className="label-text font-semibold text-base-content">
                Valeur estimée au marché actuel (FCFA)
              </label>
              <input
                id="valeur-input"
                type="number"
                min={0}
                step={5000}
                value={valeurEstimee}
                onChange={(e) => setValeurEstimee(Number(e.target.value))}
                className="input input-bordered input-lg w-full text-lg font-bold"
                required
              />
              <span className="text-xs text-muted">Cette valeur sert de base de calcul pour le micro-nantissement (70% max).</span>
            </div>

            {/* Notes / Lieu de stockage */}
            <div className="form-control gap-2">
              <label htmlFor="notes-input" className="label-text font-semibold text-base-content">
                Notes ou lieu de stockage
              </label>
              <input
                id="notes-input"
                type="text"
                placeholder="Ex: Grenier familial Kévé, Sacs de 50kg bon état..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="input input-bordered input-lg w-full text-base font-semibold"
              />
            </div>

            <div className="rounded-xl bg-primary/5 p-4 border border-primary/20 space-y-1">
              <p className="text-xs font-bold text-primary flex items-center gap-1.5">
                <Sparkles size={16} />
                Calcul automatique de nantissement
              </p>
              <p className="text-xs text-muted">
                Une fois ce stock enregistré, vous pourrez demander jusqu&apos;à 70% de sa valeur en avance cash immédiate.
              </p>
            </div>

            <button
              type="submit"
              disabled={chargement}
              className="btn btn-primary btn-lg w-full text-lg mt-2"
            >
              {chargement ? (
                <span className="loading loading-spinner" />
              ) : (
                <>
                  Enregistrer le stock
                  <ArrowRight size={20} aria-hidden="true" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </PageShell>
  );
}
