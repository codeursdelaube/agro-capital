import { z } from "zod";

// ============================================================
// HELPERS COMMUNS
// ============================================================

/** Numéro de téléphone togolais — format international ou local (espaces nettoyés automatiquement) */
const telephoneSchema = z
  .string()
  .transform((val) => val.replace(/[\s\-\.\(\)]/g, ""))
  .pipe(
    z.string().regex(/^(\+228|00228)?[279]\d{7}$/, "Numéro de téléphone togolais invalide (ex: 90123456)")
  );

/** PIN numérique 4–6 chiffres */
const pinSchema = z
  .string()
  .transform((val) => val.trim())
  .pipe(
    z.string().regex(/^\d{4,6}$/, "Le PIN doit contenir 4 à 6 chiffres")
  );

/** Régions du Togo */
const regionSchema = z.enum([
  "Lomé",
  "Maritime",
  "Plateaux",
  "Centrale",
  "Kara",
  "Savanes",
]);

// ============================================================
// AUTH
// ============================================================

export const inscriptionSchema = z.object({
  telephone: telephoneSchema,
  pin: pinSchema,
  nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères").max(100),
  prenom: z.string().max(100).optional(),
  region: regionSchema,
  role: z.enum(["AGRICULTEUR", "CLIENT"]).default("CLIENT"),
});

export const connexionSchema = z.object({
  telephone: telephoneSchema,
  pin: pinSchema,
});

export const updateProfilSchema = z.object({
  nom: z.string().min(2).max(100).optional(),
  prenom: z.string().max(100).optional(),
  region: regionSchema.optional(),
});

// ============================================================
// BOUTIQUE
// ============================================================

export const boutiqueSchema = z.object({
  nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères").max(150),
  description: z.string().max(1000).optional(),
  photoUrl: z.string().url().optional(),
});

// ============================================================
// PRODUIT
// ============================================================

export const produitSchema = z.object({
  culture: z.string().min(2).max(100),
  nom: z.string().min(2).max(200),
  description: z.string().max(2000).optional(),
  prixUnitaire: z.number().positive("Le prix doit être positif"),
  uniteMesure: z.enum(["KG", "TONNE", "SAC50KG", "SAC100KG", "BOTTE", "LITRE", "UNITE"]).default("KG"),
  quantiteDisponible: z.number().nonnegative("La quantité ne peut pas être négative"),
  quantiteMinCommande: z.number().positive().default(1),
  photoUrl: z.string().url().optional(),
  stockSourceId: z.string().cuid().optional(),
});

export const updateProduitSchema = produitSchema
  .partial()
  .extend({
    statut: z.enum(["DISPONIBLE", "RUPTURE", "ARCHIVE"]).optional(),
  });

// ============================================================
// STOCK
// ============================================================

export const stockSchema = z.object({
  culture: z.string().min(2).max(100),
  quantiteKg: z.number().positive("La quantité doit être positive"),
  valeurEstimee: z.number().nonnegative().optional(),
  notes: z.string().max(500).optional(),
});

export const updateStockSchema = stockSchema
  .partial()
  .extend({
    statut: z.enum(["DISPONIBLE", "NANTI", "RESERVE", "VENDU"]).optional(),
  });

// ============================================================
// COMMANDE
// ============================================================

export const commandeSchema = z.object({
  produitId: z.string().cuid("ID produit invalide"),
  quantite: z.number().positive("La quantité doit être positive"),
  adresseLivraison: z.string().max(500).optional(),
  notes: z.string().max(500).optional(),
});

export const updateCommandeSchema = z.object({
  statut: z.enum(["CONFIRMEE", "EN_LIVRAISON", "LIVREE", "ANNULEE", "LITIGE"]),
  modePaiement: z.enum(["TMONEY", "FLOOZ", "CASH", "VIREMENT"]).optional(),
});

// ============================================================
// ANNONCE RÉCOLTE
// ============================================================

export const annonceSchema = z.object({
  culture: z.string().min(2).max(100),
  quantiteEstimee: z.number().positive(),
  prixEstime: z.number().positive().optional(),
  dateRecoltePrevu: z.string().datetime("Date invalide"),
  description: z.string().max(1000).optional(),
  region: regionSchema,
});

export const updateAnnonceSchema = annonceSchema
  .partial()
  .extend({
    statut: z.enum(["ANNONCEE", "OUVERTE", "FERMEE", "ANNULEE"]).optional(),
  });

export const reservationSchema = z.object({
  annonceId: z.string().cuid(),
  quantiteKg: z.number().positive(),
  commentaire: z.string().max(500).optional(),
});

// ============================================================
// NANTISSEMENT
// ============================================================

export const demandeNantissementSchema = z.object({
  stockId: z.string().cuid("ID stock invalide"),
  montantDemande: z.number().positive("Le montant demandé doit être positif"),
  motif: z.string().max(500).optional(),
  dateRemboursementDue: z.string().datetime().optional(),
});

export const approuverNantissementSchema = z.object({
  statut: z.enum(["APPROUVEE", "REJETEE"]),
  montantDebloque: z.number().positive().optional(),
  tauxDecote: z.number().min(0).max(1).optional(),
  dateDebloiement: z.string().datetime().optional(),
  dateRemboursementDue: z.string().datetime().optional(),
});

// ============================================================
// PAIEMENT MOBILE MONEY
// ============================================================

export const mobileMoneySchema = z.object({
  commandeId: z.string().cuid().optional(),
  demandeNantissementId: z.string().cuid().optional(),
  operateur: z.enum(["TMONEY", "FLOOZ"]),
  numeroCible: telephoneSchema,
  montant: z.number().positive(),
});

// ============================================================
// SUIVI
// ============================================================

export const suiviSchema = z
  .object({
    followedUserId: z.string().cuid().optional(),
    cultureSuivie: z.string().min(2).max(100).optional(),
  })
  .refine(
    (data) => data.followedUserId || data.cultureSuivie,
    "Vous devez suivre au moins un agriculteur ou une culture"
  );

// ============================================================
// QUERY PARAMS (pagination, filtres)
// ============================================================

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const produitsFiltresSchema = paginationSchema.extend({
  culture: z.string().optional(),
  region: z.string().optional(),
  boutiqueId: z.string().optional(),
  prixMin: z.coerce.number().optional(),
  prixMax: z.coerce.number().optional(),
  statut: z.enum(["DISPONIBLE", "RUPTURE"]).optional(),
});

export const prixFiltresSchema = paginationSchema.extend({
  culture: z.string().min(1),
  region: z.string().optional(),
  dateDebut: z.string().datetime().optional(),
  dateFin: z.string().datetime().optional(),
});
