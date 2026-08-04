"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ShoppingBag, Trash2, Save, CheckCircle, AlertCircle, Tag, Eye } from "lucide-react";
import { PageShell } from "@/_components/page-shell";
import { ProductPhotoUpload } from "@/_components/product-photo-upload";
import { CULTURES_COURANTES, UNITES_MESURE, formatFcfa } from "@/_lib/utils";
import { useTranslations } from "next-intl";

type ProduitDetail = {
  id: string;
  culture: string;
  nom: string;
  description: string | null;
  prixUnitaire: number;
  uniteMesure: string;
  quantiteDisponible: number;
  statut: "DISPONIBLE" | "RUPTURE" | "ARCHIVE";
  photoUrl: string | null;
  boutique?: {
    nom: string;
  };
};

export default function ModifierProduitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const t = useTranslations("Boutique");
  const tc = useTranslations("Common");
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  // Form states
  const [culture, setCulture] = useState("Maïs");
  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");
  const [prixUnitaire, setPrixUnitaire] = useState<number>(0);
  const [uniteMesure, setUniteMesure] = useState("SAC50KG");
  const [quantiteDisponible, setQuantiteDisponible] = useState<number>(0);
  const [statut, setStatut] = useState<"DISPONIBLE" | "RUPTURE" | "ARCHIVE">("DISPONIBLE");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [newPhoto, setNewPhoto] = useState<File | null>(null);

  useEffect(() => {
    async function loadProduit() {
      try {
        const res = await fetch(`/api/marketplace/produits/${id}`);
        if (res.ok) {
          const json = await res.json();
          const p: ProduitDetail = json.data;
          setCulture(p.culture);
          setNom(p.nom);
          setDescription(p.description ?? "");
          setPrixUnitaire(p.prixUnitaire);
          setUniteMesure(p.uniteMesure);
          setQuantiteDisponible(p.quantiteDisponible);
          setStatut(p.statut);
          setPhotoUrl(p.photoUrl);
        } else {
          setErreur("Produit introuvable ou supprimé.");
        }
      } catch {
        setErreur(tc("networkError"));
      } finally {
        setLoading(false);
      }
    }

    loadProduit();
  }, [id, tc]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErreur(null);
    setSuccess(false);

    try {
      let updatedPhotoUrl = photoUrl;

      // Envoi de la nouvelle photo si présente
      if (newPhoto) {
        const formData = new FormData();
        formData.append("photo", newPhoto);

        const photoRes = await fetch(`/api/marketplace/produits/${id}/photo`, {
          method: "POST",
          body: formData,
        });

        if (photoRes.ok) {
          const photoJson = await photoRes.json();
          updatedPhotoUrl = photoJson.data.publicUrl;
        }
      }

      // Mise à jour des informations du produit
      const res = await fetch(`/api/marketplace/produits/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          culture,
          nom,
          description: description.trim() || undefined,
          prixUnitaire: Number(prixUnitaire),
          uniteMesure,
          quantiteDisponible: Number(quantiteDisponible),
          statut,
          photoUrl: updatedPhotoUrl,
        }),
      });

      if (res.ok) {
        setPhotoUrl(updatedPhotoUrl);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 4000);
      } else {
        const json = await res.json();
        setErreur(json.error ?? "Erreur lors de la mise à jour du produit.");
      }
    } catch {
      setErreur(tc("networkError"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(t("removeProductConfirm"))) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/marketplace/produits/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/boutique/produits");
        router.refresh();
      } else {
        setErreur("Erreur lors de la suppression du produit.");
      }
    } catch {
      setErreur(tc("networkError"));
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <PageShell>
        <div className="flex justify-center p-12">
          <span className="loading loading-spinner loading-lg text-emerald-600" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="space-y-6 max-w-4xl mx-auto pb-12">
        <Link
          href="/boutique/produits"
          className="inline-flex items-center gap-2 text-sm font-bold text-emerald-600 hover:text-emerald-700 hover:underline transition-colors"
        >
          <ArrowLeft size={16} /> {t("backToProducts")}
        </Link>

        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-eyebrow">{t("vitrine")}</p>
            <h1 className="mt-1 text-h1">Modifier le Produit</h1>
            <p className="mt-1 text-xs text-slate-500 font-medium">
              Ajustez les détails, le prix, le stock et l'image de votre produit.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/catalogue"
              target="_blank"
              className="btn btn-ghost btn-sm text-slate-600 font-bold gap-1 rounded-xl"
            >
              <Eye size={16} /> Aperçu Catalogue
            </Link>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="btn btn-error btn-outline btn-sm font-bold gap-1 rounded-xl"
            >
              <Trash2 size={16} /> {t("remove")}
            </button>
          </div>
        </header>

        {success && (
          <div className="alert alert-success bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl flex items-center gap-3">
            <CheckCircle className="text-emerald-600 shrink-0" size={20} />
            <span className="font-extrabold text-sm">Produit mis à jour avec succès !</span>
          </div>
        )}

        {erreur && (
          <div className="alert alert-error bg-rose-50 border border-rose-200 text-rose-900 rounded-2xl flex items-center gap-3">
            <AlertCircle className="text-rose-600 shrink-0" size={20} />
            <span className="font-extrabold text-sm">{erreur}</span>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Aperçu Visuel Produit */}
          <div className="card bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs space-y-4 h-fit">
            <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
              <Tag className="text-emerald-600" size={18} /> Aperçu Visuel
            </h3>

            <div className="relative h-48 w-full rounded-2xl bg-slate-100 overflow-hidden border border-slate-200">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={nom}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-emerald-50 text-emerald-600 font-bold text-sm">
                  <ShoppingBag size={40} className="text-emerald-500 opacity-60" />
                </div>
              )}
              <div className="absolute top-2 left-2">
                <span className="badge bg-white/90 backdrop-blur-md font-extrabold text-emerald-800 text-xs px-2.5 py-1 rounded-full border border-emerald-200">
                  {culture}
                </span>
              </div>
              <div className="absolute top-2 right-2">
                <span
                  className={`badge border-0 font-extrabold text-xs px-2.5 py-1 rounded-full text-white ${
                    statut === "DISPONIBLE" && quantiteDisponible > 0
                      ? "bg-emerald-600"
                      : "bg-rose-600"
                  }`}
                >
                  {statut === "DISPONIBLE" && quantiteDisponible > 0
                    ? `${quantiteDisponible} dispo`
                    : statut}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <p className="font-extrabold text-lg text-slate-900">{nom || "Sans titre"}</p>
              <p className="text-2xl font-black text-emerald-700">
                {formatFcfa(prixUnitaire || 0)}{" "}
                <span className="text-xs text-slate-400 font-normal">/ {uniteMesure}</span>
              </p>
            </div>
          </div>

          {/* Formulaire de Modification */}
          <form
            onSubmit={handleSubmit}
            className="lg:col-span-2 card border border-slate-200/80 bg-white rounded-3xl p-6 shadow-xs space-y-5"
          >
            <div className="space-y-4">
              <h3 className="font-extrabold text-base text-slate-900 pb-2 border-b border-slate-100">
                Informations du Produit
              </h3>

              {/* Sélection Culture */}
              <div className="form-control gap-1.5">
                <label className="label-text font-bold text-xs text-slate-700">
                  Culture concernée
                </label>
                <select
                  value={culture}
                  onChange={(e) => setCulture(e.target.value)}
                  className="select select-bordered w-full rounded-2xl text-sm font-semibold"
                >
                  {CULTURES_COURANTES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Titre du produit */}
              <div className="form-control gap-1.5">
                <label className="label-text font-bold text-xs text-slate-700">
                  Titre de l'annonce produit
                </label>
                <input
                  type="text"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  required
                  className="input input-bordered w-full rounded-2xl text-sm font-semibold"
                  placeholder="Ex. Sac de Maïs Blanc 50kg"
                />
              </div>

              {/* Grid Prix & Quantité */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="form-control gap-1.5">
                  <label className="label-text font-bold text-xs text-slate-700">
                    Prix Unitaire (FCFA)
                  </label>
                  <input
                    type="number"
                    value={prixUnitaire}
                    onChange={(e) => setPrixUnitaire(Number(e.target.value))}
                    required
                    min={0}
                    className="input input-bordered w-full rounded-2xl text-sm font-semibold"
                  />
                </div>

                <div className="form-control gap-1.5">
                  <label className="label-text font-bold text-xs text-slate-700">
                    Unité de vente
                  </label>
                  <select
                    value={uniteMesure}
                    onChange={(e) => setUniteMesure(e.target.value)}
                    className="select select-bordered w-full rounded-2xl text-sm font-semibold"
                  >
                    {UNITES_MESURE.map((u) => (
                      <option key={u.value} value={u.value}>
                        {u.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-control gap-1.5">
                  <label className="label-text font-bold text-xs text-slate-700">
                    Quantité en stock
                  </label>
                  <input
                    type="number"
                    value={quantiteDisponible}
                    onChange={(e) => setQuantiteDisponible(Number(e.target.value))}
                    required
                    min={0}
                    className="input input-bordered w-full rounded-2xl text-sm font-semibold"
                  />
                </div>
              </div>

              {/* Statut du produit */}
              <div className="form-control gap-1.5">
                <label className="label-text font-bold text-xs text-slate-700">
                  Statut de disponibilité
                </label>
                <select
                  value={statut}
                  onChange={(e) => setStatut(e.target.value as any)}
                  className="select select-bordered w-full rounded-2xl text-sm font-semibold"
                >
                  <option value="DISPONIBLE">DISPONIBLE — En vente sur la marketplace</option>
                  <option value="RUPTURE">RUPTURE — Épuisé temporairement</option>
                  <option value="ARCHIVE">ARCHIVÉ — Masqué de la boutique</option>
                </select>
              </div>

              {/* Description */}
              <div className="form-control gap-1.5">
                <label className="label-text font-bold text-xs text-slate-700">
                  Description complémentaire
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="textarea textarea-bordered w-full rounded-2xl text-sm leading-relaxed"
                  placeholder="Qualité du grain, emballage, lieu de livraison..."
                />
              </div>

              {/* Photo du produit */}
              <div className="form-control gap-1.5 pt-2">
                <label className="label-text font-bold text-xs text-slate-700">
                  Changer la photo du produit
                </label>
                <ProductPhotoUpload
                  produitId={id}
                  initialUrl={photoUrl}
                  onUploaded={(url) => setPhotoUrl(url)}
                  onPrepared={(file) => setNewPhoto(file)}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <Link
                href="/boutique/produits"
                className="btn btn-ghost btn-md font-bold rounded-2xl"
              >
                Annuler
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="btn bg-emerald-600 hover:bg-emerald-700 text-white border-0 btn-md font-extrabold rounded-2xl shadow-md shadow-emerald-600/20 gap-2 px-6"
              >
                <Save size={18} />
                <span>{saving ? "Enregistrement..." : "Enregistrer les modifications"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </PageShell>
  );
}
