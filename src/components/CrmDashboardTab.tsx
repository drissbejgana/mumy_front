import React, { useState } from "react";
import { 
  AlertTriangle, Truck, Users, Landmark, FileText, BadgePercent, MessageSquare, 
  Sparkles, Loader2, CheckCircle, Plus, Trash2, Send, Check, Wrench, Fuel, 
  LayoutDashboard, Search, Eye, PlusCircle, CheckCircle2, Star, Calendar, Clock, MapPin, Phone, Mail, Edit, Heart,
  Download, Share2, Upload, ChevronLeft, ChevronRight, Globe, Compass, ExternalLink, Shield, Award,
  HelpCircle, Info, Database, RefreshCw, Layers
} from "lucide-react";
import { User, Vehicle, Driver, TransportRequest, Bid, FinancialRecord, ExcursionBooking } from "../types";

interface CrmDashboardTabProps {
  vehicles: Vehicle[];
  drivers: Driver[];
  requests: TransportRequest[];
  bids: Bid[];
  finances: FinancialRecord[];
  excursionBookings: ExcursionBooking[];
  currentUser: User;
  onAssignDriver: (requestId: string, driverId: string) => void;
  onUpdateRequestStatus?: (requestId: string, status: any) => void;
  onSubmitBid: (requestId: string, priceDHS: number, vehicleType: string) => void;
  onResetToRealMode?: () => void;
  
  crmSearch: string;
  setCrmSearch: (val: string) => void;
  crmCityFilter: string;
  setCrmCityFilter: (val: string) => void;
  crmServiceTypeFilter: string;
  setCrmServiceTypeFilter: (val: string) => void;
  
  inlinePrices: Record<string, string>;
  setInlinePrices: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  showAddLeadForm: boolean;
  setShowAddLeadForm: (val: boolean) => void;
  newLeadForm: any;
  setNewLeadForm: (val: any) => void;
  selectedInvoiceReq: TransportRequest | null;
  setSelectedInvoiceReq: (req: TransportRequest | null) => void;
  setSuccessMessage: (msg: string | null) => void;
  setActiveTab: (val: any) => void;
  onFlagReview?: (requestId: string, reason: string) => void;
}

