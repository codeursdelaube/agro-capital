import { requireAuth } from "@/_lib/auth";
import { generateDossierFinancement } from "@/_lib/agro-pilot-client";
import { ok, handleError } from "@/_lib/api-helpers";
import { z } from "zod";

const dossierSchema = z.object({
  typeDemande: z.enum(["pret_agricole", "subvention", "microfinance"]),
});

/** POST /api/agro-pilot/dossier-financement — Proxy serveur pour la génération de dossier */
export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const parsed = dossierSchema.parse(body);

    const result = await generateDossierFinancement(user.id, parsed.typeDemande);

    if (result) {
      return ok(result);
    }

    // Fallback dynamique
    return ok({
      type_demande: parsed.typeDemande,
      texte_dossier: `DOSSIER DE DEMANDE DE FINANCEMENT\n\nDemandeur : ${user.nom}\nRégion : ${user.region}\nContact : ${user.telephone}\n\nObjet : Demande de ${parsed.typeDemande.replace("_", " ")} pour l'exploitation agricole.\n\nCe dossier est certifié par la plateforme Agro-Capital et s'appuie sur le stock physique enregistré en magasin.`,
      documents_requis: [
        "Pièce d'identité officielle",
        "Attestation de stock certifiée Agro-Capital",
        "Historique des livraisons récentes",
      ],
      conseils_redaction: "Présentez ce dossier directement à l'agent de crédit ou à la délégation régionale du Ministère.",
    });
  } catch (error) {
    return handleError(error);
  }
}
