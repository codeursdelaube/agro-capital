"use client";

import Link from "next/link";
import { BarChart3, Home, UserRound, WalletCards } from "lucide-react";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Accueil", icon: Home },
  { href: "/marche", label: "Marché", icon: BarChart3 },
  { href: "/nantissement", label: "Cash", icon: WalletCards },
  { href: "/profil", label: "Profil", icon: UserRound },
];

export function BottomNav() {
  const pathname = usePathname();
  return <nav aria-label="Navigation principale" className="fixed bottom-0 z-30 w-full border-t border-base-200 bg-base-100 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-lg">
    <div className="mx-auto grid max-w-xl grid-cols-4 gap-1">
      {links.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`flex min-h-15 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 text-xs font-semibold leading-none transition-colors ${active ? "bg-primary text-primary-content" : "text-base-content/75 hover:bg-base-200"}`}><Icon size={20} aria-hidden="true" /><span className="truncate">{label}</span></Link>;
      })}
    </div>
  </nav>;
}