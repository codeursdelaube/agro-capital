"use client";

import type { ReactNode } from "react";
import { useCurrentUser } from "@/_hooks/useCurrentUser";
import { usePathname } from "next/navigation";

/**
 * LayoutShift — applique md:pl-56 (décalage sidebar) uniquement
 * si l'utilisateur est connecté ET n'est pas sur une page d'auth.
 */
export function LayoutShift({ children }: { children: ReactNode }) {
  const { user, isLoading } = useCurrentUser();
  const pathname = usePathname();

  const isAuthPage = pathname === "/connexion" || pathname === "/inscription";
  // On réserve la place pour la sidebar seulement si connecté et hors page d'auth
  const hasSidebar = !isAuthPage && (isLoading || !!user);

  return (
    <div className={hasSidebar ? "md:pl-56" : ""}>
      {children}
    </div>
  );
}
