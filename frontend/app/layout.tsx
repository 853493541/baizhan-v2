// app/layout.tsx (SERVER COMPONENT)
import "./globals.css";
import { ReactNode } from "react";

import LayoutShell from "./components/layout/LayoutShell";
import ToastProvider from "@/app/components/toast/ToastProvider";
import AuthGate from "./components/auth/AuthGate";

/* ======================================================
   ✅ GLOBAL METADATA
   ====================================================== */
export const metadata = {
  title: "百战",
  description: "百战统计排表工具",
  icons: {
    icon: "/icons/app_icon_no_background.png",        // browser tab
    apple: "/icons/app_icon_no_background.png",       // iOS fallback
  },
};
/* ======================================================
   📱 VIEWPORT (MUST BE SEPARATE — FIXES MOBILE ZOOM)
   ====================================================== */
export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

/* ======================================================
   ROOT LAYOUT
   ====================================================== */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        {/* ✅ Google Material Symbols (Outlined) */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined"
          rel="stylesheet"
        />
      </head>

      <body>
        {/* 🔐 Auth guard wraps the entire app */}
        <AuthGate>
          <LayoutShell>{children}</LayoutShell>
        </AuthGate>

        {/* ✅ mount toast system ONCE */}
        <ToastProvider />
      </body>
    </html>
  );
}
