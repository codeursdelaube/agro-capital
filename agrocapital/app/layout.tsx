import type { Metadata, Viewport } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";

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
};

export const metadata: Metadata = {
  title: "Agro-Capital — Le bon prix pour vos récoltes",
  description:
    "Agro-Capital aide les agriculteurs togolais à obtenir du cash via leur stock de récolte et à vendre au meilleur moment grâce au Market Radar.",
};

/**
 * Root layout minimal — pas de NextIntlClientProvider ici.
 * Le Provider est dans app/[locale]/layout.tsx pour bénéficier
 * des messages de la locale courante.
 */
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html data-theme="agrocapital" className={`${inter.variable} ${poppins.variable}`}>
      <body className="min-h-screen bg-base-100 text-base-content antialiased">
        {children}
      </body>
    </html>
  );
}