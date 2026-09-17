"use client";

import { createContext, useCallback, useContext, useState } from "react";
import type { ReactNode } from "react";

interface ToastCtx {
  showError: (message: string) => void;
}

const ToastContext = createContext<ToastCtx>({ showError: () => {} });

export function useToast(): ToastCtx {
  return useContext(ToastContext);
}

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Array<{ id: number; message: string }>>([]);

  const showError = useCallback((message: string) => {
    const id = ++nextId;
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
  }, []);

  return (
    <ToastContext.Provider value={{ showError }}>
      {children}
      {toasts.length > 0 && (
        <div
          role="alert"
          aria-live="polite"
          style={{
            position: "fixed",
            bottom: "1.5rem",
            right: "1.5rem",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
            maxWidth: "22rem",
          }}
        >
          {toasts.map((t) => (
            <div
              key={t.id}
              style={{
                background: "var(--nuit-haute)",
                border: "1px solid var(--aube)",
                color: "var(--calcaire)",
                borderRadius: "0.5rem",
                padding: "0.75rem 1rem",
                fontSize: "0.875rem",
                boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
              }}
            >
              {t.message}
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}
