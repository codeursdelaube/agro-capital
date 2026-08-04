import { NextResponse } from "next/server";

// ╔════════════════════════════════════════════════════════════════════════════╗
// ║  ENDPOINT FASTAPI DE DÉTECTION DES MALADIES DE PLANTES                     ║
// ║  👉 BRANCHEZ VOTRE URL ENDPOINT FASTAPI ICI OU VIA VARIABLE D'ENVIRONNEMENT║
// ╚════════════════════════════════════════════════════════════════════════════╝
const FASTAPI_SANTE_CULTURE_ENDPOINT =
  process.env.FASTAPI_SANTE_CULTURE_URL ||
  "http://localhost:8000/api/v1/sante-culture/diagnostic";

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";

    let bodyData: any = {};
    let cropType = "Autre";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      cropType = (formData.get("cropType") as string) || "Autre";

      // ─── 🔗 BRANCHEMENT ENDPOINT FASTAPI ────────────────────────────────────
      // Envoie le FormData (fichier image + type de culture) à FastAPI
      try {
        const fastapiRes = await fetch(FASTAPI_SANTE_CULTURE_ENDPOINT, {
          method: "POST",
          body: formData,
        });

        if (fastapiRes.ok) {
          const data = await fastapiRes.json();
          return NextResponse.json({ success: true, source: "fastapi", data });
        }
      } catch (err) {
        console.warn(
          "🔗 [FastAPI Diagnostic] Endpoint indisponible, bascule sur le moteur de détection IA de secours.",
          err
        );
      }
    } else {
      bodyData = await req.json();
      cropType = bodyData.cropType || "Autre";
    }

    // ─── Moteur IA de Secours (Simulé si FastAPI hors-ligne) ───────────────────
    const mockDiagnostics: Record<string, any> = {
      Maïs: {
        maladie: "Rouille foliaire du maïs (Puccinia sorghi)",
        scoreConfiance: 96,
        severite: "MODEREE", // FAIBLE | MODEREE | ELEVEE
        symptomes: [
          "Pustules circulaires brun-brunâtre à rougeâtres sur les deux faces des feuilles",
          "Dessèchement précoce des limbes foliaires inférieurs",
          "Réduction de la capacité photosynthétique de la plante",
        ],
        traitements: [
          "Fongicide bio : Pulvérisation d'extrait de feuilles de neem ou de solution à base de cuivre",
          "Traitement homologué ITRA/Togo : Azoxystrobine (250 g/ha) à l'apparition des premières taches",
        ],
        prevention: [
          "Utiliser des variétés hybrides tolérantes (ex. Maïs TZEE-Y)",
          "Respecter la rotation des cultures avec des légumineuses (Niébé / Haricot)",
          "Éliminer les débris de récolte infectés après la moisson",
        ],
      },
      Manioc: {
        maladie: "Mosaïque africaine du manioc (ACMD / Geminivirus)",
        scoreConfiance: 94,
        severite: "ELEVEE",
        symptomes: [
          "Décoloration jaune-vert et déformation asymétrique des limbes",
          "Nécrose et rabougrissement des jeunes feuilles terminales",
          "Réduction importante de la taille des tubercules de manioc",
        ],
        traitements: [
          "Arrachage immédiat et destruction par brûlage des plants atteints",
          "Contrôle du vecteur (Mouche blanche / Bemisia tabaci) par savon noir ou huile d'assainissement",
        ],
        prevention: [
          "Planter uniquement des boutures saines certifiées (ex. Variété Lassa / TME 419)",
          "Éviter les prélèvements de boutures dans des champs voisins infectés",
        ],
      },
      Tomate: {
        maladie: "Mildiou de la tomate (Phytophthora infestans)",
        scoreConfiance: 91,
        severite: "MODEREE",
        symptomes: [
          "Taches huileuses devenant brunes sur la face supérieure des feuilles",
          "Duvet blanchâtre au revers des feuilles par temps humide",
          "Lésions brunes et fermes sur les fruits vert ou mûrs",
        ],
        traitements: [
          "Bouillie bordelaise (Cuivre) en pulvérisation foliaire préventive/curative",
          "Fongicide : Métalaxyl + Mancozèbe tous les 7 à 10 jours",
        ],
        prevention: [
          "Éviter l'arrosage par aspersion sur le feuillage",
          "Assurer une bonne aération entre les rangs de plantation",
        ],
      },
    };

    const diagnosticData = mockDiagnostics[cropType] || {
      maladie: "Helminthosporiose foliaire (Bipolaris spp.)",
      scoreConfiance: 88,
      severite: "FAIBLE",
      symptomes: [
        "Petites taches elliptiques jaunâtres à bordures sombres sur le feuillage",
        "Léger brunissement des bordures des feuilles inférieures",
      ],
      traitements: [
        "Traitement fongicide doux à base d'oxyde de cuivre ou macération de compost",
        "Nettoyage des feuilles atteintes au bas de la tige",
      ],
      prevention: [
        "Veiller à un bon drainage du sol pour éviter le croupissement d'eau",
        "Aérer le champ et désherber les adventices réservoirs de spores",
      ],
    };

    return NextResponse.json({
      success: true,
      source: "fallback",
      fastapiEndpointPlaceholder: FASTAPI_SANTE_CULTURE_ENDPOINT,
      data: diagnosticData,
    });
  } catch (error) {
    console.error("Erreur Diagnostic Santé Culture:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors du traitement du diagnostic" },
      { status: 500 }
    );
  }
}
