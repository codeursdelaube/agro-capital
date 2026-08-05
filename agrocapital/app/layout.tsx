import type { ReactNode } from "react";

/**
 * RootLayout passthrough.
 * Le layout effectif avec <html> et <body> est défini dans app/[locale]/layout.tsx
 * pour que next-intl et la locale courante soient correctement gérés sans imbrication de balises HTML.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" data-theme="agrocapital">
      <body className="min-h-screen bg-base-100 text-base-content antialiased">
        {children}
      </body>
    </html>
  );
}