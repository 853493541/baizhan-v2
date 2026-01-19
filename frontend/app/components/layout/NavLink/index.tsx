"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import styles from "./styles.module.css";

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  "aria-disabled"?: boolean;
}

export default function NavLink({
  href,
  children,
  className,
  onClick,
  "aria-disabled": ariaDisabled,
}: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      onClick={onClick}
      aria-disabled={ariaDisabled}
      className={clsx(
        styles.link,
        isActive && styles.active,
        className
      )}
    >
      {children}
    </Link>
  );
}
