import { cookies } from "next/headers";
import { prisma } from "./prisma";
import type { User, Role } from "@prisma/client";

// ============================================================
// HACHAGE DU PIN (Web Crypto API — natif dans Node.js 20+)
// Pas de dépendance externe nécessaire
// ============================================================

const PIN_SALT_ROUNDS = 100_000; // Nombre d'itérations PBKDF2

/** Hache un PIN en utilisant PBKDF2-SHA256 avec un sel aléatoire */
export async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(pin),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );

  const hash = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: PIN_SALT_ROUNDS,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );

  const saltHex = Buffer.from(salt).toString("hex");
  const hashHex = Buffer.from(hash).toString("hex");
  return `${saltHex}:${hashHex}`;
}

/** Vérifie un PIN contre son hash stocké */
export async function verifyPin(pin: string, stored: string): Promise<boolean> {
  try {
    if (!stored || !stored.includes(":")) return false;
    const [saltHex, hashHex] = stored.split(":");
    if (!saltHex || !hashHex) return false;

    const encoder = new TextEncoder();
    const salt = Buffer.from(saltHex, "hex");

    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(pin),
      { name: "PBKDF2" },
      false,
      ["deriveBits"]
    );

    const hash = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt,
        iterations: PIN_SALT_ROUNDS,
        hash: "SHA-256",
      },
      keyMaterial,
      256
    );

    const candidateHex = Buffer.from(hash).toString("hex");
    return candidateHex === hashHex;
  } catch {
    return false;
  }
}

// ============================================================
// GESTION DES SESSIONS
// ============================================================

const SESSION_COOKIE = "agrocapital_session";
const SESSION_DURATION_DAYS = 30;

/** Crée une session en base et pose le cookie httpOnly */
export async function createSession(userId: string): Promise<string> {
  // Token aléatoire de 32 octets
  const tokenBytes = crypto.getRandomValues(new Uint8Array(32));
  const token = Buffer.from(tokenBytes).toString("hex");

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

  await prisma.session.create({
    data: { userId, token, expiresAt },
  });

  // Poser le cookie (doit être appelé dans un Server Action ou Route Handler)
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });

  return token;
}

/** Supprime la session (déconnexion) */
export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    await prisma.session.deleteMany({ where: { token } }).catch(() => {});
    cookieStore.delete(SESSION_COOKIE);
  }
}

/** Récupère l'utilisateur courant depuis le cookie de session */
export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    // Session expirée — nettoyage
    if (session) {
      await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    }
    cookieStore.delete(SESSION_COOKIE);
    return null;
  }

  return session.user;
}

/** Vérifie l'authentification et retourne l'utilisateur ou lance une erreur 401 */
export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    throw new AuthError("Non authentifié", 401);
  }
  return user;
}

/** Vérifie l'authentification ET un rôle spécifique */
export async function requireRole(
  ...roles: Role[]
): Promise<User> {
  const user = await requireAuth();
  if (!roles.includes(user.role)) {
    throw new AuthError("Accès refusé — rôle insuffisant", 403);
  }
  return user;
}

// ============================================================
// CLASSE D'ERREUR AUTH
// ============================================================

export class AuthError extends Error {
  constructor(
    message: string,
    public status: number = 401
  ) {
    super(message);
    this.name = "AuthError";
  }
}
