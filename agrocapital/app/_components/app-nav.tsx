"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  Calculator,
  Home,
  LogIn,
  Menu,
  Moon,
  PlusCircle,
  ShoppingBag,
  Store,
  Sun,
  UserRound,
  WalletCards,
  X,
  Bell,
  Tag,
  Wallet,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useCurrentUser } from "@/_hooks/useCurrentUser";

/** 4 routes principales affichées sur la Bottom Nav Mobile (1 seule ligne) */
const mainMobileLinksAgri = [
  { href: "/", label: "Accueil", icon: Home },
  { href: "/marche", label: "Marché", icon: BarChart3 },
  { href: "/boutique", label: "Boutique", icon: Store },
  { href: "/commandes", label: "Commandes", icon: ShoppingBag },
] as const;

const mainMobileLinksClient = [
  { href: "/", label: "Accueil", icon: Home },
  { href: "/catalogue", label: "Catalogue", icon: ShoppingBag },
  { href: "/commandes", label: "Achats", icon: Store },
  { href: "/marche", label: "Marché", icon: BarChart3 },
] as const;

/** Toutes les routes pour le Menu Burger et la Sidebar Desktop (Agriculteur) */
const agriMenuLinks = [
  { href: "/", label: "Accueil", icon: Home },
  { href: "/boutique", label: "Ma Boutique Vitrine", icon: Store },
  { href: "/boutique/produits", label: "Mes Produits en Vente", icon: ShoppingBag },
  { href: "/stocks/nouveau", label: "Déclarer du Stock Phys.", icon: PlusCircle },
  { href: "/nantissement", label: "Micro-Nantissement (Cash)", icon: WalletCards },
  { href: "/commandes", label: "Commandes Reçues", icon: ShoppingBag },
  { href: "/annonces", label: "Préventes & Récoltes", icon: Tag },
  { href: "/portefeuilles", label: "Mes Portefeuilles", icon: Wallet },
  { href: "/marche", label: "Market Radar (Prix)", icon: BarChart3 },
  { href: "/simulateur", label: "Simulateur Vente", icon: Calculator },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/profil", label: "Mon Profil", icon: UserRound },
] as const;

/** Toutes les routes pour le Menu Burger et la Sidebar Desktop (Client) */
const clientMenuLinks = [
  { href: "/", label: "Accueil", icon: Home },
  { href: "/catalogue", label: "Catalogue Produits", icon: ShoppingBag },
  { href: "/boutique", label: "Annuaire des Boutiques", icon: Store },
  { href: "/commandes", label: "Mes Achats & Livraisons", icon: Store },
  { href: "/annonces", label: "Récoltes à venir", icon: Tag },
  { href: "/marche", label: "Prix du Marché", icon: BarChart3 },
  { href: "/notifications", label: "Notifications & Suivis", icon: Bell },
  { href: "/profil", label: "Mon Profil", icon: UserRound },
] as const;

/** Wordmark partagé */
export function AgroCapitalWordmark({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5 select-none" aria-label="Agro-Capital — accueil">
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <rect width="32" height="32" rx="8" fill="#16a34a" />
        <path d="M16 6 C10 6 7 12 8 19 C10 17 13 15 16 15 C19 15 22 17 24 19 C25 12 22 6 16 6Z" fill="#dcfce7" />
        <path d="M16 15 L16 26" stroke="#facc15" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M16 20 L12 17" stroke="#facc15" strokeWidth="2" strokeLinecap="round" />
        <path d="M16 22 L20 19" stroke="#facc15" strokeWidth="2" strokeLinecap="round" />
      </svg>
      {!collapsed && (
        <span className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white leading-none">
          Agro<span className="text-primary">Capital</span>
        </span>
      )}
    </Link>
  );
}

