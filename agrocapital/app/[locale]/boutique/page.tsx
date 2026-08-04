"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Store, ShoppingBag } from "lucide-react";
import { PageShell } from "@/_components/page-shell";
import { useCurrentUser } from "@/_hooks/useCurrentUser";
import { useTranslations } from "next-intl";


type Boutique = {
  id: string;
  nom: string;
  description: string | null;
  userId: string;
  user: {
    nom: string;
    prenom: string | null;
    region: string;
    telephone: string;
  };
  _count?: {
    produits: number;
  };
};

export default function BoutiquePage() {
  const { user } = useCurrentUser();
  const t = useTranslations("Boutique");
  const [boutiques, setBoutiques] = useState<Boutique[]>([]);
  const [maBoutique, setMaBoutique] = useState<Boutique | null>(null);
  const [loading, setLoading] = useState(true);

  // Formulaire de création
  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");
  const [creerState, setCreerState] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    async function loadBoutiques() {
      try {
        const res = await fetch("/api/marketplace/boutique");
        if (res.ok) {
          const json = await res.json();
          const items: Boutique[] = json.data.boutiques ?? [];
          setBoutiques(items);

          if (user) {
            const mine = items.find((b) => b.userId === user.id);
            setMaBoutique(mine ?? null);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadBoutiques();
  }, [user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreur(null);
    setCreerState(true);

    try {
      const res = await fetch("/api/marketplace/boutique", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom, description: description.trim() || undefined }),
      });

      if (res.ok) {
        const json = await res.json();
        setMaBoutique(json.data);
        window.location.reload();
      } else {
        const json = await res.json();
        setErreur(json.error ?? t("createError"));
      }
    } catch {
      setErreur(t("networkError"));
    } finally {
      setCreerState(false);
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

  return (
    <PageShell>
      <div className="space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-eyebrow">{t("eyebrow")}</p>
            <h1 className="mt-1 text-h1">{t("title")}</h1>
          </div>
        </header>

        {/* Section Ma Boutique si Agriculteur */}
        {user?.role === "AGRICULTEUR" && (
          <section className="card bg-primary/5 border border-primary/20 p-5 space-y-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white">
                <Store size={20} />
              </span>
              <div>
                <h2 className="text-h2">{t("myShopTitle")}</h2>
                <p className="text-xs text-muted">{t("myShopSubtitle")}</p>
              </div>
            </div>

            {maBoutique ? (
              <div className="bg-white p-4 rounded-xl border border-base-200 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg text-base-content">{maBoutique.nom}</h3>
                    <p className="text-sm text-muted">{maBoutique.description ?? t("noDescription")}</p>
                  </div>
                  <span className="badge badge-primary font-bold">Active</span>
                </div>
                <div className="flex gap-2 pt-2">
                  <Link href="/boutique/produits" className="btn btn-primary btn-sm flex-1">
                    <ShoppingBag size={16} />
                    {t("manageProducts")}
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreate} className="bg-white p-4 rounded-xl border border-base-200 space-y-3">
                <p className="text-sm font-semibold">{t("noShopYet")}</p>
                {erreur && <div className="alert alert-error text-xs p-2">{erreur}</div>}
                <div className="form-control gap-1">
                  <label htmlFor="b-nom" className="label-text text-xs font-bold">{t("shopNameLabel")}</label>
                  <input
                    id="b-nom"
                    type="text"
                    placeholder={t("shopNamePlaceholder")}
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    className="input input-bordered input-sm w-full font-bold"
                    required
                  />
                </div>
                <div className="form-control gap-1">
                  <label htmlFor="b-desc" className="label-text text-xs font-bold">{t("shopDescLabel")}</label>
                  <textarea
                    id="b-desc"
                    placeholder={t("shopDescPlaceholder")}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="textarea textarea-bordered text-sm w-full"
                  />
                </div>
                <button type="submit" disabled={creerState} className="btn btn-primary btn-sm w-full">
                  {creerState ? <span className="loading loading-spinner" /> : <><Plus size={16} /> {t("createShop")}</>}
                </button>
              </form>
            )}
          </section>
        )}

        {/* Annuaire des boutiques publiques */}
        <section>
          <h2 className="text-h2 mb-3">{t("allShops")}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {boutiques.map((b) => (
              <div key={b.id} className="card bg-white border border-base-200 p-4 space-y-2 hover:shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-base-200 text-primary font-bold">
                    {b.nom[0]}
                  </span>
                  <div>
                    <h3 className="font-bold text-base-content">{b.nom}</h3>
                    <p className="text-xs text-muted">{t("owner", { nom: b.user.nom, region: b.user.region })}</p>
                  </div>
                </div>
                {b.description && <p className="text-xs text-muted line-clamp-2">{b.description}</p>}
                <div className="flex justify-between items-center pt-2 text-xs">
                  <span className="text-primary font-semibold">{t("productsCount", { count: b._count?.produits ?? 0 })}</span>
                  <Link href={`/catalogue?boutiqueId=${b.id}`} className="link link-primary font-bold">
                    {t("visitShop")}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </PageShell>
  );
}
