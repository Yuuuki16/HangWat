"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/header";

const HEADERLESS_ROUTES = ["/sign-in", "/sign-up"];

export function HeaderGate() {
  const pathname = usePathname();

  if (HEADERLESS_ROUTES.includes(pathname)) {
    return null;
  }

  if (pathname === "/home") {
    return <Header />;
  }

  const slotRouteMatch = pathname.match(
    /^\/events\/([^/]+)\/slots\/[^/]+$/,
  );

  if (slotRouteMatch) {
    return (
      <Header
        backLink={{
          href: `/events/${slotRouteMatch[1]}`,
          label: "イベントへ",
        }}
      />
    );
  }

  return <Header backLink={{ href: "/home", label: "ホーム" }} />;
}
