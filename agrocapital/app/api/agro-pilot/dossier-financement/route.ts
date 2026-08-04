import { requireAuth } from "@/_lib/auth";
import { generateDossierFinancement } from "@/_lib/agro-pilot-client";
import { ok, err, handleError } from "@/_lib/api-helpers";
import { z } from "zod";

const dossierSchema = z.object({
  typeDemande: z.enum(["pret_agricole", "subvention", "microfinance"]),
});

/** POST /api/agro-pilot/dossier-financement — Transmet au backend FastAPI Railway */
export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const parsed = dossierSchema.parse(body);

    const result = await generateDossierFinancement(user.id, parsed.typeDemande);

    if (!result) {
      return err("Erreur lors de la génération du dossier par le service FastAPI Railway.", 502);
    }

    return ok(result);
  } catch (error) {
    return handleError(error);
  }
}
