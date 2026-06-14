"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { useAuth } from "@/features/auth/context/authContext";

const PUBLIC_ROUTES = ["/sign-in", "/sign-up"];

function isPublicRoute(pathname: string) {
  if (PUBLIC_ROUTES.includes(pathname)) {
    return true;
  }

  return /^\/invite\/[^/]+$/.test(pathname);
}

export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { status } = useAuth();
  const isPublic = isPublicRoute(pathname);

  useEffect(() => {
    if (!isPublic && status === "unauthenticated") {
      router.replace("/sign-in");
    }
  }, [isPublic, status, router]);

  if (isPublic) {
    return <>{children}</>;
  }

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex flex-1 items-center justify-center py-16 text-foreground"
      >
        読み込み中...
      </div>
    );
  }

  return <>{children}</>;
}
