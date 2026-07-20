import React, { useState, useEffect, useRef } from "react";
import {
  MessageSquare, X, Send, UserCheck, Sparkles, Loader2,
  RefreshCw, Bot, ArrowRight, CornerDownRight, ShieldCheck, HeartHandshake
} from "lucide-react";
import { User, SupportSession, SupportMessage } from "../types";
import { apiFetch } from "../lib/apiClient";

interface SupportChatFloatingProps {
  currentUser: User;
}

export default function SupportChatFloating({ currentUser }: SupportChatFloatingProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [session, setSession] = useState<SupportSession | null>(null);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Suggestions that users can click to chat quickly
  const suggestions = currentUser.role === "transporter" ? [
    { label: "Justifier un retard", text: "J'aimerais contester un retard ou justifier un incident de service sur une course." },
    { label: "Comment marche l'algorithme ?", text: "Comment est calculé mon score de fiabilité ou l'indice de confiance ?" },
    { label: "Parler à un conseiller humain", text: "Je souhaite parler directement à un conseiller de l'équipe support." }
  ] : [
    { label: "Réduction retour à vide", text: "Comment obtenir la réduction automatique de 50% sur les retours à vide ?" },
    { label: "Sécurité & Chauffeurs", text: "Quelle est la politique de conformité des véhicules et de vérification des chauffeurs ?" },
    { label: "Parler à un conseiller humain", text: "Je souhaite parler directement à un conseiller de l'équipe support." }
  ];

  // Initialize or fetch support session (the backend derives the owner from the JWT)
  const fetchSession = async (silent = false) => {
    if (!currentUser) return;
    if (!silent) setLoading(true);
    try {
      const data = await apiFetch<SupportSession>("/api/support/session", { method: "POST" });
      setSession(data);
    } catch (error) {
      console.error("Error fetching support session:", error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Poll for messages when the chat is open
  useEffect(() => {
    if (isOpen) {
      fetchSession();
      const interval = setInterval(() => {
        fetchSession(true);
      }, 3000); // Poll every 3 seconds
      return () => clearInterval(interval);
    }
  }, [isOpen, currentUser]);

  // Scroll to bottom whenever messages list changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session?.messages]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || sending || !session) return;

    const messageText = textToSend.trim();
    setSending(true);

    try {
      // Optimistic update
      const tempId = `temp-${Date.now()}`;
      const optimisticMsg: SupportMessage = {
        id: tempId,
        senderId: currentUser.id,
        senderName: currentUser.companyName || currentUser.name,
        senderRole: currentUser.role as "transporter" | "client",
        message: messageText
      };

      setSession(prev => prev ? {
        ...prev,
        messages: [...prev.messages, optimisticMsg]
      } : null);

      const data = await apiFetch<SupportSession>("/api/support/message", {
        method: "POST",
        body: JSON.stringify({ message: messageText })
      });
      setSession(data);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    handleSendMessage(inputMessage);
    setInputMessage("");
  };

  const handleRequestHuman = async () => {
    if (sending || !session) return;
    setSending(true);
    try {
      const data = await apiFetch<SupportSession>("/api/support/message", {
        method: "POST",
        body: JSON.stringify({ requestHuman: true, message: "Demande de conseiller humain" })
      });
      setSession(data);
    } catch (error) {
      console.error("Error requesting human agent:", error);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[9999] font-sans antialiased max-w-[calc(100vw-32px)]">
      {/* Premium Ambient Pulsing Circle Background when Closed */}
      {!isOpen && (
        <div className="absolute inset-0 bg-amber-400/20 blur-md rounded-full -z-10 animate-pulse scale-105"></div>
      )}

      {/* Launcher Button */}
      {!isOpen && (
        <button
          id="btn_open_chat"
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-3 bg-gradient-to-r from-[#1E293B] via-[#0F172A] to-[#1E293B] hover:from-[#334155] hover:to-[#1E293B] text-white p-4 rounded-full shadow-[0_10px_25px_-5px_rgba(0,0,0,0.4)] border border-amber-500/20 hover:border-amber-500/40 hover:scale-105 active:scale-95 transition-all duration-300 relative cursor-pointer group"
        >
          {/* Active indicator */}
          <span className="absolute top-0 right-0 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500 border border-white"></span>
          </span>
          
          <div className="relative">
            <MessageSquare className="h-5 w-5 text-amber-400 group-hover:rotate-12 transition-transform duration-300" />
          </div>
          
          <span className="text-xs uppercase tracking-widest font-extrabold pr-1">
            Support Mumy
          </span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="w-[calc(100vw-32px)] sm:w-[380px] h-[500px] sm:h-[560px] bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.25)] border border-[#E1E3E5] flex flex-col overflow-hidden animate-fade-in">
          
          {/* Executive Dark Header */}
          <div className="bg-[#111215] p-4 text-white flex justify-between items-center shrink-0 border-b border-amber-500/10">
            <div className="flex items-center gap-3">
              {/* Luxury Brand Avatar */}
              <div className="relative">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center font-black text-sm text-black shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                  M
                </div>
                <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-emerald-500 rounded-full border-2 border-[#111215] shadow-xs"></div>
              </div>
              
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-black uppercase tracking-wider text-amber-400">Concierge Mumy</h4>
                  <span className="text-[8px] bg-amber-400/10 text-amber-400 font-extrabold px-1 py-0.5 rounded uppercase tracking-widest">PRO</span>
                </div>
                <p className="text-[10px] text-gray-400 flex items-center gap-1 font-semibold mt-0.5">
                  {session?.status === "ai" ? (
                    <>
                      <Sparkles className="h-3 w-3 text-amber-400 animate-spin" />
                      Intelligence Artificielle Active
                    </>
                  ) : session?.status === "pending_human" ? (
                    <span className="text-amber-400 animate-pulse flex items-center gap-1">
                      <span className="inline-block h-1.5 w-1.5 bg-amber-400 rounded-full animate-ping"></span>
                      Recherche conseiller support...
                    </span>
                  ) : session?.status === "chatting_human" ? (
                    <span className="text-emerald-400 flex items-center gap-1 font-bold">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Conseiller connecté
                    </span>
                  ) : (
                    "Session résolue"
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => fetchSession()}
                className="p-1.5 hover:bg-gray-800 rounded-lg transition cursor-pointer text-gray-400 hover:text-white"
                title="Actualiser la conversation"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
              <button
                id="btn_close_chat"
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-gray-800 rounded-lg transition cursor-pointer text-gray-400 hover:text-white"
                title="Fermer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Intelligent AI Co-Pilot Banner */}
          {session && session.status === "ai" && (
            <div className="bg-gradient-to-r from-amber-500/5 via-indigo-500/5 to-amber-500/5 border-b border-amber-100 p-3 text-[10px] flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2 text-slate-800 font-semibold">
                <div className="p-1 rounded bg-amber-400/10">
                  <Bot className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                </div>
                <span>Besoin d'un agent humain ?</span>
              </div>
              <button
                type="button"
                onClick={handleRequestHuman}
                className="bg-amber-500 hover:bg-amber-600 text-black font-black px-2.5 py-1 rounded-md text-[9px] uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-xs shadow-amber-400/20 active:scale-95 flex items-center gap-1"
              >
                <span>Demander</span>
                <ArrowRight className="h-2.5 w-2.5" />
              </button>
            </div>
          )}

          {/* Pending Human Banner */}
          {session && (session.status === "pending_human" || session.status === "chatting_human") && (
            <div className="bg-emerald-50 border-b border-emerald-200 p-3 text-[10px] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 text-emerald-950 font-semibold">
                <div className="p-1 rounded bg-emerald-100">
                  <HeartHandshake className="h-3.5 w-3.5 text-[#008060] shrink-0 animate-bounce" />
                </div>
                <span>Canal direct vers le support Mumy.</span>
              </div>
              <span className="text-[8px] bg-emerald-100 text-[#008060] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                {session.status === "pending_human" ? "En attente" : "Connecté"}
              </span>
            </div>
          )}

          {/* Messages Body Container */}
          <div className="flex-1 p-4 overflow-y-auto bg-[#F8FAFC] space-y-4 min-h-0 flex flex-col">
            {loading ? (
              <div className="flex flex-col items-center justify-center my-auto gap-3">
                <div className="p-3 bg-amber-400/10 rounded-full animate-bounce">
                  <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
                </div>
                <span className="text-[10px] text-gray-500 font-extrabold uppercase tracking-widest">Reconnexion sécurisée...</span>
              </div>
            ) : (
              <>
                {/* Introduction Note */}
                <div className="text-center p-2 mb-1 bg-white rounded-xl border border-gray-150 shadow-3xs max-w-sm mx-auto">
                  <span className="text-[9px] text-[#6D7175] font-semibold">
                    Support premium réservé aux partenaires agréés Mumy.
                  </span>
                </div>

                {/* Message list */}
                <div className="space-y-4 flex-1">
                  {session?.messages.map((msg) => {
                    const isMe = msg.senderId === currentUser.id;
                    const isSystem = msg.senderId === "system";
                    
                    if (isSystem) {
                      return (
                        <div key={msg.id} className="flex justify-center my-2">
                          <span className="bg-amber-50 border border-amber-200/60 text-amber-900 text-[9px] font-bold px-3 py-1 rounded-lg uppercase tracking-wider text-center max-w-[90%] shadow-3xs">
                            {msg.message}
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"} animate-fade-in`}>
                        <span className="text-[9px] text-gray-400 px-1.5 font-bold mb-1">
                          {msg.senderName}{msg.createdAt ? ` • ${new Date(msg.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}` : ""}
                        </span>
                        
                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed break-words shadow-sm border ${
                            isMe
                              ? "bg-[#111215] text-white border-[#111215] rounded-tr-none"
                              : msg.senderId === "gemini"
                              ? "bg-amber-50/70 text-slate-800 border-amber-100 shadow-amber-500/5 rounded-tl-none font-medium"
                              : "bg-white text-slate-800 border-slate-200 rounded-tl-none font-medium"
                          }`}
                        >
                          {msg.message}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick suggestions chips in AI mode to improve aesthetic appeal and quick clicks */}
          {session && session.status === "ai" && !loading && (
            <div className="bg-[#F8FAFC] border-t border-[#E1E3E5]/60 px-4 py-2 shrink-0">
              <div className="flex items-center gap-1.5 mb-1.5">
                <CornerDownRight className="h-3 w-3 text-amber-500" />
                <span className="text-[9px] text-gray-400 uppercase font-black tracking-widest">Suggestions rapides :</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {suggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(suggestion.text)}
                    disabled={sending}
                    className="text-[10px] bg-white hover:bg-amber-50 hover:text-amber-900 border border-slate-200 hover:border-amber-300 text-slate-600 px-2.5 py-1 rounded-lg transition duration-200 cursor-pointer font-semibold shadow-3xs hover:shadow-2xs active:scale-95 disabled:opacity-50"
                  >
                    {suggestion.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Premium Message Input Footer */}
          <form onSubmit={handleFormSubmit} className="p-3 border-t border-[#E1E3E5] bg-white flex gap-2 shrink-0 items-center">
            <div className="relative flex-1">
              <input
                type="text"
                id="support_chat_input"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={sending ? "Réponse en cours..." : "Posez une question à l'assistant..."}
                disabled={sending}
                className="w-full border border-slate-200 rounded-xl pl-3 pr-8 py-2.5 text-xs focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/20 bg-slate-50 focus:bg-white transition duration-200 placeholder-slate-400 text-[#1A1A1A] font-semibold"
              />
              <div className="absolute right-2.5 top-2.5 flex items-center justify-center">
                {sending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-500" />
                ) : (
                  <Bot className="h-3.5 w-3.5 text-amber-400" />
                )}
              </div>
            </div>
            
            <button
              type="submit"
              disabled={sending || !inputMessage.trim()}
              className="bg-[#111215] hover:bg-[#27272a] disabled:opacity-40 disabled:hover:bg-[#111215] text-white p-2.5 rounded-xl transition duration-200 shrink-0 cursor-pointer flex items-center justify-center shadow-md active:scale-95"
              title="Envoyer"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
