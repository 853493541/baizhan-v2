"use client";
import React, { useState } from "react";
import styles from "./styles.module.css";

interface Props {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}

export default function Dropdown({ label, options, value, onChange }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className={styles.dropdown}>
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
                setOpen(false);
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
