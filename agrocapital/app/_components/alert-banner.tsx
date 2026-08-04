"use client";

import { TrendingUp } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

export function AlertBanner() {
  const t = useTranslations("Components.alertBanner");

  return (
    <section
      className="relative overflow-hidden rounded-2xl border-l-4 border-secondary bg-secondary/10 p-4"
      aria-label={t("ariaLabel")}
    >
      <div className="flex items-start gap-3">
        {/* Icône avec animation pulse */}
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary/20 text-yellow-700">
          <TrendingUp size={20} className="animate-pulse" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-base-content">{t("title")}</p>
          <p className="mt-1 text-sm font-medium text-muted">
            {t("body")}
          </p>
        </div>
      </div>
      <Link
        href="/simulateur"
        className="btn btn-secondary mt-4 w-full font-bold text-yellow-900"
      >
        {t("button")}
      </Link>
    </section>
  );
}