import type { ReactNode } from "react";

/**
 * RootLayout passthrough.
 * Le layout effectif avec <html> et <body> est défini dans app/[locale]/layout.tsx
 * pour que next-intl et la locale courante soient correctement gérés sans imbrication de balises HTML.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}