import { NextResponse } from "next/server";

/**
 * POST /api/auth/register
 * Inscription d'un nouvel agriculteur avec Numéro de Téléphone + Code PIN (4 chiffres).
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nom, village, telephone, operateur, pin } = body;

    // Validation minimale des champs obligatoires
    if (!nom || !telephone || !pin) {
      return NextResponse.json(
        { error: "Le nom, le numéro de téléphone et le code PIN sont requis." },
        { status: 400 }
      );
    }

    // TODO: 1. Vérifier si un utilisateur avec ce numéro de téléphone existe déjà dans Prisma.
    // TODO: 2. Hacher le code PIN (ex. avec bcrypt ou argon2).
    // TODO: 3. Créer l'utilisateur dans la base de données Prisma (`prisma.user.create`).
    // TODO: 4. Générer un jeton JWT ou créer une session.

    return NextResponse.json({
      message: "Inscription réussie (Placeholder API)",
      user: {
        id: "usr_mock_123",
        nom,
        village: village || "Non spécifié",
        telephone,
        operateur: operateur || "T-Money",
      },
      token: "mock_jwt_token_xyz",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Erreur lors du traitement de la requête." },
      { status: 500 }
    );
  }
}
