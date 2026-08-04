import { requireAuth } from "@/_lib/auth";
import { sendPilotChat } from "@/_lib/agro-pilot-client";
import { ok, err, handleError } from "@/_lib/api-helpers";
import { z } from "zod";

const chatSchema = z.object({
  message: z.string().min(1, "Le message ne peut pas être vide").max(1000),
});

/** POST /api/agro-pilot/chat — Transmet la requête directement au backend FastAPI Railway */
export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const parsed = chatSchema.parse(body);

    // Appel direct au backend FastAPI sur Railway
    const fastApiResult = await sendPilotChat(user.id, parsed.message);

    if (!fastApiResult) {
      return err("Le service Agro-Pilot sur Railway n'a pas répondu. Vérifiez la connexion du serveur backend.", 502);
    }

    // Renvoie directement et fidèlement la réponse générée par l'endpoint FastAPI
    return ok({
      reponse: fastApiResult.reponse,
      contexte_utilise: fastApiResult.contexte_utilise,
    });
  } catch (error) {
    return handleError(error);
  }
}