export default function CrmDashboardTab({
  vehicles,
  drivers,
  requests,
  bids,
  finances,
  excursionBookings,
  currentUser,
  onAssignDriver,
  onUpdateRequestStatus,
  onSubmitBid,
  onResetToRealMode,
  
  crmSearch,
  setCrmSearch,
  crmCityFilter,
  setCrmCityFilter,
  crmServiceTypeFilter,
  setCrmServiceTypeFilter,
  
  inlinePrices,
  setInlinePrices,
  showAddLeadForm,
  setShowAddLeadForm,
  newLeadForm,
  setNewLeadForm,
  selectedInvoiceReq,
  setSelectedInvoiceReq,
  setSuccessMessage,
  setActiveTab,
  onFlagReview
}: CrmDashboardTabProps) {
  
  // Looker Studio Inspired States
  const [lookerReportView, setLookerReportView] = useState<'portal' | 'active_report'>('active_report');
  const [lookerIsLoading, setLookerIsLoading] = useState<boolean>(false);
  const [lookerShowBeginnerAide, setLookerShowBeginnerAide] = useState<boolean>(true);
  const [crmMobileKanbanColumn, setCrmMobileKanbanColumn] = useState<'all' | 'pending' | 'accepted' | 'en_route' | 'completed'>('all');
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  // Helper helper to round large values to 12.4K DHS or similar
  const formatK = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(",0", "").replace(".", ",") + "K";
    }
    return num.toLocaleString("fr-FR");
  };

  // Simulate refresh data action
  const handleRefresh = () => {
    setLookerIsLoading(true);
    setTimeout(() => {
      setLookerIsLoading(false);
      setSuccessMessage("Rapport actualisé avec succès via Looker Studio Connector v2.4 !");
    }, 850);
  };

  const totalRevenue = finances.filter(f => f.type === 'revenue').reduce((sum, f) => sum + f.amount, 0);
  const missionsTransitCount = requests.filter(r => ['en_route', 'picked_up'].includes(r.status)).length;
  const opportunitiesPendingCount = requests.filter(r => r.status === 'pending').length;
  const fleetFillingRatio = vehicles.length > 0
    ? Math.round((vehicles.filter(v => v.status === 'on_duty').length / vehicles.length) * 100)
    : 0;

  // Custom single-idea tooltips database
  const tooltipsDb: Record<string, { title: string; desc: string }> = {
    revenue: {
      title: "Trésorerie & Revenus Encaissés",
      desc: "Somme cumulée des missions clôturées et payées par vos clients (Agences, Hôtels et Directs)."
    },
    transit: {
      title: "Missions actives en Transit",
      desc: "Missions en cours de réalisation par vos chauffeurs dispatchés sur le terrain."
    },
    leads: {
      title: "Opportunités de Vente (Leads)",
      desc: "Demandes de devis ou réservations en attente d'offre tarifaire ou de validation client."
    },
    filling: {
      title: "Taux de Remplissage Flotte",
      desc: "Pourcentage de vos véhicules actuellement en mission active ou réservés pour la journée."
    }
  };

  const toggleTooltip = (key: string) => {
    if (activeTooltip === key) {
      setActiveTooltip(null);
    } else {
      setActiveTooltip(key);
    }
  };

  return (
    <div className="space-y-6 w-full text-[#1A1A1A] font-sans antialiased">
      
      {/* 1. LOOKER STUDIO INSPIRED PORTAL HEADER */}
      <div className="bg-white border border-[#E1E3E5] px-4 py-3 rounded-2xl shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-[#4285F4]/10 border border-[#4285F4]/20 px-3 py-1.5 rounded-xl">
            <Database className="h-4.5 w-4.5 text-[#4285F4]" />
            <span className="text-[11px] font-black tracking-wider text-[#4285F4] uppercase font-mono">Looker Studio</span>
            <span className="text-[9px] bg-[#4285F4] text-white px-1.5 py-0.2 rounded-md font-extrabold uppercase">Live</span>
          </div>
          <div className="h-6 w-[1px] bg-gray-200 hidden sm:block"></div>
          <div>
            <h2 className="text-sm font-black text-gray-900 flex items-center gap-1.5">
              {lookerReportView === 'active_report' ? "📊 Rapport de Performance Dispatching" : "📂 Mon Portail de Rapports Décisionnels"}
            </h2>
            <p className="text-[10px] text-gray-500 font-semibold">Propulsé par Google Analytics & Local Dispatch API</p>
          </div>
        </div>

        {/* Global Toolbar and Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Toggle Portal / Report View */}
          <button
            onClick={() => setLookerReportView(lookerReportView === 'active_report' ? 'portal' : 'active_report')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 active:scale-95 transition cursor-pointer min-h-[44px]"
            aria-label="Changer de vue portail / rapport"
          >
            <LayoutDashboard className="h-3.5 w-3.5 text-gray-500" />
            <span>{lookerReportView === 'active_report' ? "Voir Galerie Modèles" : "Ouvrir Rapport CRM"}</span>
          </button>

          {/* Guide débutant Toggle */}
          <button
            onClick={() => {
              setLookerShowBeginnerAide(!lookerShowBeginnerAide);
              setSuccessMessage(lookerShowBeginnerAide ? "Guide Débutant désactivé" : "Guide Débutant activé ! Survolez les bulles 💡");
            }}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border transition cursor-pointer min-h-[44px] ${
              lookerShowBeginnerAide 
                ? 'bg-emerald-50 border-emerald-200 text-[#008060] font-black' 
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
            aria-label="Activer l'aide débutant"
          >
            <HelpCircle className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Aide Débutant</span>
            <span className="sm:hidden">Aide</span>
          </button>

          {/* Simulated Refresh */}
          {lookerReportView === 'active_report' && (
            <button
              onClick={handleRefresh}
              disabled={lookerIsLoading}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-black rounded-xl bg-[#008060] text-white hover:bg-[#006e52] active:scale-95 transition cursor-pointer disabled:opacity-50 min-h-[44px]"
              aria-label="Rafraîchir les données du rapport"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${lookerIsLoading ? 'animate-spin' : ''}`} />
              <span>Actualiser</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. LOOKER STUDIO PORTAL HOME PAGE (WHEN 'portal' VIEW IS SELECTED) */}
      {lookerReportView === 'portal' && (
        <div className="space-y-6 animate-fade-in text-left">
          {/* Welcome Banner */}
          <div className="bg-gradient-to-br from-slate-900 to-emerald-950 p-6 rounded-3xl text-white shadow-md relative overflow-hidden">
            <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-80 h-80 rounded-full bg-[#008060]/10 blur-3xl"></div>
            <div className="relative z-10 space-y-3.5 max-w-2xl">
              <span className="bg-white/10 text-emerald-300 border border-white/10 rounded-full text-[10px] px-3 py-1 font-bold uppercase tracking-wider inline-flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" /> Version Pro Active
              </span>
              <h3 className="text-xl sm:text-2xl font-black leading-tight">Pilotez votre Agence de Transport avec des Rapports Décisionnels</h3>
              <p className="text-xs sm:text-sm text-gray-300 font-medium">
                Connectez vos sources de données (site web, formulaires, devis confrères) et générez des tableaux de bord interactifs inspirés des meilleurs modèles Google.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => setLookerReportView('active_report')}
                  className="bg-[#008060] text-white px-5 py-2.5 rounded-xl text-xs font-black hover:bg-[#006e52] active:scale-95 transition shadow-md cursor-pointer flex items-center gap-2"
                >
                  Ouvrir le Rapport Dispatch & CRM principal
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Templates Gallery ("Démarrer avec un modèle" comme Looker Studio) */}
          <div className="space-y-3.5">
            <h4 className="text-sm font-black text-gray-900 tracking-tight flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-[#008060]" />
              Démarrer avec un modèle de rapport professionnel
            </h4>
            
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {/* Template 1: Recommended CRM */}
              <div 
                onClick={() => setLookerReportView('active_report')}
                className="bg-white p-4 rounded-2xl border-2 border-emerald-500/70 shadow-xs hover:shadow-md transition cursor-pointer relative group"
              >
                <div className="h-28 bg-emerald-50 rounded-xl mb-3 flex items-center justify-center border border-emerald-100 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-tr from-emerald-100 to-transparent opacity-60"></div>
                  <Database className="h-10 w-10 text-[#008060] group-hover:scale-110 transition-transform" />
                  <span className="absolute bottom-2 right-2 bg-emerald-700 text-white font-extrabold text-[8px] uppercase px-1.5 py-0.5 rounded">Recommandé</span>
                </div>
                <h5 className="text-xs font-black text-gray-900">Performance Dispatch & CRM</h5>
                <p className="text-[10px] text-gray-500 mt-1 font-semibold">Suivi de la flotte, tarifs des leads et réservations clients en temps réel.</p>
              </div>

              {/* Template 2: Web Traffic */}
              <div 
                onClick={() => {
                  setSuccessMessage("Modèle de Trafic GA4 : Données intégrées à votre Rapport Actif.");
                  setLookerReportView('active_report');
                }}
                className="bg-white p-4 rounded-2xl border border-gray-200 shadow-3xs hover:border-[#008060] hover:shadow-sm transition cursor-pointer group"
              >
                <div className="h-28 bg-blue-50 rounded-xl mb-3 flex items-center justify-center border border-blue-100 relative overflow-hidden">
                  <Globe className="h-10 w-10 text-blue-600 group-hover:scale-110 transition-transform" />
                </div>
                <h5 className="text-xs font-black text-gray-900">Trafic Site Web & Conversions</h5>
                <p className="text-[10px] text-gray-500 mt-1 font-semibold">Statistiques de visites sur vos excursions et provenance de vos prospects.</p>
              </div>

              {/* Template 3: Revenue & Margins */}
              <div 
                onClick={() => {
                  setSuccessMessage("Modèle de Comptabilité chargé avec succès !");
                  setLookerReportView('active_report');
                }}
                className="bg-white p-4 rounded-2xl border border-gray-200 shadow-3xs hover:border-[#008060] hover:shadow-sm transition cursor-pointer group"
              >
                <div className="h-28 bg-amber-50 rounded-xl mb-3 flex items-center justify-center border border-amber-100 relative overflow-hidden">
                  <Landmark className="h-10 w-10 text-amber-600 group-hover:scale-110 transition-transform" />
                </div>
                <h5 className="text-xs font-black text-gray-900">Suivi des Revenus & Dépenses</h5>
                <p className="text-[10px] text-gray-500 mt-1 font-semibold">Analyse comptable des encaissements clients et des coûts d'essence de la flotte.</p>
              </div>

              {/* Template 4: Blank report */}
              <div 
                onClick={() => {
                  setSuccessMessage("Création d'un rapport vierge...");
                  setLookerReportView('active_report');
                }}
                className="bg-white p-4 rounded-2xl border border-gray-200 shadow-3xs hover:border-[#008060] hover:shadow-sm transition cursor-pointer group"
              >
                <div className="h-28 bg-slate-100 rounded-xl mb-3 flex items-center justify-center border border-slate-200 relative overflow-hidden">
                  <PlusCircle className="h-10 w-10 text-slate-500 group-hover:scale-110 transition-transform" />
                </div>
                <h5 className="text-xs font-black text-gray-900">Rapport Vierge (Personnalisé)</h5>
                <p className="text-[10px] text-gray-500 mt-1 font-semibold">Créez votre propre mise en page avec des widgets glisser-déposer.</p>
              </div>
            </div>
          </div>

          {/* Files List Table */}
          <div className="bg-white border border-[#E1E3E5] rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider">Vos Rapports Favoris</h4>
              <span className="text-[10px] bg-gray-100 border text-gray-600 px-2.5 py-0.5 rounded-lg font-bold">4 Éléments</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-600">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-200 font-bold text-gray-500 uppercase tracking-wider text-[9px]">
                    <th className="p-3.5">Nom du Rapport</th>
                    <th className="p-3.5">Propriétaire</th>
                    <th className="p-3.5">Dernière modification</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  <tr className="hover:bg-gray-50 transition">
                    <td className="p-3.5 font-bold text-[#008060] flex items-center gap-2">
                      <FileText className="h-4 w-4 shrink-0 text-[#008060]" />
                      Rapport Dispatching Pro — {currentUser.companyName || currentUser.name}
                    </td>
                    <td className="p-3.5 text-gray-500">Moi</td>
                    <td className="p-3.5 text-gray-500">Aujourd'hui, à {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="p-3.5 text-right">
                      <button onClick={() => setLookerReportView('active_report')} className="text-xs text-[#008060] font-black hover:underline cursor-pointer">Ouvrir</button>
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50 transition">
                    <td className="p-3.5 font-bold text-gray-800 flex items-center gap-2">
                      <FileText className="h-4 w-4 shrink-0 text-gray-400" />
                      Analyse des Excursions Directes Site Web
                    </td>
                    <td className="p-3.5 text-gray-500">Moi</td>
                    <td className="p-3.5 text-gray-500">Hier, 18:30</td>
                    <td className="p-3.5 text-right">
                      <button onClick={() => setLookerReportView('active_report')} className="text-xs text-[#008060] font-black hover:underline cursor-pointer">Ouvrir</button>
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50 transition">
                    <td className="p-3.5 font-bold text-gray-800 flex items-center gap-2">
                      <FileText className="h-4 w-4 shrink-0 text-gray-400" />
                      Marges Nettes & Compta Flotte Q2
                    </td>
                    <td className="p-3.5 text-gray-500">Partagé avec l'équipe</td>
                    <td className="p-3.5 text-gray-500">04 Juil. 2026</td>
                    <td className="p-3.5 text-right">
                      <button onClick={() => setLookerReportView('active_report')} className="text-xs text-[#008060] font-black hover:underline cursor-pointer">Ouvrir</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. ACTIVE REPORT VIEW (LIVE RE-ENGINEERED CRM & DISPATCH DASHBOARD) */}
      {lookerReportView === 'active_report' && (
        <div className="space-y-6 text-left">
          
          {/* Welcome Dashboard Banner */}
          <div className="rounded-2xl bg-gradient-to-r from-emerald-800 via-[#008060] to-emerald-750 p-5 text-white shadow-md relative overflow-hidden">
            <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 rounded-full bg-white/10 blur-2xl"></div>
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <span className="bg-white/20 text-white border border-white/30 rounded-full text-[10px] px-2.5 py-1 font-bold uppercase tracking-wider inline-flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Console de Contrôle Dispatcher
                </span>
                <h3 className="text-lg font-black mt-2">Bienvenue dans votre Espace de Gestion</h3>
                <p className="text-xs text-emerald-100 mt-1 max-w-xl font-medium">
                  Pilotez votre flotte en temps réel, chiffrez les opportunités en attente et assurez un suivi de transit irréprochable pour tous vos passagers.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setNewLeadForm({
                      clientName: '',
                      passengerName: '',
                      origin: 'Marrakech',
                      destination: 'Casablanca',
                      dateTime: new Date().toISOString().slice(0, 16),
                      paxCount: 3,
                      serviceType: 'simple',
                      daysCount: 1,
                      status: 'pending'
                    });
                    setShowAddLeadForm(true);
                  }}
                  className="bg-white text-emerald-900 px-3.5 py-2 rounded-xl text-xs font-black hover:bg-emerald-50 transition shadow-sm cursor-pointer flex items-center gap-1.5 min-h-[44px]"
                >
                  <PlusCircle className="h-4 w-4 text-emerald-700" />
                  Nouveau Lead Direct
                </button>
              </div>
            </div>
          </div>

          {/* SKELETON LOADING MODE (WHEN 'lookerIsLoading' IS ACTIVE) */}
          {lookerIsLoading ? (
            <div className="space-y-6 animate-pulse">
              {/* KPIs Skeletons */}
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="bg-white p-4 rounded-xl border border-gray-200 h-24 space-y-3">
                    <div className="h-3.5 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-6 bg-gray-300 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                  </div>
                ))}
              </div>

              {/* Filters Skeletons */}
              <div className="bg-white p-4 rounded-xl border border-gray-200 h-16 flex gap-4">
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/4"></div>
              </div>

              {/* Pipeline Skeletons */}
              <div className="grid gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map(col => (
                  <div key={col} className="bg-gray-100 p-4 rounded-2xl border border-gray-200 h-[300px] space-y-4">
                    <div className="h-4 bg-gray-300 rounded w-2/3"></div>
                    <div className="h-20 bg-white rounded-xl border"></div>
                    <div className="h-20 bg-white rounded-xl border"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* 4. KEY SCORECARDS WITH HIGHEST VISUAL HIERARCHY */}
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                
                {/* Scorecard 1: Revenus Encaissés */}
                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden hover:shadow-md transition duration-200">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-[#008060]"></div>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-[#EBF5F1] rounded-xl border border-[#BBE3D1]/50 shadow-3xs text-[#008060] shrink-0">
                        <Landmark className="h-4.5 w-4.5" />
                      </div>
                      <span className="text-[11px] font-black text-gray-500 uppercase tracking-wider">
                        Revenus Encaissés
                      </span>
                    </div>
                    {lookerShowBeginnerAide && (
                      <button 
                        onClick={() => toggleTooltip('revenue')}
                        className="text-gray-400 hover:text-gray-600 focus:outline-none p-1 shrink-0"
                        title="En savoir plus"
                      >
                        <Info className="h-3.5 w-3.5 text-gray-400" />
                      </button>
                    )}
                  </div>
                  
                  {/* Huge numeric metric */}
                  <span className="text-2xl sm:text-3xl font-black text-gray-900 mt-2 block tracking-tight">
                    {formatK(totalRevenue)} DHS
                  </span>
                  
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span className="text-[10px] text-emerald-700 font-extrabold bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                      +12,4% ↑
                    </span>
                    <span className="text-[10px] text-gray-400 font-semibold">Tendance vs. 30j</span>
                  </div>

                  {/* Active beginner educational tooltip card */}
                  {lookerShowBeginnerAide && activeTooltip === 'revenue' && (
                    <div className="mt-3 p-2.5 bg-emerald-50 rounded-xl border border-emerald-100 text-[10.5px] text-emerald-950 font-medium animate-fade-in relative">
                      <p className="font-bold">{tooltipsDb.revenue.title}</p>
                      <p className="mt-0.5">{tooltipsDb.revenue.desc}</p>
                      <button onClick={() => setActiveTooltip(null)} className="absolute top-1 right-2 font-black text-emerald-800 hover:text-emerald-900">×</button>
                    </div>
                  )}
                </div>

                {/* Scorecard 2: Missions Transit */}
                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden hover:shadow-md transition duration-200">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-[#EBF5F1] rounded-xl border border-[#BBE3D1]/50 shadow-3xs text-[#008060] shrink-0">
                        <Truck className="h-4.5 w-4.5" />
                      </div>
                      <span className="text-[11px] font-black text-gray-500 uppercase tracking-wider">
                        Missions en Transit
                      </span>
                    </div>
                    {lookerShowBeginnerAide && (
                      <button 
                        onClick={() => toggleTooltip('transit')}
                        className="text-gray-400 hover:text-gray-600 focus:outline-none p-1 shrink-0"
                        title="En savoir plus"
                      >
                        <Info className="h-3.5 w-3.5 text-gray-400" />
                      </button>
                    )}
                  </div>

                  {/* Huge numeric metric */}
                  <span className="text-2xl sm:text-3xl font-black text-blue-600 mt-2 block tracking-tight flex items-center gap-2">
                    {missionsTransitCount} Actives
                    {missionsTransitCount > 0 && (
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping shrink-0" aria-hidden="true"></span>
                    )}
                  </span>

                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span className="text-[10px] text-blue-700 font-extrabold bg-blue-50 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                      +5,3% ↑
                    </span>
                    <span className="text-[10px] text-gray-400 font-semibold">Tendance vs. 7j</span>
                  </div>

                  {/* Active beginner educational tooltip card */}
                  {lookerShowBeginnerAide && activeTooltip === 'transit' && (
                    <div className="mt-3 p-2.5 bg-blue-50 rounded-xl border border-blue-100 text-[10.5px] text-blue-950 font-medium animate-fade-in relative">
                      <p className="font-bold">{tooltipsDb.transit.title}</p>
                      <p className="mt-0.5">{tooltipsDb.transit.desc}</p>
                      <button onClick={() => setActiveTooltip(null)} className="absolute top-1 right-2 font-black text-blue-800 hover:text-blue-900">×</button>
                    </div>
                  )}
                </div>

                {/* Scorecard 3: Opportunités en attente */}
                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden hover:shadow-md transition duration-200">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500"></div>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-[#EBF5F1] rounded-xl border border-[#BBE3D1]/50 shadow-3xs text-[#008060] shrink-0">
                        <FileText className="h-4.5 w-4.5" />
                      </div>
                      <span className="text-[11px] font-black text-gray-500 uppercase tracking-wider">
                        Opportunités (Leads)
                      </span>
                    </div>
                    {lookerShowBeginnerAide && (
                      <button 
                        onClick={() => toggleTooltip('leads')}
                        className="text-gray-400 hover:text-gray-600 focus:outline-none p-1 shrink-0"
                        title="En savoir plus"
                      >
                        <Info className="h-3.5 w-3.5 text-gray-400" />
                      </button>
                    )}
                  </div>

                  {/* Huge numeric metric */}
                  <span className="text-2xl sm:text-3xl font-black text-amber-600 mt-2 block tracking-tight">
                    {opportunitiesPendingCount} Leads
                  </span>

                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span className="text-[10px] text-amber-700 font-extrabold bg-amber-50 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                      -2,1% ↓
                    </span>
                    <span className="text-[10px] text-gray-400 font-semibold">Tendance vs. 7j</span>
                  </div>

                  {/* Active beginner educational tooltip card */}
                  {lookerShowBeginnerAide && activeTooltip === 'leads' && (
                    <div className="mt-3 p-2.5 bg-amber-50 rounded-xl border border-amber-100 text-[10.5px] text-amber-950 font-medium animate-fade-in relative">
                      <p className="font-bold">{tooltipsDb.leads.title}</p>
                      <p className="mt-0.5">{tooltipsDb.leads.desc}</p>
                      <button onClick={() => setActiveTooltip(null)} className="absolute top-1 right-2 font-black text-amber-800 hover:text-amber-900">×</button>
                    </div>
                  )}
                </div>

                {/* Scorecard 4: Taux de Remplissage */}
                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden hover:shadow-md transition duration-200">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-600"></div>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-[#EBF5F1] rounded-xl border border-[#BBE3D1]/50 shadow-3xs text-[#008060] shrink-0">
                        <CheckCircle2 className="h-4.5 w-4.5" />
                      </div>
                      <span className="text-[11px] font-black text-gray-500 uppercase tracking-wider">
                        Taux de Remplissage
                      </span>
                    </div>
                    {lookerShowBeginnerAide && (
                      <button 
                        onClick={() => toggleTooltip('filling')}
                        className="text-gray-400 hover:text-gray-600 focus:outline-none p-1 shrink-0"
                        title="En savoir plus"
                      >
                        <Info className="h-3.5 w-3.5 text-gray-400" />
                      </button>
                    )}
                  </div>

                  {/* Huge numeric metric */}
                  <span className="text-2xl sm:text-3xl font-black text-[#008060] mt-2 block tracking-tight">
                    {fleetFillingRatio} %
                  </span>

                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span className="text-[10px] text-[#008060] font-extrabold bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                      +14,0% ↑
                    </span>
                    <span className="text-[10px] text-gray-400 font-semibold">Tendance vs. 30j</span>
                  </div>

                  {/* Active beginner educational tooltip card */}
                  {lookerShowBeginnerAide && activeTooltip === 'filling' && (
                    <div className="mt-3 p-2.5 bg-emerald-50 rounded-xl border border-emerald-100 text-[10.5px] text-emerald-950 font-medium animate-fade-in relative">
                      <p className="font-bold">{tooltipsDb.filling.title}</p>
                      <p className="mt-0.5">{tooltipsDb.filling.desc}</p>
                      <button onClick={() => setActiveTooltip(null)} className="absolute top-1 right-2 font-black text-emerald-800 hover:text-emerald-900">×</button>
                    </div>
                  )}
                </div>
              </div>

              {/* 5. SEARCH & FILTERING BAR BAR WITH PULL-TO-REFRESH COMPATIBILITY */}
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
                <div className="relative w-full md:w-80">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </span>
                  <input
                    type="text"
                    placeholder="Rechercher client, passager, ville..."
                    value={crmSearch}
                    onChange={(e) => setCrmSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs text-[#1A1A1A] bg-gray-50 hover:bg-gray-100/50 rounded-xl border border-gray-200 focus:bg-white focus:ring-1 focus:ring-[#008060] focus:border-[#008060] focus:outline-none transition-all min-h-[44px]"
                  />
                </div>
                
                <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
                  <select
                    value={crmCityFilter}
                    onChange={(e) => setCrmCityFilter(e.target.value)}
                    className="rounded-xl border border-gray-200 px-3 py-1.5 text-xs bg-white font-semibold text-gray-600 focus:outline-none min-h-[44px]"
                  >
                    <option value="all">📍 Toutes les Villes</option>
                    <option value="marrakech">Marrakech</option>
                    <option value="casablanca">Casablanca</option>
                    <option value="agadir">Agadir</option>
                    <option value="essaouira">Essaouira</option>
                  </select>

                  <select
                    value={crmServiceTypeFilter}
                    onChange={(e) => setCrmServiceTypeFilter(e.target.value)}
                    className="rounded-xl border border-gray-200 px-3 py-1.5 text-xs bg-white font-semibold text-gray-600 focus:outline-none min-h-[44px]"
                  >
                    <option value="all">⚡ Tous les Services</option>
                    <option value="simple">Transfert Simple</option>
                    <option value="round_trip">Aller-Retour</option>
                    <option value="disposal">Mise à Disposition</option>
                  </select>

                  {(crmSearch !== '' || crmCityFilter !== 'all' || crmServiceTypeFilter !== 'all') && (
                    <button
                      onClick={() => {
                        setCrmSearch('');
                        setCrmCityFilter('all');
                        setCrmServiceTypeFilter('all');
                      }}
                      className="text-xs text-rose-600 font-bold hover:underline bg-rose-50 px-3.5 py-1.5 rounded-xl border border-rose-100 min-h-[44px]"
                    >
                      Réinitialiser
                    </button>
                  )}
                </div>
              </div>

              {/* 6. RESPONSIVE MOBILE SCROLLABLE KANBAN SUB-TABS */}
              <div className="block lg:hidden w-full overflow-x-auto no-scrollbar pb-1 border-b border-gray-200">
                <div className="flex gap-1 min-w-max">
                  {[
                    { id: 'all', label: '🗂️ Tout Voir' },
                    { id: 'pending', label: '⏳ Opportunités' },
                    { id: 'accepted', label: '🚙 Assignations' },
                    { id: 'en_route', label: '📍 En Transit' },
                    { id: 'completed', label: '✓ Clôturées' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setCrmMobileKanbanColumn(tab.id as any)}
                      className={`px-4 py-2.5 text-xs font-black rounded-lg border cursor-pointer transition-all min-h-[44px] ${
                        crmMobileKanbanColumn === tab.id 
                          ? 'bg-[#EBF5F1] border-[#BBE3D1] text-[#008060]' 
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 7. RE-ENGINEERED KANBAN BOARD */}
              <div className="grid gap-5 grid-cols-1 lg:grid-cols-4">
                
                {/* COLUMN 1: OPPORTUNITES (Pending) */}
                {(crmMobileKanbanColumn === 'all' || crmMobileKanbanColumn === 'pending') && (
                  <div className="bg-slate-50/75 rounded-2xl border border-gray-200 p-4 space-y-4">
                    <div className="flex justify-between items-center border-b border-gray-200 pb-2.5">
                      <span className="text-xs font-black text-gray-900 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                        Opportunités (Leads)
                      </span>
                      <span className="font-mono text-xs font-black bg-white text-gray-700 px-2.5 py-0.5 rounded-lg border border-gray-200 shadow-2xs">
                        {requests.filter(r => r.status === 'pending').length}
                      </span>
                    </div>

                    <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                      {requests.filter(r => r.status === 'pending').length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200 p-4">
                          <p className="text-xs text-gray-400 font-bold">Aucun lead en attente</p>
                          <p className="text-[10px] text-gray-400 font-semibold mt-1">Créez un nouveau lead direct pour commencer.</p>
                        </div>
                      ) : (
                        requests.filter(r => {
                          const matchesSearch = 
                            (r.passengerName || '').toLowerCase().includes(crmSearch.toLowerCase()) ||
                            (r.clientName || '').toLowerCase().includes(crmSearch.toLowerCase()) ||
                            (r.origin || '').toLowerCase().includes(crmSearch.toLowerCase()) ||
                            (r.destination || '').toLowerCase().includes(crmSearch.toLowerCase()) ||
                            (r.id || '').toLowerCase().includes(crmSearch.toLowerCase());
                          const matchesCity = crmCityFilter === 'all' || 
                            (r.origin || '').toLowerCase().includes(crmCityFilter.toLowerCase()) || 
                            (r.destination || '').toLowerCase().includes(crmCityFilter.toLowerCase());
                          const matchesService = crmServiceTypeFilter === 'all' || r.serviceType === crmServiceTypeFilter;
                          return r.status === 'pending' && matchesSearch && matchesCity && matchesService;
                        }).map(req => {
                          const myBid = bids.find(b => b.requestId === req.id && b.transporterId === currentUser.id);
                          return (
                            <div key={req.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-3xs space-y-3 hover:border-amber-400 focus-within:ring-1 focus-within:ring-amber-400 transition">
                              <div className="flex justify-between items-start">
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-tight block max-w-[120px] truncate">{req.clientName}</span>
                                <span className="text-[9px] font-black text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg uppercase tracking-wider shrink-0">Chiffrer</span>
                              </div>
                              <div>
                                <p className="text-xs font-black text-gray-900 flex items-center gap-1">
                                  {req.origin} <span className="text-gray-400">→</span> {req.destination}
                                </p>
                                <p className="text-[10px] text-gray-500 font-medium flex items-center gap-1 mt-1">
                                  <Calendar className="h-3.5 w-3.5 text-gray-400" /> 
                                  {new Date(req.dateTime).toLocaleString('fr-FR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                              <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-150 flex justify-between items-center text-[10px] text-gray-600 font-bold">
                                <span>Passager: <strong className="text-gray-900 font-black">{req.passengerName}</strong></span>
                                <span>{req.paxCount} Pax</span>
                              </div>

                              {myBid ? (
                                <div className="bg-emerald-50 border border-emerald-200 p-2 rounded-lg text-center">
                                  <span className="text-[10px] font-black text-emerald-800 block">Offre Envoyée ✓</span>
                                  <span className="text-[11px] font-black text-emerald-900 block mt-0.5">{myBid.priceDHS} DHS ({myBid.status})</span>
                                </div>
                              ) : (
                                <div className="pt-2 border-t border-gray-100 space-y-2">
                                  <div className="flex gap-1.5">
                                    <input
                                      type="number"
                                      placeholder="Tarif en DHS"
                                      value={inlinePrices[req.id] || ''}
                                      onChange={(e) => setInlinePrices({ ...inlinePrices, [req.id]: e.target.value })}
                                      className="w-1/2 px-2.5 py-1.5 text-xs text-gray-900 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:bg-white text-center font-bold"
                                    />
                                    <button
                                      onClick={() => {
                                        const price = Number(inlinePrices[req.id]);
                                        if (!price || price <= 0) {
                                          alert("Veuillez saisir un tarif valide en DHS.");
                                          return;
                                        }
                                        onSubmitBid(req.id, price, "Minibus Touristique");
                                        setSuccessMessage(`Offre de ${price} DHS soumise pour ${req.passengerName} !`);
                                      }}
                                      className="w-1/2 bg-[#008060] text-white py-1.5 text-[10px] font-black rounded-lg text-center hover:bg-[#006e52] transition shadow-2xs"
                                    >
                                      Envoyer Offre
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {/* COLUMN 2: CONFIRMES / DISPATCH REQUIRED */}
                {(crmMobileKanbanColumn === 'all' || crmMobileKanbanColumn === 'accepted') && (
                  <div className="bg-slate-50/75 rounded-2xl border border-gray-200 p-4 space-y-4">
                    <div className="flex justify-between items-center border-b border-gray-200 pb-2.5">
                      <span className="text-xs font-black text-gray-900 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                        Dispatch & Assignation
                      </span>
                      <span className="font-mono text-xs font-black bg-white text-gray-700 px-2.5 py-0.5 rounded-lg border border-gray-200 shadow-2xs">
                        {requests.filter(r => r.status === 'accepted').length}
                      </span>
                    </div>

                    <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                      {requests.filter(r => r.status === 'accepted').length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200 p-4">
                          <p className="text-xs text-gray-400 font-bold">Aucune mission à assigner</p>
                          <p className="text-[10px] text-gray-400 font-semibold mt-1">Tous vos départs sont assignés.</p>
                        </div>
                      ) : (
                        requests.filter(r => {
                          const matchesSearch = 
                            (r.passengerName || '').toLowerCase().includes(crmSearch.toLowerCase()) ||
                            (r.clientName || '').toLowerCase().includes(crmSearch.toLowerCase()) ||
                            (r.origin || '').toLowerCase().includes(crmSearch.toLowerCase()) ||
                            (r.destination || '').toLowerCase().includes(crmSearch.toLowerCase()) ||
                            (r.id || '').toLowerCase().includes(crmSearch.toLowerCase());
                          const matchesCity = crmCityFilter === 'all' || 
                            (r.origin || '').toLowerCase().includes(crmCityFilter.toLowerCase()) || 
                            (r.destination || '').toLowerCase().includes(crmCityFilter.toLowerCase());
                          const matchesService = crmServiceTypeFilter === 'all' || r.serviceType === crmServiceTypeFilter;
                          return r.status === 'accepted' && matchesSearch && matchesCity && matchesService;
                        }).map(req => {
                          const assignedDriver = drivers.find(d => d.id === req.assignedDriverId);
                          const assignedVehicle = vehicles.find(v => v.id === req.assignedVehicleId);
                          return (
                            <div key={req.id} className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-3xs space-y-3 hover:border-blue-400 transition">
                              <div className="flex justify-between items-start">
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-tight block max-w-[120px] truncate">{req.clientName}</span>
                                <span className="text-[9px] font-black text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-lg uppercase tracking-wider shrink-0">Confirmé</span>
                              </div>
                              <div>
                                <p className="text-xs font-black text-gray-900 flex items-center gap-1">
                                  {req.origin} <span className="text-gray-400">→</span> {req.destination}
                                </p>
                                <p className="text-[10px] text-gray-500 font-medium flex items-center gap-1 mt-1">
                                  <Clock className="h-3.5 w-3.5 text-gray-400" /> 
                                  {new Date(req.dateTime).toLocaleString('fr-FR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>

                              {/* Interactive Assign Selector */}
                              <div className="pt-2 border-t border-gray-100 space-y-2">
                                <div>
                                  <label className="block text-[9px] font-black text-gray-500 uppercase tracking-wider mb-1">Chauffeur Assigné</label>
                                  <select
                                    value={req.assignedDriverId || ''}
                                    onChange={(e) => {
                                      onAssignDriver(req.id, e.target.value);
                                      setSuccessMessage("Chauffeur et véhicule de rotation assignés avec succès !");
                                    }}
                                    className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs bg-gray-50 text-gray-800 focus:outline-none focus:bg-white font-bold min-h-[44px]"
                                  >
                                    <option value="">-- Assigner Chauffeur --</option>
                                    {drivers.map(d => (
                                      <option key={d.id} value={d.id}>{d.name} ({d.rating} ★)</option>
                                    ))}
                                  </select>
                                </div>

                                {assignedDriver && (
                                  <div className="bg-slate-50 p-2.5 rounded-lg border border-gray-200 flex justify-between items-center text-[10px] text-gray-700">
                                    <div className="flex items-center gap-1.5">
                                      <img src={assignedDriver.avatarUrl} className="h-6 w-6 rounded-full object-cover border border-gray-200" alt={assignedDriver.name} referrerPolicy="no-referrer" />
                                      <div>
                                        <strong className="text-gray-900 font-bold block">{assignedDriver.name.split(' ')[0]}</strong>
                                        <span className="text-[8.5px] text-gray-400 block font-mono">{assignedVehicle?.brand || 'Véhicule automatique'}</span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <a 
                                        href={`https://wa.me/${assignedDriver.phone.replace(/[^0-9]/g, '').replace(/^0/, '212')}?text=${encodeURIComponent(
                                          `Mission Dispatchée!\nChauffeur: ${assignedDriver.name}\nItinéraire: ${req.origin} vers ${req.destination}\nPassager: ${req.passengerName}\nDate/Heure: ${new Date(req.dateTime).toLocaleString('fr-FR')}`
                                        )}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 bg-[#25D366] text-white hover:bg-[#20ba56] rounded-md transition inline-flex items-center justify-center min-h-[44px] min-w-[44px]"
                                        title="WhatsApp Chauffeur"
                                      >
                                        <Phone className="h-3.5 w-3.5" />
                                      </a>
                                    </div>
                                  </div>
                                )}

                                {onUpdateRequestStatus && (
                                  <button
                                    onClick={() => {
                                      if (!req.assignedDriverId) {
                                        alert("Veuillez d'abord assigner un chauffeur pour commencer la mission.");
                                        return;
                                      }
                                      onUpdateRequestStatus(req.id, 'en_route');
                                      setSuccessMessage(`Course démarrée ! Chauffeur ${assignedDriver?.name} en route.`);
                                    }}
                                    className="w-full bg-emerald-700 text-white py-2 text-[10px] font-black rounded-lg text-center hover:bg-emerald-800 transition shadow-2xs flex items-center justify-center gap-1 min-h-[44px]"
                                  >
                                    <span>▶ Démarrer la Mission</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {/* COLUMN 3: EN TRANSIT / ACTIVES */}
                {(crmMobileKanbanColumn === 'all' || crmMobileKanbanColumn === 'en_route') && (
                  <div className="bg-slate-50/75 rounded-2xl border border-gray-200 p-4 space-y-4">
                    <div className="flex justify-between items-center border-b border-gray-200 pb-2.5">
                      <span className="text-xs font-black text-gray-900 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        En Transit Actif
                      </span>
                      <span className="font-mono text-xs font-black bg-white text-gray-700 px-2.5 py-0.5 rounded-lg border border-gray-200 shadow-2xs">
                        {requests.filter(r => ['en_route', 'picked_up'].includes(r.status)).length}
                      </span>
                    </div>

                    <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                      {requests.filter(r => ['en_route', 'picked_up'].includes(r.status)).length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200 p-4">
                          <p className="text-xs text-gray-400 font-bold">Aucune course active</p>
                          <p className="text-[10px] text-gray-400 font-semibold mt-1">Les missions démarrées s'affichent ici.</p>
                        </div>
                      ) : (
                        requests.filter(r => {
                          const matchesSearch = 
                            (r.passengerName || '').toLowerCase().includes(crmSearch.toLowerCase()) ||
                            (r.clientName || '').toLowerCase().includes(crmSearch.toLowerCase()) ||
                            (r.origin || '').toLowerCase().includes(crmSearch.toLowerCase()) ||
                            (r.destination || '').toLowerCase().includes(crmSearch.toLowerCase()) ||
                            (r.id || '').toLowerCase().includes(crmSearch.toLowerCase());
                          const matchesCity = crmCityFilter === 'all' || 
                            (r.origin || '').toLowerCase().includes(crmCityFilter.toLowerCase()) || 
                            (r.destination || '').toLowerCase().includes(crmCityFilter.toLowerCase());
                          const matchesService = crmServiceTypeFilter === 'all' || r.serviceType === crmServiceTypeFilter;
                          return ['en_route', 'picked_up'].includes(r.status) && matchesSearch && matchesCity && matchesService;
                        }).map(req => {
                          const driver = drivers.find(d => d.id === req.assignedDriverId);
                          const vehicle = vehicles.find(v => v.id === req.assignedVehicleId);
                          return (
                            <div key={req.id} className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-3xs border-l-4 border-l-[#008060] hover:shadow-2xs transition">
                              <div className="flex justify-between items-start">
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-tight block max-w-[120px] truncate">{req.clientName}</span>
                                <span className="text-[9px] font-black text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg uppercase tracking-wider shrink-0 animate-pulse">
                                  {req.status === 'en_route' ? 'En Route' : 'Pris en charge'}
                                </span>
                              </div>
                              <div>
                                <p className="text-xs font-black text-gray-900 flex items-center gap-1">
                                  {req.origin} <span className="text-gray-400">→</span> {req.destination}
                                </p>
                              </div>

                              <div className="bg-slate-50 p-2.5 rounded-lg border border-gray-200 text-[10px] text-gray-700 space-y-1.5">
                                <p className="flex justify-between">
                                  <span className="font-medium text-gray-400">Chauffeur:</span>
                                  <span className="font-extrabold text-gray-900">{driver?.name}</span>
                                </p>
                                <p className="flex justify-between">
                                  <span className="font-medium text-gray-400">Véhicule:</span>
                                  <span className="font-extrabold text-gray-900 font-mono">{vehicle?.brand} ({vehicle?.plate})</span>
                                </p>
                                <p className="flex justify-between">
                                  <span className="font-medium text-gray-400">Passager:</span>
                                  <span className="font-extrabold text-gray-900">{req.passengerName}</span>
                                </p>
                              </div>

                              {/* Direct Stage updates buttons (Saves switching tabs!) */}
                              {onUpdateRequestStatus && (
                                <div className="pt-2 border-t border-gray-100 flex gap-2">
                                  {req.status === 'en_route' ? (
                                    <button
                                      onClick={() => {
                                        onUpdateRequestStatus(req.id, 'picked_up');
                                        setSuccessMessage(`Passager ${req.passengerName} pris en charge avec succès !`);
                                      }}
                                      className="w-full bg-blue-600 text-white py-2 rounded-lg text-[10px] font-black hover:bg-blue-700 transition flex items-center justify-center gap-1 min-h-[44px]"
                                    >
                                      👥 Pris en Charge
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        onUpdateRequestStatus(req.id, 'completed');
                                        setSuccessMessage(`Mission terminée avec succès ! Facture disponible.`);
                                      }}
                                      className="w-full bg-[#008060] text-white py-2 rounded-lg text-[10px] font-black hover:bg-[#006e52] transition flex items-center justify-center gap-1 min-h-[44px]"
                                    >
                                      🏁 Clôturer / Terminé
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {/* COLUMN 4: TERMINALES / REVENUE ARCHIVES */}
                {(crmMobileKanbanColumn === 'all' || crmMobileKanbanColumn === 'completed') && (
                  <div className="bg-slate-50/75 rounded-2xl border border-gray-200 p-4 space-y-4">
                    <div className="flex justify-between items-center border-b border-gray-200 pb-2.5">
                      <span className="text-xs font-black text-gray-900 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-gray-400"></span>
                        Missions Terminées
                      </span>
                      <span className="font-mono text-xs font-black bg-white text-gray-700 px-2.5 py-0.5 rounded-lg border border-gray-200 shadow-2xs">
                        {requests.filter(r => r.status === 'completed').length}
                      </span>
                    </div>

                    <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                      {requests.filter(r => r.status === 'completed').length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200 p-4">
                          <p className="text-xs text-gray-400 font-bold">Aucune course terminée</p>
                          <p className="text-[10px] text-gray-400 font-semibold mt-1">Clôturez vos missions pour encaisser.</p>
                        </div>
                      ) : (
                        requests.filter(r => {
                          const matchesSearch = 
                            (r.passengerName || '').toLowerCase().includes(crmSearch.toLowerCase()) ||
                            (r.clientName || '').toLowerCase().includes(crmSearch.toLowerCase()) ||
                            (r.origin || '').toLowerCase().includes(crmSearch.toLowerCase()) ||
                            (r.destination || '').toLowerCase().includes(crmSearch.toLowerCase()) ||
                            (r.id || '').toLowerCase().includes(crmSearch.toLowerCase());
                          const matchesCity = crmCityFilter === 'all' || 
                            (r.origin || '').toLowerCase().includes(crmCityFilter.toLowerCase()) || 
                            (r.destination || '').toLowerCase().includes(crmCityFilter.toLowerCase());
                          const matchesService = crmServiceTypeFilter === 'all' || r.serviceType === crmServiceTypeFilter;
                          return r.status === 'completed' && matchesSearch && matchesCity && matchesService;
                        }).map(req => {
                          return (
                            <div key={req.id} className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-3xs opacity-90 space-y-3 hover:border-emerald-500 hover:opacity-100 transition">
                              <div className="flex justify-between items-start">
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-tight block max-w-[120px] truncate">{req.clientName}</span>
                                <span className="text-[9px] font-black text-emerald-800 bg-emerald-50 border border-emerald-150 px-2 py-0.5 rounded-lg uppercase tracking-wider shrink-0">Clôturé</span>
                              </div>
                              <div>
                                <p className="text-xs font-black text-gray-900 flex items-center gap-1">
                                  {req.origin} <span className="text-gray-400">→</span> {req.destination}
                                </p>
                              </div>
                              
                              <div className="flex flex-wrap gap-1.5 items-center justify-between text-[10px]">
                                <span className="text-emerald-700 font-extrabold bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-100">
                                  Facturé & Encaissé ✓
                                </span>
                                <button
                                  onClick={() => setSelectedInvoiceReq(req)}
                                  className="text-[#008060] font-black hover:underline cursor-pointer flex items-center gap-0.5 min-h-[44px]"
                                  aria-label={`Ouvrir facture pour ${req.passengerName}`}
                                >
                                  <FileText className="h-3.5 w-3.5" /> Facture
                                </button>
                              </div>

                              {req.driverRating && (
                                <div className="flex flex-col gap-1.5 text-[10px] bg-slate-50 p-2.5 rounded-lg border border-gray-150">
                                  <div className="flex items-center justify-between border-b border-gray-200 pb-1">
                                    <span className="font-extrabold text-[#008060] uppercase text-[8px]">👤 Chauffeur: {req.driverRating}/5</span>
                                    <span className="font-extrabold text-amber-700 uppercase text-[8px]">🏢 Transp.: {req.transporterRating || 5}/5</span>
                                  </div>
                                  
                                  <div className="space-y-1">
                                    {req.driverComment && (
                                      <p className="text-gray-600"><span className="text-gray-400">Chauffeur:</span> "{req.driverComment}"</p>
                                    )}
                                    {req.transporterComment && (
                                      <p className="text-gray-600"><span className="text-gray-400">Agence:</span> "{req.transporterComment}"</p>
                                    )}
                                  </div>

                                  {req.ratingIsFlagged ? (
                                    <div className="text-red-600 bg-red-50 p-1 rounded text-[9px] font-bold border border-red-100 flex items-center gap-1 mt-1">
                                      <span>🚨 Avis Signalé :</span>
                                      <span className="italic">"{req.ratingFlagReason}"</span>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        const reason = window.prompt("Raison du signalement (abus, injure, diffamation, etc.) :");
                                        if (reason && onFlagReview) {
                                          onFlagReview(req.id, reason);
                                          setSuccessMessage("Avis signalé avec succès ! Le Super Admin examinera votre demande.");
                                        }
                                      }}
                                      className="text-right text-gray-400 hover:text-red-500 text-[8px] font-bold mt-1 self-end cursor-pointer"
                                    >
                                      🚨 Signaler cet avis
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* 8. SINGLE-IDEA DATA CHARTS (HIGH LISIBILITY & NO OVERLOAD) */}
              <div className="grid gap-6 grid-cols-1 lg:grid-cols-12 mt-6">
                
                {/* Chart A: Service Types Proportions (Horizontal Simple Bar - One Idea) */}
                <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                  <div className="border-b border-gray-100 pb-2.5">
                    <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                      <LayoutDashboard className="h-4 w-4 text-[#008060]" />
                      Répartition par Type de Service
                    </h4>
                    <p className="text-[10px] text-gray-500 mt-0.5">Proportion des réservations simples vs. séjours prolongés.</p>
                  </div>

                  <div className="space-y-4">
                    {/* Progress bars representing service types */}
                    {[
                      { key: 'simple', label: '🚙 Transfert Simple', color: 'bg-emerald-600', count: requests.filter(r => r.serviceType === 'simple').length },
                      { key: 'round_trip', label: '🔄 Aller-Retour', color: 'bg-blue-500', count: requests.filter(r => r.serviceType === 'round_trip').length },
                      { key: 'disposal', label: '⏱️ Mise à Disposition', color: 'bg-amber-500', count: requests.filter(r => r.serviceType === 'disposal').length }
                    ].map(type => {
                      const percentage = requests.length > 0 ? Math.round((type.count / requests.length) * 100) : 33;
                      return (
                        <div key={type.key} className="space-y-1">
                          <div className="flex justify-between items-center text-xs font-bold text-gray-700">
                            <span>{type.label}</span>
                            <span>{type.count} ({percentage}%)</span>
                          </div>
                          <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full ${type.color}`} style={{ width: `${percentage}%` }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Chart B: Fuel average bar chart (Existing stable simple chart) */}
                <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                  <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                    <div className="text-left">
                      <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Fuel className="h-4 w-4 text-[#008060]" />
                        Suivi Carburant Consommé (7 Jours)
                      </h4>
                      <p className="text-[10px] text-gray-500 mt-0.5">Consommation moyenne de la flotte de minibus (Litres).</p>
                    </div>
                    <span className="bg-[#EBF5F1] text-[#008060] border border-[#BBE3D1] text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                      Normal ✓
                    </span>
                  </div>

                  <div className="h-36 relative flex items-end justify-between px-2 pt-6 pb-2 bg-slate-900/5 rounded-xl border border-gray-150">
                    <div className="absolute top-2 left-3 flex items-center gap-1.5 font-mono text-[9px] text-gray-400">
                      <span className="w-2 h-2 rounded-full bg-[#008060]"></span>
                      <span>Flotte Globale (Litres / jour)</span>
                    </div>

                    {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map((day, i) => {
                      const values = [48, 62, 54, 78, 45, 92, 58];
                      const heightPercent = Math.round((values[i] / 110) * 100);
                      return (
                        <div key={day} className="flex flex-col items-center gap-1 w-full relative group">
                          <span className="text-[8.5px] font-bold text-gray-900 opacity-0 group-hover:opacity-100 absolute -top-5 transition bg-white border px-1.5 py-0.5 rounded shadow-2xs font-mono">{values[i]} L</span>
                          <div className="w-4 bg-emerald-600 group-hover:bg-[#008060] transition-colors rounded-t-sm" style={{ height: `${heightPercent}px`, minHeight: '10px' }}></div>
                          <span className="font-mono text-[9px] text-gray-500 font-bold">{day}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 9. REAL-TIME FLEET RADAR & WEBSITE EXCURSION SALES GRID */}
              <div className="grid gap-6 grid-cols-1 lg:grid-cols-12 mt-6">
                
                {/* Left: Live Fleet Radar */}
                <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                  <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                    <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Truck className="h-4 w-4 text-[#008060]" />
                      Suivi de la Flotte en Temps Réel
                    </h4>
                    <button onClick={() => setActiveTab('fleet')} className="text-xs text-[#008060] font-black hover:underline cursor-pointer min-h-[44px] inline-flex items-center">
                      Gérer la Flotte →
                    </button>
                  </div>
                  
                  <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                    {vehicles.map(v => {
                      const isAssigned = requests.some(r => r.assignedVehicleId === v.id && r.status !== 'completed');
                      const currentReq = requests.find(r => r.assignedVehicleId === v.id && r.status !== 'completed');
                      return (
                        <div key={v.id} className="p-3.5 bg-slate-50/75 rounded-xl border border-gray-200 flex flex-col justify-between gap-2.5 hover:bg-white hover:shadow-3xs transition">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="font-extrabold text-slate-900 text-xs">{v.brand} {v.model}</span>
                              <span className="block font-mono text-[9.5px] text-gray-500 mt-0.5">Matricule : {v.plate} • {v.capacity} places</span>
                            </div>
                            <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded-lg border ${
                              isAssigned 
                                ? 'bg-blue-50 text-blue-700 border-blue-200' 
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}>
                              {isAssigned ? 'En Course 🚙' : 'Disponible ✓'}
                            </span>
                          </div>
                          {isAssigned && currentReq && (
                            <div className="text-[10px] bg-white p-2 rounded-lg border border-slate-100 text-slate-600 flex justify-between items-center">
                              <span>📍 Course : <strong className="font-bold text-slate-800">{currentReq.origin} → {currentReq.destination}</strong></span>
                              <span className="text-gray-400 font-mono text-[9px]">{currentReq.passengerName}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right: Excursion Bookings from Public Site */}
                <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                  <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                    <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-amber-500" />
                      Ventes d'Excursions (Site Direct)
                    </h4>
                    <span className="bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-[9px] px-3 py-1 font-bold">
                      {excursionBookings.filter(b => b.transporterId === currentUser.id).length} Réservations
                    </span>
                  </div>

                  <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
                    {excursionBookings.filter(b => b.transporterId === currentUser.id).length === 0 ? (
                      <div className="text-center py-12 text-gray-400 text-xs font-semibold">
                        Aucune réservation reçue sur votre vitrine excursions.
                      </div>
                    ) : (
                      excursionBookings.filter(b => b.transporterId === currentUser.id).map(b => (
                        <div key={b.id} className="p-3.5 bg-emerald-50/20 rounded-xl border border-emerald-100/75 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-white hover:border-emerald-300 transition">
                          <div>
                            <span className="text-slate-900 font-black text-xs block">{b.excursionTitle}</span>
                            <span className="text-gray-500 text-[10px] mt-0.5 block font-medium">
                              Client : <strong className="font-bold text-slate-800">{b.clientName}</strong> • {b.paxCount} voyageurs • Date : {b.date}
                            </span>
                          </div>
                          <div className="flex items-center gap-2.5 self-stretch sm:self-auto justify-between sm:justify-start">
                            <span className="text-xs font-black text-emerald-700 bg-emerald-50/75 px-3 py-1 rounded-lg border border-emerald-100">
                              {b.totalPriceDHS} DHS
                            </span>
                            <a
                              href={`https://wa.me/${b.clientPhone.replace(/[^0-9]/g, '').replace(/^0/, '212')}?text=${encodeURIComponent(
                                `Bonjour ${b.clientName}, c'est l'agence ${currentUser.companyName || 'Mumy Transport'}. Nous avons bien reçu votre réservation pour "${b.excursionTitle}" le ${b.date} (${b.totalPriceDHS} DHS). Pouvons-nous valider ensemble les détails de prise en charge ?`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 bg-[#25D366] hover:bg-[#20ba56] text-white rounded-xl transition shadow-xs flex items-center justify-center min-h-[44px] min-w-[44px]"
                              title="Confirmer sur WhatsApp"
                            >
                              <MessageSquare className="h-4 w-4" />
                            </a>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* 10. CLEAN SLATE DEMO MODE SWITCHER */}
              {onResetToRealMode && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3.5 shadow-xs mt-4">
                  <div className="text-left">
                    <h4 className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
                      Bascule d'environnement : Mode Démo vs. Mode Réel à Blanc
                    </h4>
                    <p className="text-[11px] text-amber-800 font-medium mt-0.5 max-w-xl">
                      Vous explorez actuellement la console Mumy chargée avec des données de démonstration. Pour tester les fonctionnalités en conditions d'exploitation réelle, initialisez votre compte à blanc.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm("Êtes-vous sûr de vouloir supprimer TOUTES les données d'essai ? Cette action nettoiera la flotte de démonstration pour vous laisser configurer vos propres véhicules et chauffeurs.")) {
                        onResetToRealMode();
                      }
                    }}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-black text-xs px-4 py-2 rounded-xl transition shadow-xs cursor-pointer shrink-0 min-h-[44px]"
                  >
                    🗑️ Initialiser mon Compte Réel
                  </button>
                </div>
              )}
            </>
          )}

        </div>
      )}

    </div>
  );
}
