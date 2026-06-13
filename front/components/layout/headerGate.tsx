"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/header";

const HEADERLESS_ROUTES = ["/login"];

export function HeaderGate() {
  const pathname = usePathname();

  if (HEADERLESS_ROUTES.includes(pathname)) {
    return null;
  }

  return <Header />;
}
