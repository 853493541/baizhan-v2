"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./styles.module.css";

export default function NavLink({ href, children }) {
  const pathname = usePathname();

  // Convert both paths into segments
  const pathSeg = pathname.split("/").filter(Boolean);
  const hrefSeg = href.split("/").filter(Boolean);

  // EXACT segment match
  const active = pathSeg.join("/") === hrefSeg.join("/");

  return (
    <Link
      href={href}
      className={`${styles.link} ${active ? styles.active : ""}`}
    >
      {children}
    </Link>
  );
}
