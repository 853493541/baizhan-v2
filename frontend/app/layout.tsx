// app/layout.tsx
import "./globals.css";
import { ReactNode } from "react";
import LayoutShell from "./components/LayoutShell";

export const metadata = {
  title: "Baizhan App",
  description: "App layout with topbar and sidebar",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <LayoutShell>{children}</LayoutShell>
      </body>
    </html>
  );
}
