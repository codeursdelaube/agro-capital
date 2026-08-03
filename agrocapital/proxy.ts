import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "agrocapital_session";

const PROTECTED_PREFIXES = [
  "/profil",
  "/nantissement",
  "/simulateur",
  "/boutique",
  "/catalogue",
  "/stocks",
  "/commandes",
  "/annonces",
  "/portefeuilles",
  "/notifications",
];

const AUTH_PREFIXES = ["/connexion", "/inscription"];

export default function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const sessionToken = request.cookies.get(SESSION_COOKIE)?.value;
  const isAuthenticated = Boolean(sessionToken);

  // Routes privees : redirection vers /connexion?from=... si non connecte
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
  );

  if (isProtected && !isAuthenticated) {
    const connexionUrl = new URL("/connexion", request.url);
    connexionUrl.searchParams.set("from", pathname + search);
    return NextResponse.redirect(connexionUrl);
  }

  // Routes auth : redirection vers accueil si deja connecte
  const isAuthPage = AUTH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
  );

  if (isAuthPage && isAuthenticated) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)",
  ],
};
