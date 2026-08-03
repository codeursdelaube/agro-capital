"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Trash2, Tag, ArrowLeft } from "lucide-react";
import { PageShell } from "@/_components/page-shell";
import { formatFcfa } from "@/_lib/utils";

type Produit = {
  id: string;
  culture: string;
  nom: string;
  description: string | null;
  prixUnitaire: number;
  uniteMesure: string;
  quantiteDisponible: number;
  statut: "DISPONIBLE" | "RUPTURE" | "ARCHIVE";
};

export default function MesProduitsPage() {
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
    if (!confirm("Retirer ce produit de la vente ?")) return;
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
          <ArrowLeft size={16} /> Retour à ma boutique
        </Link>

        <header className="flex items-center justify-between">
          <div>
            <p className="text-eyebrow">Vitrine commerciale</p>
            <h1 className="mt-1 text-h1">Mes produits en vente</h1>
          </div>
          <Link href="/boutique/produits/nouveau" className="btn btn-primary btn-sm">
            <Plus size={16} /> Ajouter un produit
          </Link>
        </header>

        {loading ? (
          <div className="flex justify-center p-8">
            <span className="loading loading-spinner loading-lg text-primary" />
          </div>
        ) : produits.length === 0 ? (
          <div className="card bg-white p-8 text-center border border-base-200 space-y-3">
            <Tag size={40} className="mx-auto text-muted" />
            <p className="text-sm text-muted">Vous n&apos;avez mis aucun produit en vente dans votre boutique.</p>
            <Link href="/boutique/produits/nouveau" className="btn btn-primary btn-md mx-auto">
              Mettre un produit en vente
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {produits.map((p) => (
              <div key={p.id} className="card bg-white border border-base-200 p-4 space-y-3 shadow-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-base text-base-content">{p.nom}</h3>
                    <p className="text-xs text-muted">Culture : {p.culture}</p>
                  </div>
                  <span className={`badge border-0 font-bold text-xs ${p.statut === "DISPONIBLE" ? "bg-primary/10 text-primary" : "bg-error/20 text-error"}`}>
                    {p.statut}
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-lg font-extrabold text-primary">{formatFcfa(p.prixUnitaire)} / {p.uniteMesure}</span>
                  <span className="text-xs font-semibold text-muted">Dispo : {p.quantiteDisponible} {p.uniteMesure}</span>
                </div>
                <div className="flex justify-end pt-2 border-t border-base-100">
                  <button onClick={() => handleDelete(p.id)} className="btn btn-ghost btn-xs text-error">
                    <Trash2 size={14} /> Retirer
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
