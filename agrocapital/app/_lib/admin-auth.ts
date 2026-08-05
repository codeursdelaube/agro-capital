import { cookies } from "next/headers";
import { getCurrentUser } from "./auth";
import { AuthError } from "./auth";

export const ADMIN_COOKIE = "agrocapital_admin_session";

/**
 * Vérifie que l'utilisateur est authentifié comme Administrateur
 * (Soit rôle ADMIN en base de données, soit cookie de session djobokoumin valide)
 */
export async function requireAdminAccess() {
  const cookieStore = await cookies();
  const adminCookie = cookieStore.get(ADMIN_COOKIE)?.value;

  const currentUser = await getCurrentUser();

  // Si l'utilisateur est ADMIN en DB ou possède le cookie de session admin valide
  if (currentUser?.role === "ADMIN" || adminCookie === "authenticated_admin_session_token") {
    return currentUser ?? { id: "admin-secret", role: "ADMIN", nom: "Administrateur" };
  }

  throw new AuthError("Accès refusé — Réservé à l'administration", 403);
}
