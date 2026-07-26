import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {MutationCache, QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {GoogleOAuthProvider} from '@react-oauth/google';
import App from './App.tsx';
import './index.css';
import { LanguageProvider } from './lib/LanguageContext.tsx';
import { AuthProvider } from './lib/AuthContext.tsx';
import ErrorToaster from './components/ErrorToaster.tsx';
import { reportApiError } from './lib/errorBus.ts';

const queryClient = new QueryClient({
  // Global safety net: no mutation may fail silently. Individual mutations can still add
  // their own onError; this only guarantees the user always sees that a save was rejected.
  mutationCache: new MutationCache({
    onError: (error) => reportApiError(error),
  }),
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
});

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

function Root() {
  const app = (
    <AuthProvider>
      <LanguageProvider>
        <App />
        <ErrorToaster />
      </LanguageProvider>
    </AuthProvider>
  );

  // Only wraps with the Google provider when configured, so "Sign in with Google" simply
  // doesn't render rather than erroring when the app is run without a Google Client ID.
  return googleClientId ? (
    <GoogleOAuthProvider clientId={googleClientId}>{app}</GoogleOAuthProvider>
  ) : (
    app
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <Root />
    </QueryClientProvider>
  </StrictMode>,
);
