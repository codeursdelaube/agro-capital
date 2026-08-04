"use client";

import Image from "next/image";
import { PageShell } from "@/_components/page-shell";
import { CashRequestFlow } from "@/_components/cash-request-flow";
import { PedagogicTooltip } from "@/_components/tooltip";
import { useTranslations } from "next-intl";

export default function NantissementPage() {
  const t = useTranslations("Nantissement");

  return (
    <PageShell>
      <div className="space-y-6">

        {/* En-tête */}
        <header>
          <p className="text-eyebrow">{t("eyebrow")}</p>
          <div className="mt-2 flex items-center gap-2">
            <h1 className="text-h1">{t("headerTitle")}</h1>
            <PedagogicTooltip
              label={t("tooltipLabel")}
              text={t("tooltipText")}
            />
          </div>
          <p className="mt-2 text-sm text-muted">
            {t("headerSubtitle")}
          </p>
        </header>

        {/* Hero illustration */}
        <section className="card overflow-hidden bg-base-200 border border-base-300">
          <div className="flex items-center gap-4 p-5">
            <div className="flex-1">
              <h2 className="text-h2 text-base-content">
                {t("heroTitle")}
              </h2>
              <p className="mt-2 text-sm text-muted">
                {t("heroSubtitle")}
              </p>
            </div>
            <div className="shrink-0">
              <Image
                src="/illustartion2.png"
                alt={t("heroAlt")}
                width={400}
                height={400}
                className="h-28 w-28 object-contain"
              />
            </div>
          </div>
        </section>

        {/* Flux de demande */}
        <CashRequestFlow />

      </div>
    </PageShell>
  );
}