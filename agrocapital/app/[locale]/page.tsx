"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Calculator,
  ShoppingBag,
  Store,
  WalletCards,
  Tag,
  TrendingUp,
  Shield,
  Zap,
  Star,
  Sparkles,
} from "lucide-react";
import { motion, useScroll, useTransform, type Variants } from "motion/react";
import { useCurrentUser } from "@/_hooks/useCurrentUser";
import { formatFcfa } from "@/_lib/utils";
import { useTranslations } from "next-intl";
import { PwaInstallButton } from "@/_components/pwa-install-button";


// ─── Animation Variants ───────────────────────────────────────────────────────
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.1, ease: "easeOut" },
  }),
};

const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: (i = 0) => ({
    opacity: 1,
    transition: { duration: 0.5, delay: i * 0.08 },
  }),
};

// ─── Données features ─────────────────────────────────────────────────────────
const features = [
  {
    icon: Sparkles,
    color: "bg-emerald-100 text-emerald-800",
    title: "Agro-Pilot IA",
    desc: "Votre assistant virtuel intelligent connecté à Supabase : opportunités de vente, météo et prêts bancaires.",
    href: "/agro-pilot",
  },
  {
    icon: BarChart3,
    color: "bg-emerald-100 text-emerald-700",
    title: "Market Radar",
    desc: "Suivez les prix en temps réel et recevez des prédictions Agro-Pilot avant tout le monde.",
    href: "/marche",
  },
  {
    icon: WalletCards,
    color: "bg-yellow-100 text-yellow-700",
    title: "Cash Immédiat",
    desc: "Obtenez une avance sur votre stock physique sans attendre la vente finale.",
    href: "/nantissement",
  },
  {
    icon: Store,
    color: "bg-blue-100 text-blue-700",
    title: "Boutique Digitale",
    desc: "Vendez vos produits en ligne avec livraison Mobile Money directe sur votre portefeuille.",
    href: "/boutique",
  },
  {
    icon: Tag,
    color: "bg-purple-100 text-purple-700",
    title: "Préventes",
    desc: "Annoncez vos récoltes avant même la moisson. Recevez des réservations et des acomptes.",
    href: "/annonces",
  },
  {
    icon: Calculator,
    color: "bg-orange-100 text-orange-700",
    title: "Vendre ou Attendre ?",
    desc: "Le simulateur calcule si vous gagnez plus en vendant maintenant ou dans 3 mois.",
    href: "/simulateur",
  },
  {
    icon: ShoppingBag,
    color: "bg-rose-100 text-rose-700",
    title: "Commandes Directes",
    desc: "Recevez des commandes de clients ou d'autres agriculteurs, directement sur votre téléphone.",
    href: "/commandes",
  },
];

const stats = [
  { value: "2 400+", label: "Agriculteurs inscrits" },
  { value: "850M", label: "FCFA de transactions" },
  { value: "98%", label: "Satisfaction clients" },
];

