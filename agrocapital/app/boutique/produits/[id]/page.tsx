"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, ShoppingBag } from "lucide-react";
import { PageShell } from "@/_components/page-shell";
import { ProductPhotoUpload } from "@/_components/product-photo-upload";
import { CULTURES_COURANTES, UNITES_MESURE } from "@/_lib/utils";

type Produit = {
  id: string;
  culture: string;
  nom: string;
  description: string | null;
  prixUnitaire: number;
  uniteMesure: string;
  quantiteDisponible: number;
  photoUrl: string | null;
};

export default function ModifierProduitPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [produit, setProduit] = useState<Produit | null>(null);
  const [culture, setCulture] = useState("");
  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");
  const [prixUnitaire, setPrixUnitaire] = useState(0);
  const [uniteMesure, setUniteMesure] = useState("");
  const [quantiteDisponible, setQuantiteDisponible] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    async function chargerProduit() {
      try {
        const res = await fetch(`/api/marketplace/produits/${params.id}`);
        const json = await res.json();

        if (!res.ok) {
          setErreur(json.error ?? "Produit introuvable");
          return;
        }

        const data: Produit = json.data;
        setProduit(data);
        setCulture(data.culture);
        setNom(data.nom);
        setDescription(data.description ?? "");
        setPrixUnitaire(data.prixUnitaire);
        setUniteMesure(data.uniteMesure);
        setQuantiteDisponible(data.quantiteDisponible);
      } catch {
        setErreur("Impossible de charger le produit");
      } finally {
        setLoading(false);
      }
    }

    chargerProduit();
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErreur(null);

    try {
      const res = await fetch(`/api/marketplace/produits/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          culture,
          nom,
          description: description.trim() || undefined,
          prixUnitaire: Number(prixUnitaire),
          uniteMesure,
          quantiteDisponible: Number(quantiteDisponible),
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setErreur(json.error ?? "Modification impossible");
        return;
      }

      router.push("/boutique/produits");
      router.refresh();
    } catch {
      setErreur("Erreur réseau");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageShell>
        <div className="flex justify-center p-12">
          <span className="loading loading-spinner loading-lg text-primary" />
        </div>
      </PageShell>
    );
  }

  if (!produit) {
    return (
      <PageShell>
        <div className="alert alert-error">{erreur ?? "Produit introuvable"}</div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="space-y-6">
        <Link
          href="/boutique/produits"
          className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
        >
          <ArrowLeft size={16} /> Retour à mes produits
        </Link>

        <header>
          <p className="text-eyebrow">Vitrine commerciale</p>
          <h1 className="mt-1 text-h1">Modifier le produit</h1>
        </header>

        <form
          onSubmit={handleSubmit}
          className="card border border-base-200 bg-white shadow-sm"
        >
          <div className="card-body gap-5 p-6">
            {erreur && (
              <div className="alert alert-error text-sm py-2">{erreur}</div>
            )}

            <div className="form-control gap-2">
              <span className="label-text font-semibold">Photo du produit</span>
              <ProductPhotoUpload
                produitId={produit.id}
                initialUrl={produit.photoUrl}
                onUploaded={(photoUrl) =>
                  setProduit((current) =>
                    current ? { ...current, photoUrl } : current
                  )
                }
              />
            </div>

            <div className="form-control gap-2">
              <label
                htmlFor="culture-select"
                className="label-text flex items-center gap-2 font-semibold"
              >
                <ShoppingBag size={18} className="text-primary" /> Culture
              </label>

              <input
                id="culture-select"
                type="text"
                list="cultures-suggestions"
                value={culture}
                onChange={(e) => setCulture(e.target.value)}
                className="input input-bordered input-lg w-full font-bold"
                required
              />

              <datalist id="cultures-suggestions">
                {CULTURES_COURANTES.map((c) => {
                  const val = c.replace(/^[^\s]+\s/, "");
                  return <option key={val} value={val} />;
                })}
              </datalist>
            </div>

            <div className="form-control gap-2">
              <label htmlFor="nom" className="label-text font-semibold">
                Titre de l’annonce produit
              </label>
              <input
                id="nom"
                type="text"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                className="input input-bordered input-lg w-full font-semibold"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="form-control gap-2">
                <label htmlFor="prix" className="label-text font-semibold">
                  Prix unitaire (FCFA)
                </label>
                <input
                  id="prix"
                  type="number"
                  min={100}
                  step={1}
                  value={prixUnitaire}
                  onChange={(e) => setPrixUnitaire(Number(e.target.value))}
                  className="input input-bordered input-lg w-full font-bold text-primary"
                  required
                />
              </div>

              <div className="form-control gap-2">
                <label htmlFor="unite" className="label-text font-semibold">
                  Unité de vente
                </label>
                <select
                  id="unite"
                  value={uniteMesure}
                  onChange={(e) => setUniteMesure(e.target.value)}
                  className="select select-bordered select-lg w-full font-semibold"
                >
                  {UNITES_MESURE.map((u) => (
                    <option key={u.value} value={u.value}>
                      {u.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-control gap-2">
              <label htmlFor="qte" className="label-text font-semibold">
                Quantité disponible
              </label>
              <input
                id="qte"
                type="number"
                min={0}
                value={quantiteDisponible}
                onChange={(e) =>
                  setQuantiteDisponible(Number(e.target.value))
                }
                className="input input-bordered input-lg w-full font-bold"
                required
              />
            </div>

            <div className="form-control gap-2">
              <label htmlFor="desc" className="label-text font-semibold">
                Description complémentaire
              </label>
              <textarea
                id="desc"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="textarea textarea-bordered w-full"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary btn-lg w-full"
            >
              {saving ? (
                <span className="loading loading-spinner" />
              ) : (
                <>
                  <Save size={20} /> Enregistrer les modifications
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </PageShell>
  );
}