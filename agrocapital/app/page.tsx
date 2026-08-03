"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Calculator,
  PlusCircle,
  ShoppingBag,
  Store,
  WalletCards,
  Tag,
} from "lucide-react";
import { motion } from "motion/react";
import { AlertBanner } from "@/_components/alert-banner";
import { PageShell } from "@/_components/page-shell";
import { StockCard, StockItem } from "@/_components/stock-card";
import { useCurrentUser } from "@/_hooks/useCurrentUser";
import { formatFcfa } from "@/_lib/utils";

const actionsAgriculteur = [
  {
    href: "/marche",
    label: "Market Radar",
    description: "Prix en temps réel & prédictions Agro-Pilot",
    icon: BarChart3,
  },
  {
    href: "/boutique",
    label: "Ma Boutique",
    description: "Gérer ma vitrine et mes produits en vente",
    icon: Store,
  },
  {
    href: "/nantissement",
    label: "Demander du cash",
    description: "Débloquer une avance sur mon stock physique",
    icon: WalletCards,
  },
  {
    href: "/simulateur",
    label: "Vendre ou attendre ?",
    description: "Calculer mon gain potentiel",
    icon: Calculator,
  },
  {
    href: "/commandes",
    label: "Commandes reçues",
    description: "Suivre et valider les demandes clients",
    icon: ShoppingBag,
  },
  {
    href: "/annonces",
    label: "Préventes & récoltes",
    description: "Annoncer une récolte future et recevoir des réservations",
    icon: Tag,
  },
];

const actionsClient = [
  {
    href: "/catalogue",
    label: "Explorer le marché",
    description: "Rechercher des produits vivriers locaux direct agriculteurs",
    icon: ShoppingBag,
  },
  {
    href: "/commandes",
    label: "Mes commandes",
    description: "Suivre la livraison de mes produits",
    icon: Store,
  },
  {
    href: "/annonces",
    label: "Récoltes à venir",
    description: "Réserver des produits avant récolte",
    icon: Tag,
  },
  {
    href: "/marche",
    label: "Prix du marché",
    description: "Suivre l'évolution officielle des cours",
    icon: BarChart3,
  },
];

export default function Home() {
  const { user, isLoading } = useCurrentUser();
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [valeurTotale, setValeurTotale] = useState(0);

  useEffect(() => {
    if (user && user.role === "AGRICULTEUR") {
      fetch("/api/stocks")
        .then((res) => (res.ok ? res.json() : null))
        .then((json) => {
          if (json?.data?.stocks) {
            const list: StockItem[] = json.data.stocks;
            setStocks(list);
            const total = list.reduce((acc, s) => acc + (s.valeurEstimee ?? 0), 0);
            setValeurTotale(total);
          }
        })
        .catch(console.error);
    }
  }, [user]);

  const isAgri = user?.role === "AGRICULTEUR" || !user; // Par défaut orientation agriculteur s'il n'est pas loggé
  const actionsList = isAgri ? actionsAgriculteur : actionsClient;

  return (
    <PageShell>
      <div className="space-y-7">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-2xl bg-base-200">
          <div className="flex items-center gap-2">
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, delay: 0.1 }}
              className="flex-1 py-7 pl-5 pr-2"
            >
              <p className="text-eyebrow">
                {user ? `Bonjour, ${user.nom} 👋` : "Bienvenue sur Agro-Capital 👋"}
              </p>
              <h1 className="mt-2 text-h1 leading-tight text-base-content">
                {user?.role === "CLIENT"
                  ? "Achetez en direct chez les producteurs togolais."
                  : "Votre récolte mérite le bon prix."}
              </h1>
              {!user && !isLoading && (
                <div className="mt-4 flex gap-2">
                  <Link href="/connexion" className="btn btn-primary btn-sm rounded-xl">
                    Se connecter
                  </Link>
                  <Link href="/inscription" className="btn btn-outline btn-sm rounded-xl">
                    S&apos;inscrire
                  </Link>
                </div>
              )}
            </motion.div>
            <div className="shrink-0 w-40 sm:w-52">
              <Image
                src="/illustartion1.png"
                alt="Agriculteur consultant son téléphone"
                width={1080}
                height={1080}
                priority
                className="h-36 w-full object-contain object-bottom rounded-4xl sm:h-44"
              />
            </div>
          </div>
        </section>

        {/* Valeur totale du stock si agriculteur */}
        {user?.role === "AGRICULTEUR" && (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.18 }}
            className="card bg-primary text-primary-content shadow-md"
          >
            <div className="card-body gap-1.5 p-5">
              <p className="text-sm font-semibold opacity-80">Valeur totale de vos stocks déclarés</p>
              <p className="text-hero">{formatFcfa(valeurTotale)}</p>
              <p className="text-sm opacity-80">{stocks.length} stock(s) enregistré(s)</p>
            </div>
          </motion.section>
        )}

        {/* Alerte prix */}
        <AlertBanner />

        {/* Actions rapides */}
        <section>
          <h2 className="text-h2 mb-4">Que voulez-vous faire ?</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {actionsList.map(({ href, label, description, icon: Icon }, i) => (
              <motion.div
                key={href}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: 0.2 + i * 0.05 }}
              >
                <Link
                  href={href}
                  className="card bg-white shadow-sm border border-base-200 hover:shadow-md hover:border-primary/30 transition-all duration-200 block h-full"
                >
                  <div className="card-body flex-row items-center gap-4 p-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Icon size={23} aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <strong className="block text-base text-base-content">{label}</strong>
                      <small className="mt-0.5 block text-xs text-muted">{description}</small>
                    </span>
                    <ArrowRight className="shrink-0 text-primary/60" size={18} aria-hidden="true" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Section Stocks pour l'agriculteur */}
        {user?.role === "AGRICULTEUR" && (
          <section>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-h2">Mes stocks physiques</h2>
                <p className="text-xs text-muted">Données d&apos;exploitation en grenier/magasin</p>
              </div>
              <Link href="/stocks/nouveau" className="btn btn-primary btn-sm rounded-xl font-bold">
                + Déclarer un stock
              </Link>
            </div>
            {stocks.length === 0 ? (
              <div className="card bg-white p-6 text-center border border-base-200">
                <p className="text-sm text-muted">Vous n&apos;avez encore déclaré aucun stock de récolte.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {stocks.map((stock, i) => (
                  <StockCard key={stock.id} stock={stock} index={i} />
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </PageShell>
  );
}