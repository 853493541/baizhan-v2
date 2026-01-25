"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

export default function AuthGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(false);

  // ✅ guarantees ONE /me call per page load
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/auth/me", {
          credentials: "include",
        });

        if (!res.ok) {
          if (!cancelled) {
            setAuthed(false);
            setChecking(false);
            if (pathname !== "/login") router.replace("/login");
          }
          return;
        }

        const data = await res.json();

        if (!cancelled) {
          setAuthed(true);
          setChecking(false);

          // ✅ expose username ONCE for layout/topbar
          if (data?.user?.username) {
            (window as any).__AUTH_USERNAME__ = data.user.username;
          }

          if (pathname === "/login") router.replace("/");
        }
      } catch {
        if (!cancelled) {
          setAuthed(false);
          setChecking(false);
          if (pathname !== "/login") router.replace("/login");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []); // ⛔ DO NOT add deps

  // ⛔ block render until auth known
  if (checking) return null;

  // ⛔ unauth users only see login
  if (!authed && pathname !== "/login") return null;

  return <>{children}</>;
}