// ─── Composants Hero Public (non connecté) ────────────────────────────────────
// ─── Composants Hero Public (non connecté) ────────────────────────────────────
function HeroPublic() {
  const t = useTranslations("Home");

  const stats = [
    { value: "2 400+", label: t("statsAgriculteurs"), icon: "🧑‍🌾" },
    { value: "850M", label: t("statsTransactions"), icon: "💰" },
    { value: "98%", label: t("statsSatisfaction"), icon: "⭐" },
  ];

  return (
    <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-emerald-900/5 via-emerald-50/60 to-yellow-50/50 border border-emerald-100/80 shadow-xs">
      {/* Decorative Blob lights */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -right-40 h-[32rem] w-[32rem] rounded-full bg-emerald-400/20 blur-[100px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -left-20 h-[28rem] w-[28rem] rounded-full bg-yellow-400/20 blur-[100px]"
      />

      <div className="relative px-6 py-12 sm:px-10 lg:px-14 lg:py-20">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Headline & Action CTA */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0}
            className="lg:col-span-7 space-y-6"
          >
            {/* Live Badge */}
            <div className="inline-flex items-center gap-2.5 rounded-full border border-emerald-500/20 bg-white/80 backdrop-blur-md px-4 py-2 shadow-sm">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-bold tracking-wide text-emerald-800 uppercase">
                {t("badge")}
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black leading-[1.12] tracking-tight text-slate-900">
              {t("heroTitle")}{" "}
              <span className="relative inline-block text-emerald-600">
                {t("heroTitleHighlight")}
                <span
                  aria-hidden
                  className="absolute bottom-1 left-0 -z-10 h-3 w-full rounded-sm bg-yellow-300/60 -skew-x-3"
                />
              </span>
            </h1>

            <p className="text-sm sm:text-lg text-slate-600 leading-relaxed lg:max-w-xl font-medium">
              {t("heroSubtitle")}
            </p>

            {/* CTAs */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              <Link
                href="/inscription"
                id="cta-inscription-hero"
                className="group relative inline-flex items-center justify-center gap-2.5 rounded-2xl bg-emerald-600 px-6 sm:px-7 py-3.5 sm:py-4 text-sm sm:text-base font-extrabold text-white shadow-xl shadow-emerald-600/25 hover:bg-emerald-700 hover:shadow-2xl hover:shadow-emerald-600/35 active:scale-95 transition-all duration-200"
              >
                {t("ctaStart")}
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <PwaInstallButton />
              <Link
                href="/connexion"
                id="cta-connexion-hero"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-slate-200/90 bg-white/90 backdrop-blur-md px-6 sm:px-7 py-3.5 sm:py-4 text-sm sm:text-base font-extrabold text-slate-700 hover:border-emerald-400 hover:text-emerald-700 hover:shadow-lg active:scale-95 transition-all duration-200"
              >
                {t("ctaLogin")}
              </Link>
            </div>

            {/* Mini Stats Cards */}
            <div className="pt-6 border-t border-slate-200/60 grid grid-cols-3 gap-2 sm:gap-4">
              {stats.map((s) => (
                <div key={s.label} className="p-2.5 sm:p-3 rounded-2xl bg-white/60 backdrop-blur-xs border border-white/80 shadow-xs text-center sm:text-left">
                  <div className="text-xs sm:text-sm">{s.icon}</div>
                  <p className="text-base sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">{s.value}</p>
                  <p className="text-[10px] sm:text-[11px] font-semibold text-slate-500 line-clamp-1">{s.label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right Column: Hero Graphic with Floating Glass Cards */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 relative flex justify-center"
          >
            <div className="relative w-full max-w-md">
              
              {/* Floating Badge Top Left */}
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="absolute -top-3 -left-2 sm:-top-4 sm:-left-4 z-20 flex items-center gap-2 sm:gap-3 rounded-2xl border border-emerald-500/20 bg-white/90 backdrop-blur-md px-3 sm:px-4 py-2 sm:py-3 shadow-xl"
              >
                <span className="flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 font-extrabold text-xs sm:text-sm">
                  📈
                </span>
                <div>
                  <p className="text-[10px] sm:text-xs font-black text-slate-900">{t("heroFloatBadge1")}</p>
                  <p className="text-[9px] sm:text-[10px] font-semibold text-slate-500">Agro-Capital Analytics</p>
                </div>
              </motion.div>

              {/* Floating Badge Bottom Right */}
              <motion.div
                animate={{ y: [0, 6, 0] }}
                transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut" }}
                className="absolute -bottom-3 -right-2 sm:-bottom-4 sm:-right-2 z-20 flex items-center gap-2 sm:gap-3 rounded-2xl border border-amber-500/20 bg-white/90 backdrop-blur-md px-3 sm:px-4 py-2 sm:py-3 shadow-xl"
              >
                <span className="flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700 font-extrabold text-xs sm:text-sm">
                  ⚡
                </span>
                <div>
                  <p className="text-[10px] sm:text-xs font-black text-slate-900">{t("heroFloatBadge2")}</p>
                  <p className="text-[9px] sm:text-[10px] font-semibold text-slate-500">T-Money & Flooz</p>
                </div>
              </motion.div>

              {/* Main Image Container */}
              <div className="relative rounded-3xl bg-gradient-to-b from-white to-emerald-50/50 p-4 border border-white/80 shadow-2xl overflow-hidden">
                <Image
                  src="/illustartion1.png"
                  alt={t("heroIllustrationAlt")}
                  width={600}
                  height={600}
                  priority
                  className="w-full h-auto object-contain transform hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}

// ─── Widget Cultures Recommandées (Agro-Pilot FastAPI) ────────────────────────
type CultureRec = {
  culture: string;
  score_rentabilite: number;
  raison: string;
  saison_optimale: string;
};

function RecommandationsCulturesWidget() {
  const t = useTranslations("Home");
  const [cultures, setCultures] = useState<CultureRec[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/agro-pilot/recommandations")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data?.cultures) {
          setCultures(json.data.cultures);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;

  return (
    <div className="card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl space-y-3 shadow-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-extrabold text-sm">
          <Sparkles size={18} /> {t("culturasRecommended")}
        </div>
        <Link href="/agro-pilot" className="text-xs font-extrabold text-emerald-600 hover:underline">
          {t("exploreCatalogue")} →
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {cultures.map((c, i) => (
          <div key={i} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 space-y-1">
            <div className="flex items-center justify-between">
              <strong className="text-sm font-extrabold text-slate-900 dark:text-white">{c.culture}</strong>
              <span className="badge badge-xs bg-emerald-100 text-emerald-800 font-bold border-0">
                {c.score_rentabilite}/100
              </span>
            </div>
            <p className="text-xs text-slate-500 line-clamp-2">{c.raison}</p>
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 block pt-1">
              {t("saison", { season: c.saison_optimale })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Dashboard Agriculteur connecté ──────────────────────────────────────────
function HeroAgriculteur({
  nom,
  valeurStock,
  nbStocks,
}: {
  nom: string;
  valeurStock: number;
  nbStocks: number;
}) {
  const t = useTranslations("Home");

  return (
    <div className="space-y-4">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-10 -right-10 h-52 w-52 rounded-full bg-white/5"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-0 h-32 w-32 rounded-full bg-yellow-400/10"
        />
        <div className="relative flex items-center gap-4 px-5 py-7">
          <div className="flex-1">
            <p className="text-sm font-semibold text-emerald-200">{t("greetingAgri")}</p>
            <h1 className="mt-0.5 text-2xl font-extrabold leading-tight">{nom}</h1>
            <p className="mt-1 text-sm text-emerald-200">{t("roleAgri")}</p>
            <div className="mt-4 rounded-2xl bg-white/15 backdrop-blur-sm px-4 py-3">
              <p className="text-xs font-semibold text-emerald-100">{t("stocksValue")}</p>
              <p className="text-2xl font-extrabold">{formatFcfa(valeurStock)}</p>
              <p className="text-xs text-emerald-200">{t("stocksDeclared", { count: nbStocks })}</p>
            </div>
          </div>
          <Image
            src="/illustartion3.png"
            alt={t("illustration3Alt")}
            width={160}
            height={160}
            className="w-32 shrink-0 drop-shadow-xl"
          />
        </div>
      </section>

      {/* Recommandations Agro-Pilot */}
      <RecommandationsCulturesWidget />
    </div>
  );
}

// ─── Dashboard Client connecté ────────────────────────────────────────────────
function HeroClient({ nom }: { nom: string }) {
  const t = useTranslations("Home");

  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-10 -right-10 h-52 w-52 rounded-full bg-white/5"
      />
      <div className="relative flex items-center gap-4 px-5 py-7">
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-300">{t("greetingClient")}</p>
          <h1 className="mt-0.5 text-2xl font-extrabold">{nom}</h1>
          <p className="mt-1 text-sm text-slate-400">{t("roleClient")}</p>
          <Link
            href="/catalogue"
            className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-5 py-2.5 text-sm font-extrabold text-white hover:bg-emerald-400 transition-colors"
          >
            {t("exploreCatalogue")} <ArrowRight size={15} />
          </Link>
        </div>
        <Image
          src="/illustartion2.png"
          alt={t("illustration2Alt")}
          width={160}
          height={160}
          className="w-32 shrink-0 drop-shadow-xl"
        />
      </div>
    </section>
  );
}

// ─── Données features filtrées selon le rôle ──────────────────────────────────
const featuresAgri = [
  {
    icon: Sparkles,
    color: "bg-emerald-100 text-emerald-800",
    title: "Agro-Pilot IA",
    desc: "Votre assistant virtuel intelligent : opportunités de vente, météo et prêts bancaires.",
    href: "/agro-pilot",
  },
  {
    icon: BarChart3,
    color: "bg-teal-100 text-teal-700",
    title: "Market Radar",
    desc: "Suivez les prix en temps réel et recevez des prédictions de cours.",
    href: "/marche",
  },
  {
    icon: WalletCards,
    color: "bg-yellow-100 text-yellow-700",
    title: "Cash Immédiat",
    desc: "Obtenez une avance de trésorerie certifiée sur votre stock physique.",
    href: "/nantissement",
  },
  {
    icon: Store,
    color: "bg-blue-100 text-blue-700",
    title: "Ma Boutique Vitrine",
    desc: "Gérez vos produits en ligne et recevez le paiement des clients par Mobile Money.",
    href: "/boutique",
  },
  {
    icon: Tag,
    color: "bg-purple-100 text-purple-700",
    title: "Préventes & Récoltes",
    desc: "Annoncez vos récoltes futures et permettez aux acheteurs de réserver en avance.",
    href: "/annonces",
  },
  {
    icon: Calculator,
    color: "bg-indigo-100 text-indigo-700",
    title: "Simulateur Vente",
    desc: "Calculez vos marges nettes et votre rentabilité par récolte.",
    href: "/simulateur",
  },
];

const featuresClient = [
  {
    icon: ShoppingBag,
    color: "bg-emerald-100 text-emerald-800",
    title: "Catalogue Direct",
    desc: "Achetez directement des produits vivriers auprès des agriculteurs togolais.",
    href: "/catalogue",
  },
  {
    icon: Sparkles,
    color: "bg-teal-100 text-teal-800",
    title: "Agro-Pilot (Conseiller Achat)",
    desc: "Votre assistant intelligent pour repérer les meilleures opportunités d'achat.",
    href: "/agro-pilot",
  },
  {
    icon: Store,
    color: "bg-blue-100 text-blue-700",
    title: "Annuaire des Boutiques",
    desc: "Découvrez les boutiques des producteurs de Lomé, Kara et des autres régions.",
    href: "/boutique",
  },
  {
    icon: BarChart3,
    color: "bg-purple-100 text-purple-700",
    title: "Prix du Marché",
    desc: "Suivez les prix moyens des produits pour acheter au juste prix.",
    href: "/marche",
  },
  {
    icon: Tag,
    color: "bg-yellow-100 text-yellow-700",
    title: "Récoltes à venir",
    desc: "Réservez les récoltes des agriculteurs avant même qu'elles n'arrivent sur le marché.",
    href: "/annonces",
  },
  {
    icon: ShoppingBag,
    color: "bg-indigo-100 text-indigo-700",
    title: "Mes Achats & Livraisons",
    desc: "Suivez le statut de vos commandes et payez à la livraison par Mobile Money.",
    href: "/commandes",
  },
];

// ─── TrustBar (Bandeau de couverture) ──────────────────────────────────────────
function TrustBar() {
  const t = useTranslations("Home");
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/70 backdrop-blur-md p-4 flex flex-wrap items-center justify-between gap-4 shadow-xs">
      <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-emerald-800">
        <Shield size={16} className="text-emerald-600" />
        <span>{t("regionsTitle")}</span>
      </div>
      <div className="text-xs font-bold text-slate-700 bg-emerald-50/80 px-4 py-1.5 rounded-full border border-emerald-100/80">
        🇹🇬 {t("regionsList")}
      </div>
    </div>
  );
}

// ─── AgroPilotSpotlight (Focus IA) ────────────────────────────────────────────
function AgroPilotSpotlight() {
  const t = useTranslations("Home");
  return (
    <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white p-6 sm:p-12 shadow-2xl border border-emerald-500/20">
      <div aria-hidden className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-emerald-500/20 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-yellow-500/10 blur-3xl" />

      <div className="relative grid lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-7 space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3.5 py-1.5 text-xs font-bold text-emerald-300 border border-emerald-500/30">
            <Sparkles size={14} className="text-yellow-300" />
            <span>Agro-Pilot Intelligence</span>
          </div>

          <h2 className="text-xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight">
            {t("spotlightTitle")}
          </h2>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            {t("spotlightSubtitle")}
          </p>

          <div className="space-y-3 pt-2">
            {[t("spotlightFeature1"), t("spotlightFeature2"), t("spotlightFeature3")].map((feat, idx) => (
              <div key={idx} className="flex items-center gap-3 text-xs sm:text-sm font-semibold text-emerald-100">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/30 border border-emerald-400/40 text-emerald-300 text-xs font-bold">
                  ✓
                </span>
                <span>{feat}</span>
              </div>
            ))}
          </div>

          <div className="pt-4">
            <Link
              href="/agro-pilot"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-7 py-4 text-sm font-extrabold text-slate-950 shadow-lg shadow-emerald-500/30 hover:bg-emerald-400 active:scale-95 transition-all"
            >
              {t("spotlightCta")} <ArrowRight size={17} />
            </Link>
          </div>
        </div>

        {/* AI Graphic Widget Card */}
        <div className="lg:col-span-5 flex justify-center">
          <div className="w-full max-w-sm rounded-3xl bg-white/10 backdrop-blur-md p-6 border border-white/15 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold text-emerald-300">Radar Maïs (Lomé)</span>
              </div>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">HAUSSE</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-slate-300">Prix conseillé</span>
                <span className="text-lg font-black text-white">450 FCFA / kg</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed bg-white/5 p-3 rounded-xl border border-white/5">
                💡 &quot;Agro-Pilot vous conseille de conserver votre stock encore 2 semaines pour maximiser vos gains (+18%).&quot;
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Section Features ─────────────────────────────────────────────────────────
function FeaturesSection({ isConnected, userRole }: { isConnected: boolean; userRole?: string }) {
  const t = useTranslations("Home");

  const publicFeatures = [
    { icon: Sparkles, color: "bg-emerald-100 text-emerald-800", title: t("featuresPublic.agroPilot.title"), desc: t("featuresPublic.agroPilot.desc"), href: "/agro-pilot" },
    { icon: BarChart3, color: "bg-teal-100 text-teal-800", title: t("featuresPublic.marketRadar.title"), desc: t("featuresPublic.marketRadar.desc"), href: "/marche" },
    { icon: WalletCards, color: "bg-yellow-100 text-yellow-800", title: t("featuresPublic.cashImmediat.title"), desc: t("featuresPublic.cashImmediat.desc"), href: "/nantissement" },
    { icon: Store, color: "bg-blue-100 text-blue-800", title: t("featuresPublic.boutique.title"), desc: t("featuresPublic.boutique.desc"), href: "/boutique" },
    { icon: Tag, color: "bg-purple-100 text-purple-800", title: t("featuresPublic.preventes.title"), desc: t("featuresPublic.preventes.desc"), href: "/annonces" },
    { icon: Calculator, color: "bg-orange-100 text-orange-800", title: t("featuresPublic.simulateur.title"), desc: t("featuresPublic.simulateur.desc"), href: "/simulateur" },
    { icon: ShoppingBag, color: "bg-rose-100 text-rose-800", title: t("featuresPublic.commandes.title"), desc: t("featuresPublic.commandes.desc"), href: "/commandes" },
  ];

  const agriFeatures = [
    { icon: Sparkles, color: "bg-emerald-100 text-emerald-800", title: t("featuresAgri.agroPilot.title"), desc: t("featuresAgri.agroPilot.desc"), href: "/agro-pilot" },
    { icon: BarChart3, color: "bg-teal-100 text-teal-700", title: t("featuresAgri.marketRadar.title"), desc: t("featuresAgri.marketRadar.desc"), href: "/marche" },
    { icon: WalletCards, color: "bg-yellow-100 text-yellow-700", title: t("featuresAgri.cashImmediat.title"), desc: t("featuresAgri.cashImmediat.desc"), href: "/nantissement" },
    { icon: Store, color: "bg-blue-100 text-blue-700", title: t("featuresAgri.boutique.title"), desc: t("featuresAgri.boutique.desc"), href: "/boutique" },
    { icon: Tag, color: "bg-purple-100 text-purple-700", title: t("featuresAgri.preventes.title"), desc: t("featuresAgri.preventes.desc"), href: "/annonces" },
    { icon: Calculator, color: "bg-indigo-100 text-indigo-700", title: t("featuresAgri.simulateur.title"), desc: t("featuresAgri.simulateur.desc"), href: "/simulateur" },
  ];

  const clientFeatures = [
    { icon: ShoppingBag, color: "bg-emerald-100 text-emerald-800", title: t("featuresClient.catalogue.title"), desc: t("featuresClient.catalogue.desc"), href: "/catalogue" },
    { icon: Store, color: "bg-blue-100 text-blue-700", title: t("featuresClient.boutiques.title"), desc: t("featuresClient.boutiques.desc"), href: "/boutique" },
    { icon: BarChart3, color: "bg-purple-100 text-purple-700", title: t("featuresClient.marche.title"), desc: t("featuresClient.marche.desc"), href: "/marche" },
    { icon: Tag, color: "bg-yellow-100 text-yellow-700", title: t("featuresClient.annonces.title"), desc: t("featuresClient.annonces.desc"), href: "/annonces" },
    { icon: ShoppingBag, color: "bg-indigo-100 text-indigo-700", title: t("featuresClient.commandes.title"), desc: t("featuresClient.commandes.desc"), href: "/commandes" },
  ];

  const currentFeatures = !isConnected ? publicFeatures : userRole === "CLIENT" ? clientFeatures : agriFeatures;

  return (
    <section className="space-y-6">
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="space-y-1"
      >
        <h2 className="text-2xl font-black tracking-tight text-slate-900">
          {isConnected ? t("featuresTitleConnected") : t("featuresTitle")}
        </h2>
        {!isConnected && (
          <p className="text-sm font-medium text-slate-500">
            {t("featuresSubtitle")}
          </p>
        )}
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {currentFeatures.map(({ icon: Icon, color, title, desc, href }, i) => (
          <motion.div
            key={href}
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={i}
          >
            <Link
              href={href}
              className="group flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white/80 backdrop-blur-sm p-6 shadow-sm hover:shadow-xl hover:border-emerald-300 hover:-translate-y-1 transition-all duration-300 h-full"
            >
              <div className="space-y-4">
                <span
                  className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${color} shadow-xs transition-transform duration-300 group-hover:scale-110`}
                >
                  <Icon size={22} />
                </span>
                <div>
                  <strong className="block text-base font-extrabold text-slate-900 group-hover:text-emerald-700 transition-colors">
                    {title}
                  </strong>
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed font-medium">{desc}</p>
                </div>
              </div>
              <div className="pt-4 flex items-center justify-end">
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  Explorer <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ─── Section "Comment ça marche" (seulement pour les non-connectés) ───────────
function HowItWorksSection() {
  const t = useTranslations("Home");

  const steps = [
    {
      img: "/illustartion1.png",
      step: "01",
      title: t("step01Title"),
      desc: t("step01Desc"),
    },
    {
      img: "/illustartion2.png",
      step: "02",
      title: t("step02Title"),
      desc: t("step02Desc"),
    },
    {
      img: "/illustartion3.png",
      step: "03",
      title: t("step03Title"),
      desc: t("step03Desc"),
    },
  ];

  return (
    <section className="space-y-8">
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="text-center space-y-2"
      >
        <span className="inline-block rounded-full bg-emerald-100/90 px-4 py-1.5 text-xs font-bold text-emerald-800 border border-emerald-200/80">
          {t("howItWorksBadge")}
        </span>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900">{t("howItWorksTitle")}</h2>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-3">
        {steps.map(({ img, step, title, desc }, i) => (
          <motion.div
            key={step}
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={i}
            className="group relative flex flex-col items-center gap-4 rounded-3xl border border-slate-200/80 bg-white/80 backdrop-blur-sm p-7 shadow-xs hover:shadow-xl hover:border-emerald-300 hover:-translate-y-1 transition-all duration-300 text-center"
          >
            <div className="shrink-0 relative">
              <div className="h-32 w-32 rounded-2xl bg-gradient-to-b from-emerald-50 to-white flex items-center justify-center p-2 shadow-inner">
                <Image
                  src={img}
                  alt={title}
                  width={200}
                  height={200}
                  className="h-24 w-24 object-contain drop-shadow-md group-hover:scale-105 transition-transform"
                />
              </div>
              <span className="absolute -top-3 -right-3 flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-xs font-black text-white shadow-lg border-2 border-white">
                {step}
              </span>
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">{title}</h3>
              <p className="mt-2 text-xs text-slate-500 leading-relaxed font-medium">{desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ─── Section CTA Final (non-connecté) ────────────────────────────────────────
function CTASection() {
  const t = useTranslations("Home");

  return (
    <motion.section
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-950 px-5 py-8 sm:px-8 sm:py-12 text-center text-white shadow-2xl border border-emerald-500/20"
    >
      <div aria-hidden className="pointer-events-none absolute -top-12 -right-12 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-12 -left-12 h-44 w-44 rounded-full bg-yellow-400/20 blur-2xl" />

      <div className="relative max-w-2xl mx-auto space-y-4">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-extrabold backdrop-blur-md border border-white/20">
          <Zap size={14} className="text-yellow-300" />
          {t("ctaFinalBadge")}
        </span>
        <h2 className="text-xl sm:text-3xl lg:text-4xl font-black leading-tight">
          {t("ctaFinalTitle")}
        </h2>
        <p className="text-xs sm:text-base text-emerald-100 font-medium leading-relaxed">
          {t("ctaFinalSubtitle")}
        </p>
        <div className="pt-4 flex flex-col sm:flex-row sm:justify-center gap-3">
          <Link
            href="/inscription"
            id="cta-inscription-final"
            className="inline-flex items-center justify-center gap-2.5 rounded-2xl bg-white px-6 sm:px-8 py-3.5 sm:py-4 text-sm sm:text-base font-extrabold text-emerald-800 shadow-xl hover:bg-emerald-50 active:scale-95 transition-all"
          >
            {t("ctaFinalCreate")} <ArrowRight size={18} />
          </Link>
          <PwaInstallButton />
          <Link
            href="/marche"
            id="cta-marche-public"
            className="inline-flex items-center justify-center gap-2.5 rounded-2xl border-2 border-white/30 bg-white/10 backdrop-blur-md px-6 sm:px-8 py-3.5 sm:py-4 text-sm sm:text-base font-bold text-white hover:bg-white/20 transition-all"
          >
            <TrendingUp size={18} />
            {t("ctaFinalMarket")}
          </Link>
        </div>
      </div>
    </motion.section>
  );
}

// ─── Section actions rapides connecté ────────────────────────────────────────
function QuickActionsConnected({ isAgri }: { isAgri: boolean }) {
  const t = useTranslations("Home");

  const agriActions = [
    { href: "/sante-culture", label: "🌿 Santé Culture IA", color: "bg-emerald-600 text-white" },
    { href: "/stocks/nouveau", label: t("quickActionsAgri.declareStock"), color: "bg-white border border-slate-200 text-slate-800" },
    { href: "/nantissement", label: t("quickActionsAgri.demandeCash"), color: "bg-yellow-400 text-yellow-900" },
    { href: "/agro-pilot", label: t("quickActionsAgri.agroPilot"), color: "bg-white border border-slate-200 text-slate-800" },
  ];
  const clientActions = [
    { href: "/catalogue", label: t("quickActionsClient.catalogue"), color: "bg-emerald-600 text-white" },
    { href: "/annonces", label: t("annonces"), color: "bg-white border border-slate-200 text-slate-800" },
    { href: "/commandes", label: t("quickActionsClient.achats"), color: "bg-yellow-400 text-yellow-900" },
    { href: "/marche", label: t("quickActionsClient.marche"), color: "bg-white border border-slate-200 text-slate-800" },
  ];

  const actions = isAgri ? agriActions : clientActions;

  return (
    <div className="grid grid-cols-2 gap-2.5">
      {actions.map(({ href, label, color }) => (
        <Link
          key={href}
          href={href}
          className={`flex items-center justify-center rounded-2xl px-3 py-3.5 text-xs font-extrabold text-center leading-tight shadow-sm hover:shadow-md active:scale-95 transition-all ${color}`}
        >
          {label}
        </Link>
      ))}
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function Home() {
  const t = useTranslations("Home");
  const { user, isLoading } = useCurrentUser();
  const [stocks, setStocks] = useState<{ valeurEstimee?: number }[]>([]);

  useEffect(() => {
    if (user?.role === "AGRICULTEUR") {
      fetch("/api/stocks")
        .then((r) => (r.ok ? r.json() : null))
        .then((json) => {
          if (json?.data?.stocks) setStocks(json.data.stocks);
        })
        .catch(() => { });
    }
  }, [user]);

  const valeurTotale = stocks.reduce((acc, s) => acc + (s.valeurEstimee ?? 0), 0);
  const isAgri = user?.role === "AGRICULTEUR";

  // Squelette de chargement
  if (isLoading) {
    return (
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-6 pb-28 md:pb-10">
        <div className="space-y-4">
          <div className="h-64 w-full rounded-3xl bg-slate-100 animate-pulse" />
          <div className="h-8 w-48 rounded-xl bg-slate-100 animate-pulse" />
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-20 rounded-2xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 pb-28 md:pb-10">
      <div className="space-y-8 pt-0">

        {/* ── HERO ── */}
        {!user ? (
          <>
            <HeroPublic />
            <TrustBar />
          </>
        ) : isAgri ? (
          <div className="pt-5">
            <HeroAgriculteur
              nom={user.nom}
              valeurStock={valeurTotale}
              nbStocks={stocks.length}
            />
          </div>
        ) : (
          <div className="pt-5">
            <HeroClient nom={user.nom} />
          </div>
        )}

        {/* ── Actions rapides si connecté ── */}
        {user && (
          <section className="space-y-3">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-400">
              {t("quickActions")}
            </h2>
            <QuickActionsConnected isAgri={isAgri} />
          </section>
        )}

        {/* ── Comment ça marche (visiteurs) ── */}
        {!user && <HowItWorksSection />}

        {/* ── Features / Que faire ── */}
        <FeaturesSection isConnected={!!user} userRole={user?.role} />

        {/* ── Spotlight IA (visiteurs) ── */}
        {!user && <AgroPilotSpotlight />}

        {/* ── CTA final (visiteurs) ── */}
        {!user && <CTASection />}

        {/* ── Stocks récents (agriculteur) ── */}
        {isAgri && stocks.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-400">
                {t("recentStocks")}
              </h2>
              <Link href="/stocks/nouveau" className="text-xs font-bold text-emerald-600 hover:underline">
                + Déclarer
              </Link>
            </div>
            <div className="space-y-2">
              {stocks.slice(0, 3).map((s: any, i) => (
                <div
                  key={s.id ?? i}
                  className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🌾</span>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{s.culture ?? "Stock"}</p>
                      <p className="text-xs text-slate-500">{s.quantiteKg ?? "—"} kg</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-extrabold text-emerald-700">
                      {formatFcfa(s.valeurEstimee ?? 0)}
                    </p>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.statut === "DISPONIBLE"
                        ? "bg-emerald-100 text-emerald-700"
                        : s.statut === "NANTI"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-slate-100 text-slate-500"
                        }`}
                    >
                      {s.statut ?? "—"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Pied de page discret */}
        {!user && (
          <p className="text-center text-[11px] text-slate-400 pb-4">
            Agro-Capital · Djanta 2026 · Lomé, Togo 🇹🇬
          </p>
        )}
      </div>
    </main>
  );
}