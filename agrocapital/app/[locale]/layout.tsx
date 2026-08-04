import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { AppNav } from "@/_components/app-nav";
import { LayoutShift } from "@/_components/layout-shift";
import { SplashScreen } from "@/_components/splash-screen";
import { SwRegister } from "@/_components/sw-register";
import { PwaUpdateBanner } from "@/_components/pwa-update-banner";
import type { Metadata, Viewport } from "next";
import { Inter, Poppins } from "next/font/google";
import "../globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#059669",
};

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
    manifest: "/manifest.json",
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: "AgroCapital",
    },
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
    <html lang={locale} data-theme="agrocapital" className={`${inter.variable} ${poppins.variable}`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#059669" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="min-h-screen bg-base-100 text-base-content antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <SwRegister />
          <PwaUpdateBanner />
          <SplashScreen>
            <AppNav />
            {/* LayoutShift ajoute md:pl-56 uniquement si l'utilisateur est connecté */}
            <LayoutShift>{children}</LayoutShift>
          </SplashScreen>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
