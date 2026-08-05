import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./app/i18n/routing";

const SESSION_COOKIE = "agrocapital_session";

/**
 * Routes protégées — chemin SANS préfixe locale (ex: /boutique, pas /fr/boutique).
 * next-intl strip la locale avant le test.
 */
const PROTECTED_PREFIXES = [
  "/profil",
  "/nantissement",
  "/simulateur",
  "/boutique",
  "/catalogue",
  "/agro-pilot",
  "/stocks",
  "/commandes",
  "/annonces",
  "/portefeuilles",
  "/notifications",
];

const AUTH_PREFIXES = ["/connexion", "/inscription"];

/** Middleware next-intl — gère la détection et la redirection de locale */
const intlMiddleware = createMiddleware(routing);

/**
 * Retire le préfixe de locale (/fr/boutique → /boutique).
 * Compatible avec toutes les locales définies dans routing.ts.
 */
function stripLocale(pathname: string): string {
  const localePattern = new RegExp(
    `^/(${routing.locales.join("|")})(/.*)?(/?$)`,
    "i"
  );
  const match = pathname.match(localePattern);
  if (match) {
    return match[2] ?? "/";
  }
  return pathname;
}

export default function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // ─── 1. next-intl gère d'abord la détection / redirection de locale ──────
  const intlResponse = intlMiddleware(request);

  // ─── 2. Auth guard — opère sur le chemin sans préfixe locale ─────────────
  const cleanPath = stripLocale(pathname);

  // ─── 2b. Redirection silencieuse pour les tentatives /admin ───────────────────
  if (cleanPath === "/admin" || cleanPath.startsWith("/admin/") || cleanPath === "/nantissement/admin") {
    return NextResponse.redirect(new URL(`/${routing.defaultLocale}/`, request.url));
  }

  // ─── 2c. Portail Secret Admin /djobokoumin ───────────────────────────────────
  const adminCookie = request.cookies.get("agrocapital_admin_session")?.value;
  const isAdminAuthenticated = adminCookie === "authenticated_admin_session_token";

  if (cleanPath.startsWith("/djobokoumin") && cleanPath !== "/djobokoumin/connexion" && !isAdminAuthenticated) {
    return NextResponse.redirect(new URL(`/${routing.defaultLocale}/djobokoumin/connexion`, request.url));
  }

  // ─── 2d. Auth guard classique ─────────────────────────────────────────────────
  const sessionToken = request.cookies.get(SESSION_COOKIE)?.value;
  const isAuthenticated = Boolean(sessionToken);

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => cleanPath === prefix || cleanPath.startsWith(prefix + "/")
  );

  if (isProtected && !isAuthenticated) {
    const connexionUrl = new URL(
      `/${routing.defaultLocale}/connexion`,
      request.url
    );
    connexionUrl.searchParams.set("from", cleanPath + search);
    return NextResponse.redirect(connexionUrl);
  }

  const isAuthPage = AUTH_PREFIXES.some(
    (prefix) => cleanPath === prefix || cleanPath.startsWith(prefix + "/")
  );

  if (isAuthPage && isAuthenticated) {
    return NextResponse.redirect(
      new URL(`/${routing.defaultLocale}/`, request.url)
    );
  }

  // ─── 3. Laisse next-intl finaliser la réponse
  return intlResponse ?? NextResponse.next();
}

export const config = {
  matcher: [
    // Toutes les routes sauf API, fichiers statiques et ressources Next.js
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)",
  ],
};
