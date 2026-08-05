// Utilitaires partagés (sans mock data)

/** Formate un montant en FCFA lisible */
export function formatFcfa(montant: number): string {
  return `${new Intl.NumberFormat("fr-FR").format(Math.round(montant))} FCFA`;
}

/** Tronque un texte à n caractères */
export function tronquer(texte: string, max = 80): string {
  if (texte.length <= max) return texte;
  return texte.slice(0, max).trimEnd() + "…";
}

/** Initiales d'un nom complet */
export function initiales(nom: string, prenom?: string | null): string {
  const parts = [nom, prenom].filter(Boolean) as string[];
  return parts
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/** Formate une date en français court */
export function dateCourteFr(date: string | Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

/** Labels lisibles pour les statuts commande */
export const STATUT_COMMANDE_LABEL: Record<string, string> = {
  EN_ATTENTE: "En attente",
  CONFIRMEE: "Confirmée",
  EN_LIVRAISON: "En livraison",
  LIVREE: "Livrée",
  ANNULEE: "Annulée",
  LITIGE: "Litige",
};

/** Couleur badge daisyUI pour statut commande */
export function statutCommandeBadge(statut: string): string {
  const map: Record<string, string> = {
    EN_ATTENTE: "badge-warning",
    CONFIRMEE: "badge-info",
    EN_LIVRAISON: "badge-primary",
    LIVREE: "badge-success",
    ANNULEE: "badge-error",
    LITIGE: "badge-error",
  };
  return map[statut] ?? "badge-ghost";
}

/** Labels lisibles pour les statuts stock */
export const STATUT_STOCK_LABEL: Record<string, string> = {
  DISPONIBLE: "Disponible",
  NANTI: "En garantie",
  RESERVE: "Réservé",
  VENDU: "Vendu",
};

/** Régions du Togo (options select) */
export const REGIONS_TOGO = [
  "Lomé",
  "Maritime",
  "Plateaux",
  "Centrale",
  "Kara",
  "Savanes",
] as const;

export type RegionTogo = (typeof REGIONS_TOGO)[number];

/** Unités de mesure produit */
export const UNITES_MESURE = [
  { value: "KG", label: "Kilogrammes (kg)" },
  { value: "TONNE", label: "Tonnes" },
  { value: "SAC50KG", label: "Sacs de 50 kg" },
  { value: "SAC100KG", label: "Sacs de 100 kg" },
  { value: "BOL", label: "bol" },
  { value: "LITRE", label: "Litres" },
  { value: "UNITE", label: "Unités" },
] as const;

/** Cultures courantes au Togo */
export const CULTURES_COURANTES = [
  "🌽 Maïs",
  "🫘 Soja",
  "🌾 Riz",
  "🌾 Mil",
  "🫘 Niébé",
  "🥜 Arachide",
  "🍠 Igname",
  "🥦 Manioc",
  "🍅 Tomate",
  "🫑 Piment",
  "🍌 Banane",
  "🌴 Noix de palme",
] as const;

/** Cultures éligibles au Warrantage (Grains & Légumineuses sèches stockables) */
export const CULTURES_WARRANTAGE_ELIGIBLES = [
  "Maïs",
  "Riz",
  "Sorgho",
  "Mil",
  "Fonio",
  "Niébé",
  "Arachide",
  "Soja",
  "Sésame",
  "Anacarde",
] as const;

/** Vérifie si une culture est stocable et éligible au crédit warrantage */
export function isCultureNantissable(culture: string): boolean {
  if (!culture) return false;
  const c = culture.toLowerCase();
  const eligibles = [
    "maïs",
    "mais",
    "corn",
    "riz",
    "rice",
    "paddy",
    "sorgho",
    "sorghum",
    "mil",
    "millet",
    "fonio",
    "niébé",
    "niebe",
    "haricot",
    "bean",
    "arachide",
    "peanut",
    "soja",
    "soy",
    "soybean",
    "sésame",
    "sesame",
    "anacarde",
    "cajou",
    "cashew",
  ];
  return eligibles.some((e) => c.includes(e));
}
