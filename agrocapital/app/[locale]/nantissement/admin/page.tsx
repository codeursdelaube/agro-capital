"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DeprecatedAdminPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/djobokoumin/nantissement");
  }, [router]);

  return null;
}
