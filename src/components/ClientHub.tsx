import React, { useState } from "react";
import { 
  PlusCircle, ShieldCheck, Star, Sparkles, MapPin, Calendar, Clock, 
  ChevronRight, ArrowLeftRight, CheckCircle2, Award, User, Users, ClipboardCheck,
  Building, FileText, Phone, BadgePercent, Briefcase, Download, Search, Filter,
  ShieldAlert, Map, Plane, Globe, Compass, ExternalLink, Eye, MessageSquare
} from "lucide-react";
import { TransportRequest, Bid, EmptyReturn, User as UserType, AdBanner, Excursion, TransporterWebsite, ExcursionBooking } from "../types";
import SimulationAdBanner from "./SimulationAdBanner";
import { useMissionTracking } from "../hooks/useTracking";

// Shows who is genuinely coming to collect the passenger. The previous version derived a
// name, phone, vehicle and licence plate by hashing the request id against a pool of three
// invented drivers — the client was shown a stranger's details for their real booking.
// The driver and vehicle now come from the mission's own redacted tracking view.
function AssignedDriverPanel({ requestId }: { requestId: string }) {
  const { data, isLoading } = useMissionTracking(requestId);
  const driver = data?.driver;
  const vehicle = data?.vehicle;

  return (
    <div className="flex justify-between items-center pb-2 border-b border-gray-100 flex-wrap gap-2">
      <div>
        <span className="text-[10px] text-gray-400 uppercase font-extrabold tracking-wider">Chauffeur Assigné</span>
        <div className="flex items-center gap-2 mt-1">
          <div className="rounded-full bg-[#008060]/10 p-1.5 text-[#008060]">
            <User className="h-4 w-4" />
          </div>
          <div>
            {isLoading ? (
              <p className="text-[11px] text-gray-400 italic">Chargement des informations chauffeur…</p>
            ) : driver ? (
              <>
                <p className="text-xs font-extrabold text-gray-900">{driver.name}</p>
                <p className="text-[10px] text-gray-500 font-medium">
                  {vehicle ? `${vehicle.brand} ${vehicle.model} • Plaque : ${vehicle.plate}` : 'Véhicule en cours d\'affectation'}
                </p>
              </>
            ) : (
              <>
                <p className="text-xs font-extrabold text-gray-900">En cours d'affectation</p>
                <p className="text-[10px] text-gray-500 font-medium">
                  Le transporteur n'a pas encore désigné de chauffeur pour cette mission.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
      {driver?.phone && (
        <a
          href={`tel:${driver.phone}`}
          className="flex items-center gap-1 bg-[#EBF5F1] text-[#008060] font-bold text-[10px] px-3 py-2 rounded-lg border border-[#BBE3D1] hover:bg-[#d0ebd9] transition"
        >
          <Phone className="h-3.5 w-3.5" /> Appeler Chauffeur
        </a>
      )}
    </div>
  );
}

interface ClientHubProps {
  users: UserType[];
  requests: TransportRequest[];
  bids: Bid[];
  emptyReturns: EmptyReturn[];
  onCreateRequest: (req: Omit<TransportRequest, 'id' | 'clientId' | 'clientName' | 'status' | 'createdAt'>) => void;
  onAcceptBid: (bidId: string, requestId: string) => void;
  onRateDriver: (requestId: string, driverRating: number, driverComment: string, transporterRating: number, transporterComment: string) => void;
  emptyReturnMarketplace: React.ReactNode; // embed marketplace direct
  banners: AdBanner[];
  onRegisterImpression: (id: string) => void;
  onRegisterClick: (id: string) => void;
  excursions: Excursion[];
  websites: TransporterWebsite[];
  onBookExcursion: (booking: Omit<ExcursionBooking, 'id' | 'status' | 'createdAt'>) => void;
  excursionBookings: ExcursionBooking[];
}

export default function ClientHub({
  users,
  requests,
  bids,
  emptyReturns,
  onCreateRequest,
  onAcceptBid,
  onRateDriver,
  emptyReturnMarketplace,
  banners,
  onRegisterImpression,
  onRegisterClick,
  excursions,
  websites,
  onBookExcursion,
  excursionBookings
}: ClientHubProps) {
  const [activeTab, setActiveTab] = useState<'create' | 'bids' | 'returns' | 'b2b_space' | 'history' | 'excursions'>('create');
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const triggerSuccessBanner = (msg: string) => {
    setSuccessBanner(msg);
    setTimeout(() => {
      setSuccessBanner(null);
    }, 5000);
  };

  // Flash request form state
  const [formData, setFormData] = useState({
    passengerName: '',
    // Left blank rather than prefilled with a specific airport and riad — a client who
    // skipped these fields used to submit someone else's itinerary by default.
    origin: '',
    destination: '',
    dateTime: '',
    paxCount: 2,
    serviceType: 'simple' as 'simple' | 'round_trip' | 'disposal' | 'multistop',
    daysCount: 1,
    isHalfDay: false,
    waypoints: [] as string[],
    welcomeSign: '',
    b2bPaymentTerms: 'on_receipt' as 'on_receipt' | '30_days_eom' | 'end_of_month'
  });

  // Rating modal state
  const [ratingState, setRatingState] = useState<{
    requestId: string | null;
    driverRating: number;
    driverComment: string;
    transporterRating: number;
    transporterComment: string;
  }>({
    requestId: null,
    driverRating: 5,
    driverComment: '',
    transporterRating: 5,
    transporterComment: ''
  });

  // Filters & Sorting state for Bids Comparator
  const [bidsSortKey, setBidsSortKey] = useState<'price_low_high' | 'price_high_low' | 'rating_high_low'>('price_low_high');
  const [bidsMinRating, setBidsMinRating] = useState<number>(0);
  const [bidsMaxPrice, setBidsMaxPrice] = useState<number>(15000);
  const [bidsSearchQuery, setBidsSearchQuery] = useState<string>('');

  // Excursions Marketplace State
  const [excSearch, setExcSearch] = useState('');
  const [excLocation, setExcLocation] = useState('all');
  const [excMaxPrice, setExcMaxPrice] = useState(3000);
  const [selectedExcForBooking, setSelectedExcForBooking] = useState<Excursion | null>(null);
  const [selectedDetailsExcursion, setSelectedDetailsExcursion] = useState<Excursion | null>(null);
  
  // Booking Form State
  const [bookingForm, setBookingForm] = useState({
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    date: new Date().toISOString().split('T')[0],
    paxCount: 2
  });

  // Real transporter rating, averaged over the ratings clients have actually left on that
  // transporter's completed missions. This used to be a hardcoded table of six company
  // names with a 4.7 fallback, so every transporter — including brand-new ones — displayed
  // a flattering score nobody had given them.
  const getTransporterRating = (name: string): number | null => {
    const scores = requests
      .filter(r => r.transporterRating && bids.some(b => b.requestId === r.id && b.transporterName === name && b.status === 'accepted'))
      .map(r => r.transporterRating as number);
    if (scores.length === 0) return null;
    return Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;
  };

  // Dynamic status tracking state for Client Pro
  const [localStatuses, setLocalStatuses] = useState<Record<string, 'accepted' | 'en_route' | 'picked_up' | 'completed'>>({});

  const getRequestStatus = (req: TransportRequest) => {
    return localStatuses[req.id] || req.status;
  };

  const updateLocalStatus = (requestId: string, newStatus: 'accepted' | 'en_route' | 'picked_up' | 'completed') => {
    setLocalStatuses(prev => ({
      ...prev,
      [requestId]: newStatus
    }));
    triggerSuccessBanner(`Statut de la course mis à jour : ${
      newStatus === 'en_route' ? 'Chauffeur en route' : 
      newStatus === 'picked_up' ? 'Passager à bord' : 
      newStatus === 'completed' ? 'Mission terminée' : 'Confirmée'
    }`);
  };

  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.passengerName || !formData.dateTime || !formData.origin.trim() || !formData.destination.trim()) {
      triggerSuccessBanner("Veuillez renseigner le passager, le lieu de départ, la destination et la date.");
      return;
    }
    // Validation check: if disposal and not half day, days count is mandatory
    if (formData.serviceType === 'disposal' && !formData.isHalfDay && (!formData.daysCount || formData.daysCount < 1)) {
      triggerSuccessBanner("Le nombre de jours est obligatoire pour une mise à disposition de journée(s) entière(s).");
      return;
    }

    if (formData.serviceType === 'multistop' && formData.waypoints.filter(w => w.trim() !== '').length === 0) {
      triggerSuccessBanner("Veuillez ajouter au moins une étape pour le trajet multi-étapes.");
      return;
    }

    onCreateRequest({
      passengerName: formData.passengerName,
      origin: formData.origin,
      destination: formData.serviceType === 'multistop'
        ? [...formData.waypoints.filter(w => w.trim() !== ''), formData.destination].join(' ➔ ')
        : formData.destination,
      dateTime: formData.dateTime,
      paxCount: formData.paxCount,
      serviceType: formData.serviceType,
      daysCount: formData.serviceType === 'disposal' && !formData.isHalfDay ? formData.daysCount : undefined,
      isHalfDay: formData.serviceType === 'disposal' ? formData.isHalfDay : undefined,
      waypoints: formData.serviceType === 'multistop' ? formData.waypoints.filter(w => w.trim() !== '') : undefined,
      welcomeSign: formData.welcomeSign || undefined,
      b2bPaymentTerms: formData.b2bPaymentTerms
    });

    // Reset
    setFormData({
      passengerName: '',
      origin: '',
      destination: '',
      dateTime: '',
      paxCount: 2,
      serviceType: 'simple',
      daysCount: 1,
      isHalfDay: false,
      waypoints: [],
      welcomeSign: '',
      b2bPaymentTerms: 'on_receipt'
    });

    triggerSuccessBanner("Votre demande B2B a été publiée ! Les transporteurs ont été alertés et vont soumettre leurs offres.");
    setActiveTab('bids');
  };

  const submitDriverRating = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ratingState.requestId) return;
    onRateDriver(
      ratingState.requestId,
      ratingState.driverRating,
      ratingState.driverComment,
      ratingState.transporterRating,
      ratingState.transporterComment
    );
    setRatingState({
      requestId: null,
      driverRating: 5,
      driverComment: '',
      transporterRating: 5,
      transporterComment: ''
    });
    triggerSuccessBanner("Merci pour votre évaluation séparée ! Ce retour garantit notre charte d'excellence Mumy.");
  };

  return (
    <div className="space-y-6 text-left">
      
      {/* Simulation Advertisement Banner */}
      <SimulationAdBanner 
        role="client"
        banners={banners}
        onRegisterImpression={onRegisterImpression}
        onRegisterClick={onRegisterClick}
      />
      
      {/* Dynamic Success Toast / Banner */}
      {successBanner && (
        <div className="rounded-xl bg-[#EBF5F1] p-4 border border-[#BBE3D1] text-xs font-semibold text-[#008060] flex items-center justify-between gap-2 shadow-xs transition duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-[#008060]" />
            <span>{successBanner}</span>
          </div>
          <button onClick={() => setSuccessBanner(null)} className="text-[#008060] hover:text-[#006e52]">
            ×
          </button>
        </div>
      )}

      {/* TRUST GUARANTEE BADGE - Shopify Vibe */}
      <div className="rounded-xl bg-[#EBF5F1] p-4 border border-[#BBE3D1]">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-6 w-6 text-[#008060] shrink-0" />
          <div>
            <h4 className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider flex items-center gap-1.5">
              🛡️ GARANTIE QUALITÉ MUMY — Remboursement Intégral Assuré
            </h4>
            <p className="text-xs text-[#1A1A1A] mt-1 leading-relaxed">
              Tout retard de service de nos transporteurs prestataires est lourdement pénalisé par la plateforme. En cas de service non effectué ou défaillant, vous êtes intégralement remboursé sans discussion. Votre excellence hôtelière est protégée.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Menu styled like header roles */}
      <div className="flex gap-1 bg-[#F6F6F7] p-1 rounded-lg border border-[#E1E3E5] overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('create')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition shrink-0 ${
            activeTab === 'create'
              ? "bg-white text-[#1A1A1A] shadow-xs border border-[#E1E3E5]/30"
              : "text-[#6D7175] hover:text-[#1A1A1A]"
          }`}
        >
          <div className="flex items-center gap-1.5">
            <PlusCircle className="h-3.5 w-3.5 text-[#008060]" />
            Demande Flash
          </div>
        </button>
        <button
          onClick={() => setActiveTab('bids')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition shrink-0 ${
            activeTab === 'bids'
              ? "bg-white text-[#1A1A1A] shadow-xs border border-[#E1E3E5]/30"
              : "text-[#6D7175] hover:text-[#1A1A1A]"
          }`}
        >
          <div className="flex items-center gap-1.5">
            <ArrowLeftRight className="h-3.5 w-3.5 text-[#008060]" />
            Comparateur d'Offres
          </div>
        </button>
        <button
          onClick={() => setActiveTab('returns')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition shrink-0 ${
            activeTab === 'returns'
              ? "bg-white text-[#1A1A1A] shadow-xs border border-[#E1E3E5]/30"
              : "text-[#6D7175] hover:text-[#1A1A1A]"
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Award className="h-3.5 w-3.5 text-[#008060]" />
            Retours à Vide
          </div>
        </button>
        <button
          onClick={() => setActiveTab('b2b_space')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition shrink-0 ${
            activeTab === 'b2b_space'
              ? "bg-white text-[#1A1A1A] shadow-xs border border-[#E1E3E5]/30"
              : "text-[#6D7175] hover:text-[#1A1A1A]"
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Briefcase className="h-3.5 w-3.5 text-[#008060]" />
            Espace Pro B2B
          </div>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition shrink-0 ${
            activeTab === 'history'
              ? "bg-white text-[#1A1A1A] shadow-xs border border-[#E1E3E5]/30"
              : "text-[#6D7175] hover:text-[#1A1A1A]"
          }`}
        >
          <div className="flex items-center gap-1.5">
            <ClipboardCheck className="h-3.5 w-3.5 text-[#008060]" />
            Suivi & Notes
          </div>
        </button>
        <button
          onClick={() => setActiveTab('excursions')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition shrink-0 ${
            activeTab === 'excursions'
              ? "bg-white text-[#1A1A1A] shadow-xs border border-[#E1E3E5]/30"
              : "text-[#6D7175] hover:text-[#1A1A1A]"
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Compass className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
            Excursions (Viator-Style)
          </div>
        </button>
      </div>

      {/* 1. FLASH REQUEST FORM TAB */}
      {activeTab === 'create' && (
        <div className="grid gap-6 md:grid-cols-12">
          
          <div className="md:col-span-7 rounded-xl bg-white p-6 border border-[#E1E3E5] shadow-xs">
            <h3 className="text-sm font-bold text-[#1A1A1A] mb-4 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-[#008060]" />
              Formulaire de Demande B2B Multi-Option & Flash
            </h3>
            
            <form onSubmit={handleRequestSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-[#6D7175] uppercase">Nom du Passager principal *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Famille Henderson / Dr. Alami"
                  value={formData.passengerName}
                  onChange={(e) => setFormData({...formData, passengerName: e.target.value})}
                  className="mt-1 w-full rounded-lg border border-[#E1E3E5] p-2.5 text-xs bg-[#F6F6F7] text-[#1A1A1A] focus:outline-none focus:border-[#008060] focus:ring-1 focus:ring-[#008060]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-[#6D7175] uppercase">Point de Départ (Origine) *</label>
                  <input
                    type="text"
                    required
                    value={formData.origin}
                    onChange={(e) => setFormData({...formData, origin: e.target.value})}
                    className="mt-1 w-full rounded-lg border border-[#E1E3E5] p-2.5 text-xs bg-white text-[#1A1A1A] focus:outline-none focus:border-[#008060]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#6D7175] uppercase">Point d'Arrivée (Destination Finale) *</label>
                  <input
                    type="text"
                    required
                    value={formData.destination}
                    onChange={(e) => setFormData({...formData, destination: e.target.value})}
                    className="mt-1 w-full rounded-lg border border-[#E1E3E5] p-2.5 text-xs bg-white text-[#1A1A1A] focus:outline-none focus:border-[#008060]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-[#6D7175] uppercase">Date & Heure de Départ *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.dateTime}
                    onChange={(e) => setFormData({...formData, dateTime: e.target.value})}
                    className="mt-1 w-full rounded-lg border border-[#E1E3E5] p-2.5 text-xs bg-white text-[#1A1A1A] focus:outline-none focus:border-[#008060]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#6D7175] uppercase">Nombre de Voyageurs (Pax)</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={formData.paxCount}
                    onChange={(e) => setFormData({...formData, paxCount: Number(e.target.value)})}
                    className="mt-1 w-full rounded-lg border border-[#E1E3E5] p-2.5 text-xs bg-white text-[#1A1A1A] focus:outline-none focus:border-[#008060]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#6D7175] uppercase">Type de Service Pro</label>
                <div className="mt-1 grid grid-cols-4 gap-2">
                  {[
                    { id: 'simple', label: 'Simple' },
                    { id: 'round_trip', label: 'Aller-Retour' },
                    { id: 'disposal', label: 'Mise à dispo.' },
                    { id: 'multistop', label: 'Multi-étapes' }
                  ].map((service) => (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => setFormData({...formData, serviceType: service.id as any})}
                      className={`rounded-lg py-2 text-[11px] font-bold transition border ${
                        formData.serviceType === service.id
                          ? "bg-emerald-50 border-[#008060] text-[#008060]"
                          : "bg-white border-[#E1E3E5] text-[#6D7175] hover:bg-gray-50"
                      }`}
                    >
                      {service.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* DYNAMIC FIELD 1: Waypoints Multi-points */}
              {formData.serviceType === 'multistop' && (
                <div className="animate-fade-in bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-700 uppercase flex items-center gap-1">
                      <Map className="h-3 w-3 text-slate-500" />
                      Étapes intermédiaires du trajet
                    </span>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, waypoints: [...formData.waypoints, ''] })}
                      className="text-[11px] text-[#008060] font-bold hover:underline"
                    >
                      + Ajouter une ville/étape
                    </button>
                  </div>
                  
                  {formData.waypoints.length === 0 && (
                    <div className="text-center py-2 text-xs text-gray-400">
                      Aucune étape intermédiaire. Cliquez sur le bouton ci-dessus pour construire votre trajet.
                    </div>
                  )}

                  <div className="space-y-2">
                    {formData.waypoints.map((wp, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <span className="text-[10px] text-slate-500 font-bold w-12 font-mono">Point {idx + 1} :</span>
                        <input
                          type="text"
                          placeholder="Ex: Casablanca / Rabat / Fès"
                          value={wp}
                          onChange={(e) => {
                            const newWps = [...formData.waypoints];
                            newWps[idx] = e.target.value;
                            setFormData({ ...formData, waypoints: newWps });
                          }}
                          className="flex-1 rounded-lg border border-slate-300 p-2 text-xs bg-white text-[#1A1A1A] focus:outline-none focus:border-[#008060]"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newWps = formData.waypoints.filter((_, i) => i !== idx);
                            setFormData({ ...formData, waypoints: newWps });
                          }}
                          className="text-red-500 hover:text-red-700 text-xs font-bold px-1"
                        >
                          Retirer
                        </button>
                      </div>
                    ))}
                  </div>

                  {formData.waypoints.length > 0 && (
                    <div className="text-[10px] text-slate-500 bg-white p-2 rounded border border-slate-200 font-mono">
                      <strong>Itinéraire proposé :</strong> {formData.origin} ➔ {formData.waypoints.filter(w=>w.trim()!=='').join(' ➔ ')} ➔ {formData.destination}
                    </div>
                  )}
                </div>
              )}

              {/* DYNAMIC FIELD 2: Displayed and configured ONLY if "disposal" is active */}
              {formData.serviceType === 'disposal' && (
                <div className="animate-fade-in bg-amber-50 p-4 rounded-xl border border-amber-200 space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-amber-900 uppercase">Durée de la mise à disposition</label>
                    <div className="mt-1.5 flex gap-4">
                      <label className="flex items-center gap-1.5 text-xs text-amber-950 font-bold cursor-pointer">
                        <input
                          type="radio"
                          name="isHalfDay"
                          checked={!formData.isHalfDay}
                          onChange={() => setFormData({ ...formData, isHalfDay: false })}
                          className="text-[#008060] focus:ring-[#008060]"
                        />
                        Journée(s) Entière(s)
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-amber-950 font-bold cursor-pointer">
                        <input
                          type="radio"
                          name="isHalfDay"
                          checked={formData.isHalfDay}
                          onChange={() => setFormData({ ...formData, isHalfDay: true })}
                          className="text-[#008060] focus:ring-[#008060]"
                        />
                        Demi-Journée (Max 4 heures / 100km)
                      </label>
                    </div>
                  </div>

                  {!formData.isHalfDay ? (
                    <div>
                      <label className="block text-[10px] font-bold text-amber-900 uppercase">Nombre de jours de mise à disposition *</label>
                      <input
                        type="number"
                        min={1}
                        required
                        value={formData.daysCount}
                        onChange={(e) => setFormData({...formData, daysCount: Number(e.target.value)})}
                        className="mt-1 w-full rounded-lg border border-amber-300 p-2 text-xs bg-white text-[#1A1A1A] focus:outline-none focus:border-[#008060]"
                      />
                    </div>
                  ) : (
                    <div className="text-[10px] text-amber-800 font-medium">
                      ⚡ Forfait Demi-journée activé. Idéal pour un transfert local multi-points court, une visite de la médina ou un événement de séminaire limité.
                    </div>
                  )}
                </div>
              )}

              {/* PREMIUM B2B OPTIONS (Airport Greeting, Invoices, Payment terms) */}
              <div className="border-t border-[#E1E3E5] pt-4 space-y-3">
                <h4 className="text-[11px] font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1">
                  💼 Options Administratives & Services VIP B2B
                </h4>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-[#6D7175] uppercase">Pancarte d'accueil Aéroport/Gare</label>
                    <input
                      type="text"
                      placeholder="Ex: GROUPE SMITH / Riad Guest"
                      value={formData.welcomeSign}
                      onChange={(e) => setFormData({...formData, welcomeSign: e.target.value})}
                      className="mt-1 w-full rounded-lg border border-[#E1E3E5] p-2 text-xs bg-white text-[#1A1A1A] focus:outline-none focus:border-[#008060]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#6D7175] uppercase">Conditions de Règlement Pro</label>
                    <select
                      value={formData.b2bPaymentTerms}
                      onChange={(e: any) => setFormData({...formData, b2bPaymentTerms: e.target.value})}
                      className="mt-1 w-full rounded-lg border border-[#E1E3E5] p-2 text-xs bg-white text-[#1A1A1A] focus:outline-none focus:border-[#008060]"
                    >
                      <option value="on_receipt">Paiement à réception de facture</option>
                      <option value="30_days_eom">Règlement 30 Jours Fin de Mois</option>
                      <option value="end_of_month">Virement groupé fin de mois</option>
                    </select>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-[#008060] py-3 text-xs font-bold text-white hover:bg-[#006e52] transition shadow-xs flex items-center justify-center gap-2"
              >
                <PlusCircle className="h-4 w-4" />
                Publier l'Appel d'Offre B2B Immédiat
              </button>
            </form>
          </div>

          {/* Form Explanations card */}
          <div className="md:col-span-5 rounded-xl bg-[#F6F6F7] p-5 border border-[#E1E3E5]">
            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">Comment fonctionne la Demande Flash ?</h4>
            <ul className="space-y-3 text-xs text-gray-600">
              <li className="flex gap-2">
                <span className="font-bold text-[#008060]">1.</span>
                <span>Vous soumettez votre besoin exact en quelques clics via ce formulaire pro.</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-[#008060]">2.</span>
                <span>Les sociétés de transport accréditées reçoivent instantanément l'appel d'offres.</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-[#008060]">3.</span>
                <span>Elles formulent une offre tarifaire compétitive en temps réel.</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-[#008060]">4.</span>
                <span>Vous comparez les propositions sur votre tableau de bord et réservez l'offre idéale.</span>
              </li>
            </ul>
          </div>

        </div>
      )}

      {/* 2. BIDS COMPARATOR TAB */}
      {activeTab === 'bids' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Comparateur de Propositions Commerciales</h3>
            <p className="text-xs text-gray-500 mt-1">Consultez, filtrez et acceptez les meilleures propositions de notre flotte partenaire.</p>
          </div>

          {/* Advanced Bids Filters & Sort Bar */}
          <div className="bg-[#F6F6F7] rounded-xl border border-[#E1E3E5] p-4 grid gap-4 sm:grid-cols-4 items-center animate-fade-in shadow-xs">
            <div>
              <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-wider mb-1">Recherche de course</label>
              <input
                type="text"
                placeholder="Ville, passager, véhicule..."
                value={bidsSearchQuery}
                onChange={(e) => setBidsSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-[#E1E3E5] p-2 text-xs bg-white text-[#1A1A1A] focus:outline-none focus:border-[#008060]"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">Budget Max (DHS)</label>
                <span className="text-xs font-mono font-bold text-[#008060]">{bidsMaxPrice} DHS</span>
              </div>
              <input
                type="range"
                min="500"
                max="15000"
                step="250"
                value={bidsMaxPrice}
                onChange={(e) => setBidsMaxPrice(Number(e.target.value))}
                className="w-full accent-[#008060] cursor-pointer mt-1"
              />
            </div>

            <div>
              <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-wider mb-1">Évaluation minimum</label>
              <select
                value={bidsMinRating}
                onChange={(e) => setBidsMinRating(Number(e.target.value))}
                className="w-full rounded-lg border border-[#E1E3E5] p-2 text-xs bg-white text-[#1A1A1A] focus:outline-none"
              >
                <option value={0}>Toutes les notes</option>
                <option value={4}>★ 4.0 +</option>
                <option value={4.5}>★ 4.5 +</option>
                <option value={4.8}>★ 4.8 +</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-wider mb-1">Trier les offres</label>
              <select
                value={bidsSortKey}
                onChange={(e) => setBidsSortKey(e.target.value as any)}
                className="w-full rounded-lg border border-[#E1E3E5] p-2 text-xs bg-white text-[#008060] font-bold focus:outline-none"
              >
                <option value="price_low_high">Prix : Du moins cher au plus cher</option>
                <option value="price_high_low">Prix : Du plus cher au moins cher</option>
                <option value="rating_high_low">Note : Mieux notés d'abord</option>
              </select>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {(() => {
              const filteredBids = bids
                .filter(b => b.status === 'pending')
                .filter(bid => {
                  const reqInfo = requests.find(r => r.id === bid.requestId);
                  if (!reqInfo) return false;
                  
                  // A transporter with no ratings yet is only hidden once the client asks
                  // for a minimum score — otherwise new partners would never be visible.
                  const rating = getTransporterRating(bid.transporterName);
                  if (bidsMinRating > 0 && (rating === null || rating < bidsMinRating)) return false;
                  if (bid.priceDHS > bidsMaxPrice) return false;
                  
                  if (bidsSearchQuery.trim() !== '') {
                    const query = bidsSearchQuery.toLowerCase();
                    const matchText = `${bid.transporterName} ${bid.vehicleType} ${reqInfo.passengerName} ${reqInfo.origin} ${reqInfo.destination}`.toLowerCase();
                    if (!matchText.includes(query)) return false;
                  }
                  return true;
                })
                .sort((a, b) => {
                  const aFeatured = users.some(u => (u.id === a.transporterId || u.companyName === a.transporterName || u.name === a.transporterName) && u.isFeatured);
                  const bFeatured = users.some(u => (u.id === b.transporterId || u.companyName === b.transporterName || u.name === b.transporterName) && u.isFeatured);
                  if (aFeatured && !bFeatured) return -1;
                  if (!aFeatured && bFeatured) return 1;

                  if (bidsSortKey === 'price_low_high') {
                    return a.priceDHS - b.priceDHS;
                  } else if (bidsSortKey === 'price_high_low') {
                    return b.priceDHS - a.priceDHS;
                  } else {
                    // Unrated transporters sort last rather than being given an invented score.
                    return (getTransporterRating(b.transporterName) ?? -1) - (getTransporterRating(a.transporterName) ?? -1);
                  }
                });

              if (filteredBids.length === 0) {
                return (
                  <div className="col-span-full py-12 text-center bg-[#F6F6F7] rounded-lg border border-transparent">
                    <Award className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                    <p className="text-sm text-gray-500 font-medium">Aucune proposition commerciale ne correspond à vos filtres.</p>
                  </div>
                );
              }

              return filteredBids.map(bid => {
                const reqInfo = requests.find(r => r.id === bid.requestId);
                if (!reqInfo) return null;
                const rating = getTransporterRating(bid.transporterName);
                const isFeatured = users.some(u => (u.id === bid.transporterId || u.companyName === bid.transporterName || u.name === bid.transporterName) && u.isFeatured);

                return (
                  <div key={bid.id} className={`rounded-xl bg-white p-5 border shadow-xs relative transition duration-200 ${
                    isFeatured 
                      ? "border-amber-400 bg-amber-50/15 shadow-sm ring-1 ring-amber-400/30" 
                      : "border-[#E1E3E5] hover:border-[#008060] hover:shadow-md"
                  }`}>
                    {isFeatured ? (
                      <span className="absolute right-4 top-4 rounded bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 text-[10px] font-extrabold tracking-wider uppercase flex items-center gap-1">
                        <Sparkles className="h-3 w-3 text-amber-600 fill-amber-500" />
                        SÉLECTIONNÉ (HANDPICKED)
                      </span>
                    ) : (
                      <span className="absolute right-4 top-4 rounded bg-[#EBF5F1] text-[#008060] border border-[#BBE3D1] px-2 py-0.5 text-[10px] font-extrabold tracking-wider uppercase">
                        PROPOSITION PARTENAIRE
                      </span>
                    )}

                    <div className="mb-3 space-y-1">
                      <div className="flex justify-between items-center flex-wrap gap-1">
                        <p className="text-[10px] text-gray-400 font-mono">Demande ID: {reqInfo.id}</p>
                        <span className="rounded bg-slate-100 text-slate-800 text-[9px] font-bold px-1.5 py-0.5 border border-slate-200">
                          {reqInfo.serviceType === 'simple' && 'Simple'}
                          {reqInfo.serviceType === 'round_trip' && 'Aller-Retour'}
                          {reqInfo.serviceType === 'disposal' && (reqInfo.isHalfDay ? 'Mise à dispo (1/2 Jour)' : `Mise à dispo (${reqInfo.daysCount}j)`)}
                          {reqInfo.serviceType === 'multistop' && 'Multi-étapes'}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-[#1A1A1A] mt-1">{reqInfo.origin} → {reqInfo.destination}</p>
                      <p className="text-[11px] text-[#6D7175]">
                        Passager: <strong className="text-slate-800">{reqInfo.passengerName}</strong> • {reqInfo.paxCount} Pax • {new Date(reqInfo.dateTime).toLocaleString('fr-FR')}
                      </p>
                      
                      {isFeatured && (
                        <div className="rounded-lg bg-amber-100/50 border border-amber-200 p-2.5 text-[10.5px] text-amber-950 font-medium my-2 flex items-start gap-1.5 leading-relaxed">
                          <Sparkles className="h-4 w-4 text-amber-600 fill-amber-500 shrink-0 mt-0.5" />
                          <span>
                            <strong>Recommandé :</strong> Ce prestataire d'élite est trié sur le volet (Handpicked) pour sa ponctualité, sa flotte moderne et son service client haut de gamme.
                          </span>
                        </div>
                      )}

                      {reqInfo.welcomeSign && (
                        <div className="rounded bg-yellow-50 border border-yellow-200 p-1.5 text-[10px] text-yellow-800 font-medium">
                          🏷️ <strong>Pancarte :</strong> "{reqInfo.welcomeSign}"
                        </div>
                      )}
                    </div>

                    <div className="rounded-lg bg-[#F6F6F7] p-3 mb-4 border border-[#E1E3E5] space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-[#6D7175] font-medium">Véhicule Proposé :</span>
                        <strong className="text-[#1A1A1A]">{bid.vehicleType}</strong>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-[#6D7175] font-medium">Transporteur :</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-[#1A1A1A]">{bid.transporterName}</span>
                          {rating !== null ? (
                            <span className="bg-amber-50 text-amber-800 border border-amber-200 text-[9.5px] px-1.5 py-0.5 rounded font-extrabold flex items-center gap-0.5">
                              ★ {rating.toFixed(1)}
                            </span>
                          ) : (
                            <span className="bg-gray-50 text-gray-500 border border-gray-200 text-[9.5px] px-1.5 py-0.5 rounded font-bold">
                              Pas encore noté
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-[10px] border-t border-dashed border-gray-300 pt-1.5 mt-1.5">
                        <span className="text-[#6D7175] font-medium">Facturation :</span>
                        <span className="font-mono text-gray-800 uppercase font-semibold">
                          {reqInfo.b2bPaymentTerms === 'on_receipt' && 'À réception'}
                          {reqInfo.b2bPaymentTerms === '30_days_eom' && '30j Fin de Mois'}
                          {reqInfo.b2bPaymentTerms === 'end_of_month' && 'Virement fin de mois'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-[#E1E3E5] pt-3">
                      <div>
                        <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Tarif Proposé</span>
                        <p className="text-base font-extrabold text-[#008060] font-mono">{bid.priceDHS} DHS</p>
                      </div>
                      <button
                        onClick={() => onAcceptBid(bid.id, bid.requestId)}
                        className="rounded-lg bg-[#008060] hover:bg-[#006e52] px-4 py-2 text-xs font-bold text-white shadow-xs transition cursor-pointer"
                      >
                        Accepter l'offre
                      </button>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}

      {/* 3. EMPTY RETURNS EMBEDDED MARKETPLACE */}
      {activeTab === 'returns' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Achat immédiat : Retours à Vide Anonymes (-30% net)</h3>
            <p className="text-xs text-gray-500 mt-1">Réservez en direct les trajets de retour à vide de nos prestataires certifiés en toute confidentialité.</p>
          </div>
          {emptyReturnMarketplace}
        </div>
      )}

      {/* 4. ESPACE PREMIUM B2B */}
      {activeTab === 'b2b_space' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* HEADER SUMMARY */}
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-xl bg-white p-4 border border-[#E1E3E5] shadow-xs">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-[#6D7175] uppercase">Crédit B2B Autorisé</span>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-[#008060] border border-[#BBE3D1]">ACTIF</span>
              </div>
              <p className="text-xl font-bold text-[#1A1A1A] mt-2">50 000 DHS</p>
              <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-[#008060] h-full rounded-full" style={{ width: '38%' }}></div>
              </div>
              <p className="text-[10px] text-[#6D7175] mt-1">19 200 DHS consommés ce mois</p>
            </div>

            <div className="rounded-xl bg-white p-4 border border-[#E1E3E5] shadow-xs">
              <span className="text-[10px] font-bold text-[#6D7175] uppercase">Trajets Commandés</span>
              <p className="text-xl font-bold text-[#1A1A1A] mt-2">{requests.length} courses</p>
              <p className="text-[10px] text-emerald-600 font-semibold mt-2">📊 Taux de ponctualité : 100%</p>
            </div>

            <div className="rounded-xl bg-white p-4 border border-[#E1E3E5] shadow-xs">
              <span className="text-[10px] font-bold text-[#6D7175] uppercase">Factures dues</span>
              <p className="text-xl font-bold text-[#1A1A1A] mt-2">10 500 DHS</p>
              <p className="text-[10px] text-amber-600 font-semibold mt-2">📅 Prochain prélèvement : 31/07</p>
            </div>

            <div className="rounded-xl bg-white p-4 border border-[#E1E3E5] shadow-xs">
              <span className="text-[10px] font-bold text-[#6D7175] uppercase">Pancartes actives</span>
              <p className="text-xl font-bold text-[#1A1A1A] mt-2">
                {requests.filter(r => r.welcomeSign).length} enregistrées
              </p>
              <p className="text-[10px] text-[#6D7175] mt-2">Prêtes pour l'accueil douane</p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-12">
            
            {/* ANNUAIRE DES TRANSPORTEURS AGRÉÉS */}
            <div className="md:col-span-8 space-y-6">
              
              <div className="rounded-xl bg-white p-5 border border-[#E1E3E5] shadow-xs">
                <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-[#1A1A1A]">Annuaire des Transporteurs Agrées</h3>
                    <p className="text-[11px] text-gray-500">Chauffeurs bilingues, véhicules certifiés et agréments à jour</p>
                  </div>
                  <div className="flex gap-1.5 items-center bg-[#F6F6F7] px-2 py-1 rounded border border-[#E1E3E5]">
                    <Search className="h-3 w-3 text-gray-400" />
                    <input type="text" placeholder="Rechercher..." className="bg-transparent text-xs text-[#1A1A1A] focus:outline-none w-24" />
                  </div>
                </div>

                <div className="space-y-4">
                  {users
                    .filter(u => u.role === 'transporter' && u.status === 'verified')
                    .map((user) => {
                      // Everything here is the transporter's own verified record. It used to
                      // be padded out of a two-entry lookup table with invented review counts,
                      // fleet inventories and — most seriously — a ministerial licence number
                      // fabricated from the first six digits of their ICE.
                      const name = user.companyName || user.name;
                      const carrier = {
                        name,
                        rating: getTransporterRating(name),
                        reviews: requests.filter(
                          r => r.transporterRating && bids.some(b => b.requestId === r.id && b.transporterName === name && b.status === 'accepted')
                        ).length,
                        phone: user.phone,
                        ice: user.ice,
                        isFeatured: user.isFeatured
                      };

                      return (
                        <div key={user.id} className={`rounded-xl border p-4 transition ${
                          carrier.isFeatured 
                            ? "border-amber-400 bg-amber-50/15 shadow-sm ring-1 ring-amber-400/20" 
                            : "bg-slate-50 border-slate-200 hover:border-[#008060]"
                        } space-y-3`}>
                          <div className="flex justify-between items-start flex-wrap gap-2">
                            <div>
                              <h4 className="text-xs font-bold text-[#1A1A1A] flex items-center gap-1.5 flex-wrap">
                                {carrier.name}
                                {carrier.isFeatured && (
                                  <span className="rounded bg-amber-100 text-amber-900 text-[9px] font-extrabold px-1.5 py-0.5 border border-amber-300 flex items-center gap-0.5">
                                    <Sparkles className="h-2.5 w-2.5 text-amber-500 fill-amber-500" />
                                    SÉLECTION HANDPICKED
                                  </span>
                                )}
                                <span className="rounded bg-[#EBF5F1] text-[#008060] text-[9px] font-bold px-1.5 py-0.5 border border-[#BBE3D1]">CERTIFIÉ</span>
                              </h4>
                              {carrier.ice && (
                                <p className="text-[10px] text-slate-500 mt-0.5 font-mono">ICE : {carrier.ice}</p>
                              )}
                            </div>
                            {carrier.rating !== null ? (
                              <div className="flex items-center gap-1 font-bold text-amber-500 text-xs">
                                <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                                <span>{carrier.rating.toFixed(1)}</span>
                                <span className="text-gray-400 font-normal">
                                  ({carrier.reviews} avis)
                                </span>
                              </div>
                            ) : (
                              <span className="text-[10px] text-gray-400 font-semibold">Pas encore d'avis</span>
                            )}
                          </div>

                          <div className="flex justify-between items-center text-xs pt-1">
                            <div className="flex items-center gap-1 text-[#6D7175]">
                              <Phone className="h-3.5 w-3.5 text-gray-400" />
                              <span>{carrier.phone || 'Téléphone non communiqué'}</span>
                            </div>
                            <button 
                              onClick={() => triggerSuccessBanner(`Canal direct ouvert avec ${carrier.name}. Soumettez un appel d'offre pour recevoir leurs prix instantanés.`)}
                              className="rounded-lg border border-[#E1E3E5] px-3 py-1 bg-white text-[#1A1A1A] font-bold hover:bg-gray-50 transition"
                            >
                              Contacter direct
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* FORFAITS ROUTIERS & DEVIS DIRECTS */}
              <div className="rounded-xl bg-white p-5 border border-[#E1E3E5] shadow-xs">
                <h3 className="text-sm font-bold text-[#1A1A1A] mb-3">Tarifs Forfaitaires Recommandés B2B</h3>
                <p className="text-xs text-gray-500 mb-4">Réservez instantanément aux tarifs négociés de la plateforme.</p>
                
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    { route: "Marrakech ➔ Désert d'Agafay", price: "900 DHS", car: "Berline VIP", type: "Aller simple" },
                    { route: "Marrakech ➔ Casablanca Aéroport", price: "1 800 DHS", car: "Vito / V-Class", type: "Transfert direct" },
                    { route: "Marrakech ➔ Vallée de l'Ourika", price: "1 200 DHS", car: "Sprinter 17 Pax", type: "Journée complète" },
                    { route: "Marrakech ➔ Essaouira Médina", price: "1 500 DHS", car: "Hyundai H1", type: "Excursion Pro" },
                    { route: "Marrakech ➔ Rabat Centre", price: "2 200 DHS", car: "Premium SUV", type: "Rendez-vous B2B" },
                    { route: "Marrakech Tour Historique", price: "750 DHS", car: "Minibus Vito", type: "Demi-journée" }
                  ].map((deal, idx) => (
                    <div key={idx} className="p-3 bg-[#F6F6F7] rounded-xl border border-[#E1E3E5] flex flex-col justify-between hover:border-[#008060] transition cursor-pointer"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          origin: deal.route.split(' ➔ ')[0],
                          destination: deal.route.split(' ➔ ')[1] || "Centre Ville",
                          serviceType: deal.type.includes('Demi-journée') ? 'disposal' : 'simple',
                          isHalfDay: deal.type.includes('Demi-journée'),
                          welcomeSign: "ACCUEIL HOTEL RIAD ROYAL",
                          paxCount: 4
                        });
                        triggerSuccessBanner(`Forfait ${deal.route} chargé dans le formulaire. Ajustez si besoin.`);
                        setActiveTab('create');
                      }}
                    >
                      <div>
                        <span className="text-[9px] font-bold text-[#008060] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">{deal.type}</span>
                        <h4 className="text-xs font-bold text-[#1A1A1A] mt-2">{deal.route}</h4>
                        <p className="text-[10px] text-gray-400 mt-0.5">{deal.car}</p>
                      </div>
                      <div className="flex justify-between items-center mt-3 border-t border-gray-200/60 pt-2">
                        <span className="text-xs font-bold text-gray-900">{deal.price}</span>
                        <span className="text-[10px] text-[#008060] font-bold hover:underline">Réserver ➔</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* FACTURATION B2B & PANCARTE APERCU */}
            <div className="md:col-span-4 space-y-6">
              
              {/* COMPTE COURANT & INVOICES */}
              <div className="rounded-xl bg-[#F6F6F7] p-5 border border-[#E1E3E5]">
                <h3 className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-[#008060]" />
                  Factures Proforma & Bilan
                </h3>
                
                <div className="space-y-3">
                  {[
                    { id: "FAC-2026-068", date: "02/07/2026", amt: "4 200 DHS", desc: "Transferts Séminaire Smith", status: "Payée" },
                    { id: "FAC-2026-064", date: "28/06/2026", amt: "6 300 DHS", desc: "Mise à dispo. Agence Travel", status: "Payée" },
                    { id: "FAC-2026-071", date: "05/07/2026", amt: "10 500 DHS", desc: "Forfait Excursion Essaouira", status: "Non payée" }
                  ].map((invoice, idx) => (
                    <div key={idx} className="bg-white p-3 rounded-lg border border-[#E1E3E5] flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-[#1A1A1A]">{invoice.id}</p>
                        <p className="text-[10px] text-gray-400">{invoice.date} • {invoice.desc}</p>
                        <p className="text-[11px] font-bold text-gray-900 mt-1">{invoice.amt}</p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-1.5 py-0.5 text-[9px] font-bold rounded ${
                          invoice.status === 'Payée' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {invoice.status}
                        </span>
                        <button 
                          onClick={() => triggerSuccessBanner(`Téléchargement de la facture ${invoice.id} démarré au format PDF certifié.`)}
                          className="mt-2 block w-full text-slate-500 hover:text-slate-800 flex items-center justify-end gap-1 text-[10px]"
                        >
                          <Download className="h-3 w-3" /> PDF
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 bg-[#008060]/5 p-3 rounded-lg border border-[#008060]/20 text-xs">
                  <p className="font-semibold text-[#008060] flex items-center gap-1">
                    ℹ️ Facturation centralisée
                  </p>
                  <p className="text-[10px] text-[#008060] mt-1 leading-relaxed">
                    Mumy consolide l'ensemble de vos réservations hôtelières. Recevez un relevé unique mensuel pour votre comptabilité.
                  </p>
                </div>
              </div>

              {/* WELCOME SIGN PREVIEW CARD (Airport arrival mockup) */}
              <div className="rounded-xl bg-[#1A1A1A] p-5 text-white border border-transparent shadow-xs">
                <span className="rounded bg-yellow-400 text-black px-1.5 py-0.5 text-[9px] font-extrabold uppercase">Aperçu pancarte d'accueil</span>
                <h4 className="text-xs text-gray-400 mt-2 font-mono uppercase tracking-wider">Simulateur Chauffeur</h4>
                
                <div className="my-4 bg-white text-black p-4 rounded-lg shadow-inner border-4 border-yellow-400 text-center flex flex-col justify-center items-center h-28">
                  <Plane className="h-5 w-5 text-yellow-500 mb-1" />
                  <p className="text-[11px] uppercase tracking-wider font-semibold text-gray-500">MUMY VIP WELCOME</p>
                  <p className="text-base font-extrabold uppercase mt-1 tracking-tight">
                    {formData.welcomeSign || "VOTRE LOGO / NOM CLIENT"}
                  </p>
                  <p className="text-[9px] text-gray-400 mt-2 font-mono">Assuré par Chauffeur Partenaire Mumy</p>
                </div>
                
                <p className="text-[10px] text-gray-300 leading-relaxed">
                  Ce texte est automatiquement transmis à la tablette d'accueil ou imprimé par le chauffeur dès validation de la course. Zéro erreur d'orthographe à l'arrivée.
                </p>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* 5. TRACKING & DRIVER RATING HISTORY */}
      {activeTab === 'history' && (
        <div className="rounded-xl bg-white p-5 border border-[#E1E3E5] space-y-6 shadow-xs">
          <div>
            <h3 className="text-sm font-bold text-[#1A1A1A]">Suivi des Courses & Évaluations Chauffeurs</h3>
            <p className="text-xs text-[#6D7175] mt-1">Suivez les trajets en cours et notez vos chauffeurs dès que la mission est finalisée.</p>
          </div>

          <div className="space-y-4">
            {requests.map(req => {
              const currentStatus = getRequestStatus(req);

              return (
                <div key={req.id} className="rounded-xl bg-[#F6F6F7] border border-[#E1E3E5] p-5 text-xs space-y-4 animate-fade-in shadow-xs">
                  <div className="flex justify-between items-center flex-wrap gap-2 pb-3 border-b border-gray-200">
                    <span className="font-mono font-bold uppercase bg-white text-[#1A1A1A] border border-[#E1E3E5] px-2.5 py-1 rounded shadow-2xs text-[10px]">
                      Demande ID: {req.id}
                    </span>
                    <span className={`px-2.5 py-1 rounded-full font-bold text-[9.5px] uppercase tracking-wider ${
                      currentStatus === 'completed' ? 'bg-[#EBF5F1] text-[#008060] border border-[#BBE3D1]' :
                      currentStatus === 'en_route' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                      currentStatus === 'picked_up' ? 'bg-blue-100 text-blue-800 border border-blue-200' : 'bg-gray-100 text-gray-800 border border-gray-200'
                    }`}>
                      {currentStatus === 'completed' ? 'Mission Terminée' : currentStatus === 'en_route' ? 'Chauffeur en route' : currentStatus === 'picked_up' ? 'Client Récupéré' : 'Confirmée / Assignée'}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="font-extrabold text-sm text-[#1A1A1A] flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-[#008060]" />
                      {req.origin} → {req.destination}
                    </div>
                    <p className="text-[#6D7175] text-[11px] font-medium pl-5">
                      Passager principal : <strong className="text-gray-900">{req.passengerName}</strong> • Date prévue : {new Date(req.dateTime).toLocaleString('fr-FR')}
                    </p>
                  </div>

                  {/* If the course is in progress, display our high-end, live dynamic stepper */}
                  {currentStatus !== 'completed' ? (
                    /* Visual Progress Stepper */
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs space-y-4">
                      <AssignedDriverPanel requestId={req.id} />

                      {/* Visual Step Indicator */}
                      <div className="relative pt-2">
                        <div className="absolute top-[22px] left-8 right-8 h-[2px] bg-gray-200"></div>
                        {/* Green Fill line based on state */}
                        <div className="absolute top-[22px] left-8 h-[2px] bg-[#008060] transition-all duration-300" style={{
                          width: currentStatus === 'accepted' ? '0%' :
                                 currentStatus === 'en_route' ? '50%' : '100%'
                        }}></div>

                        <div className="relative flex justify-between">
                          {[
                            { key: 'accepted', label: 'Assigné', desc: 'Chauffeur confirmé' },
                            { key: 'en_route', label: 'En Route', desc: 'Vers lieu de prise' },
                            { key: 'picked_up', label: 'À Bord', desc: 'Trajet en cours' }
                          ].map((step, idx) => {
                            const stepsInOrder = ['accepted', 'en_route', 'picked_up'];
                            const currentIdx = stepsInOrder.indexOf(currentStatus);
                            const stepIdx = stepsInOrder.indexOf(step.key);
                            const isPassed = stepIdx <= currentIdx;
                            const isCurrent = step.key === currentStatus;

                            return (
                              <div key={step.key} className="flex flex-col items-center relative z-10 flex-1">
                                <div className={`h-8 w-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                                  isPassed 
                                    ? 'bg-[#008060] border-[#008060] text-white shadow-xs' 
                                    : 'bg-white border-gray-300 text-gray-400'
                                } ${isCurrent ? 'ring-4 ring-emerald-100 scale-110 font-bold' : ''}`}>
                                  {isPassed && idx < currentIdx ? (
                                    <CheckCircle2 className="h-4 w-4" />
                                  ) : (
                                    <span className="text-[10px] font-bold">{idx + 1}</span>
                                  )}
                                </div>
                                <span className={`text-[10.5px] font-extrabold mt-1.5 ${isPassed ? 'text-[#008060]' : 'text-gray-400'}`}>
                                  {step.label}
                                </span>
                                <span className="text-[9px] text-gray-400 max-w-[80px] text-center leading-tight mt-0.5 font-medium">
                                  {step.desc}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Live ETA Box */}
                      <div className="bg-emerald-50/40 rounded-lg border border-emerald-100 p-2.5 flex items-center justify-between text-xs text-[#008060] font-medium animate-fade-in mt-2">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-4 w-4 animate-pulse shrink-0" />
                          <span>
                            {currentStatus === 'accepted' && "Chauffeur prépare le véhicule. Départ imminent."}
                            {currentStatus === 'en_route' && "Chauffeur en route. ETA de récupération : 7 minutes."}
                            {currentStatus === 'picked_up' && "Passager récupéré. Trajet en cours. Arrivée prévue dans 14 minutes."}
                          </span>
                        </div>
                        <span className="bg-[#008060] text-white text-[8px] px-1.5 py-0.5 rounded font-extrabold font-mono uppercase tracking-widest shrink-0">
                          Direct Live
                        </span>
                      </div>

                      {/* Simulation Controls for testing */}
                      <div className="pt-2.5 border-t border-gray-100 flex items-center justify-between flex-wrap gap-2">
                        <span className="text-[9.5px] font-extrabold text-gray-400 uppercase tracking-wider">Simulateur Chauffeur :</span>
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => updateLocalStatus(req.id, 'en_route')}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition duration-150 cursor-pointer ${
                              currentStatus === 'en_route' 
                                ? 'bg-amber-500 text-white border-amber-500 shadow-2xs' 
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            🚗 En Route
                          </button>
                          <button
                            type="button"
                            onClick={() => updateLocalStatus(req.id, 'picked_up')}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition duration-150 cursor-pointer ${
                              currentStatus === 'picked_up' 
                                ? 'bg-blue-500 text-white border-blue-500 shadow-2xs' 
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            🙋 À Bord
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              updateLocalStatus(req.id, 'completed');
                            }}
                            className="px-3.5 py-1.5 rounded-lg text-[10px] font-bold bg-[#008060] text-white hover:bg-[#006e52] border border-transparent shadow-2xs transition duration-150 cursor-pointer"
                          >
                            🏁 Finaliser Course
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Completed view with star ratings and comment logging */
                    <div className="border-t border-gray-150 pt-3 flex flex-col gap-3">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div className="space-y-2 flex-1">
                          <span className="text-[10px] text-gray-400 uppercase font-extrabold tracking-wider block">Évaluation de la mission</span>
                          
                          {req.driverRating ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-gray-150">
                              {/* Driver rating */}
                              <div className="space-y-1">
                                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">👤 Note Chauffeur :</span>
                                <div className="flex items-center gap-1.5 font-medium text-amber-600">
                                  <div className="flex">
                                    {[1, 2, 3, 4, 5].map(star => (
                                      <Star key={star} className={`h-3 w-3 ${star <= (req.driverRating || 0) ? 'fill-amber-500 text-amber-500' : 'text-gray-300'}`} />
                                    ))}
                                  </div>
                                  <span className="font-bold text-gray-800 text-xs">({req.driverRating}/5)</span>
                                </div>
                                {req.driverComment && <p className="text-gray-600 text-[11px] italic">"{req.driverComment}"</p>}
                              </div>

                              {/* Transporter rating */}
                              <div className="space-y-1">
                                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">🏢 Note Transporteur :</span>
                                <div className="flex items-center gap-1.5 font-medium text-amber-600">
                                  <div className="flex">
                                    {[1, 2, 3, 4, 5].map(star => (
                                      <Star key={star} className={`h-3 w-3 ${star <= (req.transporterRating || 0) ? 'fill-amber-500 text-amber-500' : 'text-gray-300'}`} />
                                    ))}
                                  </div>
                                  <span className="font-bold text-gray-800 text-xs">({req.transporterRating || 5}/5)</span>
                                </div>
                                {req.transporterComment && <p className="text-gray-600 text-[11px] italic">"{req.transporterComment}"</p>}
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-orange-600 font-semibold mt-1">⚠️ Mission terminée. Veuillez évaluer votre chauffeur et votre transporteur partenaire.</p>
                          )}
                        </div>

                        <div className="shrink-0">
                          {req.driverRating ? (
                            (() => {
                              const elapsedMs = req.ratingCreatedAt ? (Date.now() - new Date(req.ratingCreatedAt).getTime()) : 0;
                              const timeLeftMin = Math.max(0, Math.ceil((10 * 60 * 1000 - elapsedMs) / 1000 / 60));
                              const canModify = timeLeftMin > 0;

                              return canModify ? (
                                <div className="text-right space-y-1">
                                  <button
                                    onClick={() => setRatingState({
                                      requestId: req.id,
                                      driverRating: req.driverRating || 5,
                                      driverComment: req.driverComment || '',
                                      transporterRating: req.transporterRating || 5,
                                      transporterComment: req.transporterComment || ''
                                    })}
                                    className="rounded-lg bg-slate-900 hover:bg-black px-3 py-1.5 font-bold text-white transition text-[10px] cursor-pointer shadow-xs flex items-center gap-1"
                                  >
                                    ✏️ Modifier l'avis
                                  </button>
                                  <span className="text-[9px] text-amber-600 font-medium block">
                                    Modifiable encore pendant {timeLeftMin} min
                                  </span>
                                </div>
                              ) : (
                                <span className="text-[10px] text-gray-400 font-medium flex items-center gap-1 border border-gray-200 px-2.5 py-1 bg-gray-50 rounded-lg">
                                  🔒 Avis finalisé (RGPD / Anti-Abus)
                                </span>
                              );
                            })()
                          ) : (
                            <button
                              onClick={() => setRatingState({
                                requestId: req.id,
                                driverRating: 5,
                                driverComment: '',
                                transporterRating: 5,
                                transporterComment: ''
                              })}
                              className="rounded-lg bg-slate-900 hover:bg-black px-4 py-2 font-bold text-white transition text-xs cursor-pointer shadow-xs"
                            >
                              ⭐ Noter la Mission
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. EXCURSIONS TAB */}
      {activeTab === 'excursions' && (
        <div className="space-y-6 animate-fade-in text-xs">
          
          {/* Header Banner */}
          <div className="rounded-xl bg-gradient-to-r from-amber-500/10 to-[#008060]/10 p-5 border border-amber-200/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <span className="bg-amber-100 text-amber-800 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border border-amber-200">
                MARKETPLACE EXCURSIONS v1.0
              </span>
              <h3 className="text-base font-bold text-[#1A1A1A] mt-1.5 flex items-center gap-1.5">
                <Compass className="h-5 w-5 text-amber-500 animate-pulse" />
                Plateforme de Réservation d'Excursions & Circuits (Style Viator)
              </h3>
              <p className="text-xs text-[#6D7175] font-medium mt-1">
                Trouvez et réservez des excursions d'exception directement fournies par nos agences de transport VIP locales. Zéro frais caché.
              </p>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="bg-white rounded-xl border border-[#E1E3E5] p-4 shadow-2xs flex flex-col md:flex-row items-center gap-4">
            <div className="w-full md:w-1/3">
              <label className="block text-[10px] font-bold text-[#6D7175] uppercase">Rechercher par mot-clé</label>
              <div className="relative mt-1">
                <input
                  type="text"
                  value={excSearch}
                  onChange={(e) => setExcSearch(e.target.value)}
                  placeholder="Ex: Essaouira, Désert Agafay, Chameau..."
                  className="w-full rounded-lg border border-[#E1E3E5] pl-8 pr-3 py-2 text-xs focus:outline-none focus:border-[#008060]"
                />
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              </div>
            </div>

            <div className="w-full md:w-1/4">
              <label className="block text-[10px] font-bold text-[#6D7175] uppercase">Lieu de départ</label>
              <select
                value={excLocation}
                onChange={(e) => setExcLocation(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#E1E3E5] px-2.5 py-2 text-xs bg-white text-gray-800 focus:outline-none"
              >
                <option value="all">Tous les lieux (Marrakech, Agadir...)</option>
                <option value="marrakech">Marrakech</option>
                <option value="agadir">Agadir</option>
                <option value="ouarzazate">Ouarzazate</option>
              </select>
            </div>

            <div className="w-full md:w-1/4">
              <div className="flex justify-between text-[10px] font-bold text-[#6D7175] uppercase">
                <span>Budget Max</span>
                <span className="text-emerald-700 font-extrabold">{excMaxPrice} DHS</span>
              </div>
              <input
                type="range"
                min="200"
                max="3000"
                step="50"
                value={excMaxPrice}
                onChange={(e) => setExcMaxPrice(Number(e.target.value))}
                className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer mt-3 accent-[#008060]"
              />
            </div>
            
            <div className="w-full md:w-1/6 flex items-end justify-end h-full">
              <button
                onClick={() => {
                  setExcSearch('');
                  setExcLocation('all');
                  setExcMaxPrice(3000);
                }}
                className="text-[11px] font-extrabold text-[#008060] hover:underline"
              >
                Réinitialiser
              </button>
            </div>
          </div>

          {/* Excursions Cards Grid */}
          <div className="grid gap-6 md:grid-cols-3">
            {excursions
              .filter(exc => exc.isActive)
              .filter(exc => {
                if (excLocation !== 'all' && exc.location.toLowerCase() !== excLocation) return false;
                if (excSearch && !exc.title.toLowerCase().includes(excSearch.toLowerCase()) && !exc.description.toLowerCase().includes(excSearch.toLowerCase())) return false;
                if (exc.priceDHS > excMaxPrice) return false;
                return true;
              })
              .length === 0 ? (
              <div className="col-span-3 text-center py-12 bg-white rounded-xl border border-[#E1E3E5]">
                <Compass className="h-12 w-12 text-gray-300 mx-auto animate-pulse" />
                <h4 className="font-bold text-gray-800 mt-3 text-sm">Aucun circuit ne correspond à vos critères de recherche.</h4>
                <p className="text-gray-500 mt-1">Essayez d'élargir vos filtres ou d'augmenter le budget maximum.</p>
              </div>
            ) : (
              excursions
                .filter(exc => exc.isActive)
                .filter(exc => {
                  if (excLocation !== 'all' && exc.location.toLowerCase() !== excLocation) return false;
                  if (excSearch && !exc.title.toLowerCase().includes(excSearch.toLowerCase()) && !exc.description.toLowerCase().includes(excSearch.toLowerCase())) return false;
                  if (exc.priceDHS > excMaxPrice) return false;
                  return true;
                })
                .map(exc => {
                  const partnerWebsite = websites.find(w => w.transporterId === exc.transporterId);
                  return (
                    <div key={exc.id} className="bg-white border border-[#E1E3E5] rounded-2xl overflow-hidden shadow-2xs hover:shadow-md transition duration-200 flex flex-col justify-between">
                      <div className="h-44 relative cursor-pointer" onClick={() => setSelectedDetailsExcursion(exc)}>
                        <img src={exc.imageUrl} alt={exc.title} className="w-full h-full object-cover" />
                        <div className="absolute top-3 right-3 bg-white text-slate-900 font-extrabold text-xs px-2.5 py-1 rounded-lg border border-gray-200 shadow-md">
                          {exc.priceDHS} DHS <span className="text-[9px] text-gray-400 font-medium">/ client</span>
                        </div>
                        <div className="absolute bottom-3 left-3 bg-amber-500 text-white font-bold text-[9.5px] px-2.5 py-1 rounded shadow-sm">
                          📍 {exc.location}
                        </div>
                      </div>

                      <div className="p-4 space-y-3.5 flex-1 flex flex-col justify-between">
                        <div className="space-y-2">
                          
                          {/* Transporter / Vendor info */}
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-gray-500 flex items-center gap-1.5">
                              {partnerWebsite?.logoUrl ? (
                                <img 
                                  src={partnerWebsite.logoUrl} 
                                  alt="" 
                                  className="h-4.5 w-4.5 rounded-md object-cover border border-slate-200 shadow-3xs" 
                                />
                              ) : (
                                <Building className="h-3.5 w-3.5 text-[#008060]" style={{ color: partnerWebsite?.primaryColor }} />
                              )}
                              <span style={{ color: partnerWebsite?.primaryColor }}>{exc.transporterName}</span>
                            </span>
                            {partnerWebsite?.customDomain && (
                              <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200 rounded px-1.5 font-mono font-bold flex items-center gap-0.5" style={{ color: partnerWebsite?.primaryColor, borderColor: partnerWebsite?.primaryColor + '40', backgroundColor: partnerWebsite?.primaryColor + '0d' }}>
                                <Globe className="h-2.5 w-2.5" />
                                {partnerWebsite.customDomain}
                              </span>
                            )}
                          </div>

                          <div className="flex justify-between items-center text-[10px] font-bold text-gray-400">
                            <span>⌛ {exc.duration}</span>
                            <span className="flex items-center gap-1">
                              <span className="text-amber-500">★ 4.9 (214 avis)</span>
                              {partnerWebsite?.tripadvisorUrl && (
                                <a 
                                  href={partnerWebsite.tripadvisorUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="text-[#00AF87] font-black underline hover:text-emerald-700"
                                >
                                  TripAdvisor
                                </a>
                              )}
                            </span>
                          </div>

                          <h4 className="font-extrabold text-[#1A1A1A] text-xs leading-snug hover:text-[#008060] cursor-pointer" onClick={() => setSelectedDetailsExcursion(exc)}>{exc.title}</h4>
                          <p className="text-[10.5px] text-gray-500 leading-relaxed line-clamp-3 font-medium cursor-pointer" onClick={() => setSelectedDetailsExcursion(exc)}>{exc.description}</p>
                          
                          {/* Highlights bullet list */}
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-150 space-y-1 cursor-pointer" onClick={() => setSelectedDetailsExcursion(exc)}>
                            <span className="text-[9px] font-extrabold text-slate-700 uppercase tracking-wider block">Points forts du circuit :</span>
                            <ul className="space-y-0.5">
                              {exc.highlights.slice(0, 3).map((hl, i) => (
                                <li key={i} className="text-[9.5px] text-slate-600 flex items-start gap-1">
                                  <span className="text-emerald-500 mt-0.5" style={{ color: partnerWebsite?.primaryColor }}>✓</span> <span className="truncate">{hl}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-[#E1E3E5] flex flex-col gap-2">
                          <div className="flex justify-between items-center text-[10px] text-gray-400 font-bold">
                            <span>Max : {exc.maxPax} voyageurs</span>
                            <span>Direct Transporteur</span>
                          </div>

                          <div className="grid grid-cols-3 gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedDetailsExcursion(exc)}
                              className="py-1.5 text-slate-700 border border-slate-200 bg-slate-50 font-bold text-[10px] rounded-lg hover:bg-slate-100 transition flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Eye className="h-3 w-3 text-slate-500" />
                              Détails
                            </button>

                            <a
                              href={`https://wa.me/${partnerWebsite?.contactPhone.replace(/[^0-9]/g, '').replace(/^0/, '212') || '212600000000'}?text=${encodeURIComponent(
                                `Bonjour ${exc.transporterName}, je souhaite réserver l'excursion "${exc.title}" (${exc.priceDHS} DHS / client) via WhatsApp. Pouvez-vous me confirmer la disponibilité ?`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="py-1.5 bg-[#25D366] text-white font-bold text-[10px] rounded-lg hover:bg-[#20ba56] transition flex items-center justify-center gap-1 shadow-3xs uppercase tracking-wider text-center"
                            >
                              <MessageSquare className="h-3.5 w-3.5" />
                              WhatsApp
                            </a>

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedExcForBooking(exc);
                                setBookingForm({
                                  ...bookingForm,
                                  clientName: 'Hôtel Royal Mansour (Conciergerie)',
                                  clientPhone: '+212 5 24 38 78 78',
                                  clientEmail: 'concierge@royalmansour.ma',
                                  date: new Date().toISOString().split('T')[0],
                                  paxCount: 2
                                });
                              }}
                              className="py-1.5 text-white font-bold text-[10px] rounded-lg hover:opacity-90 cursor-pointer transition shadow-3xs flex items-center justify-center gap-1"
                              style={{ backgroundColor: partnerWebsite?.primaryColor || '#008060' }}
                            >
                              <Calendar className="h-3 w-3" />
                              Réserver
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
            )}
          </div>

          {/* Client Booking Modal Overlay */}
          {selectedExcForBooking && (
            <div className="fixed inset-0 bg-[#1A1A1A]/75 backdrop-blur-xs flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl border border-[#E1E3E5] w-full max-w-md shadow-2xl overflow-hidden animate-fade-in flex flex-col">
                <div className="p-4 bg-slate-50 border-b border-[#E1E3E5] flex justify-between items-center shrink-0">
                  <h4 className="text-xs font-black text-[#1A1A1A] flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-[#008060]" />
                    Réservation Excursion : {selectedExcForBooking.title}
                  </h4>
                  <button 
                    type="button"
                    onClick={() => setSelectedExcForBooking(null)}
                    className="text-gray-500 hover:text-gray-800 font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    onBookExcursion({
                      excursionId: selectedExcForBooking.id,
                      excursionTitle: selectedExcForBooking.title,
                      transporterId: selectedExcForBooking.transporterId,
                      transporterName: selectedExcForBooking.transporterName,
                      clientName: bookingForm.clientName,
                      clientPhone: bookingForm.clientPhone,
                      clientEmail: bookingForm.clientEmail,
                      date: bookingForm.date,
                      paxCount: Number(bookingForm.paxCount),
                      totalPriceDHS: Number(selectedExcForBooking.priceDHS * bookingForm.paxCount)
                    });
                    setSelectedExcForBooking(null);
                    triggerSuccessBanner("Excursion réservée avec succès ! Le transporteur " + selectedExcForBooking.transporterName + " a reçu la demande d'excursion.");
                  }}
                  className="p-5 space-y-4 text-xs font-medium text-gray-800"
                >
                  <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 flex justify-between items-center">
                    <div>
                      <p className="text-[10px] text-gray-500">Tarif par passager :</p>
                      <p className="text-sm font-black text-[#1A1A1A]">{selectedExcForBooking.priceDHS} DHS</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-gray-500">Total estimé :</p>
                      <p className="text-sm font-black text-[#008060]">{selectedExcForBooking.priceDHS * bookingForm.paxCount} DHS</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#6D7175] uppercase">Nom du client / Voyageur principal</label>
                    <input
                      type="text"
                      required
                      value={bookingForm.clientName}
                      onChange={(e) => setBookingForm({ ...bookingForm, clientName: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-[#E1E3E5] px-3.5 py-2 text-xs focus:outline-none"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-[10px] font-bold text-[#6D7175] uppercase">Téléphone de Contact</label>
                      <input
                        type="text"
                        required
                        value={bookingForm.clientPhone}
                        onChange={(e) => setBookingForm({ ...bookingForm, clientPhone: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-[#E1E3E5] px-3.5 py-2 text-xs focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#6D7175] uppercase">E-mail</label>
                      <input
                        type="email"
                        required
                        value={bookingForm.clientEmail}
                        onChange={(e) => setBookingForm({ ...bookingForm, clientEmail: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-[#E1E3E5] px-3.5 py-2 text-xs focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-[10px] font-bold text-[#6D7175] uppercase">Date de l'excursion</label>
                      <input
                        type="date"
                        required
                        value={bookingForm.date}
                        onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-[#E1E3E5] px-3 py-2 text-xs focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#6D7175] uppercase">Nombre de passagers (Pax)</label>
                      <input
                        type="number"
                        required
                        min="1"
                        max={selectedExcForBooking.maxPax}
                        value={bookingForm.paxCount}
                        onChange={(e) => setBookingForm({ ...bookingForm, paxCount: Number(e.target.value) })}
                        className="mt-1 w-full rounded-lg border border-[#E1E3E5] px-3 py-2 text-xs focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-3 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setSelectedExcForBooking(null)}
                      className="w-1/2 py-2.5 border border-[#E1E3E5] text-gray-700 font-bold rounded-xl hover:bg-gray-50 cursor-pointer"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="w-1/2 py-2.5 bg-[#008060] text-white font-bold rounded-xl hover:bg-[#006e52] cursor-pointer"
                    >
                      Confirmer la Réservation
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      )}

      {/* RATE DRIVER & TRANSPORTER MODAL POPUP */}
      {ratingState.requestId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-xl bg-white p-5 shadow-xl border border-[#E1E3E5] text-left">
            <button 
              onClick={() => setRatingState({
                requestId: null,
                driverRating: 5,
                driverComment: '',
                transporterRating: 5,
                transporterComment: ''
              })}
              className="absolute right-4 top-4 text-[#6D7175] hover:text-[#1A1A1A] text-xl font-bold cursor-pointer"
            >
              ×
            </button>
            <form onSubmit={submitDriverRating} className="space-y-4">
              <div className="text-center">
                <Star className="mx-auto h-8 w-8 text-amber-500 fill-amber-500 mb-2 animate-bounce" />
                <h4 className="font-bold text-[#1A1A1A]">Évaluation Double de la Mission</h4>
                <p className="text-[11px] text-[#6D7175] mt-1 leading-relaxed">
                  Votre avis est précieux. Veuillez évaluer séparément le chauffeur pour sa prestation et l'agence de transport pour sa ponctualité et son service global.
                </p>
              </div>

              {/* 1. CHAUFFEUR (DRIVER) SECTION */}
              <div className="bg-slate-50 p-3 rounded-xl border border-gray-150 space-y-2">
                <span className="text-[10px] font-black text-[#008060] uppercase tracking-wider block">
                  👤 Partie 1 : Le Chauffeur (Conduite, Accueil)
                </span>
                
                {/* Star selection */}
                <div className="flex gap-1.5 py-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRatingState({ ...ratingState, driverRating: star })}
                      className="hover:scale-110 transition duration-150 cursor-pointer"
                    >
                      <Star className={`h-5 w-5 ${star <= ratingState.driverRating ? 'fill-amber-500 text-amber-500' : 'text-gray-300'}`} />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-gray-700 ml-2">{ratingState.driverRating} / 5</span>
                </div>

                <div>
                  <textarea
                    placeholder="Commentaire sur le chauffeur..."
                    value={ratingState.driverComment}
                    onChange={(e) => setRatingState({...ratingState, driverComment: e.target.value})}
                    className="w-full rounded-lg border border-[#E1E3E5] bg-white p-2 text-[11px] text-[#1A1A1A] h-12 focus:outline-none focus:border-[#008060]"
                  />
                </div>
              </div>

              {/* 2. TRANSPORTEUR (CARRIER) SECTION */}
              <div className="bg-slate-50 p-3 rounded-xl border border-gray-150 space-y-2">
                <span className="text-[10px] font-black text-amber-700 uppercase tracking-wider block">
                  🏢 Partie 2 : Le Transporteur (Véhicule, Coordination)
                </span>
                
                {/* Star selection */}
                <div className="flex gap-1.5 py-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRatingState({ ...ratingState, transporterRating: star })}
                      className="hover:scale-110 transition duration-150 cursor-pointer"
                    >
                      <Star className={`h-5 w-5 ${star <= ratingState.transporterRating ? 'fill-amber-500 text-amber-500' : 'text-gray-300'}`} />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-gray-700 ml-2">{ratingState.transporterRating} / 5</span>
                </div>

                <div>
                  <textarea
                    placeholder="Commentaire sur l'agence / véhicule..."
                    value={ratingState.transporterComment}
                    onChange={(e) => setRatingState({...ratingState, transporterComment: e.target.value})}
                    className="w-full rounded-lg border border-[#E1E3E5] bg-white p-2 text-[11px] text-[#1A1A1A] h-12 focus:outline-none focus:border-[#008060]"
                  />
                </div>
              </div>

              <div className="flex gap-2 text-[9px] text-[#6D7175] items-start bg-amber-50 border border-amber-200/50 p-2.5 rounded-lg">
                <span>🛡️</span>
                <p>
                  <strong>Sécurité anti-abus :</strong> Un seul avis par mission. Une fois validée, l'évaluation est modifiable pendant 10 minutes uniquement, après quoi elle sera verrouillée.
                </p>
              </div>

              <button type="submit" className="w-full rounded-lg bg-[#008060] py-2.5 text-xs font-bold text-white hover:bg-[#006e52] transition shadow-xs cursor-pointer">
                Soumettre l'évaluation double
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DETAILED EXCURSION DETAILS & VIDEO MODAL */}
      {selectedDetailsExcursion && (
        <div className="fixed inset-0 bg-[#1A1A1A]/90 backdrop-blur-md flex items-center justify-center z-55 p-2 sm:p-4">
          <div className="bg-white rounded-2xl border border-gray-200 w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-xs">
            
            {/* Header */}
            <div className="p-4 bg-slate-900 border-b border-slate-950 flex justify-between items-center shrink-0 text-white">
              <div className="flex items-center gap-2">
                <Compass className="h-5 w-5 text-amber-400 animate-spin-slow" />
                <span className="font-black uppercase tracking-wider text-[11px]">Détails de l'Excursion</span>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedDetailsExcursion(null)}
                className="text-slate-400 hover:text-white font-black bg-slate-800 h-7 w-7 rounded-full flex items-center justify-center cursor-pointer text-xs"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
              {/* Big Cover Image */}
              <div className="relative h-56 rounded-xl overflow-hidden shadow-sm border border-slate-200">
                <img src={selectedDetailsExcursion.imageUrl} alt={selectedDetailsExcursion.title} className="w-full h-full object-cover" />
                <div className="absolute top-3 right-3 bg-white text-slate-900 font-extrabold text-xs px-3 py-1.5 rounded-lg border border-gray-200 shadow-md">
                  Dès <span className="text-emerald-600 font-black">{selectedDetailsExcursion.priceDHS} DHS</span>
                </div>
                <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-xs text-white text-[10px] font-black px-2.5 py-1 rounded">
                  📍 {selectedDetailsExcursion.location}
                </div>
              </div>

              {/* Title & Metadata */}
              <div className="space-y-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                  {selectedDetailsExcursion.title}
                </h2>
                <div className="flex flex-wrap gap-4 text-[10.5px] text-slate-500 font-bold border-b border-slate-100 pb-3">
                  <span className="flex items-center gap-1">⌛ Durée : {selectedDetailsExcursion.duration}</span>
                  <span className="flex items-center gap-1">👥 Max Voyageurs : {selectedDetailsExcursion.maxPax}</span>
                  <span className="flex items-center gap-0.5 text-amber-500">★ 4.9 (214 avis)</span>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h4 className="font-extrabold text-slate-800 uppercase tracking-wider text-[10px]">Description de l'itinéraire</h4>
                <p className="text-slate-600 leading-relaxed font-medium text-[11px] whitespace-pre-line bg-slate-50 p-4 rounded-xl border border-slate-100">
                  {selectedDetailsExcursion.description}
                </p>
              </div>

              {/* YouTube Video Section */}
              {selectedDetailsExcursion.youtubeUrl && (
                <div className="space-y-2.5">
                  <h4 className="font-extrabold text-slate-800 uppercase tracking-wider text-[10px] flex items-center gap-1 text-red-600">
                    🎬 Vidéo de présentation & Aperçu
                  </h4>
                  {(() => {
                    const getEmbedUrl = (url: string) => {
                      if (!url) return null;
                      let videoId = '';
                      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
                      const match = url.match(regExp);
                      if (match && match[2].length === 11) {
                        videoId = match[2];
                      } else {
                        return null;
                      }
                      return `https://www.youtube.com/embed/${videoId}`;
                    };
                    const embedUrl = getEmbedUrl(selectedDetailsExcursion.youtubeUrl);
                    if (embedUrl) {
                      return (
                        <iframe
                          className="w-full aspect-video rounded-xl border border-slate-200 shadow-sm"
                          src={embedUrl}
                          title="YouTube video player"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        ></iframe>
                      );
                    } else {
                      return (
                        <a 
                          href={selectedDetailsExcursion.youtubeUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="block p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl font-bold hover:bg-red-100 transition text-center"
                        >
                          ▶ Ouvrir la vidéo sur YouTube : {selectedDetailsExcursion.youtubeUrl}
                        </a>
                      );
                    }
                  })()}
                </div>
              )}

              {/* Highlights, Includes & Excludes */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 space-y-2">
                  <h5 className="font-extrabold text-emerald-800 text-[9.5px] uppercase tracking-wider">Points Forts</h5>
                  <ul className="space-y-1">
                    {selectedDetailsExcursion.highlights.map((hl, i) => (
                      <li key={i} className="text-[10px] text-slate-700 font-medium flex items-start gap-1">
                        <span className="text-emerald-600 mt-0.5">✓</span>
                        <span>{hl}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100 space-y-2">
                  <h5 className="font-extrabold text-blue-800 text-[9.5px] uppercase tracking-wider">Inclus</h5>
                  <ul className="space-y-1">
                    {selectedDetailsExcursion.includes.map((inc, i) => (
                      <li key={i} className="text-[10px] text-slate-700 font-medium flex items-start gap-1">
                        <span className="text-blue-600 mt-0.5">✓</span>
                        <span>{inc}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-rose-50/50 p-3 rounded-xl border border-rose-100 space-y-2">
                  <h5 className="font-extrabold text-rose-800 text-[9.5px] uppercase tracking-wider">Non Inclus</h5>
                  <ul className="space-y-1">
                    {selectedDetailsExcursion.excludes.map((exc, i) => (
                      <li key={i} className="text-[10px] text-slate-700 font-medium flex items-start gap-1">
                        <span className="text-rose-600 mt-0.5">✕</span>
                        <span>{exc}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Footer and Booking Options */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
              <span className="text-[10.5px] text-slate-500 font-bold">
                Tarif direct transporteur : <span className="text-slate-900 font-black">{selectedDetailsExcursion.priceDHS} DHS</span>
              </span>

              <div className="flex gap-2">
                {/* WhatsApp Reservation Button */}
                {(() => {
                  const partnerWebsite = websites.find(w => w.transporterId === selectedDetailsExcursion.transporterId);
                  return (
                    <a
                      href={`https://wa.me/${partnerWebsite?.contactPhone.replace(/[^0-9]/g, '').replace(/^0/, '212') || '212600000000'}?text=${encodeURIComponent(
                        `Bonjour ${selectedDetailsExcursion.transporterName}, je souhaite réserver l'excursion "${selectedDetailsExcursion.title}" (${selectedDetailsExcursion.priceDHS} DHS) via WhatsApp. Pouvez-vous me confirmer les disponibilités ?`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-[#25D366] text-white font-extrabold rounded-xl hover:bg-[#20ba56] transition shadow-xs flex items-center gap-1.5 uppercase tracking-wider text-center"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      Réserver WhatsApp
                    </a>
                  );
                })()}

                <button
                  type="button"
                  onClick={() => {
                    const targetExc = selectedDetailsExcursion;
                    setSelectedDetailsExcursion(null);
                    setSelectedExcForBooking(targetExc);
                    setBookingForm({
                      ...bookingForm,
                      clientName: 'Hôtel Royal Mansour (Conciergerie)',
                      clientPhone: '+212 5 24 38 78 78',
                      clientEmail: 'concierge@royalmansour.ma',
                      date: new Date().toISOString().split('T')[0],
                      paxCount: 2
                    });
                  }}
                  className="px-4 py-2 text-white font-extrabold rounded-xl hover:opacity-90 transition shadow-xs flex items-center gap-1.5 uppercase tracking-wider cursor-pointer bg-[#008060]"
                >
                  <Calendar className="h-3.5 w-3.5" />
                  Réserver Direct
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
