"use client";

import { useEffect } from "react";
import { Log } from "logging-middleware";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    void Log(
      "frontend",
      "fatal",
      "page",
      `unhandled render error: ${error.message}${error.digest ? ` (digest=${error.digest})` : ""}`
    );
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          padding: 32,
        }}
      >
        <h1 style={{ marginTop: 0 }}>Something went wrong</h1>
        <p style={{ color: "#555" }}>{error.message}</p>
        <button
          type="button"
          onClick={reset}
          style={{
            padding: "8px 16px",
            borderRadius: 6,
            border: "1px solid #1565c0",
            background: "#1565c0",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
