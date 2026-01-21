"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

export default function AuthGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkAuth() {
      try {
        const res = await fetch(`${API_BASE}/api/auth/me`, {
          credentials: "include",
        });

        if (!res.ok) {
          if (!cancelled) {
            setAuthed(false);
            setChecking(false);

            if (pathname !== "/login") {
              router.replace("/login");
            }
          }
          return;
        }

        if (!cancelled) {
          setAuthed(true);
          setChecking(false);

          if (pathname === "/login") {
            router.replace("/");
          }
        }
      } catch {
        if (!cancelled) {
          setAuthed(false);
          setChecking(false);
          if (pathname !== "/login") {
            router.replace("/login");
          }
        }
      }
    }

    checkAuth();
    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  // ⛔ prevent flicker
  if (checking) return null;

  // ⛔ not logged in → only allow /login
  if (!authed && pathname !== "/login") return null;

  // 🔓 login page should NOT use LayoutShell
  if (pathname === "/login") {
    return <>{children}</>;
  }

  return <>{children}</>;
}