export function AppNav() {
  const pathname = usePathname();
  const { user } = useCurrentUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setIsDark(true);
      document.documentElement.setAttribute("data-theme", "agrocapital-dark");
      document.documentElement.classList.add("dark");
    } else {
      setIsDark(false);
      document.documentElement.setAttribute("data-theme", "agrocapital");
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleDarkMode = () => {
    const nextTheme = !isDark;
    setIsDark(nextTheme);
    if (nextTheme) {
      document.documentElement.setAttribute("data-theme", "agrocapital-dark");
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.setAttribute("data-theme", "agrocapital");
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const isAgri = user?.role === "AGRICULTEUR" || !user;
  const mobileLinks = isAgri ? mainMobileLinksAgri : mainMobileLinksClient;
  const menuLinks = isAgri ? agriMenuLinks : clientMenuLinks;

  return (
    <>
      {/* HEADER MOBILE */}
      <header className="md:hidden sticky top-0 z-40 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-4 py-3 shadow-xs">
        <AgroCapitalWordmark />

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleDarkMode}
            aria-label="Basculer le mode sombre"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-primary/10 transition-colors"
          >
            {isDark ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-slate-700" />}
          </button>

          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Ouvrir le menu de navigation"
            aria-expanded={menuOpen}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold transition-colors"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {/* MENU BURGER DRAWER MOBILE */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="md:hidden fixed inset-x-0 top-[57px] bottom-[60px] z-50 bg-white dark:bg-slate-900 flex flex-col p-5 overflow-y-auto shadow-2xl border-b border-slate-200 dark:border-slate-800"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <span className="text-xs font-extrabold uppercase tracking-wider text-primary">
                Menu {user ? `(${user.role})` : "Principal"}
              </span>
              <button
                type="button"
                onClick={toggleDarkMode}
                className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl"
              >
                {isDark ? <Sun size={15} className="text-yellow-400" /> : <Moon size={15} />}
                {isDark ? "Mode Clair" : "Mode Sombre"}
              </button>
            </div>

            <nav className="flex-1 py-4 space-y-1.5">
              {menuLinks.map(({ href, label, icon: Icon }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMenuOpen(false)}
                    className={[
                      "flex items-center gap-3.5 rounded-2xl px-4 py-3 text-sm font-bold transition-all",
                      active
                        ? "bg-primary text-white shadow-sm"
                        : "text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800",
                    ].join(" ")}
                  >
                    <Icon size={19} className={active ? "text-white" : "text-primary"} />
                    {label}
                  </Link>
                );
              })}
              {!user && (
                <Link
                  href="/connexion"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3.5 rounded-2xl px-4 py-3 text-sm font-bold bg-primary/10 text-primary mt-2"
                >
                  <LogIn size={19} /> Se connecter / S&apos;inscrire
                </Link>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DESKTOP SIDEBAR */}
      <aside
        aria-label="Navigation principale"
        className="hidden md:flex fixed inset-y-0 left-0 z-40 w-56 flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-xs"
      >
        <div className="px-5 py-6">
          <AgroCapitalWordmark />
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {menuLinks.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={[
                  "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold transition-all duration-150",
                  active
                    ? "bg-primary/10 text-primary font-bold"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white",
                ].join(" ")}
              >
                {active && (
                  <span
                    className="absolute left-0 h-5 w-1 rounded-r-full bg-primary"
                    aria-hidden="true"
                  />
                )}
                <Icon
                  size={17}
                  aria-hidden="true"
                  className={active ? "text-primary" : "text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300"}
                />
                <span className="truncate">{label}</span>
              </Link>
            );
          })}
          {!user && (
            <Link
              href="/connexion"
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-bold bg-primary text-white mt-4 justify-center"
            >
              <LogIn size={15} /> Se connecter
            </Link>
          )}
        </nav>

        <div className="px-4 py-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
          <button
            type="button"
            onClick={toggleDarkMode}
            className="flex w-full items-center justify-between rounded-xl bg-slate-100 dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-primary/10 transition-colors"
          >
            <span className="flex items-center gap-2">
              {isDark ? <Sun size={15} className="text-yellow-400" /> : <Moon size={15} />}
              {isDark ? "Clair" : "Sombre"}
            </span>
          </button>
          <p className="text-[11px] text-center text-slate-400 font-medium">Djanta 2026 · Lomé</p>
        </div>
      </aside>

      {/* MOBILE BOTTOM NAV */}
      <nav
        aria-label="Navigation mobile"
        className={[
          "md:hidden fixed bottom-0 inset-x-0 z-40 bg-white dark:bg-slate-900 text-slate-800 dark:text-white",
          "border-t border-slate-200 dark:border-slate-800 shadow-lg",
          "pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 px-2",
        ].join(" ")}
      >
        <div className="grid grid-cols-4 gap-1 max-w-md mx-auto">
          {mobileLinks.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={[
                  "flex flex-col items-center justify-center gap-1 rounded-xl min-h-[3.5rem] px-1 py-1.5",
                  "text-[0.68rem] font-bold leading-none transition-all duration-150",
                  active
                    ? "text-primary font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800",
                ].join(" ")}
              >
                <span
                  className={[
                    "flex h-8 w-8 items-center justify-center rounded-full transition-all duration-150",
                    active ? "bg-primary/10 text-primary" : "",
                  ].join(" ")}
                >
                  <Icon size={20} aria-hidden="true" />
                </span>
                <span className="truncate">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
