import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ok, err, handleError } from "@/_lib/api-helpers";

export const ADMIN_COOKIE = "agrocapital_admin_session";

/** POST /api/admin/auth — Déverrouiller le portail secret djobokoumin */
export async function POST(req: Request) {
  try {
    const { secretWord, password } = await req.json();

    const expectedSecret = process.env.ADMIN_SECRET_WORD || process.env.ADMIN_SECRET_KEY || "JoelEtSamuelSontRiches";
    const expectedPassword = process.env.ADMIN_PASSWORD || "@groc@pit@lelodie2026";

    if (secretWord !== expectedSecret || password !== expectedPassword) {
      return err("Secret ou mot de passe d'administration incorrect", 401);
    }

    const cookieStore = await cookies();
    cookieStore.set(ADMIN_COOKIE, "authenticated_admin_session_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 heures
      path: "/",
    });

    return ok({ success: true, message: "Accès administration déverrouillé" });
  } catch (error) {
    return handleError(error);
  }
}

/** DELETE /api/admin/auth — Se déconnecter du portail admin */
export async function DELETE() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(ADMIN_COOKIE);
    return ok({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
