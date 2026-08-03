"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, ShoppingBag } from "lucide-react";
import { PageShell } from "@/_components/page-shell";
import { CULTURES_COURANTES, UNITES_MESURE } from "@/_lib/utils";

type Stock = {
  id: string;
  culture: string;
  quantiteKg: number;
};

export default function NouveauProduitCommercialPage() {
  const router = useRouter();
  const [culture, setCulture] = useState("Maïs");
  const [nom, setNom] = useState("Sac de Maïs Blanc de Kévé");
  const [description, setDescription] = useState("");
  const [prixUnitaire, setPrixUnitaire] = useState(9000);
  const [uniteMesure, setUniteMesure] = useState("SAC50KG");
  const [quantiteDisponible, setQuantiteDisponible] = useState(10);
  const [stockSourceId, setStockSourceId] = useState<string>("");
  const [stocks, setStocks] = useState<Stock[]>([]);

  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/stocks")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.data?.stocks) setStocks(json.data.stocks);
      })
      .catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setChargement(true);
    setErreur(null);

    try {
      const res = await fetch("/api/marketplace/produits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          culture,
          nom,
          description: description.trim() || undefined,
          prixUnitaire: Number(prixUnitaire),
          uniteMesure,
          quantiteDisponible: Number(quantiteDisponible),
          stockSourceId: stockSourceId || undefined,
        }),
      });

      if (res.ok) {
        router.push("/boutique/produits");
        router.refresh();
      } else {
        const json = await res.json();
        setErreur(json.error ?? "Erreur lors de la mise en vente du produit");
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
        <Link href="/boutique/produits" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">
          <ArrowLeft size={16} /> Retour à mes produits
        </Link>

        <header>
          <p className="text-eyebrow">Vitrine commerciale</p>
          <h1 className="mt-1 text-h1">Mettre un produit en vente</h1>
          <p className="mt-2 text-sm text-muted">
            Créez une fiche produit accessible par les acheteurs et autres agriculteurs sur la marketplace.
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
              <label htmlFor="culture-select" className="label-text font-semibold flex items-center gap-2">
                <ShoppingBag size={18} className="text-primary" /> Culture
              </label>
              <select
                id="culture-select"
                value={culture}
                onChange={(e) => setCulture(e.target.value)}
                className="select select-bordered select-lg w-full font-bold"
              >
                {CULTURES_COURANTES.map((c) => {
                  const val = c.replace(/^[^\s]+\s/, "");
                  return <option key={val} value={val}>{c}</option>;
                })}
              </select>
            </div>

            {/* Nom commercial */}
            <div className="form-control gap-2">
              <label htmlFor="nom" className="label-text font-semibold">Titre de l&apos;annonce produit</label>
              <input
                id="nom"
                type="text"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                className="input input-bordered input-lg w-full font-semibold"
                required
              />
            </div>

            {/* Prix & Unité */}
            <div className="grid grid-cols-2 gap-3">
              <div className="form-control gap-2">
                <label htmlFor="prix" className="label-text font-semibold">Prix unitaire (FCFA)</label>
                <input
                  id="prix"
                  type="number"
                  min={100}
                  step={500}
                  value={prixUnitaire}
                  onChange={(e) => setPrixUnitaire(Number(e.target.value))}
                  className="input input-bordered input-lg w-full font-bold text-primary"
                  required
                />
              </div>

              <div className="form-control gap-2">
                <label htmlFor="unite" className="label-text font-semibold">Unité de vente</label>
                <select
                  id="unite"
                  value={uniteMesure}
                  onChange={(e) => setUniteMesure(e.target.value)}
                  className="select select-bordered select-lg w-full font-semibold"
                >
                  {UNITES_MESURE.map((u) => (
                    <option key={u.value} value={u.value}>{u.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quantité dispo */}
            <div className="form-control gap-2">
              <label htmlFor="qte" className="label-text font-semibold">Quantité mise en vente</label>
              <input
                id="qte"
                type="number"
                min={1}
                value={quantiteDisponible}
                onChange={(e) => setQuantiteDisponible(Number(e.target.value))}
                className="input input-bordered input-lg w-full font-bold"
                required
              />
            </div>

            {/* Option rattachement à un stock physique */}
            {stocks.length > 0 && (
              <div className="form-control gap-2 bg-base-200 p-4 rounded-xl">
                <label htmlFor="stock-link" className="label-text font-semibold text-xs text-muted uppercase">
                  (Optionnel) Rattaché à votre stock physique
                </label>
                <select
                  id="stock-link"
                  value={stockSourceId}
                  onChange={(e) => setStockSourceId(e.target.value)}
                  className="select select-bordered select-md w-full font-medium"
                >
                  <option value="">Aucun lien (indépendant)</option>
                  {stocks.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.culture} — {s.quantiteKg} kg disponibles
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Description */}
            <div className="form-control gap-2">
              <label htmlFor="desc" className="label-text font-semibold">Description complémentaire</label>
              <textarea
                id="desc"
                rows={3}
                placeholder="Qualité du grain, séchage, emballage..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="textarea textarea-bordered w-full"
              />
            </div>

            <button type="submit" disabled={chargement} className="btn btn-primary btn-lg w-full mt-2">
              {chargement ? <span className="loading loading-spinner" /> : <>Publier le produit <ArrowRight size={20} /></>}
            </button>
          </div>
        </form>
      </div>
    </PageShell>
  );
}
