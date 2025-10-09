"use client";
import React, { useState, useRef, useEffect } from "react";
import styles from "./styles.module.css";

interface Props {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}

export default function Dropdown({ label, options, value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // ✅ Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className={styles.dropdown}>
      <button
        type="button"
        className={styles.dropdownBtn}
        onClick={() => setOpen((o) => !o)}
      >
        {value || label}
        <span className={styles.arrow}>▼</span>
      </button>

      {open && (
        <ul className={styles.dropdownList}>
          {options.map((opt) => (
            <li
              key={opt}
              className={styles.dropdownItem}
              onClick={() => {
                onChange(opt);
                setOpen(false); // ✅ close after selection
              }}
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
