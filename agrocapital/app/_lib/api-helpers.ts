import { NextResponse } from "next/server";
import { ZodError, type ZodSchema } from "zod";
import { AuthError } from "./auth";

// ============================================================
// HELPERS DE RÉPONSE API STANDARDISÉS
// ============================================================

/** Réponse succès avec données */
export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

/** Réponse erreur standardisée */
export function err(message: string, status = 400, details?: unknown) {
  return NextResponse.json(
    { success: false, error: message, details: details ?? undefined },
    { status }
  );
}

/** Handler d'erreurs global pour les route handlers */
export function handleError(error: unknown): NextResponse {
  if (error instanceof AuthError) {
    return err(error.message, error.status);
  }
  if (error instanceof ZodError) {
    const issues = error.issues.map((e) => e.message).join(", ");
    return err(issues || "Données invalides", 400, error.flatten().fieldErrors);
  }
  if (error instanceof SyntaxError) {
    return err("Corps de la requête JSON invalide", 400);
  }
  // Erreur Prisma — contrainte unique
  if (
    error instanceof Error &&
    "code" in error &&
    (error as { code: string }).code === "P2002"
  ) {
    return err("Cette ressource existe déjà (ex: numéro de téléphone déjà enregistré)", 409);
  }
  // Erreur Prisma — enregistrement non trouvé
  if (
    error instanceof Error &&
    "code" in error &&
    (error as { code: string }).code === "P2025"
  ) {
    return err("Ressource introuvable", 404);
  }
  console.error("[API Error]", error);
  return err("Erreur serveur interne", 500);
}

/** Parse et valide le body JSON d'une requête */
export async function parseBody<T>(
  req: Request,
  schema: ZodSchema<T>
): Promise<T> {
  const body = await req.json();
  return schema.parse(body);
}

/** Calcul de l'offset de pagination */
export function getPaginationOffset(page: number, limit: number) {
  return { skip: (page - 1) * limit, take: limit };
}
