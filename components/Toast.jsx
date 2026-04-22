"use client";

import { createContext, useCallback, useContext, useState } from "react";

const ToastContext = createContext({ toast: () => {} });

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((message, tone = "info") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 3800);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed z-50 bottom-6 right-6 flex flex-col gap-2 w-[min(92vw,360px)]">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={[
              "bp-card px-4 py-3 text-sm flex items-start gap-3 animate-slide-up",
              t.tone === "error" && "border-rose-300/60",
              t.tone === "success" && "border-emerald-300/60",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <span
              className={[
                "mt-0.5 h-2 w-2 rounded-full shrink-0",
                t.tone === "success"
                  ? "bg-emerald-500"
                  : t.tone === "error"
                  ? "bg-rose-500"
                  : "bg-brand-500",
              ].join(" ")}
            />
            <span className="leading-snug">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
