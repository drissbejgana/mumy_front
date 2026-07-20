import React, { useState } from "react";
import { Loader2, Lock, Mail } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../lib/AuthContext";

const googleEnabled = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

export default function LoginScreen() {
  const { login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de la connexion.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: { credential?: string }) => {
    if (!credentialResponse.credential) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await loginWithGoogle(credentialResponse.credential);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de la connexion Google.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F6F7] flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <img
            src="https://www.mumy.app/logo.png"
            alt="Mumy"
            referrerPolicy="no-referrer"
            className="h-10 w-auto object-contain mx-auto"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
          <p className="mt-2 text-xs text-[#6D7175]">Écosystème B2B de transport touristique au Maroc</p>
        </div>

        <div className="bg-white border border-[#E1E3E5] rounded-xl shadow-xs p-6 space-y-4">
          <h1 className="text-sm font-bold text-[#1A1A1A] mb-1">Connexion</h1>

          {googleEnabled && (
            <>
              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError("Échec de la connexion Google.")}
                  locale="fr"
                />
              </div>
              <div className="flex items-center gap-3 text-[10px] text-[#6D7175] uppercase font-semibold tracking-wider">
                <div className="h-px flex-1 bg-[#E1E3E5]" />
                ou
                <div className="h-px flex-1 bg-[#E1E3E5]" />
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#1A1A1A] mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#6D7175]" />
                <input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vous@exemple.ma"
                  className="w-full rounded-lg border border-[#E1E3E5] py-2 pl-9 pr-3 text-sm text-[#1A1A1A] outline-none focus:border-[#008060] focus:ring-1 focus:ring-[#008060]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1A1A1A] mb-1.5">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#6D7175]" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-[#E1E3E5] py-2 pl-9 pr-3 text-sm text-[#1A1A1A] outline-none focus:border-[#008060] focus:ring-1 focus:ring-[#008060]"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">{error}</div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#008060] py-2.5 text-sm font-semibold text-white transition hover:bg-[#006e52] disabled:opacity-60"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Se connecter
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
