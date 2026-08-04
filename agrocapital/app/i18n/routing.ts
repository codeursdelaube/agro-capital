import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  // Locales supportées : Français (par défaut) et Anglais
  locales: ["fr", "en"],

  // Locale par défaut
  defaultLocale: "fr",

  // Préfixe toujours actif (/fr/..., /en/...)
  localePrefix: "always",
});

export type Locale = (typeof routing.locales)[number];
