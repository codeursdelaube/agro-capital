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
function HeroPublic() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-yellow-50">
      {/* Blob décoratif */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-emerald-100/60 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-yellow-100/60 blur-3xl"
      />

      <div className="relative px-4 py-10 sm:px-6 lg:px-10 lg:py-16">
        {/* Badge */}
        <motion.div
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          custom={0}
          className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-1.5 shadow-sm"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500">
            <Star size={10} className="text-white" fill="white" />
          </span>
          <span className="text-xs font-bold text-emerald-700">
            Plateforme #1 au Togo · Djanta 2026
          </span>
        </motion.div>

        {/* Titre + illustration — 2 colonnes sur desktop */}
        <div className="flex items-center gap-8 lg:gap-16">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={1}
            className="flex-1 min-w-0"
          >
            <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-4xl lg:text-5xl xl:text-6xl">
              Votre récolte mérite{" "}
              <span className="relative inline-block">
                <span className="relative z-10 text-emerald-600">le bon prix.</span>
                <span
                  aria-hidden
                  className="absolute bottom-0 left-0 h-2.5 w-full -skew-x-2 bg-yellow-200/70"
                />
              </span>
            </h1>
            <p className="mt-4 text-base text-slate-600 leading-relaxed lg:text-lg lg:max-w-xl">
              Agro-Capital connecte les agriculteurs togolais au marché numérique.
              Vendez mieux, obtenez du cash sur votre stock, suivez les prix en temps réel.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/inscription"
                id="cta-inscription-hero"
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-emerald-200 hover:bg-emerald-700 active:scale-95 transition-all duration-150 lg:px-8 lg:py-4 lg:text-base"
              >
                Commencer gratuitement
                <ArrowRight size={17} />
              </Link>
              <Link
                href="/connexion"
                id="cta-connexion-hero"
                className="inline-flex items-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-6 py-3.5 text-sm font-extrabold text-slate-700 hover:border-emerald-300 hover:text-emerald-700 transition-all duration-150 lg:px-8 lg:py-4 lg:text-base"
              >
                J&apos;ai déjà un compte
              </Link>
            </div>

            {/* Mini-stats */}
            <div className="mt-7 flex gap-8">
              {stats.map((s) => (
                <div key={s.label}>
                  <p className="text-lg font-extrabold text-slate-900 lg:text-2xl">{s.value}</p>
                  <p className="text-[11px] text-slate-500 lg:text-xs">{s.label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Illustration 1 — cachée sur mobile, grande sur desktop */}
          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.25, ease: [0.22, 1, 0.36, 1] as const }}
            className="hidden sm:block shrink-0 w-48 md:w-64 lg:w-80 xl:w-96"
          >
            <Image
              src="/illustartion1.png"
              alt="Agriculteur consultant les prix sur son téléphone"
              width={600}
              height={600}
              priority
              className="w-full drop-shadow-2xl"
            />
          </motion.div>
        </div>

        {/* Illustration 1 mobile (sous le texte) */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="sm:hidden mt-6 flex justify-center"
        >
          <Image
            src="/illustartion1.png"
            alt="Agriculteur consultant les prix sur son téléphone"
            width={300}
            height={300}
            priority
            className="w-52 drop-shadow-xl"
          />
        </motion.div>
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
          <Sparkles size={18} /> Cultures Recommandées par Agro-Pilot
        </div>
        <Link href="/agro-pilot" className="text-xs font-extrabold text-emerald-600 hover:underline">
          Tout voir →
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
              🗓️ Saison : {c.saison_optimale}
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
            <p className="text-sm font-semibold text-emerald-200">Bonjour 👋</p>
            <h1 className="mt-0.5 text-2xl font-extrabold leading-tight">{nom}</h1>
            <p className="mt-1 text-sm text-emerald-200">🌾 Agriculteur · Agro-Capital</p>
            <div className="mt-4 rounded-2xl bg-white/15 backdrop-blur-sm px-4 py-3">
              <p className="text-xs font-semibold text-emerald-100">Valeur totale de vos stocks</p>
              <p className="text-2xl font-extrabold">{formatFcfa(valeurStock)}</p>
              <p className="text-xs text-emerald-200">{nbStocks} stock(s) déclaré(s)</p>
            </div>
          </div>
          <Image
            src="/illustartion3.png"
            alt="Protection de votre récolte"
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
  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-10 -right-10 h-52 w-52 rounded-full bg-white/5"
      />
      <div className="relative flex items-center gap-4 px-5 py-7">
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-300">Bienvenue 👋</p>
          <h1 className="mt-0.5 text-2xl font-extrabold">{nom}</h1>
          <p className="mt-1 text-sm text-slate-400">🛒 Client · Agro-Capital</p>
          <Link
            href="/catalogue"
            className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-5 py-2.5 text-sm font-extrabold text-white hover:bg-emerald-400 transition-colors"
          >
            Explorer le catalogue <ArrowRight size={15} />
          </Link>
        </div>
        <Image
          src="/illustartion2.png"
          alt="Paiement reçu sur mobile"
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

// ─── Section Features ─────────────────────────────────────────────────────────
function FeaturesSection({ isConnected, userRole }: { isConnected: boolean; userRole?: string }) {
  const currentFeatures = userRole === "CLIENT" ? featuresClient : featuresAgri;

  return (
    <section>
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="mb-5"
      >
        <h2 className="text-xl font-extrabold text-slate-900">
          {isConnected ? "Vos services disponibles" : "Tout ce dont vous avez besoin"}
        </h2>
        {!isConnected && (
          <p className="mt-1 text-sm text-slate-500">
            Une plateforme complète, conçue pour les agriculteurs et acheteurs togolais.
          </p>
        )}
      </motion.div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
              className="group flex items-start gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all duration-200 h-full"
            >
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${color} transition-transform duration-200 group-hover:scale-110`}
              >
                <Icon size={21} />
              </span>
              <span className="min-w-0 flex-1">
                <strong className="block text-sm font-extrabold text-slate-900 group-hover:text-emerald-700 transition-colors">
                  {title}
                </strong>
                <small className="mt-1 block text-xs text-slate-500 leading-relaxed">{desc}</small>
              </span>
              <ArrowRight
                size={16}
                className="mt-0.5 shrink-0 text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all duration-200"
              />
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ─── Section "Comment ça marche" (seulement pour les non-connectés) ───────────
function HowItWorksSection() {
  const steps = [
    {
      img: "/illustartion1.png",
      step: "01",
      title: "Suivez les prix du marché",
      desc: "Consultez les cours officiels et les prédictions Agro-Pilot pour vendre au bon moment.",
    },
    {
      img: "/illustartion2.png",
      step: "02",
      title: "Vendez et recevez en FCFA",
      desc: "Publiez vos produits, recevez des commandes et encaissez via T-Money ou Flooz.",
    },
    {
      img: "/illustartion3.png",
      step: "03",
      title: "Protégez votre exploitation",
      desc: "Demandez une avance cash sur votre stock et planifiez sereinement votre prochaine saison.",
    },
  ];

  return (
    <section>
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="mb-6 text-center"
      >
        <span className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700 mb-2">
          Simple comme bonjour
        </span>
        <h2 className="text-xl font-extrabold text-slate-900">Comment ça marche ?</h2>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-3">
        {steps.map(({ img, step, title, desc }, i) => (
          <motion.div
            key={step}
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={i}
            className="flex flex-col items-center gap-4 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm text-center"
          >
            <div className="shrink-0 relative">
              <Image
                src={img}
                alt={title}
                width={200}
                height={200}
                className="h-28 w-28 object-contain drop-shadow-md"
              />
              <span className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-extrabold text-white shadow-md">
                {step}
              </span>
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">{title}</h3>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">{desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ─── Section CTA Final (non-connecté) ────────────────────────────────────────
function CTASection() {
  return (
    <motion.section
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900 px-6 py-8 text-center text-white shadow-xl"
    >
      <div aria-hidden className="pointer-events-none absolute -top-8 -right-8 h-40 w-40 rounded-full bg-white/5" />
      <div aria-hidden className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-yellow-400/10" />

      <div className="relative">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-bold backdrop-blur-sm mb-3">
          <Zap size={12} className="text-yellow-300" />
          Inscription gratuite · 2 minutes
        </span>
        <h2 className="text-xl font-extrabold leading-tight">
          Rejoignez les agriculteurs qui vendent mieux
        </h2>
        <p className="mt-2 text-sm text-emerald-100">
          Pas de frais cachés. Pas de paperasse. Juste votre numéro de téléphone et un code PIN.
        </p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/inscription"
            id="cta-inscription-final"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm font-extrabold text-emerald-700 shadow-lg hover:bg-emerald-50 active:scale-95 transition-all"
          >
            Créer mon compte <ArrowRight size={16} />
          </Link>
          <Link
            href="/marche"
            id="cta-marche-public"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-white/30 px-6 py-3.5 text-sm font-bold text-white hover:bg-white/10 transition-all"
          >
            <TrendingUp size={16} />
            Voir les prix du marché
          </Link>
        </div>
      </div>
    </motion.section>
  );
}

// ─── Section actions rapides connecté ────────────────────────────────────────
function QuickActionsConnected({ isAgri }: { isAgri: boolean }) {
  const agriActions = [
    { href: "/stocks/nouveau", label: "+ Déclarer un stock", color: "bg-emerald-600 text-white" },
    { href: "/boutique/produits", label: "Mes produits", color: "bg-white border border-slate-200 text-slate-800" },
    { href: "/nantissement", label: "Demander du cash", color: "bg-yellow-400 text-yellow-900" },
    { href: "/agro-pilot", label: "Agro-Pilot IA", color: "bg-white border border-slate-200 text-slate-800" },
  ];
  const clientActions = [
    { href: "/catalogue", label: "Explorer le catalogue", color: "bg-emerald-600 text-white" },
    { href: "/agro-pilot", label: "Agro-Pilot (Conseiller)", color: "bg-white border border-slate-200 text-slate-800" },
    { href: "/commandes", label: "Mes achats & livraisons", color: "bg-yellow-400 text-yellow-900" },
    { href: "/marche", label: "Prix du marché", color: "bg-white border border-slate-200 text-slate-800" },
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
          <HeroPublic />
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
              Actions rapides
            </h2>
            <QuickActionsConnected isAgri={isAgri} />
          </section>
        )}

        {/* ── Comment ça marche (visiteurs) ── */}
        {!user && <HowItWorksSection />}

        {/* ── Features / Que faire ── */}
        <FeaturesSection isConnected={!!user} userRole={user?.role} />

        {/* ── CTA final (visiteurs) ── */}
        {!user && <CTASection />}

        {/* ── Stocks récents (agriculteur) ── */}
        {isAgri && stocks.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-400">
                Mes stocks récents
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