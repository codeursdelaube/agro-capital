import { NextResponse } from "next/server";

/**
 * POST /api/auth/login
 * Connexion d'un agriculteur via Numéro de Téléphone + Code PIN (4 chiffres).
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { telephone, pin } = body;

    if (!telephone || !pin) {
      return NextResponse.json(
        { error: "Le numéro de téléphone et le code PIN sont requis." },
        { status: 400 }
      );
    }

    // TODO: 1. Chercher l'agriculteur par téléphone dans Prisma (`prisma.user.findUnique`).
    // TODO: 2. Comparer le code PIN avec le mot de passe/PIN haché en BDD.
    // TODO: 3. Retourner un jeton de session JWT ou cookie d'authentification.

    return NextResponse.json({
      message: "Connexion réussie (Placeholder API)",
      user: {
        id: "usr_mock_123",
        nom: "Akouvi Mensah",
        telephone,
        village: "Kévé, Zio",
        operateur: "T-Money",
      },
      token: "mock_jwt_token_xyz",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Erreur serveur lors de la connexion." },
      { status: 500 }
    );
  }
}
