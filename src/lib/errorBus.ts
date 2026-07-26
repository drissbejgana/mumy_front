// Minimal pub/sub bridging React Query's MutationCache (configured outside the React tree
// in main.tsx) to the ErrorToaster component that renders inside it.

type ApiErrorListener = (message: string) => void;

const listeners = new Set<ApiErrorListener>();

export function subscribeToApiErrors(listener: ApiErrorListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function reportApiError(error: unknown): void {
  const message =
    error instanceof Error && error.message
      ? error.message
      : "Une erreur inattendue est survenue. Vérifiez votre connexion et réessayez.";
  listeners.forEach((listener) => listener(message));
}
