// app/layout.tsx
import "./globals.css";
import { ReactNode } from "react";
import LayoutShell from "./components/layout/LayoutShell";
import ToastProvider from "@/app/components/toast/ToastProvider";

export const metadata = {
  title: "Baizhan App",
  description: "App layout with topbar and sidebar",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <LayoutShell>{children}</LayoutShell>

        {/* ✅ REQUIRED: mount toast system ONCE */}
        <ToastProvider />
      </body>
    </html>
  );
}
