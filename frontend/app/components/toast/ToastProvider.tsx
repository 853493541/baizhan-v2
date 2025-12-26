"use client";

import { Toaster } from "react-hot-toast";

export default function ToastProvider() {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        duration: 2500,

        // Base toast style
        style: {
          borderRadius: "10px",
          padding: "10px 14px",
          fontSize: "14px",
          boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
          color: "#1f2937", // dark text
          background: "#f9fafb", // fallback (almost white, but soft)
        },

        // ✅ SUCCESS (green)
        success: {
          style: {
            background: "#ecfdf5",          // very light green
            borderLeft: "5px solid #22c55e",
          },
          iconTheme: {
            primary: "#22c55e",
            secondary: "#ecfdf5",
          },
        },

        // ❌ ERROR (red)
        error: {
          style: {
            background: "#fef2f2",          // very light red
            borderLeft: "5px solid #ef4444",
          },
          iconTheme: {
            primary: "#ef4444",
            secondary: "#fef2f2",
          },
        },

        // ℹ️ INFO / neutral
        loading: {
          style: {
            background: "#eff6ff",          // very light blue
            borderLeft: "5px solid #3b82f6",
          },
        },
      }}
    />
  );
}
