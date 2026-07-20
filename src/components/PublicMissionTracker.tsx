import React, { useState, useEffect } from "react";
import {
  MapPin, Navigation, User, Users, Calendar, Clock, Phone, ArrowLeft,
  CheckCircle2, Compass, ShieldAlert, Sparkles, AlertCircle, Info, ExternalLink, RefreshCw, Loader2
} from "lucide-react";
import { PublicTrackingView } from "../types";
import { apiFetch } from "../lib/apiClient";
import SimulationAdBanner from "./SimulationAdBanner";

interface PublicMissionTrackerProps {
  requestId: string;
  onClose: () => void;
}

export default function PublicMissionTracker({ requestId, onClose }: PublicMissionTrackerProps) {
  const [data, setData] = useState<PublicTrackingView | null>(null);
  const [loading, setLoading] = useState(true);
  const [pulse, setPulse] = useState(true);

  // This page is reached unauthenticated (no JWT), so it fetches its own redacted
  // view instead of receiving the full app state as props.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiFetch<PublicTrackingView>(`/api/track/${requestId}`)
      .then((d) => { if (!cancelled) setData(d); })
      .catch(() => { if (!cancelled) setData(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [requestId]);

  // Auto pulsing interval to simulate live radar or tracking activity
  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(p => !p);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  const handleRegisterImpression = (id: string) => {
    apiFetch(`/api/banners/${id}/impression`, { method: "POST" }).catch(() => {});
  };
  const handleRegisterClick = (id: string) => {
    apiFetch(`/api/banners/${id}/click`, { method: "POST" }).catch(() => {});
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-[#008060]" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 border border-red-150 text-center space-y-4">
          <div className="mx-auto h-12 w-12 bg-red-50 rounded-full flex items-center justify-center text-red-500">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Lien de suivi invalide ou expiré</h2>
          <p className="text-xs text-gray-500">
            La mission associée à cet identifiant est introuvable. Veuillez vérifier le lien de partage fourni par le chauffeur ou votre collaborateur.
          </p>
          <button
            onClick={onClose}
            className="w-full inline-flex justify-center items-center gap-2 px-4 py-2 bg-[#008060] text-white rounded-lg text-xs font-bold hover:bg-[#006e52] transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Retourner au portail Mumy
          </button>
        </div>
      </div>
    );
  }

  const { request, banners } = data;

  // Default to Ahmed and Mercedes Class V if no driver/vehicle assigned yet
  const driver = data.driver || {
    name: "Ahmed El Mansouri",
    phone: "+212 6 61 23 45 67",
    rating: 4.9,
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80"
  };

  const vehicle = data.vehicle || {
    brand: "Mercedes-Benz",
    model: "Classe V Luxe",
    plate: "44-A-12345",
    fuelType: "Gazole"
  };

  // Compute states for steps
  const isEnRoute = ['en_route', 'picked_up', 'completed'].includes(request.status);
  const isPickedUp = ['picked_up', 'completed'].includes(request.status);
  const isCompleted = request.status === 'completed';

  return (
    <div className="min-h-screen bg-[#F6F6F7] text-[#1A1A1A] font-sans pb-12">
      {/* Visual Header Accent Bar */}
      <div className="bg-[#008060] text-white py-4 px-6 sticky top-0 z-50 shadow-md">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={onClose}
              className="hover:bg-emerald-700/50 p-1.5 rounded-full transition"
              title="Retourner au portail"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-100 flex items-center gap-1">
                <span className={`h-1.5 w-1.5 rounded-full bg-red-500 ${pulse && 'animate-ping'}`}></span>
                Suivi de Mission en Direct
              </span>
              <h1 className="text-sm font-bold">MUMY APP • Service de Luxe B2B</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-[10px] font-mono">
            <span className="text-emerald-200">ID:</span>
            <span>{request.id}</span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 mt-6 space-y-6">
        {/* Simulation Advertisement Banner */}
        <SimulationAdBanner
          role="public"
          banners={banners}
          onRegisterImpression={handleRegisterImpression}
          onRegisterClick={handleRegisterClick}
        />
        
        {/* Main Status Hero Card */}
        <div className="bg-white rounded-2xl border border-[#E1E3E5] shadow-xs overflow-hidden">
          <div className="bg-[#1A1A1A] text-white p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-bold">État actuel du service</span>
              <div className="flex items-center gap-2 mt-1">
                <h2 className="text-lg font-bold">
                  {request.status === 'pending' && "En attente de validation"}
                  {request.status === 'accepted' && "Mission Assignée"}
                  {request.status === 'en_route' && "Chauffeur en Approche"}
                  {request.status === 'picked_up' && "Passagers à Bord (En Course)"}
                  {request.status === 'completed' && "Service Terminé avec Succès"}
                </h2>
                <Sparkles className="h-4.5 w-4.5 text-amber-400 shrink-0" />
              </div>
            </div>
            
            {/* Status Indicator circle badge */}
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
              isCompleted ? 'bg-[#EBF5F1] text-[#008060] border-[#BBE3D1]' :
              isPickedUp ? 'bg-blue-50 text-blue-800 border-blue-200' :
              isEnRoute ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-gray-50 text-gray-600 border-[#E1E3E5]'
            }`}>
              {request.status === 'pending' ? 'En attente' : request.status === 'accepted' ? 'Validé' : request.status === 'en_route' ? 'En approche' : request.status === 'picked_up' ? 'À bord' : 'Terminé'}
            </span>
          </div>

          <div className="p-6 space-y-6">
            {/* Visual Tracking Progress Timeline */}
            <div className="relative">
              {/* Progress Line */}
              <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-gray-200"></div>
              
              {/* Colored filled progress line */}
              <div 
                className="absolute left-[15px] top-4 w-0.5 bg-[#008060] transition-all duration-500"
                style={{
                  height: isCompleted ? '100%' : isPickedUp ? '66%' : isEnRoute ? '33%' : '0%'
                }}
              ></div>

              <div className="space-y-6 relative">
                {/* Step 1: Assigned */}
                <div className="flex gap-4 items-start">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 border z-10 transition ${
                    isEnRoute ? 'bg-[#008060] border-[#008060] text-white' : 'bg-white border-[#008060] text-[#008060] ring-4 ring-emerald-50'
                  }`}>
                    <CheckCircle2 className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-gray-900">1. Mission Validée & Planifiée</h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">Le prestataire Mumy a validé le trajet et assigné un chauffeur certifié.</p>
                  </div>
                </div>

                {/* Step 2: En Route */}
                <div className="flex gap-4 items-start">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 border z-10 transition ${
                    isPickedUp ? 'bg-[#008060] border-[#008060] text-white' : 
                    isEnRoute ? 'bg-amber-50 border-amber-500 text-amber-700 ring-4 ring-amber-100' : 'bg-white border-gray-300 text-gray-400'
                  }`}>
                    {isPickedUp ? <CheckCircle2 className="h-4.5 w-4.5" /> : <Compass className={`h-4.5 w-4.5 ${isEnRoute && 'animate-spin-slow'}`} />}
                  </div>
                  <div>
                    <h3 className={`text-xs font-bold ${isEnRoute ? 'text-gray-900' : 'text-gray-400'}`}>2. Chauffeur en approche</h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      {isEnRoute 
                        ? "Le véhicule se dirige actuellement vers le lieu de prise en charge." 
                        : "Le chauffeur débutera l'approche peu avant l'heure de réservation prévue."}
                    </p>
                  </div>
                </div>

                {/* Step 3: Picked Up */}
                <div className="flex gap-4 items-start">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 border z-10 transition ${
                    isCompleted ? 'bg-[#008060] border-[#008060] text-white' : 
                    isPickedUp ? 'bg-blue-50 border-blue-500 text-blue-700 ring-4 ring-blue-100' : 'bg-white border-gray-300 text-gray-400'
                  }`}>
                    {isCompleted ? <CheckCircle2 className="h-4.5 w-4.5" /> : <User className="h-4.5 w-4.5" />}
                  </div>
                  <div>
                    <h3 className={`text-xs font-bold ${isPickedUp ? 'text-gray-900' : 'text-gray-400'}`}>3. Passagers à bord</h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      {isPickedUp 
                        ? "Le transfert est en cours de réalisation. Les passagers voyagent confortablement." 
                        : "Prise en charge des clients au point de départ désigné."}
                    </p>
                  </div>
                </div>

                {/* Step 4: Completed */}
                <div className="flex gap-4 items-start">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 border z-10 transition ${
                    isCompleted ? 'bg-[#008060] border-[#008060] text-white ring-4 ring-emerald-100' : 'bg-white border-gray-300 text-gray-400'
                  }`}>
                    <CheckCircle2 className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h3 className={`text-xs font-bold ${isCompleted ? 'text-[#008060]' : 'text-gray-400'}`}>4. Déposé (Terminé)</h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      {isCompleted 
                        ? "Les voyageurs sont bien arrivés à destination. Fin de la prestation." 
                        : "Arrivée et dépose des passagers en toute sécurité."}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Simulated Live GPS Radar Widget */}
            {isEnRoute && !isCompleted && (
              <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 text-white relative overflow-hidden shadow-inner">
                <div className="absolute right-4 top-4">
                  <span className="flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-slate-800 p-2.5 rounded-lg border border-slate-700">
                    <Compass className="h-5 w-5 text-emerald-400 animate-spin-slow" />
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Position GPS en temps réel</span>
                    <span className="text-xs font-mono font-bold text-emerald-100">
                      {request.status === 'en_route' ? "Approche : Boulevard Mohamed VI • Marrakech" : "En course : Autoroute A7 • Transit Client"}
                    </span>
                    <span className="text-[9px] text-slate-500 block">Dernier signal : il y a 3 secondes • Précision GPS ~5m</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Route, Passenger & Service details card */}
        <div className="bg-white rounded-2xl border border-[#E1E3E5] p-5 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-[#6D7175] uppercase tracking-wider border-b border-[#F1F2F4] pb-2">
            Détails de l'itinéraire & Service
          </h3>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 bg-gray-100 p-1 rounded-full text-gray-500">
                    <MapPin className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Lieu de Départ</span>
                    <span className="text-xs font-bold text-[#1A1A1A]">{request.origin}</span>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 bg-emerald-50 p-1 rounded-full text-[#008060]">
                    <Navigation className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Lieu de Dépose</span>
                    <span className="text-xs font-bold text-[#1A1A1A]">{request.destination}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 md:border-l md:border-gray-100 md:pl-4">
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 bg-gray-100 p-1 rounded-full text-gray-500">
                    <User className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Passager Principal</span>
                    <span className="text-xs font-bold text-[#1A1A1A]">{request.passengerName}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-1.5 text-xs">
                    <Users className="h-3.5 w-3.5 text-gray-400" />
                    <span className="font-semibold">{request.paxCount} Pax</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs justify-end md:justify-start">
                    <span className="bg-emerald-50 text-[#008060] font-bold px-2 py-0.5 rounded text-[9px] uppercase tracking-wider">
                      {request.serviceType === 'disposal' ? `Mise à Dispo (${request.daysCount}j)` : 'Trajet Simple'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-[#F6F6F7] p-3 rounded-xl border border-[#E1E3E5] text-xs">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <div>
                  <span className="text-[8px] text-gray-400 block uppercase font-bold">Date</span>
                  <span className="font-bold">{new Date(request.dateTime).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 justify-end">
                <Clock className="h-4 w-4 text-gray-500" />
                <div className="text-right">
                  <span className="text-[8px] text-gray-400 block uppercase font-bold">Heure</span>
                  <span className="font-bold">{new Date(request.dateTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Driver & Vehicle Details Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Driver details */}
          <div className="bg-white rounded-2xl border border-[#E1E3E5] p-5 shadow-xs flex flex-col justify-between">
            <div>
              <h4 className="text-[10px] font-bold text-[#6D7175] uppercase tracking-wider border-b border-[#F1F2F4] pb-2 mb-3">
                Votre Chauffeur Mumy
              </h4>
              <div className="flex items-center gap-3">
                <img 
                  src={driver.avatarUrl} 
                  className="h-12 w-12 rounded-full object-cover border-2 border-emerald-50 shadow-sm"
                  alt="Avatar"
                />
                <div>
                  <h5 className="text-xs font-bold text-[#1A1A1A]">{driver.name}</h5>
                  <span className="text-[10px] text-gray-500 font-medium">Chauffeur Privé Certifié B2B</span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-amber-500 text-xs">★</span>
                    <span className="text-[10px] font-bold">{driver.rating} / 5.0</span>
                    <span className="text-[9px] text-emerald-600 bg-emerald-50 px-1 rounded font-semibold ml-1">Vérifié</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-[#F1F2F4]">
              <a 
                href={`tel:${driver.phone}`}
                className="w-full inline-flex justify-center items-center gap-2 px-3 py-2 bg-white hover:bg-gray-50 text-[#1A1A1A] border border-[#E1E3E5] rounded-xl text-xs font-bold transition shadow-xs"
              >
                <Phone className="h-3.5 w-3.5 text-[#008060]" />
                Contacter le chauffeur
              </a>
            </div>
          </div>

          {/* Vehicle details */}
          <div className="bg-white rounded-2xl border border-[#E1E3E5] p-5 shadow-xs flex flex-col justify-between">
            <div>
              <h4 className="text-[10px] font-bold text-[#6D7175] uppercase tracking-wider border-b border-[#F1F2F4] pb-2 mb-3">
                Véhicule de Transport
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between text-xs py-1">
                  <span className="text-gray-500">Modèle</span>
                  <span className="font-bold text-gray-900">{vehicle.brand} {vehicle.model}</span>
                </div>
                <div className="flex justify-between text-xs py-1">
                  <span className="text-gray-500">Immatriculation</span>
                  <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-bold text-slate-800 border border-slate-200">
                    {vehicle.plate}
                  </span>
                </div>
                <div className="flex justify-between text-xs py-1">
                  <span className="text-gray-500">Catégorie</span>
                  <span className="font-bold text-[#008060]">Van Premium VIP (Maroc)</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#F1F2F4] text-[10px] text-gray-500 flex items-center gap-1.5 bg-amber-50/50 p-2 rounded-lg border border-amber-100">
              <Info className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              <span>Conforme aux normes de transport touristique du Ministère du Transport marocain.</span>
            </div>
          </div>

        </div>

        {/* Security & reassurance note */}
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-start gap-3">
          <div className="bg-[#008060] text-white p-1.5 rounded-full mt-0.5">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#008060]">Prestation Sécurisée Mumy App</h4>
            <p className="text-[11px] text-emerald-800 mt-0.5 leading-relaxed">
              Ce trajet est entièrement suivi et assuré par Mumy, garantissant un niveau de service optimal, une ponctualité rigoureuse, et l'excellence du transport de luxe. Les collaborateurs de Riad/Hôtel ainsi que les clients ont accès à ce suivi en temps réel.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
