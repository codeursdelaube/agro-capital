import { NextResponse } from "next/server";

/**
 * GET /api/meteo/[region]
 * Renvoie les métriques météorologiques actuelles et prévisions pour la région spécifiée.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ region: string }> }
) {
  const { region } = await params;
  const decodedRegion = decodeURIComponent(region);

  // TODO: 1. Interroger une API météo externe (OpenWeatherMap, Meteomatics, etc.) ou la base locale Prisma.
  // TODO: 2. Formater les données météo pour les intégrer à l'analyse IA de prix (impact sécheresse/pluie sur l'offre).

  return NextResponse.json({
    region: decodedRegion,
    actuelle: {
      temp: 32,
      ressentie: 35,
      condition: "ensoleille",
      humidite: 65,
      ventKmH: 14,
    },
    previsions: [
      { jour: "Demain", temp: 30, condition: "nuageux" },
      { jour: "Mercredi", temp: 27, condition: "pluie" },
      { jour: "Jeudi", temp: 26, condition: "pluie_forte" },
      { jour: "Vendredi", temp: 29, condition: "nuageux" },
      { jour: "Samedi", temp: 33, condition: "ensoleille" },
    ],
    conseilIA:
      "Des pluies modérées sont prévues cette semaine. Pensez à protéger votre stock de maïs en grenier contre l'humidité.",
  });
}
