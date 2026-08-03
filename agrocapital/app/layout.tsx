import type { Metadata, Viewport } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import { AppNav } from "@/_components/app-nav";

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

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" data-theme="agrocapital" className={`${inter.variable} ${poppins.variable}`}>
      <body className="min-h-screen bg-base-100 text-base-content antialiased">
        <AppNav />
        {/* Décalage pour la sidebar desktop (md:pl-56), pas de décalage sur mobile */}
        <div className="md:pl-56">
          {children}
        </div>
      </body>
    </html>
  );
}