"use client";

import { useEffect, useState, useCallback } from "react";

export type CurrentUser = {
  id: string;
  nom: string;
  prenom: string | null;
  telephone: string;
  region: string;
  role: "AGRICULTEUR" | "CLIENT" | "ADMIN";
  actif: boolean;
};

type AuthState =
  | { status: "loading" }
  | { status: "authenticated"; user: CurrentUser }
  | { status: "unauthenticated" };

/**
 * Hook côté client pour récupérer l'utilisateur connecté.
 * Appelle GET /api/auth/profil — null si non connecté.
 */
export function useCurrentUser() {
  const [state, setState] = useState<AuthState>({ status: "loading" });

  const refetch = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const res = await fetch("/api/auth/profil", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        setState({ status: "authenticated", user: json.data });
      } else {
        setState({ status: "unauthenticated" });
      }
    } catch {
      setState({ status: "unauthenticated" });
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return {
    user: state.status === "authenticated" ? state.user : null,
    isLoading: state.status === "loading",
    isAuthenticated: state.status === "authenticated",
    refetch,
  };
}
