"use client";

import { useCallback, useState } from "react";

export interface ToastItem {
  id: number;
  kind: "success" | "error";
  message: string;
}

export function useToasts() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const push = useCallback((kind: ToastItem["kind"], message: string) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, kind, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, push, dismiss };
}

export function ToastStack({
  toasts,
  dismiss,
}: {
  toasts: ToastItem[];
  dismiss: (id: number) => void;
}) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <button
          key={toast.id}
          onClick={() => dismiss(toast.id)}
          className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white shadow-lg transition hover:opacity-90 ${
            toast.kind === "success" ? "bg-emerald-600" : "bg-red-600"
          }`}
        >
          <span aria-hidden>{toast.kind === "success" ? "✓" : "✕"}</span>
          {toast.message}
        </button>
      ))}
    </div>
  );
}
