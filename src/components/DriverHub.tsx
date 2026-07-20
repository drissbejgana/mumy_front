import React, { useState, useEffect } from "react";
import { 
  Smartphone, MapPin, Navigation, Calendar, Clock, User, Users, Compass, CheckCircle2, 
  Share2, Link, Check, ExternalLink, MessageSquare, Send, ShieldCheck, Heart, Power, 
  Award, FileText, CheckSquare
} from "lucide-react";
import { TransportRequest, Driver, AdBanner } from "../types";
import SimulationAdBanner from "./SimulationAdBanner";
import { useMyDriver } from "../hooks/useDrivers";

interface DriverHubProps {
  requests: TransportRequest[];
  drivers: Driver[];
  onUpdateStatus: (requestId: string, status: TransportRequest['status']) => void;
  banners: AdBanner[];
  onRegisterImpression: (id: string) => void;
  onRegisterClick: (id: string) => void;
}

export default function DriverHub({
  requests,
  drivers,
  onUpdateStatus,
  banners,
  onRegisterImpression,
  onRegisterClick
}: DriverHubProps) {
  // Resolves the logged-in driver's own record via the JWT-linked account, not a hardcoded id.
  const { data: currentDriver } = useMyDriver();
  
  // Find requests assigned to this driver
  const assignedRequests = requests.filter(r => r.assignedDriverId === 'd-1');

  // Copy state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Bottom Nav states: 'trips' | 'chat' | 'profile'
  const [activeTab, setActiveTab] = useState<'trips' | 'chat' | 'profile'>('trips');

  // Online / Offline Status
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [lastSeenTime, setLastSeenTime] = useState<string>("À l'instant");

  // Document preview modal states
  const [previewDoc, setPreviewDoc] = useState<{ type: 'manifest' | 'invoice'; reqId: string } | null>(null);

  // Signature PAD states
  const [signingReqId, setSigningReqId] = useState<string | null>(null);
  const [sigName, setSigName] = useState<string>("");

  // Chat Messenger states
  const [messages, setMessages] = useState<Array<{ sender: 'driver' | 'dispatcher'; text: string; time: string }>>([
    { sender: 'dispatcher', text: "Ahmed, le client du Riad El Fenn est-il bien à bord ?", time: "12:30" },
    { sender: 'driver', text: "Oui, nous venons de quitter le Riad, en route pour Bab Doukkala.", time: "12:32" },
    { sender: 'dispatcher', text: "Parfait, pensez à faire signer le bon de livraison (POD) sur l'application lors du dépôt.", time: "12:33" }
  ]);
  const [newMessage, setNewMessage] = useState<string>("");
  const [isTyping, setIsTyping] = useState<boolean>(false);

  // Copy link helper
  const handleCopyLink = (reqId: string) => {
    const trackingUrl = `${window.location.origin}${window.location.pathname}?track=${reqId}`;
    try {
      navigator.clipboard.writeText(trackingUrl);
    } catch (err) {
      const el = document.createElement('textarea');
      el.value = trackingUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopiedId(reqId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Chat message sending & dispatcher smart auto-response simulator
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const driverMsgText = newMessage;
    const nowStr = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    
    // Add driver message
    setMessages(prev => [...prev, { sender: 'driver', text: driverMsgText, time: nowStr }]);
    setNewMessage("");

    // Simulate office typing delay & response
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      let replyText = "Bien reçu Ahmed ! Continuez ainsi. Vos coordonnées GPS s'actualisent parfaitement.";
      if (driverMsgText.toLowerCase().includes("signature") || driverMsgText.toLowerCase().includes("pod") || driverMsgText.toLowerCase().includes("signé")) {
        replyText = "Superbe, nous voyons la signature POD du client s'afficher instantanément sur notre écran de dispatch.";
      } else if (driverMsgText.toLowerCase().includes("embouteillage") || driverMsgText.toLowerCase().includes("retard") || driverMsgText.toLowerCase().includes("bloqué")) {
        replyText = "Entendu Ahmed. Nous prévenons le client de ce ralentissement routier. Merci pour l'alerte !";
      } else if (driverMsgText.toLowerCase().includes("documents") || driverMsgText.toLowerCase().includes("facture") || driverMsgText.toLowerCase().includes("manifeste")) {
        replyText = "Tous les documents officiels de voyage sont joints et modifiables en un clic sur votre écran.";
      }

      setMessages(prev => [...prev, { sender: 'dispatcher', text: replyText, time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) }]);
    }, 1800);
  };

  return (
    <div className="flex flex-col items-center justify-center py-4 relative">
      
      {/* Smartphone Device Frame Container */}
      <div className="relative mx-auto h-[645px] w-[325px] rounded-[38px] bg-slate-900 p-3.5 shadow-2xl border-4 border-slate-800">
        
        {/* Dynamic Notch */}
        <div className="absolute left-1/2 top-5 h-4 w-28 -translate-x-1/2 rounded-full bg-slate-900 z-20 flex items-center justify-center">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-800 mr-1.5"></span>
          <span className="h-1 w-3 rounded bg-slate-800"></span>
        </div>

        {/* PWA App Inside Phone Screen */}
        <div className="h-full w-full overflow-hidden rounded-[24px] bg-white text-left flex flex-col font-sans select-none relative">
          
          {/* Header Mobile Bar */}
          <div className="bg-[#008060] text-white px-4 pt-7 pb-3 shrink-0 shadow-sm relative">
            <div className="flex justify-between items-center text-[9px] font-mono opacity-80 mb-1.5">
              <span>MUMY MOBILE PWA v3.4</span>
              <span className="flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`}></span>
                {isOnline ? "CONECTÉ 5G" : "OFFLINE"}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img 
                  src={currentDriver?.avatarUrl || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80"} 
                  className="h-8.5 w-8.5 rounded-full border border-white/20 object-cover" 
                />
                <div>
                  <h4 className="text-xs font-black leading-none flex items-center gap-1">
                    {currentDriver?.name || "Ahmed El Mansouri"}
                    <Award className="h-3 w-3 text-amber-300" />
                  </h4>
                  <span className="text-[8.5px] text-emerald-100 font-semibold uppercase tracking-wider block mt-0.5">Atlas Trans • Chauffeur Officiel</span>
                </div>
              </div>

              {/* Status Sync Button */}
              <button
                type="button"
                onClick={() => {
                  setIsOnline(!isOnline);
                  setLastSeenTime(!isOnline ? "À l'instant" : new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
                }}
                className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-wider transition-colors flex items-center gap-1 ${
                  isOnline 
                    ? "bg-emerald-900/40 text-emerald-100 hover:bg-emerald-900/60" 
                    : "bg-red-900/50 text-red-100 hover:bg-red-900/70"
                }`}
              >
                <Power className="h-2.5 w-2.5" />
                {isOnline ? "En Ligne" : "Hors Ligne"}
              </button>
            </div>
          </div>

          {/* Body Mobile Scrollable Space */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 bg-[#F6F6F7] relative">
            
            {/* TRIPS TAB */}
            {activeTab === 'trips' && (
              <div className="space-y-3 animate-fade-in text-left">
                
                {/* Simulation Ad banner inside PWA for monetization check */}
                <SimulationAdBanner 
                  role="driver"
                  banners={banners}
                  onRegisterImpression={onRegisterImpression}
                  onRegisterClick={onRegisterClick}
                />

                <div className="text-[9.5px] font-black text-gray-400 uppercase tracking-widest block">Missions Assignées du Jour</div>

                {assignedRequests.length === 0 ? (
                  <div className="py-12 text-center bg-white rounded-2xl border border-gray-200 p-4 shadow-3xs">
                    <Compass className="mx-auto h-8 w-8 text-gray-300 mb-2 animate-spin-slow" />
                    <p className="text-xs text-gray-800 font-black">Aucune mission assignée.</p>
                    <p className="text-[10px] text-gray-500 mt-1 leading-snug">Aucun trajet programmé à votre nom actuellement par la console centrale.</p>
                  </div>
                ) : (
                  assignedRequests.map(req => {
                    const isCompleted = req.status === 'completed';
                    const isEnRoute = req.status === 'en_route';
                    const isPickedUp = req.status === 'picked_up';

                    return (
                      <div key={req.id} className="rounded-2xl bg-white p-3.5 border border-gray-200 shadow-3xs space-y-3">
                        
                        {/* Status Header */}
                        <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                          <span className="rounded bg-emerald-50 text-[#008060] border border-[#BBE3D1] px-1.5 py-0.5 text-[8.5px] font-black uppercase tracking-wider">
                            {req.serviceType === 'disposal' ? `Mise à Dispo (${req.daysCount}j)` : 'Trajet Simple'}
                          </span>
                          <span className={`text-[8.5px] font-black px-1.5 py-0.5 rounded-full uppercase border ${
                            isCompleted ? 'bg-emerald-50 text-[#008060] border-emerald-200' :
                            isPickedUp ? 'bg-blue-50 text-blue-800 border-blue-200' :
                            isEnRoute ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-gray-50 text-gray-600 border-gray-200'
                          }`}>
                            {req.status === 'pending' ? 'En attente' : req.status === 'accepted' ? 'Assigné' : req.status === 'en_route' ? 'En route' : req.status === 'picked_up' ? 'Récupéré' : 'Terminé'}
                          </span>
                        </div>

                        {/* Addresses */}
                        <div className="space-y-2 py-1">
                          <div className="flex items-start gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0 mt-0.5" />
                            <div>
                              <span className="text-[8px] text-gray-400 uppercase block font-black">Point de Prise</span>
                              <span className="text-xs font-bold text-gray-950 leading-tight block">{req.origin}</span>
                            </div>
                          </div>
                          <div className="flex items-start gap-1.5">
                            <Navigation className="h-3.5 w-3.5 text-[#008060] shrink-0 mt-0.5" />
                            <div>
                              <span className="text-[8px] text-gray-400 uppercase block font-black">Destination Finale</span>
                              <span className="text-xs font-bold text-gray-950 leading-tight block">{req.destination}</span>
                            </div>
                          </div>
                        </div>

                        {/* Passenger information card */}
                        <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2 rounded-xl border border-gray-150">
                          <div className="text-left">
                            <span className="text-[8px] text-gray-400 uppercase block font-bold">Client Principal</span>
                            <span className="font-bold text-gray-800 truncate block max-w-[100px]">{req.passengerName}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[8px] text-gray-400 uppercase block font-bold">Voyageurs</span>
                            <span className="font-black text-[#008060]">{req.paxCount} Passagers</span>
                          </div>
                        </div>

                        {/* Mission documents attached (DASHBOARD SYNCED) */}
                        {req.attachments && req.attachments.length > 0 ? (
                          <div className="bg-emerald-50/50 rounded-xl p-2.5 border border-emerald-150 space-y-2">
                            <span className="text-[8.5px] font-black text-[#008060] uppercase tracking-wider block flex items-center gap-1">
                              📁 Documents Officiels Reçus :
                            </span>
                            <div className="grid grid-cols-2 gap-1.5">
                              {req.attachments.map((doc, idx) => (
                                <button
                                  type="button"
                                  key={idx}
                                  onClick={() => setPreviewDoc({ type: doc.type, reqId: req.id })}
                                  className="p-1.5 bg-white border border-emerald-200 text-slate-800 rounded-lg text-[9px] font-bold flex items-center gap-1 hover:bg-emerald-100/50 justify-center cursor-pointer transition-colors"
                                >
                                  {doc.type === 'manifest' ? '📄 Manifeste' : '🧾 Facture'}
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <p className="text-[9.5px] text-gray-400 italic">Aucun document administratif n'est joint à ce trajet.</p>
                        )}

                        {/* Customer Signature Proof of Delivery (POD) Box */}
                        {req.podSignature ? (
                          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 flex items-center justify-between text-[11px] font-bold text-[#008060] animate-fade-in">
                            <div className="flex items-center gap-1">
                              <ShieldCheck className="h-4 w-4 text-[#008060]" />
                              <span>Signature POD Enregistrée</span>
                            </div>
                            <span className="font-mono text-[9px] text-[#008060] italic bg-white px-2 py-0.5 rounded border border-[#BBE3D1]">
                              "{req.podSignature}"
                            </span>
                          </div>
                        ) : (
                          (isPickedUp || isCompleted) && (
                            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-2.5 text-left space-y-1.5">
                              <span className="text-[9px] font-black text-amber-800 uppercase tracking-wider flex items-center gap-1">
                                ✍️ Signature Client Requise (POD)
                              </span>
                              <p className="text-[9.5px] text-gray-500">Faites signer le client ci-dessous pour valider la prise en charge et le dépôt.</p>
                              
                              <div className="flex gap-1.5">
                                <input
                                  type="text"
                                  placeholder="Entrez le nom ou signature"
                                  value={signingReqId === req.id ? sigName : ""}
                                  onChange={(e) => {
                                    setSigningReqId(req.id);
                                    setSigName(e.target.value);
                                  }}
                                  className="bg-white border rounded-lg px-2 py-1 text-xs text-gray-800 flex-1 focus:outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!sigName.trim()) {
                                      alert("Veuillez saisir le nom ou les initiales du client pour signer.");
                                      return;
                                    }
                                    req.podSignature = sigName;
                                    setSigningReqId(null);
                                    setSigName("");
                                    alert("Signature client (POD) enregistrée et envoyée au bureau de transport !");
                                  }}
                                  className="bg-[#008060] text-white hover:bg-[#006e52] px-2.5 py-1 text-[10px] font-black rounded-lg transition-all"
                                >
                                  Valider POD
                                </button>
                              </div>
                            </div>
                          )
                        )}

                        {/* Interactive tracking link sharing */}
                        <div className="bg-slate-50 border border-gray-150 rounded-xl p-2 flex items-center justify-between text-[11px]">
                          <span className="text-gray-500 font-semibold flex items-center gap-1">
                            <Share2 className="h-3 w-3 text-slate-400" /> Lien Client
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyLink(req.id)}
                            className="bg-white hover:bg-gray-100 text-[#008060] border border-gray-200 rounded px-1.5 py-0.5 text-[8.5px] font-black flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            {copiedId === req.id ? "Copié !" : "Copier"}
                          </button>
                        </div>

                        {/* PWA INTERACTIVE STATUS ACTION BUTTONS */}
                        {!isCompleted && (
                          <div className="pt-2 border-t border-gray-100 flex flex-col gap-1.5">
                            <button
                              type="button"
                              onClick={() => onUpdateStatus(req.id, 'en_route')}
                              className={`w-full rounded-xl py-2 text-xs font-black transition flex items-center justify-center gap-1.5 border ${
                                isEnRoute 
                                  ? "bg-amber-50 text-amber-900 border-amber-300" 
                                  : "bg-white text-gray-700 border-gray-200 hover:bg-[#F6F6F7] cursor-pointer"
                              }`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full bg-amber-500 ${isEnRoute && 'animate-ping'}`}></span>
                              En Route vers client
                            </button>
                            
                            <button
                              type="button"
                              onClick={() => onUpdateStatus(req.id, 'picked_up')}
                              disabled={req.status === 'accepted'}
                              className={`w-full rounded-xl py-2 text-xs font-black transition flex items-center justify-center gap-1.5 border ${
                                isPickedUp 
                                  ? "bg-blue-50 text-blue-900 border-blue-300" 
                                  : "bg-white text-gray-700 border-gray-200 hover:bg-[#F6F6F7] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                              }`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full bg-blue-500 ${isPickedUp && 'animate-ping'}`}></span>
                              Client Récupéré (À bord)
                            </button>
                            
                            <button
                              type="button"
                              onClick={() => onUpdateStatus(req.id, 'completed')}
                              disabled={req.status !== 'picked_up'}
                              className={`w-full rounded-xl py-2.5 text-xs font-black transition flex items-center justify-center gap-1.5 border ${
                                req.status === 'picked_up'
                                  ? "bg-[#008060] text-white border-[#008060] hover:bg-[#006e52] shadow-sm cursor-pointer" 
                                  : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                              }`}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Mission Terminée (Déposé)
                            </button>
                          </div>
                        )}

                        {isCompleted && (
                          <div className="rounded-xl bg-[#EBF5F1] p-2.5 border border-[#BBE3D1] text-center text-[10px] font-black text-[#008060] flex items-center justify-center gap-1">
                            <CheckCircle2 className="h-4 w-4 text-[#008060]" />
                            Mission Accomplie • Félicitations !
                          </div>
                        )}

                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* CHAT TAB */}
            {activeTab === 'chat' && (
              <div className="flex flex-col h-full animate-fade-in text-left">
                
                {/* Chat feed frame */}
                <div className="bg-white rounded-2xl border border-gray-200 p-3 flex flex-col h-[400px] shadow-3xs">
                  
                  {/* Chat header */}
                  <div className="flex items-center gap-1.5 border-b border-gray-100 pb-2 mb-2 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#008060] animate-pulse"></span>
                    <strong className="text-xs text-gray-800">Messagerie Dispatch Centrale</strong>
                  </div>

                  {/* Bubble chain */}
                  <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                    {messages.map((m, idx) => (
                      <div 
                        key={idx} 
                        className={`flex flex-col max-w-[85%] ${
                          m.sender === 'driver' ? 'ml-auto items-end' : 'mr-auto items-start'
                        }`}
                      >
                        <div className={`p-2.5 rounded-2xl text-[11px] leading-snug font-medium ${
                          m.sender === 'driver' 
                            ? 'bg-[#008060] text-white rounded-tr-none' 
                            : 'bg-gray-100 text-gray-800 rounded-tl-none border border-gray-200'
                        }`}>
                          {m.text}
                        </div>
                        <span className="text-[8px] text-gray-400 mt-0.5 font-bold">{m.time}</span>
                      </div>
                    ))}

                    {isTyping && (
                      <div className="flex flex-col items-start max-w-[80%]">
                        <div className="bg-gray-100 border border-gray-150 p-2 rounded-2xl rounded-tl-none flex items-center gap-1">
                          <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></span>
                          <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                          <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                        </div>
                        <span className="text-[7.5px] text-gray-400 mt-1 font-bold">Le bureau écrit...</span>
                      </div>
                    )}
                  </div>

                  {/* Input form */}
                  <form onSubmit={handleSendMessage} className="mt-2 pt-2 border-t border-gray-100 flex gap-1.5 shrink-0">
                    <input
                      type="text"
                      placeholder="Tapez votre message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-850 flex-1 focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="bg-[#008060] hover:bg-[#006e52] text-white p-2 rounded-lg transition-colors cursor-pointer"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* PROFILE TAB */}
            {activeTab === 'profile' && (
              <div className="space-y-4 animate-fade-in text-left">
                
                {/* Driver profile summary card */}
                <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-3xs space-y-3">
                  <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                    <div className="relative">
                      <img 
                        src={currentDriver?.avatarUrl} 
                        className="w-11 h-11 rounded-full object-cover border border-[#E1E3E5]" 
                      />
                      <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${isOnline ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                    </div>
                    <div>
                      <strong className="text-sm text-gray-900 block font-black">{currentDriver?.name}</strong>
                      <span className="text-[10px] text-gray-500 font-bold block mt-0.5">Matricule: CH-1049</span>
                    </div>
                  </div>

                  {/* Statistics grid */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="bg-slate-50 border border-gray-150 p-2 rounded-xl text-center">
                      <span className="text-[8px] text-gray-400 uppercase block font-black">Note Chauffeur</span>
                      <strong className="text-sm font-black text-amber-500">★ {currentDriver?.rating || 4.9} / 5</strong>
                    </div>
                    <div className="bg-slate-50 border border-gray-150 p-2 rounded-xl text-center">
                      <span className="text-[8px] text-gray-400 uppercase block font-black">Statut Dispo</span>
                      <strong className="text-xs font-black text-emerald-700 uppercase">Actif ✓</strong>
                    </div>
                  </div>

                  <div className="space-y-2.5 pt-1 text-xs">
                    <div className="flex justify-between items-center text-gray-600">
                      <span>Téléphone professionnel :</span>
                      <strong className="text-gray-900">{currentDriver?.phone || "+212 6 12 34 56 78"}</strong>
                    </div>
                    <div className="flex justify-between items-center text-gray-600">
                      <span>Catégorie Permis :</span>
                      <strong className="text-gray-900 bg-gray-100 px-2 py-0.5 rounded border text-[10px] font-bold">Permis D (Autocar)</strong>
                    </div>
                    <div className="flex justify-between items-center text-gray-600">
                      <span>Visite Médicale :</span>
                      <strong className="text-gray-900 text-[11px]">Expire le 12/09/2026</strong>
                    </div>
                    <div className="flex justify-between items-center text-gray-600">
                      <span>Dossier CNSS :</span>
                      <strong className="text-gray-900 text-[11px] font-mono">18304928-1</strong>
                    </div>
                  </div>
                </div>

                {/* Company policy block */}
                <div className="bg-slate-900 text-slate-300 rounded-2xl p-4 border border-slate-800 space-y-2">
                  <span className="text-[8px] text-slate-500 uppercase tracking-widest font-black block">📢 CHARTE SÉCURITÉ ROUTIÈRE</span>
                  <p className="text-[10px] leading-relaxed text-slate-400">
                    Chaque chauffeur Mumy s'engage à respecter les limitations de vitesse, le repos légal et à inspecter quotidiennement la pression des pneus et niveaux d'huile.
                  </p>
                  <div className="text-[9px] text-emerald-400 font-bold">
                    ✓ Assurance Responsabilité Civile Professionnelle active.
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* DOCUMENT PREVIEW DIALOG MODAL SIMULATION */}
          {previewDoc && (() => {
            const req = assignedRequests.find(r => r.id === previewDoc.reqId);
            if (!req) return null;
            return (
              <div className="absolute inset-0 bg-black/75 z-40 p-4 flex flex-col justify-center animate-fade-in text-left">
                <div className="bg-white rounded-2xl p-4 space-y-3.5 shadow-2xl">
                  <div className="flex justify-between items-center border-b border-gray-150 pb-2">
                    <div className="flex items-center gap-1.5">
                      <FileText className="h-4.5 w-4.5 text-[#008060]" />
                      <strong className="text-xs font-black text-gray-900 uppercase">
                        {previewDoc.type === 'manifest' ? "Feuille de Route officielle" : "Facture Transport"}
                      </strong>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setPreviewDoc(null)} 
                      className="text-gray-400 hover:text-gray-600 font-black text-lg p-1.5"
                    >
                      ×
                    </button>
                  </div>

                  <div className="space-y-2 font-mono text-[9.5px] bg-slate-50 p-3 rounded-xl border border-gray-200">
                    <p className="border-b border-gray-200 pb-1 text-slate-400 text-[8px] font-black tracking-widest">MUMY TRANSPORT LOGISTICS MOROCCO</p>
                    <p><strong className="text-gray-700">Course Réf :</strong> {req.id}</p>
                    <p><strong className="text-gray-700">Chauffeur :</strong> Ahmed El Mansouri</p>
                    <p><strong className="text-gray-700">Départ :</strong> {req.origin}</p>
                    <p><strong className="text-gray-700">Destination :</strong> {req.destination}</p>
                    <p><strong className="text-gray-700">Passagers :</strong> {req.paxCount} pax ({req.passengerName})</p>
                    {previewDoc.type === 'invoice' && (
                      <p className="text-emerald-700 font-bold border-t border-dashed border-gray-300 pt-1 mt-1">
                        TARIF TOTAL : {req.priceDHS || 450} DHS (Règlement b2b)
                      </p>
                    )}
                    <p className="text-slate-400 text-[8.5px] italic pt-1 text-center font-sans">
                      Document signé numériquement par Mumy SAS. Conforme au code des transports marocain.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setPreviewDoc(null)}
                    className="w-full bg-[#008060] hover:bg-[#006e52] text-white py-2 rounded-xl text-xs font-black transition-colors"
                  >
                    Fermer le Document
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Bottom Bar Simulator / Navigation Tabs */}
          <div className="h-14 border-t border-[#E1E3E5] bg-white flex items-center justify-around shrink-0 px-2 shadow-inner z-10">
            <button
              type="button"
              onClick={() => setActiveTab('trips')}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
                activeTab === 'trips' ? 'text-[#008060]' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <MapPin className="h-4.5 w-4.5" />
              <span className="text-[8.5px] font-black mt-1 uppercase tracking-wider">Courses</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('chat')}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors relative ${
                activeTab === 'chat' ? 'text-[#008060]' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <MessageSquare className="h-4.5 w-4.5" />
              <span className="text-[8.5px] font-black mt-1 uppercase tracking-wider">Chat</span>
              <span className="absolute top-0.5 right-6 w-2 h-2 rounded-full bg-red-500 border border-white"></span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
                activeTab === 'profile' ? 'text-[#008060]' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <User className="h-4.5 w-4.5" />
              <span className="text-[8.5px] font-black mt-1 uppercase tracking-wider">Profil</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
