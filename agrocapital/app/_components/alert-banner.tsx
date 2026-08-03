import { TrendingUp } from "lucide-react";
import Link from "next/link";

export function AlertBanner() {
  return (
    <section
      className="relative overflow-hidden rounded-2xl border-l-4 border-secondary bg-secondary/10 p-4"
      aria-label="Alerte prix du marché"
    >
      <div className="flex items-start gap-3">
        {/* Icône avec animation pulse */}
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary/20 text-yellow-700">
          <TrendingUp size={20} className="animate-pulse" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-base-content">Le prix du maïs devrait monter</p>
          <p className="mt-1 text-sm font-medium text-muted">
            Attendre jusqu&apos;en octobre pourrait rapporter environ{" "}
            <strong className="text-base-content">70 000 FCFA de plus</strong>.
          </p>
        </div>
      </div>
      <Link
        href="/simulateur"
        className="btn btn-secondary mt-4 w-full font-bold text-yellow-900"
      >
        Voir ce que ça change pour moi
      </Link>
    </section>
  );
}