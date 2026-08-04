import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { AppNav } from "@/_components/app-nav";
import { LayoutShift } from "@/_components/layout-shift";
import type { Metadata } from "next";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Meta" });
  return {
    title: t("title"),
    description: t("description"),
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  // Valide la locale — 404 si non supportée
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Charge les messages pour la locale courante
  const messages = await getMessages();

  return (
    <html lang={locale} data-theme="agrocapital">
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AppNav />
          {/* LayoutShift ajoute md:pl-56 uniquement si l'utilisateur est connecté */}
          <LayoutShift>{children}</LayoutShift>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
