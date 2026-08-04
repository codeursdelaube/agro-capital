"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, ShoppingBag } from "lucide-react";
import { PageShell } from "@/_components/page-shell";
import { ProductPhotoUpload } from "@/_components/product-photo-upload";
import { CULTURES_COURANTES, UNITES_MESURE } from "@/_lib/utils";

type Stock = {
  id: string;
  culture: string;
  quantiteKg: number;
};

import { useTranslations } from "next-intl";

export default function NouveauProduitCommercialPage() {
  const t = useTranslations("Boutique");
  const tc = useTranslations("Common");
  const router = useRouter();
  const [culture, setCulture] = useState("Maïs");
  const [nom, setNom] = useState("Sac de Maïs Blanc de Kévé");
  const [description, setDescription] = useState("");
  const [prixUnitaire, setPrixUnitaire] = useState(9000);
  const [uniteMesure, setUniteMesure] = useState("SAC50KG");
  const [quantiteDisponible, setQuantiteDisponible] = useState(10);
  const [stockSourceId, setStockSourceId] = useState<string>("");
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [photo, setPhoto] = useState<File | null>(null);

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

      if (!res.ok) {
        const json = await res.json();
        setErreur(json.error ?? t("createProductError"));
        return;
      }

      const json = await res.json();

      if (photo) {
        const formData = new FormData();
        formData.append("photo", photo);

        const photoResponse = await fetch(
          `/api/marketplace/produits/${json.data.id}/photo`,
          {
            method: "POST",
            body: formData,
          }
        );

        const photoJson = await photoResponse.json();

        if (!photoResponse.ok) {
          setErreur(t("photoSendFail"));
          return;
        }

        const updateResponse = await fetch(
          `/api/marketplace/produits/${json.data.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ photoUrl: photoJson.data.publicUrl }),
          }
        );

        if (!updateResponse.ok) {
          setErreur(t("photoSaveFail"));
          return;
        }
      }

      router.push("/boutique/produits");
      router.refresh();
    } catch {
      setErreur(tc("networkError"));
    } finally {
      setChargement(false);
    }
  };

  return (
    <PageShell>
      <div className="space-y-6">
        <Link
          href="/boutique/produits"
          className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
        >
          <ArrowLeft size={16} /> {t("backToProducts")}
        </Link>

        <header>
          <p className="text-eyebrow">{t("vitrine")}</p>
          <h1 className="mt-1 text-h1">{t("createProductTitle")}</h1>
          <p className="mt-2 text-sm text-muted">
            {t("createProductSubtitle")}
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="card border border-base-200 bg-white shadow-sm"
        >
          <div className="card-body gap-5 p-6">
            {erreur && (
              <div className="alert alert-error text-sm py-2">
                <span>{erreur}</span>
              </div>
            )}

            <div className="form-control gap-2">
              <label
                htmlFor="culture-select"
                className="label-text flex items-center gap-2 font-semibold"
              >
                <ShoppingBag size={18} className="text-primary" /> {t("cropInputPlaceholder")}
              </label>
            <input
  id="culture-select"
  type="text"
  list="cultures-suggestions"
  value={culture}
  onChange={(e) => setCulture(e.target.value)}
  placeholder={t("cropInputPlaceholder")}
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
              <span className="label-text font-semibold">
                {t("photoLabel")}{" "}
                <span className="font-normal text-muted">{t("photoOptional")}</span>
              </span>
              <ProductPhotoUpload onPrepared={setPhoto} />
            </div>

            <div className="form-control gap-2">
              <label htmlFor="nom" className="label-text font-semibold">
                {t("titleLabel")}
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
                  {t("unitPriceLabel")}
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
                  {t("unitLabel")}
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
                {t("qtyToSellLabel")}
              </label>
              <input
                id="qte"
                type="number"
                min={1}
                value={quantiteDisponible}
                onChange={(e) =>
                  setQuantiteDisponible(Number(e.target.value))
                }
                className="input input-bordered input-lg w-full font-bold"
                required
              />
            </div>

            {stocks.length > 0 && (
              <div className="form-control gap-2 rounded-xl bg-base-200 p-4">
                <label
                  htmlFor="stock-link"
                  className="label-text text-xs font-semibold uppercase text-muted"
                >
                  {t("stockLinkOptional")}
                </label>
                <select
                  id="stock-link"
                  value={stockSourceId}
                  onChange={(e) => setStockSourceId(e.target.value)}
                  className="select select-bordered select-md w-full font-medium"
                >
                  <option value="">{t("noStockLink")}</option>
                  {stocks.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.culture} — {s.quantiteKg} kg disponibles
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-control gap-2">
              <label htmlFor="desc" className="label-text font-semibold">
                {t("descLabel")}
              </label>
              <textarea
                id="desc"
                rows={3}
                placeholder={t("descPlaceholder")}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="textarea textarea-bordered w-full"
              />
            </div>

            <button
              type="submit"
              disabled={chargement}
              className="btn btn-primary btn-lg mt-2 w-full"
            >
              {chargement ? (
                <span className="loading loading-spinner" />
              ) : (
                <>
                  {t("publishProduct")} <ArrowRight size={20} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </PageShell>
  );
}