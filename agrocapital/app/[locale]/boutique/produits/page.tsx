"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Trash2, Tag, ArrowLeft, Pencil } from "lucide-react";
import { PageShell } from "@/_components/page-shell";
import { formatFcfa } from "@/_lib/utils";
import Image from "next/image";

type Produit = {
  id: string;
  culture: string;
  nom: string;
  description: string | null;
  photoUrl: string | null;
  prixUnitaire: number;
  uniteMesure: string;
  quantiteDisponible: number;
  statut: "DISPONIBLE" | "RUPTURE" | "ARCHIVE";
};

import { useTranslations } from "next-intl";

export default function MesProduitsPage() {
  const t = useTranslations("Boutique");
  const [produits, setProduits] = useState<Produit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/marketplace/produits");
        if (res.ok) {
          const json = await res.json();
          setProduits(json.data.produits ?? []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm(t("removeProductConfirm"))) return;
    try {
      const res = await fetch(`/api/marketplace/produits/${id}`, { method: "DELETE" });
      if (res.ok) {
        setProduits((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <PageShell>
      <div className="space-y-6">
        <Link href="/boutique" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">
          <ArrowLeft size={16} /> {t("backToBoutique")}
        </Link>

        <header className="flex items-center justify-between">
          <div>
            <p className="text-eyebrow">{t("vitrine")}</p>
            <h1 className="mt-1 text-h1">{t("myProducts")}</h1>
          </div>
          <Link href="/boutique/produits/nouveau" className="btn btn-primary btn-sm">
            <Plus size={16} /> {t("addProduct")}
          </Link>
        </header>

        {loading ? (
          <div className="flex justify-center p-8">
            <span className="loading loading-spinner loading-lg text-primary" />
          </div>
        ) : produits.length === 0 ? (
          <div className="card bg-white p-8 text-center border border-base-200 space-y-3">
            <Tag size={40} className="mx-auto text-muted" />
            <p className="text-sm text-muted">{t("noProducts")}</p>
            <Link href="/boutique/produits/nouveau" className="btn btn-primary btn-md mx-auto">
              {t("listProduct")}
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {produits.map((p) => (
              <div key={p.id} className="card bg-white border border-base-200 p-4 space-y-3 shadow-xs">
                {p.photoUrl ? (
  <Image
    src={p.photoUrl}
    alt={p.nom}
    className="h-40 w-full rounded-xl object-cover"
    width={200}
    height={200}
  />
) : (
  <div className="flex h-40 w-full items-center justify-center rounded-xl bg-primary/5 text-primary">
    <Tag size={36} />
  </div>
)}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-base text-base-content">{p.nom}</h3>
                    <p className="text-xs text-muted">{t("cropFormat", { culture: p.culture })}</p>
                  </div>
                  <span className={`badge border-0 font-bold text-xs ${p.statut === "DISPONIBLE" ? "bg-primary/10 text-primary" : "bg-error/20 text-error"}`}>
                    {p.statut}
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-lg font-extrabold text-primary">{formatFcfa(p.prixUnitaire)} / {p.uniteMesure}</span>
                  <span className="text-xs font-semibold text-muted">{t("availableFormat", { qty: p.quantiteDisponible, unit: p.uniteMesure })}</span>
                </div>
                <div className="flex justify-end gap-2 border-t border-base-100 pt-2">
  <Link
    href={`/boutique/produits/${p.id}`}
    className="btn btn-outline btn-primary btn-xs"
  >
    <Pencil size={14} /> {t("edit")}
  </Link>

  <button
    onClick={() => handleDelete(p.id)}
    className="btn btn-ghost btn-xs text-error"
  >
    <Trash2 size={14} /> {t("remove")}
  </button>
</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
