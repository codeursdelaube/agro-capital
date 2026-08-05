import { requireAuth } from "@/_lib/auth";
import { handleError } from "@/_lib/api-helpers";
import { NextResponse } from "next/server";

const BASE_URL =
  process.env.AGRO_PILOT_API_URL || "https://agro-capital-production.up.railway.app";

/**
 * POST /api/agro-pilot/diagnostic-image
 *
 * Proxy multipart/form-data vers l'endpoint FastAPI Railway :
 *   POST /agro-pilot/diagnostic-image
 *
 * Le client Next.js envoie un FormData avec le champ "file" contenant l'image.
 * Ce route handler le transmet fidèlement à FastAPI sans toucher aux bytes.
 */
export async function POST(req: Request) {
  try {
    await requireAuth();

    const contentType = req.headers.get("content-type") ?? "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { success: false, error: "Format attendu : multipart/form-data avec un champ 'file'." },
        { status: 400 }
      );
    }

    // Lire le FormData entrant
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { success: false, error: "Aucun fichier image reçu." },
        { status: 400 }
      );
    }

    // ─── Appel FastAPI Railway ─────────────────────────────────────────────────
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000); // 20s pour l'analyse IA

    try {
      // On reconstruit un FormData propre pour FastAPI
      const outForm = new FormData();
      outForm.append("file", file);

      const fastapiRes = await fetch(`${BASE_URL}/agro-pilot/diagnostic-image`, {
        method: "POST",
        body: outForm,
        signal: controller.signal,
        cache: "no-store",
      });

      clearTimeout(timeout);

      if (fastapiRes.ok) {
        const data = await fastapiRes.json();
        return NextResponse.json({ success: true, source: "fastapi", data });
      }

      console.error(`[FastAPI diagnostic-image] Status ${fastapiRes.status}`);
    } catch (e) {
      clearTimeout(timeout);
      console.warn("[FastAPI diagnostic-image] Indisponible, bascule sur fallback.", e);
    }

    // ─── Fallback si FastAPI hors ligne ────────────────────────────────────────
    return NextResponse.json({
      success: true,
      source: "fallback",
      data: {
        culture_identifiee: "Plante non identifiée",
        etat_general: "indéterminé",
        maladies_possibles: [
          {
            nom: "Service d'analyse temporairement indisponible",
            confiance: "faible",
            symptomes_observes: ["Analyse impossible pour le moment"],
            recommandation:
              "Le service de diagnostic IA est momentanément hors ligne. Réessayez dans quelques minutes.",
          },
        ],
        conseil_general:
          "Notre service d'analyse Agro-Pilot est momentanément indisponible. Votre image sera analysée dès que le service sera rétabli.",
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
