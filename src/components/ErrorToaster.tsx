import React from "react";
import { AlertTriangle, X } from "lucide-react";
import { subscribeToApiErrors } from "../lib/errorBus";

interface ToastEntry {
  id: number;
  message: string;
}

// Every mutation in the app used to fail silently: the form cleared, an optimistic
// "enregistré avec succès" banner appeared, and the rejected request only showed up in the
// console. This subscribes to the React Query mutation cache (see main.tsx) and puts the
// server's own French error message on screen instead.
export default function ErrorToaster() {
  const [toasts, setToasts] = React.useState<ToastEntry[]>([]);

  React.useEffect(() => {
    let nextId = 1;
    return subscribeToApiErrors((message) => {
      const id = nextId++;
      setToasts((prev) => [...prev, { id, message }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 8000);
    });
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-[9999] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 shadow-lg animate-fade-in"
        >
          <AlertTriangle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
          <div className="flex-1 text-left">
            <p className="text-[11px] font-black uppercase tracking-wider text-red-700">
              L'enregistrement a échoué
            </p>
            <p className="mt-0.5 text-xs font-medium leading-relaxed text-red-900">{toast.message}</p>
          </div>
          <button
            type="button"
            onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
            className="shrink-0 rounded p-0.5 text-red-400 transition hover:bg-red-100 hover:text-red-700 cursor-pointer"
            aria-label="Fermer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
