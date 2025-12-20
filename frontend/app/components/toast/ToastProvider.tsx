"use client";

import { Toaster } from "react-hot-toast";

export default function ToastProvider() {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        duration: 2500,
        style: {
          background: "#111",
          color: "#fff",
          fontSize: "14px",
          borderRadius: "8px",
          padding: "10px 14px",
        },
        success: {
          iconTheme: {
            primary: "#22c55e",
            secondary: "#111",
          },
        },
        error: {
          iconTheme: {
            primary: "#ef4444",
            secondary: "#111",
          },
        },
      }}
    />
  );
}
