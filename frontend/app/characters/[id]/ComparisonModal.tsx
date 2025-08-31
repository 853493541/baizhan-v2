"use client";

import React from "react";

interface UpdateItem {
  name: string;
  old: number;
  new: number;
}

interface ComparisonModalProps {
  toUpdate: UpdateItem[];
  ocrOnly?: string[];
  dbOnly?: string[];
  onConfirm: () => void;
  onClose: () => void;
}

export default function ComparisonModal({
  toUpdate,
  ocrOnly = [],
  dbOnly = [],
  onConfirm,
  onClose,
}: ComparisonModalProps) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 8,
          padding: 20,
          width: 440,
          maxHeight: "75vh",
          overflowY: "auto",
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
        }}
      >
        <h3 style={{ marginTop: 0 }}>Comparison Result</h3>

        {/* Changed Abilities */}
        {toUpdate.length > 0 ? (
          <>
            <h4>Changed Abilities</h4>
            <ul style={{ listStyle: "none", paddingLeft: 0, marginBottom: 16 }}>
              {toUpdate.map((u, idx) => (
                <li key={idx} style={{ marginBottom: 6 }}>
                  <strong>{u.name}</strong>: {u.old} → {u.new}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p>No ability changes found.</p>
        )}

        {/* OCR-only */}
        {ocrOnly.length > 0 && (
          <>
            <h4>OCR Only (not in DB)</h4>
            <ul style={{ listStyle: "disc", paddingLeft: 20, marginBottom: 16 }}>
              {ocrOnly.map((name, idx) => (
                <li key={idx}>{name}</li>
              ))}
            </ul>
          </>
        )}

        {/* DB-only */}
        {dbOnly.length > 0 && (
          <>
            <h4>DB Only (not in OCR)</h4>
            <ul style={{ listStyle: "disc", paddingLeft: 20, marginBottom: 16 }}>
              {dbOnly.map((name, idx) => (
                <li key={idx}>{name}</li>
              ))}
            </ul>
          </>
        )}

        {/* Buttons */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button
            onClick={onClose}
            style={{
              padding: "8px 14px",
              borderRadius: 6,
              border: "1px solid #ccc",
              background: "#f5f5f5",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          {toUpdate.length > 0 && (
            <button
              onClick={onConfirm}
              style={{
                padding: "8px 16px",
                borderRadius: 6,
                border: "none",
                background: "#0070f3",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              Confirm Update
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
