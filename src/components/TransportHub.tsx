import React, { useState, useEffect, useRef } from "react";
import L from "leaflet";
import { 
  AlertTriangle, Truck, Users, Landmark, FileText, BadgePercent, MessageSquare, 
  Sparkles, Loader2, CheckCircle, Plus, Trash2, Send, Check, Wrench, Fuel, 
  LayoutDashboard, Search, Eye, PlusCircle, CheckCircle2, Star, Calendar, Clock, MapPin, Phone, Mail, Edit, Heart,
  Download, Share2, Upload, ChevronLeft, ChevronRight, Globe, Compass, ExternalLink, Shield, Award,
  HelpCircle, Info, Database, RefreshCw
} from "lucide-react";
import { User, Vehicle, Driver, TransportRequest, Bid, EmptyReturn, FinancialRecord, ChatMessage, AdBanner, Excursion, TransporterWebsite, ExcursionBooking } from "../types";
import SimulationAdBanner from "./SimulationAdBanner";
import CrmDashboardTab from "./CrmDashboardTab";
import { useTeamMembers, useAddTeamMember, useUpdateTeamMember, useDeleteTeamMember } from "../hooks/useTeamMembers";
import { apiFetch } from "../lib/apiClient";

interface TransportHubProps {
  vehicles: Vehicle[];
  drivers: Driver[];
  requests: TransportRequest[];
  bids: Bid[];
  emptyReturns: EmptyReturn[];
  finances: FinancialRecord[];
  collabChats: ChatMessage[];
  currentUser: User;
  onUpdateCurrentUser: (updated: Partial<User>) => void;
  onAddVehicle: (vehicle: Omit<Vehicle, 'id'>) => void;
  onUpdateVehicle: (id: string, updated: Partial<Vehicle>) => void;
  onDeleteVehicle: (id: string) => void;
  onAddDriver: (driver: Driver) => void;
  onUpdateDriver: (id: string, updated: Partial<Driver>) => void;
  onDeleteDriver: (id: string) => void;
  onAssignDriver: (requestId: string, driverId: string) => void;
  onUpdateRequestStatus?: (requestId: string, status: any) => void;
  onSubmitBid: (requestId: string, priceDHS: number, vehicleType: string) => void;
  onPublishEmptyReturn: (ret: Omit<EmptyReturn, 'id' | 'transporterId' | 'transporterName' | 'status' | 'createdAt'>) => void;
  onSendCollabMessage: (msg: string) => void;
  banners: AdBanner[];
  onRegisterImpression: (id: string) => void;
  onRegisterClick: (id: string) => void;
  excursions: Excursion[];
  websites: TransporterWebsite[];
  excursionBookings: ExcursionBooking[];
  onAddExcursion: (exc: Omit<Excursion, 'id'>) => void;
  onUpdateExcursion: (id: string, updated: Partial<Excursion>) => void;
  onDeleteExcursion: (id: string) => void;
  onUpdateWebsite: (transporterId: string, updated: Partial<TransporterWebsite>) => void;
  onBookExcursion: (booking: Omit<ExcursionBooking, 'id' | 'status' | 'createdAt'>) => void;
  onResetToRealMode?: () => void;
  onFlagReview?: (requestId: string, reason: string) => void;
}

export default function TransportHub({
  vehicles,
  drivers,
  requests,
  bids,
  emptyReturns,
  finances,
  collabChats,
  currentUser,
  onUpdateCurrentUser,
  onAddVehicle,
  onUpdateVehicle,
  onDeleteVehicle,
  onAddDriver,
  onUpdateDriver,
  onDeleteDriver,
  onAssignDriver,
  onUpdateRequestStatus,
  onSubmitBid,
  onPublishEmptyReturn,
  onSendCollabMessage,
  banners,
  onRegisterImpression,
  onRegisterClick,
  excursions,
  websites,
  excursionBookings,
  onAddExcursion,
  onUpdateExcursion,
  onDeleteExcursion,
  onUpdateWebsite,
  onBookExcursion,
  onResetToRealMode,
  onFlagReview
}: TransportHubProps) {
  // Tabs: crm_dashboard, fleet, drivers, erp, finance, leads, returns, collab, team_management
  const [activeTab, setActiveTab] = useState<'crm_dashboard' | 'fleet' | 'drivers' | 'erp' | 'finance' | 'leads' | 'returns' | 'collab' | 'team_management' | 'web_builder'>('crm_dashboard');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Looker Studio Inspired States
  const [lookerSelectedReport, setLookerSelectedReport] = useState<'ga4_traffic' | 'blank_report' | 'acme_marketing' | 'search_console'>('ga4_traffic');
  const [lookerActiveSubTab, setLookerActiveSubTab] = useState<'reports' | 'datasources' | 'explorer'>('reports');
  const [lookerLeftMenu, setLookerLeftMenu] = useState<'recent' | 'shared' | 'owned' | 'trash' | 'templates'>('recent');
  const [lookerShowProBanner, setLookerShowProBanner] = useState<boolean>(true);
  const [lookerSearchQuery, setLookerSearchQuery] = useState<string>('');
  const [lookerHelpOpen, setLookerHelpOpen] = useState<boolean>(false);
  const [lookerSettingsOpen, setLookerSettingsOpen] = useState<boolean>(false);
  const [lookerShowBeginnerAide, setLookerShowBeginnerAide] = useState<boolean>(true);
  const [lookerIsLoading, setLookerIsLoading] = useState<boolean>(false);
  const [lookerReportView, setLookerReportView] = useState<'portal' | 'active_report'>('active_report');
  const [crmMobileKanbanColumn, setCrmMobileKanbanColumn] = useState<'all' | 'pending' | 'accepted' | 'en_route' | 'completed'>('all');

  // Sub-tabs for Fleet Management
  const [fleetSubTab, setFleetSubTab] = useState<'list' | 'insurance' | 'maintenance' | 'fuel' | 'gps'>('list');

  // Leaflet map refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});

  // Transporter's own agency team members — persisted server-side via /api/team-members
  // (previously a separate localStorage key from AdminHub's team, now the same collection).
  const { data: partnerTeam = [] } = useTeamMembers();
  const addTeamMemberMutation = useAddTeamMember();
  const updateTeamMemberMutation = useUpdateTeamMember();
  const deleteTeamMemberMutation = useDeleteTeamMember();

  const [teamMemberForm, setTeamMemberForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Dispatcher' as 'Gérant' | 'Dispatcher' | 'Comptable' | 'Commercial' | 'Superviseur',
    permissions: ['fleet_view'] as string[]
  });
  const [showAddTeamMemberForm, setShowAddTeamMemberForm] = useState(false);

  // Insurance specific state
  const [showInsuranceForm, setShowInsuranceForm] = useState(false);
  const [selectedInsuranceVehicleId, setSelectedInsuranceVehicleId] = useState<string>('');
  const [insuranceForm, setInsuranceForm] = useState({
    company: 'AXA Assurance Maroc',
    policyNum: '',
    cost: 3800,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    coverage: 'Responsabilité Civile + Transport Voyageurs'
  });

  // GPS/Radar specific state
  const [selectedGpsVehicleId, setSelectedGpsVehicleId] = useState<string>('v-1');
  const [pingingVehicleId, setPingingVehicleId] = useState<string | null>(null);
  const [gpsSimulatedLogs, setGpsSimulatedLogs] = useState<string[]>([
    `[${new Date().toLocaleTimeString()}] Traceur GPS initialisé. Flotte en ligne.`,
    `[${new Date().toLocaleTimeString()}] Mercedes Sprinter (12-A-5432) localisé : Marrakech Centre (Gueliz) - 52 km/h`
  ]);
  const [gpsLocations, setGpsLocations] = useState<Record<string, { lat: number; lng: number; speed: number; status: string; locationName: string; fuel: number }>>({
    'v-1': { lat: 31.6295, lng: -7.9811, speed: 64, status: 'moving', locationName: 'Avenue Mohammed V, Marrakech', fuel: 78 },
    'v-2': { lat: 31.6420, lng: -7.9950, speed: 0, status: 'idle', locationName: 'Aéroport Marrakech Menara (Dépose)', fuel: 45 },
    'v-3': { lat: 31.5540, lng: -7.9540, speed: 82, status: 'moving', locationName: 'Route de l\'Ourika, km 12', fuel: 90 },
    'v-4': { lat: 32.3370, lng: -6.3490, speed: 0, status: 'stopped', locationName: 'Dépôt Principal Marrakech', fuel: 15 }
  });

  // GPS API Provider Integration State
  const [gpsApiPlatform, setGpsApiPlatform] = useState<string>('samsara');
  const [gpsApiKey, setGpsApiKey] = useState<string>('');
  const [gpsClientId, setGpsClientId] = useState<string>('');
  const [gpsApiUrl, setGpsApiUrl] = useState<string>('https://api.samsara.com/v1');
  const [gpsIsConnected, setGpsIsConnected] = useState<boolean>(false);
  const [gpsIsConnecting, setGpsIsConnecting] = useState<boolean>(false);

  useEffect(() => {
    // Only run if the container exists and we are currently on the 'gps' subtab
    if (fleetSubTab !== 'gps' || !mapContainerRef.current) {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersRef.current = {};
      }
      return;
    }

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        scrollWheelZoom: true,
      }).setView([31.6295, -7.9811], 12); // Center on Marrakech

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear stale markers
    Object.keys(markersRef.current).forEach(id => {
      if (!vehicles.some(v => v.id === id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });

    // Create or update markers for all vehicles
    vehicles.forEach(v => {
      const loc = gpsLocations[v.id] || { lat: 31.6295, lng: -7.9811, speed: 0, status: 'stopped', locationName: 'Marrakech Center' };
      const isSelected = selectedGpsVehicleId === v.id;

      // HTML template for highly styled moving icon using custom markers
      const colorClass = loc.status === 'moving' 
        ? "bg-emerald-500 text-slate-950" 
        : loc.status === 'idle' 
          ? "bg-amber-500 text-slate-950" 
          : "bg-slate-700 text-slate-300";

      const iconHtml = `
        <div class="relative flex items-center justify-center">
          ${isSelected ? `
            <span class="absolute inline-flex h-12 w-12 rounded-full bg-emerald-400/40 opacity-75 animate-ping"></span>
          ` : ''}
          <div class="h-10 w-10 rounded-full border-2 flex items-center justify-center shadow-xl transition-all duration-300 ${
            isSelected ? 'border-emerald-400 bg-slate-900 scale-125 z-50' : 'border-white bg-slate-950 hover:scale-110 z-20'
          }">
            <div class="h-7 w-7 rounded-full flex items-center justify-center text-xs text-white ${colorClass}">
              🚚
            </div>
          </div>
          <!-- Label -->
          <div class="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] font-bold px-2 py-0.5 rounded shadow-lg border border-slate-800 whitespace-nowrap pointer-events-none z-50 transition-opacity">
            ${v.brand} • ${loc.speed} km/h
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-leaflet-gps-icon',
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });

      if (markersRef.current[v.id]) {
        markersRef.current[v.id].setLatLng([loc.lat, loc.lng]);
        markersRef.current[v.id].setIcon(customIcon);
      } else {
        const marker = L.marker([loc.lat, loc.lng], { icon: customIcon }).addTo(map);
        marker.on('click', () => {
          setSelectedGpsVehicleId(v.id);
        });
        markersRef.current[v.id] = marker;
      }
    });

    // Animate map transition to the active selected vehicle
    if (selectedGpsVehicleId && markersRef.current[selectedGpsVehicleId]) {
      const activeLoc = gpsLocations[selectedGpsVehicleId];
      if (activeLoc) {
        map.setView([activeLoc.lat, activeLoc.lng], 14, { animate: true });
      }
    }

  }, [fleetSubTab, vehicles, gpsLocations, selectedGpsVehicleId]);

  // Smart Route Optimization & Estimation Engine State
  const [routeOptOrigin, setRouteOptOrigin] = useState<string>('Marrakech');
  const [routeOptDestination, setRouteOptDestination] = useState<string>('Casablanca');
  const [routeOptVehicleId, setRouteOptVehicleId] = useState<string>('');
  const [routeOptResult, setRouteOptResult] = useState<{
    km: number;
    duration: string;
    fuelLiters: number;
    fuelCost: number;
    tollCost: number;
    suggestedPath: string;
    optimizationType: string;
  } | null>(null);

  // Geofence Manager State
  const [geofenceZones, setGeofenceZones] = useState<Array<{
    id: string;
    name: string;
    color: string;
    center: string;
    radius: number;
    active: boolean;
  }>>([
    { id: 'gf-1', name: 'Aéroport Marrakech Menara', color: 'border-red-500 bg-red-500/10 text-red-400', center: '31.6010, -8.0260', radius: 1200, active: true },
    { id: 'gf-2', name: 'La Palmeraie Resort', color: 'border-emerald-500 bg-emerald-500/10 text-emerald-400', center: '31.6640, -7.9420', radius: 3000, active: true },
    { id: 'gf-3', name: 'Zone Industrielle Sidi Ghanem', color: 'border-blue-500 bg-blue-500/10 text-blue-400', center: '31.6590, -8.0280', radius: 1500, active: false }
  ]);
  const [geofenceAlerts, setGeofenceAlerts] = useState<Array<{
    id: string;
    timestamp: string;
    message: string;
    type: 'enter' | 'exit';
    vehiclePlate: string;
  }>>([
    { id: 'gfa-1', timestamp: '12:10', message: 'Le véhicule v-1 (Mercedes Sprinter) a pénétré dans la zone Geofence: Aéroport Marrakech Menara', type: 'enter', vehiclePlate: '12-A-5432' },
    { id: 'gfa-2', timestamp: '12:35', message: 'Le véhicule v-2 (Renault Master) est sorti de la zone Geofence: La Palmeraie Resort', type: 'exit', vehiclePlate: '44-B-9988' }
  ]);

  // GPS Route Playback State
  const [playbackVehicleId, setPlaybackVehicleId] = useState<string>('v-1');
  const [playbackIsRunning, setPlaybackIsRunning] = useState<boolean>(false);
  const [playbackProgress, setPlaybackProgress] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [playbackLogs, setPlaybackLogs] = useState<string[]>([]);

  // Document Attachments State
  const [attachingRequestId, setAttachingRequestId] = useState<string | null>(null);
  const [uploadedManifestName, setUploadedManifestName] = useState<string>('');
  const [uploadedInvoiceName, setUploadedInvoiceName] = useState<string>('');

  // Website & Excursions Builder State
  const myWebsite = websites.find(w => w.transporterId === currentUser.id) || {
    transporterId: currentUser.id,
    transporterName: currentUser.companyName || currentUser.name,
    customDomain: 'www.' + (currentUser.companyName?.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'mon-transport') + '.ma',
    dnsStatus: 'not_configured' as const,
    siteTitle: currentUser.companyName || currentUser.name || 'Mon Site Excursions',
    siteSubtitle: 'Réservez vos navettes & excursions touristiques au Maroc',
    aboutText: 'Service de transport touristique professionnel agréé par le Ministère du Transport.',
    primaryColor: '#008060',
    contactEmail: currentUser.email || 'contact@mumy.ma',
    contactPhone: currentUser.phone || '+212 6 00 00 00 00',
    headerImageUrl: 'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?w=1600&auto=format&fit=crop&q=80',
    logoUrl: 'https://images.unsplash.com/photo-1549417229-aa67d3263c09?w=200&auto=format&fit=crop&q=80'
  };

  const [siteForm, setSiteForm] = useState(myWebsite);

  useEffect(() => {
    if (myWebsite) {
      setSiteForm(myWebsite);
    }
  }, [websites, currentUser.id]);

  const [showAddExcursionForm, setShowAddExcursionForm] = useState(false);
  const [isEditingExcursion, setIsEditingExcursion] = useState(false);
  const [editingExcursionId, setEditingExcursionId] = useState<string | null>(null);
  const [selectedPreviewExcursion, setSelectedPreviewExcursion] = useState<Excursion | null>(null);

  const [excursionForm, setExcursionForm] = useState({
    title: '',
    description: '',
    duration: '1 jour',
    priceDHS: 400,
    imageUrl: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&auto=format&fit=crop&q=80',
    location: 'Marrakech',
    maxPax: 15,
    highlightsText: '',
    includesText: '',
    excludesText: '',
    youtubeUrl: '',
    cancellationPolicy: 'Annulation gratuite jusqu\'à 24h à l\'avance pour un remboursement complet',
    departureTime: '08:30',
    meetingPoint: 'Prise en charge à votre hôtel ou Riad',
    languages: 'Français, Anglais'
  });

  const [selectedBookingExcursion, setSelectedBookingExcursion] = useState<Excursion | null>(null);
  const [bookingForm, setBookingForm] = useState({
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    date: new Date().toISOString().split('T')[0],
    paxCount: 2
  });
  const [partSearch, setPartSearch] = useState('');
  const [partLoc, setPartLoc] = useState('all');

  const [dnsChecking, setDnsChecking] = useState(false);
  const [showSitePreviewModal, setShowSitePreviewModal] = useState(false);

  // GPS Playback interval and log simulations
  useEffect(() => {
    let interval: any = null;
    if (playbackIsRunning) {
      interval = setInterval(() => {
        setPlaybackProgress(prev => {
          if (prev >= 100) {
            setPlaybackIsRunning(false);
            return 100;
          }
          return Math.min(100, prev + 3 * playbackSpeed);
        });
      }, 400);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [playbackIsRunning, playbackSpeed]);

  useEffect(() => {
    if (playbackProgress === 0) {
      setPlaybackLogs([
        `[00:00] Démarrage du trajet historique - Dépôt de Marrakech.`,
        `[00:05] Route Bab Doukkala franchie, régime moteur stable.`
      ]);
    } else if (playbackProgress > 10 && playbackProgress < 30 && playbackLogs.length < 3) {
      setPlaybackLogs(prev => [`[00:20] Avenue Mohammed VI - Liaison fluide (50 km/h)`, ...prev]);
    } else if (playbackProgress >= 40 && playbackProgress < 70 && playbackLogs.length < 4) {
      setPlaybackLogs(prev => [`[00:45] Entrée zone commerciale Gueliz - Ralentissement ponctuel`, ...prev]);
    } else if (playbackProgress >= 70 && playbackProgress < 90 && playbackLogs.length < 5) {
      setPlaybackLogs(prev => [`[01:10] Bifurcation Avenue Menara - Vitesse 45 km/h`, ...prev]);
    } else if (playbackProgress === 100 && playbackLogs.length < 6) {
      setPlaybackLogs(prev => [
        `[01:25] Destination atteinte : Parking Aéroport Menara. Déchargement bagages. Moteur éteint.`,
        ...prev
      ]);
    }
  }, [playbackProgress]);

  const handleSaveWebsite = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateWebsite(currentUser.id, siteForm);
    setSuccessMessage("Votre vitrine web a été mise à jour avec succès ! Cliquez sur 'Aperçu du site' pour la visualiser.");
  };

  const handleSimulateDNSCheck = () => {
    setDnsChecking(true);
    setTimeout(() => {
      setDnsChecking(false);
      const updatedSite: TransporterWebsite = { ...siteForm, dnsStatus: 'active' as const };
      setSiteForm(updatedSite);
      onUpdateWebsite(currentUser.id, updatedSite);
      setSuccessMessage("Félicitations ! Le nom de domaine " + siteForm.customDomain + " est désormais ACTIF et pointe vers Mumy Assistance.");
    }, 1500);
  };

  const handleSaveExcursion = (e: React.FormEvent) => {
    e.preventDefault();
    const highlights = excursionForm.highlightsText.split('\n').map(h => h.trim()).filter(h => h.length > 0);
    const includes = excursionForm.includesText.split('\n').map(h => h.trim()).filter(h => h.length > 0);
    const excludes = excursionForm.excludesText.split('\n').map(h => h.trim()).filter(h => h.length > 0);
    const langs = excursionForm.languages.split(',').map(l => l.trim()).filter(l => l.length > 0);
    
    const excData = {
      transporterId: currentUser.id,
      transporterName: currentUser.companyName || currentUser.name || 'Transporteur',
      title: excursionForm.title,
      description: excursionForm.description,
      duration: excursionForm.duration,
      priceDHS: Number(excursionForm.priceDHS),
      imageUrl: excursionForm.imageUrl,
      location: excursionForm.location,
      maxPax: Number(excursionForm.maxPax),
      highlights,
      includes,
      excludes,
      isActive: true,
      youtubeUrl: excursionForm.youtubeUrl,
      cancellationPolicy: excursionForm.cancellationPolicy,
      departureTime: excursionForm.departureTime,
      meetingPoint: excursionForm.meetingPoint,
      languages: langs
    };

    if (isEditingExcursion && editingExcursionId) {
      onUpdateExcursion(editingExcursionId, excData);
      setSuccessMessage("L'excursion a été mise à jour avec succès !");
    } else {
      onAddExcursion(excData);
      setSuccessMessage("La nouvelle excursion a été ajoutée et publiée en ligne !");
    }

    setShowAddExcursionForm(false);
    setIsEditingExcursion(false);
    setEditingExcursionId(null);
  };

  const handleEditExcursionClick = (exc: Excursion) => {
    setExcursionForm({
      title: exc.title,
      description: exc.description,
      duration: exc.duration,
      priceDHS: exc.priceDHS,
      imageUrl: exc.imageUrl,
      location: exc.location,
      maxPax: exc.maxPax,
      highlightsText: exc.highlights.join('\n'),
      includesText: exc.includes.join('\n'),
      excludesText: exc.excludes.join('\n'),
      youtubeUrl: exc.youtubeUrl || '',
      cancellationPolicy: exc.cancellationPolicy || 'Annulation gratuite jusqu\'à 24h à l\'avance pour un remboursement complet',
      departureTime: exc.departureTime || '08:30',
      meetingPoint: exc.meetingPoint || 'Prise en charge à votre hôtel ou Riad',
      languages: exc.languages ? exc.languages.join(', ') : 'Français, Anglais'
    });
    setEditingExcursionId(exc.id);
    setIsEditingExcursion(true);
    setShowAddExcursionForm(true);
  };

  const handleNewExcursionClick = () => {
    setExcursionForm({
      title: '',
      description: '',
      duration: '1 jour',
      priceDHS: 400,
      imageUrl: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&auto=format&fit=crop&q=80',
      location: 'Marrakech',
      maxPax: 15,
      highlightsText: "Randonnée guidée\nDéjeuner berbère traditionnel inclus\nTransport en minibus climatisé VIP",
      includesText: "Transport aller-retour\nChauffeur VIP\nDéjeuner",
      excludesText: "Boissons supplémentaires\nPourboires",
      youtubeUrl: '',
      cancellationPolicy: 'Annulation gratuite jusqu\'à 24h à l\'avance pour un remboursement complet',
      departureTime: '08:30',
      meetingPoint: 'Prise en charge à votre hôtel ou Riad',
      languages: 'Français, Anglais'
    });
    setIsEditingExcursion(false);
    setShowAddExcursionForm(true);
  };
  
  // Advanced CRM & Fleet State
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>('v-1');
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>('d-1');
  const [showAddMaintenanceForm, setShowAddMaintenanceForm] = useState(false);
  const [showAddFuelForm, setShowAddFuelForm] = useState(false);
  
  const [maintenanceForm, setMaintenanceForm] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'oil_change' as 'oil_change' | 'tires' | 'brakes' | 'engine' | 'other',
    cost: 500,
    description: '',
    provider: ''
  });

  const [fuelForm, setFuelForm] = useState({
    date: new Date().toISOString().split('T')[0],
    liters: 45,
    cost: 580,
    mileage: 45000
  });

  const [driverForm, setDriverForm] = useState({
    name: '',
    phone: '',
    email: '',
    licenseNumber: '',
    licenseCategory: 'D (Transport en Commun)',
    licenseExpiry: new Date().toISOString().split('T')[0],
    cnssNumber: '',
    hireDate: new Date().toISOString().split('T')[0],
    salary: 6000,
    notes: '',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    medicalCheckExpiry: new Date().toISOString().split('T')[0],
    licenseCategories: [] as string[]
  });

  const [isEditingDriver, setIsEditingDriver] = useState(false);
  const [editingDriverId, setEditingDriverId] = useState<string | null>(null);
  const [showAddDriverForm, setShowAddDriverForm] = useState(false);

  const [vehicleForm, setVehicleForm] = useState({
    brand: '',
    model: '',
    plate: '',
    capacity: 8,
    status: 'available' as 'available' | 'maintenance' | 'on_duty',
    year: 2024,
    insuranceExpiry: '',
    technicalControlExpiry: '',
    fuelType: 'Gazole' as 'Gazole' | 'Essence' | 'Hybride' | 'Électrique',
    mileage: 0,
    avgConsumption: 8.5,
    notes: ''
  });

  const [isEditingVehicle, setIsEditingVehicle] = useState(false);
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);
  const [showAddVehicleForm, setShowAddVehicleForm] = useState(false);

  const [crmSearch, setCrmSearch] = useState('');
  const [crmCityFilter, setCrmCityFilter] = useState('all');
  const [crmServiceTypeFilter, setCrmServiceTypeFilter] = useState('all');
  const [inlinePrices, setInlinePrices] = useState<Record<string, string>>({});
  const [selectedInvoiceReq, setSelectedInvoiceReq] = useState<TransportRequest | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [newLeadForm, setNewLeadForm] = useState({
    clientName: '',
    passengerName: '',
    origin: '',
    destination: '',
    dateTime: '',
    paxCount: 2,
    serviceType: 'simple' as 'simple' | 'round_trip' | 'disposal',
    daysCount: 1,
    status: 'pending' as 'pending' | 'accepted' | 'en_route' | 'picked_up' | 'completed' | 'cancelled'
  });
  const [showAddLeadForm, setShowAddLeadForm] = useState(false);

  // Fleet / Vehicle state
  const [newVehicle, setNewVehicle] = useState({ brand: '', model: '', plate: '', capacity: 8, status: 'available' as const });
  
  // Moroccan Legal and Partners states
  const [partners, setPartners] = useState<any[]>([
    { id: 'p-1', name: 'Riad Royal Marrakech', type: 'client', ice: '002354897000041', phone: '+212 5 24 88 99 00', email: 'contact@riadroyal.ma', address: 'Medina, Marrakech' },
    { id: 'p-2', name: 'Atlas Parts & Tires', type: 'supplier', ice: '001928475000032', phone: '+212 5 24 33 22 11', email: 'pieces@atlasparts.ma', address: 'Sidi Ghanem, Marrakech' },
    { id: 'p-3', name: 'Hotel Mamounia', type: 'client', ice: '001554879000063', phone: '+212 5 24 38 86 00', email: 'booking@mamounia.ma', address: 'Avenue Bab Jdid, Marrakech' }
  ]);
  const [showAddPartnerForm, setShowAddPartnerForm] = useState(false);
  const [partnerForm, setPartnerForm] = useState({
    name: '',
    type: 'client' as 'client' | 'supplier',
    ice: '',
    phone: '',
    email: '',
    address: ''
  });

  // Company profile configuration state (for Moroccan ICE, IF, Patente, etc)
  const [showLegalConfig, setShowLegalConfig] = useState(false);
  const [legalForm, setLegalForm] = useState({
    companyName: currentUser?.companyName || 'Atlas Trans Marrakech',
    ice: currentUser?.ice || '001548796000085',
    patente: currentUser?.patente || '45879621',
    rc: currentUser?.rc || '98455-Marrakech',
    ifFiscal: currentUser?.ifFiscal || '12457896',
    cnss: currentUser?.cnss || '8547963'
  });

  // VMS state: Vehicle-Driver Planning links (Liaisons et planning hebdomadaire)
  const [vmsLiaisons, setVmsLiaisons] = useState<Array<{
    id: string;
    driverId: string;
    vehicleId: string;
    dayOfWeek: 'Lundi' | 'Mardi' | 'Mercredi' | 'Jeudi' | 'Vendredi' | 'Samedi' | 'Dimanche';
    shift: 'morning' | 'afternoon' | 'night' | 'full_day';
    startTime: string;
    endTime: string;
    date: string;
    notes?: string;
  }>>([
    { id: 'vms-1', driverId: 'd-1', vehicleId: 'v-1', dayOfWeek: 'Lundi', shift: 'full_day', startTime: '08:00', endTime: '18:00', date: '2026-07-06', notes: 'Rotation Standard' },
    { id: 'vms-2', driverId: 'd-1', vehicleId: 'v-1', dayOfWeek: 'Mardi', shift: 'full_day', startTime: '08:00', endTime: '18:00', date: '2026-07-07', notes: 'Rotation Standard' },
    { id: 'vms-3', driverId: 'd-2', vehicleId: 'v-2', dayOfWeek: 'Lundi', shift: 'full_day', startTime: '09:00', endTime: '19:00', date: '2026-07-06', notes: 'Service VIP' },
    { id: 'vms-4', driverId: 'd-2', vehicleId: 'v-2', dayOfWeek: 'Mercredi', shift: 'full_day', startTime: '09:00', endTime: '19:00', date: '2026-07-08', notes: 'Service VIP' },
  ]);

  const [vmsForm, setVmsForm] = useState({
    driverId: '',
    vehicleId: '',
    dayOfWeek: 'Lundi' as 'Lundi' | 'Mardi' | 'Mercredi' | 'Jeudi' | 'Vendredi' | 'Samedi' | 'Dimanche',
    shift: 'full_day' as 'morning' | 'afternoon' | 'night' | 'full_day',
    startTime: '08:00',
    endTime: '18:00',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  // Selected week configuration for VMS weekly planning grid
  const [selectedWeekStart, setSelectedWeekStart] = useState('2026-07-06');

  const availableWeeks = [
    { start: '2026-06-22', end: '2026-06-28', label: 'Semaine du 22/06 au 28/06/2026' },
    { start: '2026-06-29', end: '2026-07-05', label: 'Semaine du 29/06 au 05/07/2026' },
    { start: '2026-07-06', end: '2026-07-12', label: 'Semaine du 06/07 au 12/07/2026 (Semaine Actuelle)' },
    { start: '2026-07-13', end: '2026-07-19', label: 'Semaine du 13/07 au 19/07/2026' },
    { start: '2026-07-20', end: '2026-07-26', label: 'Semaine du 20/07 au 26/07/2026' },
    { start: '2026-07-27', end: '2026-08-02', label: 'Semaine du 27/07 au 02/08/2026' },
    { start: '2026-08-03', end: '2026-08-09', label: 'Semaine du 03/08 au 09/08/2026' }
  ];

  const getDayDateString = (mondayString: string, dayName: string) => {
    const daysOffset: { [key: string]: number } = {
      'Lundi': 0, 'Mardi': 1, 'Mercredi': 2, 'Jeudi': 3, 'Vendredi': 4, 'Samedi': 5, 'Dimanche': 6
    };
    const parts = mondayString.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const monday = new Date(year, month, day);
    const offset = daysOffset[dayName] || 0;
    monday.setDate(monday.getDate() + offset);
    
    const y = monday.getFullYear();
    const m = String(monday.getMonth() + 1).padStart(2, '0');
    const d = String(monday.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const formatDateToFrenchShort = (dateString: string) => {
    const parts = dateString.split('-');
    if (parts.length < 3) return '';
    return `${parts[2]}/${parts[1]}`;
  };

  const getFrenchDayOfWeek = (dateStr: string) => {
    if (!dateStr) return 'Lundi';
    const parts = dateStr.split('-');
    if (parts.length < 3) return 'Lundi';
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const d = new Date(year, month, day);
    const days: ('Dimanche' | 'Lundi' | 'Mardi' | 'Mercredi' | 'Jeudi' | 'Vendredi' | 'Samedi')[] = [
      'Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'
    ];
    return days[d.getDay()] || 'Lundi';
  };

  // Sync legalForm with currentUser changes
  useEffect(() => {
    if (currentUser) {
      setLegalForm({
        companyName: currentUser.companyName || 'Atlas Trans Marrakech',
        ice: currentUser.ice || '001548796000085',
        patente: currentUser.patente || '45879621',
        rc: currentUser.rc || '98455-Marrakech',
        ifFiscal: currentUser.ifFiscal || '12457896',
        cnss: currentUser.cnss || '8547963'
      });
    }
  }, [currentUser]);

  // Invoice Items state
  const [invoiceItems, setInvoiceItems] = useState<Array<{ description: string; quantity: number; unitPrice: number }>>([
    { description: 'Service de Transfert Aéroport Marrakech → Hôtel (Mercedes Vito VIP)', quantity: 1, unitPrice: 1500 }
  ]);

  // RFP / Appels d'offres bidding candidates state
  const [activeBidRequestId, setActiveBidRequestId] = useState<string | null>(null);
  const [bidForm, setBidForm] = useState({
    price: 1200,
    vehicleId: '',
    driverId: '',
    customMessage: ''
  });

  // Private chat between transporters state
  const [activePrivateChatPartner, setActivePrivateChatPartner] = useState<string | null>(null);
  const [privateInput, setPrivateInput] = useState('');
  const [privateChats, setPrivateChats] = useState<Record<string, ChatMessage[]>>({
    'Vanguard Comfort Marrakech': [
      { id: 'pm-pre-1', senderId: 'confrere', senderName: 'Vanguard Comfort Marrakech', senderRole: 'transporter', message: 'Bonjour confrère ! Avez-vous des retours à vide disponibles pour ce week-end ?', timestamp: 'Hier' }
    ]
  });
  const [fellowEmptyReturns] = useState([
    { id: 'fe-1', transporterName: 'Vanguard Comfort Marrakech', origin: 'Casablanca', destination: 'Marrakech', dateTime: '2026-07-10T14:30', price: 950, vehicle: 'Mercedes Vito VIP' },
    { id: 'fe-2', transporterName: 'Sahara Tours Agadir', origin: 'Marrakech', destination: 'Agadir', dateTime: '2026-07-12T10:00', price: 1100, vehicle: 'Hyundai H1' },
    { id: 'fe-3', transporterName: 'Atlas Vista Transport', origin: 'Fès', destination: 'Marrakech', dateTime: '2026-07-14T08:00', price: 1400, vehicle: 'Mercedes Sprinter' }
  ]);
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemPrice, setNewItemPrice] = useState(500);

  // Enterprise Custom Logo configuration
  const PRESET_LOGOS = [
    { name: "Mumy Standard", url: "https://www.mumy.app/logo.png" },
    { name: "Or Prestige", url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80" },
    { name: "Atlas Logistique", url: "https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?w=200&auto=format&fit=crop&q=80" },
    { name: "Chic Noir Minimaliste", url: "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=200&auto=format&fit=crop&q=80" }
  ];
  const [companyLogoUrl, setCompanyLogoUrl] = useState<string>("https://www.mumy.app/logo.png");

  // Proforma Invoice Generator State
  const [invoiceForm, setInvoiceForm] = useState({
    docType: 'Facture' as 'Devis' | 'Facture' | 'Bon de commande' | 'Facture Proforma',
    partnerId: 'p-1',
    passengerName: 'M. Jean Dupont',
    tvaRate: 20, // Moroccan standard TVA
    notes: 'Inclus accueil pancarte, bouteilles d\'eau de bord, Wi-Fi et frais de péage.'
  });
  const [generatedDoc, setGeneratedDoc] = useState<any>(null);

  // Historical list of created/shared commercial documents
  const [invoiceHistory, setInvoiceHistory] = useState<any[]>([
    {
      id: 'DEV-14852',
      docType: 'Devis',
      date: '05/07/2026',
      partner: { id: 'p-1', name: 'Riad Royal Marrakech', type: 'client', ice: '002354897000041', phone: '+212 5 24 88 99 00', email: 'contact@riadroyal.ma', address: 'Medina, Marrakech' },
      passengerName: 'M. Jean Dupont',
      items: [{ description: 'Transfert Aéroport Marrakech → Riad Royal (Vito VIP)', quantity: 1, unitPrice: 450 }],
      subtotal: 450,
      tvaRate: 20,
      tvaAmount: 90,
      totalTtc: 540,
      notes: 'Inclus accueil pancarte, Wi-Fi et boissons fraîches.',
      status: 'shared',
      sharedWith: 'Riad Royal Marrakech'
    },
    {
      id: 'FACT-85472',
      docType: 'Facture',
      date: '06/07/2026',
      partner: { id: 'p-3', name: 'Hotel Mamounia', type: 'client', ice: '001554879000063', phone: '+212 5 24 38 86 00', email: 'booking@mamounia.ma', address: 'Avenue Bab Jdid, Marrakech' },
      passengerName: 'Mme. Sarah Larson',
      items: [{ description: 'Excursion d\'une journée Vallée de l\'Ourika (Minibus Sprinter)', quantity: 1, unitPrice: 1500 }],
      subtotal: 1500,
      tvaRate: 10,
      tvaAmount: 150,
      totalTtc: 1650,
      notes: 'Frais de péage et parking inclus.',
      status: 'created',
      sharedWith: null
    }
  ]);
  
  // Return à Vide state
  const [newReturn, setNewReturn] = useState({ origin: 'Essaouira', destination: 'Marrakech', dateTime: '', basePriceDHS: 1000, vehicleType: 'Minibus Sprinter' });

  // Collaborative chat state
  const [collabInput, setCollabInput] = useState('');

  // Gemini Yield Advice State
  const [yieldAdvice, setYieldAdvice] = useState<string>('');
  const [loadingYield, setLoadingYield] = useState(false);

  useEffect(() => {
    fetchYieldAdvice();
  }, []);

  const fetchYieldAdvice = async () => {
    setLoadingYield(true);
    try {
      const data = await apiFetch<{ advice: string }>("/api/gemini/yield", {
        method: "POST",
        body: JSON.stringify({ route: "Essaouira - Marrakech", demandLevel: "Très Forte" })
      });
      setYieldAdvice(data.advice);
    } catch (err) {
      console.error(err);
      setYieldAdvice("📈 Alerte Yield : Forte demande sur l'axe Essaouira - Marrakech. Pensez à ajuster vos prix de +15% pour optimiser vos revenus.");
    } finally {
      setLoadingYield(false);
    }
  };

  const handleAddVehicleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVehicle.brand || !newVehicle.plate) return;
    onAddVehicle(newVehicle);
    setNewVehicle({ brand: '', model: '', plate: '', capacity: 8, status: 'available' });
    setSuccessMessage("Véhicule ajouté avec succès à votre flotte !");
  };

  const handleAddMaintenanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicleId) return;
    const currentVehicle = vehicles.find(v => v.id === selectedVehicleId);
    if (!currentVehicle) return;

    const newLog = {
      id: `m-${Math.floor(100 + Math.random() * 900)}`,
      date: maintenanceForm.date,
      type: maintenanceForm.type,
      cost: Number(maintenanceForm.cost),
      description: maintenanceForm.description,
      provider: maintenanceForm.provider
    };

    const existingLogs = currentVehicle.maintenanceLogs || [];
    onUpdateVehicle(selectedVehicleId, {
      maintenanceLogs: [...existingLogs, newLog]
    });

    setMaintenanceForm({
      date: new Date().toISOString().split('T')[0],
      type: 'oil_change',
      cost: 500,
      description: '',
      provider: ''
    });
    setShowAddMaintenanceForm(false);
    setSuccessMessage("Entretien enregistré avec succès pour ce véhicule !");
  };

  const handleAddFuelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicleId) return;
    const currentVehicle = vehicles.find(v => v.id === selectedVehicleId);
    if (!currentVehicle) return;

    const newLog = {
      id: `f-${Math.floor(100 + Math.random() * 900)}`,
      date: fuelForm.date,
      liters: Number(fuelForm.liters),
      cost: Number(fuelForm.cost),
      mileage: Number(fuelForm.mileage)
    };

    const existingLogs = currentVehicle.fuelLogs || [];
    const updatedMileage = Number(fuelForm.mileage) > (currentVehicle.mileage || 0) 
      ? Number(fuelForm.mileage) 
      : currentVehicle.mileage;

    onUpdateVehicle(selectedVehicleId, {
      fuelLogs: [...existingLogs, newLog],
      mileage: updatedMileage
    });

    setFuelForm({
      date: new Date().toISOString().split('T')[0],
      liters: 45,
      cost: 580,
      mileage: updatedMileage ? updatedMileage + 500 : 45500
    });
    setShowAddFuelForm(false);
    setSuccessMessage("Ravitaillement carburant enregistré avec succès !");
  };

  const handleAddDriverSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverForm.name || !driverForm.phone) return;

    // Synchronize licenseCategory joined string
    const finalCategory = driverForm.licenseCategories.length > 0 
      ? driverForm.licenseCategories.join(', ') 
      : driverForm.licenseCategory;

    const finalForm = {
      ...driverForm,
      licenseCategory: finalCategory
    };

    if (isEditingDriver && editingDriverId) {
      onUpdateDriver(editingDriverId, finalForm);
      setSuccessMessage("Chauffeur mis à jour avec succès !");
    } else {
      const newDriver = {
        id: `d-${Math.floor(100 + Math.random() * 900)}`,
        rating: 5.0,
        ...finalForm,
        status: 'active' as const
      };
      onAddDriver(newDriver);
      setSuccessMessage("Nouveau chauffeur enregistré avec succès !");
    }

    // Reset Form
    setDriverForm({
      name: '',
      phone: '',
      email: '',
      licenseNumber: '',
      licenseCategory: 'D (Transport en Commun)',
      licenseExpiry: new Date().toISOString().split('T')[0],
      cnssNumber: '',
      hireDate: new Date().toISOString().split('T')[0],
      salary: 6000,
      notes: '',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      medicalCheckExpiry: new Date().toISOString().split('T')[0],
      licenseCategories: [] as string[]
    });
    setIsEditingDriver(false);
    setEditingDriverId(null);
    setShowAddDriverForm(false);
  };

  const handleEditDriverClick = (driver: Driver) => {
    // Parse license categories from comma separated list if applicable
    let categories: string[] = driver.licenseCategories || [];
    if (categories.length === 0 && driver.licenseCategory) {
      categories = driver.licenseCategory.split(',').map(s => s.trim()).filter(Boolean);
    }
    setDriverForm({
      name: driver.name,
      phone: driver.phone,
      email: driver.email || '',
      licenseNumber: driver.licenseNumber || '',
      licenseCategory: driver.licenseCategory || 'D (Transport en Commun)',
      licenseExpiry: driver.licenseExpiry || new Date().toISOString().split('T')[0],
      cnssNumber: driver.cnssNumber || '',
      hireDate: driver.hireDate || new Date().toISOString().split('T')[0],
      salary: driver.salary || 6000,
      notes: driver.notes || '',
      avatarUrl: driver.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      medicalCheckExpiry: driver.medicalCheckExpiry || new Date().toISOString().split('T')[0],
      licenseCategories: categories
    });
    setIsEditingDriver(true);
    setEditingDriverId(driver.id);
    setShowAddDriverForm(true);
  };

  const handleEditVehicleClick = (vehicle: Vehicle) => {
    setVehicleForm({
      brand: vehicle.brand,
      model: vehicle.model,
      plate: vehicle.plate,
      capacity: vehicle.capacity,
      status: vehicle.status,
      year: vehicle.year || 2024,
      insuranceExpiry: vehicle.insuranceExpiry || '',
      technicalControlExpiry: vehicle.technicalControlExpiry || '',
      fuelType: vehicle.fuelType || 'Gazole',
      mileage: vehicle.mileage || 0,
      avgConsumption: vehicle.avgConsumption || 8.5,
      notes: vehicle.notes || ''
    });
    setIsEditingVehicle(true);
    setEditingVehicleId(vehicle.id);
    setShowAddVehicleForm(true);
  };

  const handleSaveVehicleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleForm.brand || !vehicleForm.plate) return;

    if (isEditingVehicle && editingVehicleId) {
      onUpdateVehicle(editingVehicleId, vehicleForm);
      setSuccessMessage("Véhicule mis à jour avec succès !");
    } else {
      onAddVehicle({
        brand: vehicleForm.brand,
        model: vehicleForm.model,
        plate: vehicleForm.plate,
        capacity: Number(vehicleForm.capacity),
        status: vehicleForm.status,
        year: Number(vehicleForm.year),
        insuranceExpiry: vehicleForm.insuranceExpiry,
        technicalControlExpiry: vehicleForm.technicalControlExpiry,
        fuelType: vehicleForm.fuelType,
        mileage: Number(vehicleForm.mileage),
        avgConsumption: Number(vehicleForm.avgConsumption),
        notes: vehicleForm.notes,
        maintenanceLogs: [],
        fuelLogs: []
      });
      setSuccessMessage("Nouveau véhicule ajouté à la flotte !");
    }

    // Reset Form
    setVehicleForm({
      brand: '',
      model: '',
      plate: '',
      capacity: 8,
      status: 'available',
      year: 2024,
      insuranceExpiry: '',
      technicalControlExpiry: '',
      fuelType: 'Gazole',
      mileage: 0,
      avgConsumption: 8.5,
      notes: ''
    });
    setIsEditingVehicle(false);
    setEditingVehicleId(null);
    setShowAddVehicleForm(false);
  };

  const handleAddPartner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerForm.name || !partnerForm.ice) return;
    const newPartner = {
      id: `p-${Math.floor(100 + Math.random() * 900)}`,
      ...partnerForm
    };
    setPartners(prev => [...prev, newPartner]);
    setPartnerForm({
      name: '',
      type: 'client',
      ice: '',
      phone: '',
      email: '',
      address: ''
    });
    setShowAddPartnerForm(false);
    setSuccessMessage(`Partenaire "${newPartner.name}" enregistré avec succès !`);
  };

  const handleAddTeamMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamMemberForm.name || !teamMemberForm.email) return;
    const name = teamMemberForm.name;
    addTeamMemberMutation.mutate({
      name,
      email: teamMemberForm.email,
      phone: teamMemberForm.phone || '+212 6 00 00 00 00',
      role: teamMemberForm.role,
      permissions: teamMemberForm.permissions.length > 0 ? teamMemberForm.permissions : ['fleet_view'],
      status: 'active'
    });
    setTeamMemberForm({
      name: '',
      email: '',
      phone: '',
      role: 'Dispatcher',
      permissions: ['fleet_view']
    });
    setShowAddTeamMemberForm(false);
    setSuccessMessage(`Membre d'équipe "${name}" ajouté avec succès !`);
  };

  const handleToggleTeamMemberStatus = (id: string) => {
    const member = partnerTeam.find(m => m.id === id);
    if (!member) return;
    updateTeamMemberMutation.mutate({ id, updated: { status: member.status === 'active' ? 'suspended' : 'active' } });
  };

  const handleDeleteTeamMember = (id: string) => {
    if (!confirm("Voulez-vous vraiment retirer ce membre de l'équipe ?")) return;
    deleteTeamMemberMutation.mutate(id);
    setSuccessMessage("Membre de l'équipe supprimé.");
  };

  const handlePostulerBid = (e: React.FormEvent, requestId: string) => {
    e.preventDefault();
    const selectedVeh = vehicles.find(v => v.id === bidForm.vehicleId);
    const selectedDr = drivers.find(d => d.id === bidForm.driverId);
    
    let vehicleDesc = selectedVeh ? `${selectedVeh.brand} ${selectedVeh.model}` : 'Véhicule Standard';
    if (selectedDr) {
      vehicleDesc += ` (Chauffeur: ${selectedDr.name})`;
    }
    if (bidForm.customMessage) {
      vehicleDesc += ` - Msg: "${bidForm.customMessage}"`;
    }
    
    onSubmitBid(requestId, Number(bidForm.price), vehicleDesc);
    setActiveBidRequestId(null);
    setBidForm({ price: 1200, vehicleId: '', driverId: '', customMessage: '' });
    setSuccessMessage("Votre candidature à l'appel d'offre a été soumise avec succès !");
  };

  const startPrivateChat = (item: typeof fellowEmptyReturns[0]) => {
    const partner = item.transporterName;
    setActivePrivateChatPartner(partner);
    setActiveTab('collab'); // Switch directly to Espace Confrères chat tab
    
    // If chat doesn't exist, initialize it
    if (!privateChats[partner]) {
      const autoMessage: ChatMessage = {
        id: `pm-init-${Date.now()}`,
        senderId: 'u-1',
        senderName: currentUser.companyName || 'Atlas Trans Marrakech',
        senderRole: 'transporter',
        message: `Bonjour, je suis intéressé par votre retour à vide du ${new Date(item.dateTime).toLocaleDateString('fr-FR')} (${item.origin} → ${item.destination}) à ${item.price} DHS avec le véhicule ${item.vehicle}. Est-il disponible ?`,
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      };
      
      setPrivateChats(prev => ({
        ...prev,
        [partner]: [autoMessage]
      }));

      // Set a small delay for simulated realistic reply
      setTimeout(() => {
        const replyMessage: ChatMessage = {
          id: `pm-reply-${Date.now()}`,
          senderId: 'confrere',
          senderName: partner,
          senderRole: 'transporter',
          message: `Salut ! Oui, ce retour à vide est bien disponible. Le véhicule est un ${item.vehicle} très propre. Voulez-vous qu'on s'arrange pour le bloquer ?`,
          timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        };
        setPrivateChats(prev => ({
          ...prev,
          [partner]: [...(prev[partner] || []), replyMessage]
        }));
      }, 1500);
    }
  };

  const handleSendPrivateMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePrivateChatPartner || !privateInput.trim()) return;
    
    const newMsg: ChatMessage = {
      id: `pm-user-${Date.now()}`,
      senderId: 'u-1',
      senderName: currentUser.companyName || 'Atlas Trans Marrakech',
      senderRole: 'transporter',
      message: privateInput.trim(),
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    };
    
    const partner = activePrivateChatPartner;
    setPrivateChats(prev => ({
      ...prev,
      [partner]: [...(prev[partner] || []), newMsg]
    }));
    setPrivateInput('');

    // Simulate response
    setTimeout(() => {
      const answers = [
        "Parfait, je transmets les coordonnées de mon chauffeur pour la coordination.",
        "Entendu. Nous pouvons valider les conditions tarifaires par virement ou espèces.",
        "Le véhicule est prêt et dispose de tous les agréments touristiques requis.",
        "C'est noté ! Je bloque ce trajet pour vous. Merci pour la collaboration !"
      ];
      const randomAnswer = answers[Math.floor(Math.random() * answers.length)];
      const partnerReply: ChatMessage = {
        id: `pm-reply-${Date.now()}`,
        senderId: 'confrere',
        senderName: partner,
        senderRole: 'transporter',
        message: randomAnswer,
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      };
      setPrivateChats(prev => ({
        ...prev,
        [partner]: [...(prev[partner] || []), partnerReply]
      }));
    }, 2000);
  };

  const handleVmsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vmsForm.driverId || !vmsForm.vehicleId) {
      alert("Veuillez sélectionner un chauffeur et un véhicule.");
      return;
    }
    const newLiaison = {
      id: `vms-${Math.floor(1000 + Math.random() * 9000)}`,
      ...vmsForm
    };
    setVmsLiaisons(prev => [...prev, newLiaison]);
    setSuccessMessage("Planning VMS enregistré avec succès !");
  };

  const handleDeleteVmsLiaison = (id: string) => {
    setVmsLiaisons(prev => prev.filter(l => l.id !== id));
    setSuccessMessage("Liaison VMS supprimée.");
  };

  const handleSaveLegalConfig = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateCurrentUser({
      companyName: legalForm.companyName,
      ice: legalForm.ice,
      patente: legalForm.patente,
      rc: legalForm.rc,
      ifFiscal: legalForm.ifFiscal,
      cnss: legalForm.cnss
    });
    setShowLegalConfig(false);
    setSuccessMessage("Vos informations légales d'entreprise ont été synchronisées.");
  };

  const handleInvoiceGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    const partner = partners.find(p => p.id === invoiceForm.partnerId) || partners[0];
    
    // Calculate values
    const subtotal = invoiceItems.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
    const tvaAmount = subtotal * (invoiceForm.tvaRate / 100);
    const totalTtc = subtotal + tvaAmount;

    const prefix = invoiceForm.docType === 'Devis' ? 'DEV' :
                   invoiceForm.docType === 'Facture' ? 'FACT' :
                   invoiceForm.docType === 'Bon de commande' ? 'BC' : 'PRO';
    const newDocId = `${prefix}-${Math.floor(10000 + Math.random() * 90000)}`;

    const newDoc = {
      id: newDocId,
      date: new Date().toLocaleDateString('fr-FR'),
      partner,
      items: [...invoiceItems],
      subtotal,
      tvaAmount,
      totalTtc,
      status: 'created',
      sharedWith: null,
      ...invoiceForm
    };

    setGeneratedDoc(newDoc);
    setInvoiceHistory(prev => [newDoc, ...prev]);
    setSuccessMessage(`${invoiceForm.docType} généré avec succès !`);
  };

  const handleDownloadDoc = (doc: any) => {
    const content = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>${doc.docType} - ${doc.id}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
      body { font-family: 'Inter', sans-serif; background-color: #f8fafc; }
      @media print {
        .no-print { display: none !important; }
        body { background-color: white !important; }
        .print-shadow { box-shadow: none !important; border: none !important; }
      }
    </style>
  </head>
  <body class="p-4 sm:p-8">
    <div class="max-w-4xl mx-auto bg-white p-6 sm:p-12 rounded-xl shadow-md border border-gray-200 print-shadow space-y-6">
      
      <!-- Top Actions Bar (No Print) -->
      <div class="no-print flex justify-between items-center bg-slate-50 border border-slate-200 p-4 rounded-lg mb-4">
        <span class="text-xs font-semibold text-slate-600">Document numérique certifié par Mumy</span>
        <div class="flex gap-2">
          <button onclick="window.print()" class="bg-[#008060] hover:bg-[#006e52] text-white text-xs font-bold px-4 py-2 rounded-lg transition shadow-xs cursor-pointer">
            🖨️ Imprimer / Enregistrer PDF
          </button>
        </div>
      </div>

      <!-- Logo & Header -->
      <div class="flex flex-col sm:flex-row justify-between items-start gap-4 border-b-2 border-[#008060] pb-6">
        <div class="space-y-2">
          ${companyLogoUrl ? `<img src="${companyLogoUrl}" class="h-12 object-contain max-w-[220px]" />` : `<div class="h-12 w-12 bg-[#008060] text-white flex items-center justify-center font-extrabold rounded-lg text-lg">${currentUser.companyName?.substring(0, 2).toUpperCase() || 'TR'}</div>`}
          <div>
            <p class="font-extrabold text-[#008060] uppercase tracking-wider text-sm">${currentUser.companyName || 'Atlas Trans Marrakech'}</p>
            <p class="text-[10px] text-gray-500 font-medium">Prestataire de Transport National & Touristique Agréé</p>
          </div>
        </div>
        
        <div class="text-left text-[10px] text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-200 max-w-xs w-full sm:w-auto">
          <p class="font-bold text-gray-800 uppercase tracking-wider text-[9px] border-b border-gray-200 pb-1 mb-1.5">Identifiants Légaux Maroc</p>
          <p class="font-semibold text-gray-900 font-mono">ICE : ${currentUser.ice || '001548796000085'}</p>
          <p class="mt-0.5">Patente : <span class="font-mono">${currentUser.patente || '45879621'}</span> | RC : <span class="font-mono">${currentUser.rc || '98455-Marrakech'}</span></p>
          <p class="mt-0.5">I.F. : <span class="font-mono">${currentUser.ifFiscal || '12457896'}</span> | CNSS : <span class="font-mono">${currentUser.cnss || '8547963'}</span></p>
        </div>
      </div>

      <!-- Document Meta -->
      <div class="flex justify-between items-center bg-emerald-50 border border-emerald-100 rounded-lg p-4">
        <div>
          <span class="text-[9px] font-bold text-[#008060] uppercase tracking-widest block">Type de Document</span>
          <h4 class="font-extrabold text-lg text-gray-900">${doc.docType}</h4>
        </div>
        <div class="text-right">
          <span class="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">Numéro de Pièce</span>
          <p class="font-mono font-extrabold text-gray-900 text-sm">${doc.id}</p>
          <p class="text-[10px] text-gray-500 font-medium">Émis le ${doc.date}</p>
        </div>
      </div>

      <!-- Client & Mission -->
      <div class="grid gap-4 sm:grid-cols-2">
        <div class="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-2">
          <span class="font-bold uppercase text-[9px] text-[#6D7175] block tracking-wider border-b border-gray-200 pb-1">CLIENT DESTINATAIRE</span>
          <p class="font-bold text-gray-900 text-xs">${doc.partner?.name}</p>
          <div class="text-[10px] text-gray-600 space-y-0.5">
            <p>ICE : <span class="font-mono font-semibold">${doc.partner?.ice}</span></p>
            <p>Tél : ${doc.partner?.phone}</p>
            <p>Email : ${doc.partner?.email}</p>
            <p>Adresse : ${doc.partner?.address}</p>
          </div>
        </div>

        <div class="bg-gray-50 p-4 rounded-lg border border-gray-200 flex flex-col justify-between">
          <div>
            <span class="font-bold uppercase text-[9px] text-[#6D7175] block tracking-wider border-b border-gray-200 pb-1">RÉFÉRENCE MISSION / PASSAGERS</span>
            <div class="mt-2 space-y-1">
              <p class="text-gray-800 font-bold text-xs">${doc.passengerName}</p>
              <p class="text-[10px] text-[#008060] font-semibold">Statut Mission : Certifié & Validé</p>
            </div>
          </div>
          <div class="text-[9px] text-gray-400 italic">
            Généré via Mumy Enterprise CRM v2.0
          </div>
        </div>
      </div>

      <!-- Items Table -->
      <div class="border border-gray-200 rounded-lg overflow-hidden">
        <div class="grid grid-cols-12 bg-gray-50 p-3 text-[9px] font-bold uppercase tracking-wider text-[#6D7175] border-b border-gray-200">
          <span class="col-span-7">Désignation de la prestation transport</span>
          <span class="col-span-2 text-center">Quantité</span>
          <span class="col-span-3 text-right">Montant HT</span>
        </div>
        <div class="divide-y divide-gray-200">
          ${doc.items?.map((item: any) => `
            <div class="grid grid-cols-12 p-3 text-xs">
              <span class="col-span-7 font-semibold text-gray-900">${item.description}</span>
              <span class="col-span-2 text-center font-mono font-semibold">${item.quantity}</span>
              <span class="col-span-3 text-right font-mono font-bold text-gray-900">${item.quantity * item.unitPrice} DHS</span>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Totals -->
      <div class="flex justify-end">
        <div class="w-full sm:w-80 bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-2">
          <div class="flex justify-between text-gray-600 text-xs font-medium">
            <span>Total Hors Taxes (HT) :</span>
            <span class="font-mono font-bold">${doc.subtotal} DHS</span>
          </div>
          <div class="flex justify-between text-gray-600 text-xs font-medium">
            <span>T.V.A. (${doc.tvaRate}%) :</span>
            <span class="font-mono font-bold">${doc.tvaAmount} DHS</span>
          </div>
          <div class="flex justify-between font-extrabold text-gray-900 pt-2 border-t border-gray-200 text-sm">
            <span>Total TTC (DHS) :</span>
            <span class="text-[#008060] font-mono font-extrabold">${doc.totalTtc} DHS</span>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="grid gap-4 sm:grid-cols-2 pt-6 border-t border-gray-100 text-[10px] text-gray-500">
        <div>
          <p class="font-bold text-gray-700">Conditions de règlement :</p>
          <p class="mt-0.5 leading-relaxed">${doc.notes || 'Règlement à la réception de la facture.'}</p>
        </div>
        <div class="flex justify-end items-center">
          <div class="border-2 border-dashed border-emerald-600/30 rounded-xl px-5 py-2.5 text-center transform -rotate-1 select-none bg-emerald-50/20">
            <p class="text-[8px] font-bold text-emerald-600 uppercase tracking-widest">Document Certifié</p>
            <p class="font-extrabold text-[#008060] text-sm mt-0.5 font-mono">CONFORME MUMY</p>
            <p class="text-[7px] text-gray-400 mt-0.5 font-mono">ID: ${doc.id}</p>
          </div>
        </div>
      </div>
    </div>
  </body>
</html>`;
    
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.docType.replace(/\s+/g, '_')}_${doc.id}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setSuccessMessage(`Document ${doc.docType} (${doc.id}) téléchargé en format HTML interactif. Vous pouvez l'ouvrir pour l'imprimer ou l'enregistrer en PDF !`);
  };

  const handleShareDoc = (docId: string, partnerName: string) => {
    setInvoiceHistory(prev => prev.map(item => {
      if (item.id === docId) {
        return { ...item, status: 'shared', sharedWith: partnerName };
      }
      return item;
    }));
    
    if (generatedDoc && generatedDoc.id === docId) {
      setGeneratedDoc(prev => ({ ...prev, status: 'shared', sharedWith: partnerName }));
    }

    setSuccessMessage(`Document ${docId} partagé avec succès avec ${partnerName} par email et WhatsApp !`);
  };

  const handleAddInvoiceItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemDesc.trim()) return;
    setInvoiceItems(prev => [...prev, { description: newItemDesc, quantity: newItemQty, unitPrice: newItemPrice }]);
    setNewItemDesc('');
    setNewItemQty(1);
    setNewItemPrice(500);
  };

  const handleRemoveInvoiceItem = (index: number) => {
    setInvoiceItems(prev => prev.filter((_, i) => i !== index));
  };

  // Mock submit of individual KYC document to see status transition in real-time
  const handleKycSubmit = (docType: 'licence' | 'rc' | 'insurance' | 'patente', filename: string) => {
    const update: any = {};
    if (docType === 'licence') {
      update.kycLicenceStatus = 'pending';
      update.kycLicenceUrl = filename;
    } else if (docType === 'rc') {
      update.kycRcStatus = 'pending';
      update.kycRcUrl = filename;
    } else if (docType === 'insurance') {
      update.kycInsuranceStatus = 'pending';
      update.kycInsuranceUrl = filename;
    } else if (docType === 'patente') {
      update.kycPatenteStatus = 'pending';
      update.kycPatenteUrl = filename;
    }
    // Set user status to pending so Admin can re-verify if needed
    if (currentUser.status === 'verified') {
      update.status = 'pending';
    }
    onUpdateCurrentUser(update);
    setSuccessMessage(`Document "${filename}" soumis pour vérification Admin !`);
  };

  const handleReturnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReturn.dateTime) return;
    onPublishEmptyReturn({
      origin: newReturn.origin,
      destination: newReturn.destination,
      dateTime: newReturn.dateTime,
      basePriceDHS: Number(newReturn.basePriceDHS),
      vehicleType: newReturn.vehicleType
    });
    // Reset
    setNewReturn({ origin: 'Essaouira', destination: 'Marrakech', dateTime: '', basePriceDHS: 1000, vehicleType: 'Minibus Sprinter' });
    setSuccessMessage("Retour à vide publié avec succès sur la marketplace Mumy !");
  };

  const handleSendCollab = (e: React.FormEvent) => {
    e.preventDefault();
    if (!collabInput.trim()) return;
    onSendCollabMessage(collabInput);
    setCollabInput('');
  };

  // Financial Stats Calculations
  const totalRevenue = finances.filter(f => f.type === 'revenue').reduce((acc, f) => acc + f.amount, 0);
  const totalExpenses = finances.filter(f => f.type === 'expense').reduce((acc, f) => acc + f.amount, 0);
  const netProfit = totalRevenue - totalExpenses;

  return (
    <div className="space-y-6 text-left animate-fade-in">
      {/* Simulation Advertisement Banner */}
      <SimulationAdBanner 
        role="transporter"
        banners={banners}
        onRegisterImpression={onRegisterImpression}
        onRegisterClick={onRegisterClick}
      />

      {/* PLATEFORME CHARTER & RISK SCORE SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left Card: Charte Qualité */}
        <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 flex flex-col justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-slate-100 p-2 text-slate-700">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-950 uppercase tracking-wider flex items-center gap-1">
                🛡️ QUALITÉ & PARTENARIAT : Charte Partenaire Mumy
              </h4>
              <p className="text-xs text-slate-700 mt-2 leading-relaxed font-medium">
                Mumy encourage l'excellence opérationnelle pour garantir la satisfaction des Hôtels & Riads. En cas de retard de service ou d'anomalie, notre équipe de modération vous accompagne pour trouver une solution amiable. Le professionnalisme fait notre force !
              </p>
              <p className="text-[10px] text-slate-500 mt-2">
                Les pénalités ne sont appliquées qu'après examen contradictoire de l'incident. Un score de risque faible garantit votre accès prioritaire aux appels d'offres les plus lucratifs.
              </p>
            </div>
          </div>
        </div>

        {/* Right Card: Score de Risque & Suivi des incidents */}
        <div className="rounded-xl bg-[#FBFBFC] p-4 border border-[#E1E3E5] flex flex-col justify-between space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                SUIVI DE FIABILITÉ & SCORE DE RISQUE
              </h4>
              <p className="text-[10px] text-[#6D7175] mt-0.5">
                Calculé d'après vos courses récentes. Score optimal : 100/100.
              </p>
            </div>
            <span className={`text-xs font-extrabold px-2.5 py-1 rounded-lg border ${
              (currentUser.errorCount || 0) === 0 ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
              (currentUser.errorCount || 0) === 1 ? 'bg-amber-50 text-amber-800 border-amber-300' :
              (currentUser.errorCount || 0) === 2 ? 'bg-orange-50 text-orange-800 border-orange-300' :
              'bg-red-50 text-red-800 border-red-300'
            }`}>
              Score : {Math.max(0, 100 - (currentUser.errorCount || 0) * 15)}/100
            </span>
          </div>

          {/* Visual Progress Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-bold text-[#6D7175]">
              <span>Statut : {
                (currentUser.errorCount || 0) === 0 ? '🟢 EXCELLENT - Aucun Risque' :
                (currentUser.errorCount || 0) === 1 ? '🟡 CONFIANCE - Risque Faible' :
                (currentUser.errorCount || 0) === 2 ? '🟠 ATTENTION - Risque Modéré' :
                '🔴 CRITIQUE - Risque Élevé'
              }</span>
              <span>{(currentUser.errorCount || 0)} incident{(currentUser.errorCount || 0) > 1 ? 's' : ''}</span>
            </div>
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 rounded-full ${
                  (currentUser.errorCount || 0) === 0 ? 'bg-emerald-500 w-full' :
                  (currentUser.errorCount || 0) === 1 ? 'bg-amber-500 w-[85%]' :
                  (currentUser.errorCount || 0) === 2 ? 'bg-orange-500 w-[70%]' :
                  'bg-red-500 w-[40%]'
                }`}
              />
            </div>
          </div>

          {/* Simulated / Real Incident List */}
          <div className="space-y-1.5 max-h-[100px] overflow-y-auto">
            {(!currentUser.riskErrors || currentUser.riskErrors.length === 0) ? (
              <p className="text-[10px] text-gray-500 italic">Aucune anomalie ou erreur de service signalée à ce jour. Compte au vert !</p>
            ) : (
              currentUser.riskErrors.map((err) => (
                <div key={err.id} className="flex justify-between items-center bg-white p-2 rounded border border-[#E1E3E5] text-[10px]">
                  <div>
                    <span className="font-extrabold text-[#1A1A1A] uppercase tracking-wider">[{err.type}]</span>
                    <span className="text-[#6D7175] mx-1">• {err.date}</span>
                    <p className="text-[#6D7175] font-medium mt-0.5">{err.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newErrors = (currentUser.riskErrors || []).filter(e => e.id !== err.id);
                      const newCount = Math.max(0, (currentUser.errorCount || 0) - 1);
                      onUpdateCurrentUser({ errorCount: newCount, riskErrors: newErrors });
                    }}
                    className="text-[#008060] hover:text-[#006e52] font-bold uppercase tracking-wider hover:bg-[#EBF5F1] p-1 rounded transition cursor-pointer"
                    title="Résoudre ou contester cet incident"
                  >
                    Résoudre
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Simulator Panel inside dashboard */}
          <div className="pt-2 border-t border-[#E1E3E5] flex items-center justify-between gap-2 flex-wrap">
            <span className="text-[9px] font-bold text-[#6D7175] uppercase tracking-wider">Test de Simulation de Risque :</span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => {
                  const types = ["Retard", "Chauffeur", "Propreté", "Annulation"];
                  const selectedType = types[Math.floor(Math.random() * types.length)];
                  const descs = {
                    "Retard": "Retard de 15 minutes au transfert d'arrivée.",
                    "Chauffeur": "Chauffeur n'ayant pas de pancarte d'accueil.",
                    "Propreté": "Bouteilles d'eau manquantes ou cabine non aspirée.",
                    "Annulation": "Demande de remplacement de véhicule de dernière minute."
                  };
                  const newErrors = [
                    ...(currentUser.riskErrors || []),
                    {
                      id: `err-${Math.floor(1000 + Math.random() * 9000)}`,
                      type: selectedType,
                      date: new Date().toISOString().split('T')[0],
                      description: descs[selectedType as keyof typeof descs],
                      resolved: false
                    }
                  ];
                  onUpdateCurrentUser({ errorCount: newErrors.length, riskErrors: newErrors });
                }}
                className="bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold px-2 py-1 rounded text-[9px] uppercase tracking-wider shadow-2xs transition cursor-pointer"
              >
                + Simuler Incident
              </button>
              {(currentUser.errorCount || 0) > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    onUpdateCurrentUser({ errorCount: 0, riskErrors: [] });
                  }}
                  className="bg-[#EBF5F1] hover:bg-[#BBE3D1] text-[#008060] font-bold px-2 py-1 rounded text-[9px] uppercase tracking-wider shadow-2xs transition cursor-pointer"
                >
                  Effacer Tout
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successMessage && (
        <div className="rounded-xl bg-[#EBF5F1] p-4 border border-[#BBE3D1] flex items-center justify-between animate-fade-in shadow-xs">
          <div className="flex items-center gap-3">
            <Check className="h-5 w-5 text-[#008060] shrink-0" />
            <span className="text-xs font-bold text-[#008060]">{successMessage}</span>
          </div>
          <button 
            onClick={() => setSuccessMessage(null)} 
            className="text-[#008060] hover:text-[#006e52] text-xs font-bold cursor-pointer bg-white px-2.5 py-1 rounded-md border border-[#BBE3D1] shadow-xs"
          >
            OK
          </button>
        </div>
      )}

      {/* MAIN TWO-COLUMN LAYOUT */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* SIDEBAR NAVIGATION */}
        <div className="w-full lg:w-72 shrink-0 lg:sticky lg:top-24 space-y-4">
          <div className="bg-white rounded-2xl border border-[#E1E3E5] p-4 shadow-xs space-y-1.5 flex flex-col w-full">
            <div className="hidden lg:block pb-3.5 mb-2 border-b border-[#E1E3E5] px-1">
              <span className="text-[10px] font-bold text-[#008060] bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 animate-pulse text-[#008060]" /> Console Partenaire
              </span>
              <p className="text-xs font-black text-[#1A1A1A] mt-2.5 uppercase tracking-wider">Navigation Pro</p>
            </div>

            {/* Vertical/Horizontal Navigation */}
            <div className="flex overflow-x-auto lg:flex-col gap-1 py-1 lg:py-0 no-scrollbar lg:max-h-[calc(100vh-220px)] lg:overflow-y-auto">
              <button
                onClick={() => setActiveTab('crm_dashboard')}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl shrink-0 transition-all cursor-pointer w-auto lg:w-full text-left ${
                  activeTab === 'crm_dashboard' 
                    ? 'bg-[#EBF5F1] border border-[#BBE3D1] text-[#008060] shadow-2xs font-extrabold' 
                    : 'text-[#6D7175] hover:text-[#1A1A1A] hover:bg-gray-50 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-[#EBF5F1] rounded-lg border border-[#BBE3D1]/40 text-[#008060] shrink-0 shadow-3xs">
                    <LayoutDashboard className="h-4 w-4" />
                  </div>
                  <span>CRM & Pipe de Ventes</span>
                </div>
              </button>
              
              <button
                onClick={() => setActiveTab('fleet')}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl shrink-0 transition-all cursor-pointer w-auto lg:w-full text-left ${
                  activeTab === 'fleet' 
                    ? 'bg-[#EBF5F1] border border-[#BBE3D1] text-[#008060] shadow-2xs font-extrabold' 
                    : 'text-[#6D7175] hover:text-[#1A1A1A] hover:bg-gray-50 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-[#EBF5F1] rounded-lg border border-[#BBE3D1]/40 text-[#008060] shrink-0 shadow-3xs">
                    <Truck className="h-4 w-4" />
                  </div>
                  <span>Gestion Flotte</span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('drivers')}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl shrink-0 transition-all cursor-pointer w-auto lg:w-full text-left ${
                  activeTab === 'drivers' 
                    ? 'bg-[#EBF5F1] border border-[#BBE3D1] text-[#008060] shadow-2xs font-extrabold' 
                    : 'text-[#6D7175] hover:text-[#1A1A1A] hover:bg-gray-50 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-[#EBF5F1] rounded-lg border border-[#BBE3D1]/40 text-[#008060] shrink-0 shadow-3xs">
                    <Users className="h-4 w-4" />
                  </div>
                  <span>Chauffeurs VIP</span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('erp')}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl shrink-0 transition-all cursor-pointer w-auto lg:w-full text-left ${
                  activeTab === 'erp' 
                    ? 'bg-[#EBF5F1] border border-[#BBE3D1] text-[#008060] shadow-2xs font-extrabold' 
                    : 'text-[#6D7175] hover:text-[#1A1A1A] hover:bg-gray-50 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-[#EBF5F1] rounded-lg border border-[#BBE3D1]/40 text-[#008060] shrink-0 shadow-3xs">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <span>Missions & Dispatch</span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('finance')}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl shrink-0 transition-all cursor-pointer w-auto lg:w-full text-left ${
                  activeTab === 'finance' 
                    ? 'bg-[#EBF5F1] border border-[#BBE3D1] text-[#008060] shadow-2xs font-extrabold' 
                    : 'text-[#6D7175] hover:text-[#1A1A1A] hover:bg-gray-50 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-[#EBF5F1] rounded-lg border border-[#BBE3D1]/40 text-[#008060] shrink-0 shadow-3xs">
                    <Landmark className="h-4 w-4" />
                  </div>
                  <span>Compta & Facturation</span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('leads')}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl shrink-0 transition-all cursor-pointer w-auto lg:w-full text-left ${
                  activeTab === 'leads' 
                    ? 'bg-[#EBF5F1] border border-[#BBE3D1] text-[#008060] shadow-2xs font-extrabold' 
                    : 'text-[#6D7175] hover:text-[#1A1A1A] hover:bg-gray-50 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-[#EBF5F1] rounded-lg border border-[#BBE3D1]/40 text-[#008060] shrink-0 shadow-3xs">
                    <FileText className="h-4 w-4" />
                  </div>
                  <span>Appels d'Offres Flash</span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('returns')}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl shrink-0 transition-all cursor-pointer w-auto lg:w-full text-left ${
                  activeTab === 'returns' 
                    ? 'bg-[#EBF5F1] border border-[#BBE3D1] text-[#008060] shadow-2xs font-extrabold' 
                    : 'text-[#6D7175] hover:text-[#1A1A1A] hover:bg-gray-50 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-[#EBF5F1] rounded-lg border border-[#BBE3D1]/40 text-[#008060] shrink-0 shadow-3xs">
                    <BadgePercent className="h-4 w-4" />
                  </div>
                  <span>Publier Retour à Vide</span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('web_builder')}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl shrink-0 transition-all cursor-pointer w-auto lg:w-full text-left ${
                  activeTab === 'web_builder' 
                    ? 'bg-[#EBF5F1] border border-[#BBE3D1] text-[#008060] shadow-2xs font-extrabold' 
                    : 'text-[#6D7175] hover:text-[#1A1A1A] hover:bg-gray-50 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-[#EBF5F1] rounded-lg border border-[#BBE3D1]/40 text-[#008060] shrink-0 shadow-3xs">
                    <Compass className="h-4 w-4" />
                  </div>
                  <span>Espace Excursions</span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('collab')}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl shrink-0 transition-all cursor-pointer w-auto lg:w-full text-left ${
                  activeTab === 'collab' 
                    ? 'bg-[#EBF5F1] border border-[#BBE3D1] text-[#008060] shadow-2xs font-extrabold' 
                    : 'text-[#6D7175] hover:text-[#1A1A1A] hover:bg-gray-50 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-[#EBF5F1] rounded-lg border border-[#BBE3D1]/40 text-[#008060] shrink-0 shadow-3xs">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <span>Espace Confrères</span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('team_management')}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl shrink-0 transition-all cursor-pointer w-auto lg:w-full text-left ${
                  activeTab === 'team_management' 
                    ? 'bg-[#EBF5F1] border border-[#BBE3D1] text-[#008060] shadow-2xs font-extrabold' 
                    : 'text-[#6D7175] hover:text-[#1A1A1A] hover:bg-gray-50 border border-transparent'
                }`}
              >
                <div className="flex items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-[#EBF5F1] rounded-lg border border-[#BBE3D1]/40 text-[#008060] shrink-0 shadow-3xs">
                      <Users className="h-4 w-4" />
                    </div>
                    <span>Équipe & Permissions</span>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 rounded text-[8px] px-1 py-0.2 font-extrabold uppercase shrink-0 hidden lg:inline-block">
                    Membres
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* MAIN TAB CONTENT */}
        <div className="flex-1 min-w-0 space-y-6 w-full">

            {/* TAB CONTENT: CRM DASHBOARD & SALES PIPE */}
      {activeTab === 'crm_dashboard' && (
        <CrmDashboardTab
          vehicles={vehicles}
          drivers={drivers}
          requests={requests}
          bids={bids}
          finances={finances}
          excursionBookings={excursionBookings}
          currentUser={currentUser}
          onAssignDriver={onAssignDriver}
          onUpdateRequestStatus={onUpdateRequestStatus}
          onSubmitBid={onSubmitBid}
          onResetToRealMode={onResetToRealMode}
          crmSearch={crmSearch}
          setCrmSearch={setCrmSearch}
          crmCityFilter={crmCityFilter}
          setCrmCityFilter={setCrmCityFilter}
          crmServiceTypeFilter={crmServiceTypeFilter}
          setCrmServiceTypeFilter={setCrmServiceTypeFilter}
          inlinePrices={inlinePrices}
          setInlinePrices={setInlinePrices}
          showAddLeadForm={showAddLeadForm}
          setShowAddLeadForm={setShowAddLeadForm}
          newLeadForm={newLeadForm}
          setNewLeadForm={setNewLeadForm}
          selectedInvoiceReq={selectedInvoiceReq}
          setSelectedInvoiceReq={setSelectedInvoiceReq}
          setSuccessMessage={setSuccessMessage}
          setActiveTab={setActiveTab}
          onFlagReview={onFlagReview}
        />
      )}

      {/* TAB CONTENT: FLEET MANAGEMENT */}
      {activeTab === 'fleet' && (
        <div className="space-y-6 animate-fade-in text-xs text-left w-full">
          {/* Sub-tab Navigation */}
          <div className="flex flex-col sm:flex-row gap-4 pb-2 border-b border-[#E1E3E5] items-start sm:items-center justify-between w-full">
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setFleetSubTab('list')}
                className={`px-3 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                  fleetSubTab === 'list'
                    ? 'bg-[#008060] text-white shadow-xs'
                    : 'bg-white border border-[#E1E3E5] text-[#6D7175] hover:text-[#1A1A1A] hover:bg-gray-50'
                }`}
              >
                🚗 Fiches Véhicules
              </button>
              <button
                onClick={() => setFleetSubTab('insurance')}
                className={`px-3 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                  fleetSubTab === 'insurance'
                    ? 'bg-[#008060] text-white shadow-xs'
                    : 'bg-white border border-[#E1E3E5] text-[#6D7175] hover:text-[#1A1A1A] hover:bg-gray-50'
                }`}
              >
                🛡️ Assurances & Contrats
              </button>
              <button
                onClick={() => setFleetSubTab('maintenance')}
                className={`px-3 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                  fleetSubTab === 'maintenance'
                    ? 'bg-[#008060] text-white shadow-xs'
                    : 'bg-white border border-[#E1E3E5] text-[#6D7175] hover:text-[#1A1A1A] hover:bg-gray-50'
                }`}
              >
                🔧 Maintenance & Carnet
              </button>
              <button
                onClick={() => setFleetSubTab('fuel')}
                className={`px-3 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                  fleetSubTab === 'fuel'
                    ? 'bg-[#008060] text-white shadow-xs'
                    : 'bg-white border border-[#E1E3E5] text-[#6D7175] hover:text-[#1A1A1A] hover:bg-gray-50'
                }`}
              >
                ⛽ Gazoil & Kilométrage
              </button>
              <button
                onClick={() => setFleetSubTab('gps')}
                className={`px-3 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                  fleetSubTab === 'gps'
                    ? 'bg-[#008060] text-white shadow-xs'
                    : 'bg-white border border-[#E1E3E5] text-[#6D7175] hover:text-[#1A1A1A] hover:bg-gray-50'
                }`}
              >
                🛰️ Live GPS & Radar
              </button>
            </div>
            
            <div className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-lg">
              Statut Flotte : <span className="text-[#008060] font-black">{vehicles.filter(v => v.status === 'available').length} Dispo</span> / {vehicles.length} Véhicules
            </div>
          </div>

          {fleetSubTab === 'list' && (
            <div className="grid gap-6 lg:grid-cols-12 w-full">
          {/* Left Column: Fleet List - 5 cols */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-xl bg-white p-5 border border-[#E1E3E5] shadow-xs space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-[#1A1A1A]">Flotte de Véhicules ({vehicles.length})</h3>
                <button
                  onClick={() => {
                    setIsEditingVehicle(false);
                    setVehicleForm({
                      brand: '',
                      model: '',
                      plate: '',
                      capacity: 8,
                      status: 'available',
                      year: 2024,
                      insuranceExpiry: '',
                      technicalControlExpiry: '',
                      fuelType: 'Gazole',
                      mileage: 0,
                      avgConsumption: 8.5,
                      notes: ''
                    });
                    setShowAddVehicleForm(true);
                  }}
                  className="bg-[#008060] text-white px-2.5 py-1.5 rounded-lg text-xs font-bold hover:bg-[#006e52] cursor-pointer"
                >
                  + Ajouter Véhicule
                </button>
              </div>

              <div className="space-y-2">
                {vehicles.map(v => (
                  <div
                    key={v.id}
                    onClick={() => setSelectedVehicleId(v.id)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition ${
                      selectedVehicleId === v.id 
                        ? 'bg-[#EBF5F1] border-[#BBE3D1] shadow-2xs' 
                        : 'bg-[#F6F6F7] border-[#E1E3E5] hover:bg-white'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-[#1A1A1A]">{v.brand} {v.model}</p>
                        <p className="text-[10px] text-[#6D7175] font-mono mt-0.5">Matricule: {v.plate} • {v.capacity} Pax</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded border text-[9px] font-bold uppercase tracking-wider ${
                        v.status === 'available' 
                          ? 'bg-white text-[#008060] border-[#BBE3D1]' 
                          : v.status === 'on_duty'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {v.status === 'available' ? 'Disponible' : v.status === 'on_duty' ? 'En Service' : 'Entretien'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-[#E1E3E5]/50 text-[10px] text-[#6D7175]">
                      <span>KM: <strong className="text-gray-900 font-mono">{v.mileage || 0}</strong></span>
                      <span>Logs: <strong className="text-gray-900">{(v.maintenanceLogs || []).length} maint.</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Fleet Details & Logs CRM - 7 cols */}
          <div className="lg:col-span-7 space-y-6">
            {selectedVehicleId && vehicles.find(v => v.id === selectedVehicleId) ? (
              (() => {
                const v = vehicles.find(veh => veh.id === selectedVehicleId)!;
                return (
                  <div className="space-y-6">
                    {/* Specifications Card */}
                    <div className="rounded-xl bg-white p-5 border border-[#E1E3E5] shadow-xs space-y-4">
                      <div className="flex justify-between items-start border-b border-[#E1E3E5] pb-3">
                        <div>
                          <h3 className="text-base font-bold text-[#1A1A1A]">{v.brand} {v.model}</h3>
                          <span className="text-xs text-[#6D7175] font-mono">ID Véhicule: {v.id}</span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditVehicleClick(v)}
                            className="text-gray-700 border border-[#E1E3E5] hover:bg-gray-50 transition px-2.5 py-1 text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer"
                          >
                            <Edit className="h-3.5 w-3.5" /> Modifier
                          </button>
                          <button
                            onClick={() => {
                              if (confirm("Supprimer définitivement ce véhicule ?")) {
                                onDeleteVehicle(v.id);
                                setSelectedVehicleId(vehicles.find(ve => ve.id !== v.id)?.id || null);
                              }
                            }}
                            className="text-red-500 border border-red-200 hover:bg-red-50 transition p-1 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Specs details Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs font-medium text-gray-700">
                        <div className="bg-[#F6F6F7] p-2.5 rounded-lg border border-[#E1E3E5]/50">
                          <span className="text-[9px] text-[#6D7175] uppercase block">Plaque d'Immatriculation</span>
                          <span className="text-xs font-bold text-[#1A1A1A] font-mono block mt-1">{v.plate}</span>
                        </div>
                        <div className="bg-[#F6F6F7] p-2.5 rounded-lg border border-[#E1E3E5]/50">
                          <span className="text-[9px] text-[#6D7175] uppercase block">Capacité Maximum</span>
                          <span className="text-xs font-bold text-[#1A1A1A] block mt-1">{v.capacity} Pax (Places)</span>
                        </div>
                        <div className="bg-[#F6F6F7] p-2.5 rounded-lg border border-[#E1E3E5]/50">
                          <span className="text-[9px] text-[#6D7175] uppercase block">Année du Modèle</span>
                          <span className="text-xs font-bold text-[#1A1A1A] block mt-1">{v.year || 2024}</span>
                        </div>
                        <div className="bg-[#F6F6F7] p-2.5 rounded-lg border border-[#E1E3E5]/50">
                          <span className="text-[9px] text-[#6D7175] uppercase block">Type de Carburant</span>
                          <span className="text-xs font-bold text-[#1A1A1A] block mt-1">{v.fuelType || 'Gazole'}</span>
                        </div>
                        <div className="bg-[#F6F6F7] p-2.5 rounded-lg border border-[#E1E3E5]/50">
                          <span className="text-[9px] text-[#6D7175] uppercase block">Kilométrage Actuel</span>
                          <span className="text-xs font-bold text-[#1A1A1A] font-mono block mt-1">{(v.mileage || 0).toLocaleString()} KM</span>
                        </div>
                        <div className="bg-[#F6F6F7] p-2.5 rounded-lg border border-[#E1E3E5]/50">
                          <span className="text-[9px] text-[#6D7175] uppercase block">Consommation Moyenne</span>
                          <span className="text-xs font-bold text-[#1A1A1A] block mt-1">{v.avgConsumption || 8.5} L/100KM</span>
                        </div>
                      </div>

                      {/* Regulatory Dates */}
                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="rounded-lg p-3 bg-amber-50/50 border border-amber-200 text-xs">
                          <span className="text-[#6D7175] block">Échéance Assurance:</span>
                          <span className="font-bold text-[#1A1A1A] flex items-center gap-1 mt-1">
                            <Calendar className="h-3.5 w-3.5 text-amber-600" />
                            {v.insuranceExpiry ? new Date(v.insuranceExpiry).toLocaleDateString('fr-FR') : "N/A"}
                          </span>
                        </div>
                        <div className="rounded-lg p-3 bg-blue-50/50 border border-blue-200 text-xs">
                          <span className="text-[#6D7175] block">Contrôle Technique:</span>
                          <span className="font-bold text-[#1A1A1A] flex items-center gap-1 mt-1">
                            <Calendar className="h-3.5 w-3.5 text-blue-600" />
                            {v.technicalControlExpiry ? new Date(v.technicalControlExpiry).toLocaleDateString('fr-FR') : "N/A"}
                          </span>
                        </div>
                      </div>

                      {v.notes && (
                        <div className="text-xs text-[#6D7175] p-3 rounded-lg bg-gray-50 border border-[#E1E3E5] italic">
                          💡 Notes: {v.notes}
                        </div>
                      )}
                    </div>

                    {/* Maintenance Tracker Panel */}
                    <div className="rounded-xl bg-white p-5 border border-[#E1E3E5] shadow-xs space-y-4">
                      <div className="flex justify-between items-center border-b border-[#E1E3E5] pb-2">
                        <h4 className="text-sm font-bold text-[#1A1A1A] flex items-center gap-1.5">
                          <Wrench className="h-4 w-4 text-[#008060]" />
                          Carnet d'Entretien & Maintenance
                        </h4>
                        <button
                          onClick={() => setShowAddMaintenanceForm(!showAddMaintenanceForm)}
                          className="bg-gray-150 border border-gray-300 px-2.5 py-1 rounded text-[10px] font-bold text-gray-800 hover:bg-gray-200 cursor-pointer"
                        >
                          {showAddMaintenanceForm ? "Fermer" : "+ Consigner Entretien"}
                        </button>
                      </div>

                      {showAddMaintenanceForm && (
                        <form onSubmit={handleAddMaintenanceSubmit} className="bg-[#FAFBFB] p-4 rounded-xl border border-[#E1E3E5] space-y-3.5 animate-slide-up">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold text-[#6D7175] uppercase tracking-wider">Date d'intervention</label>
                              <input
                                type="date"
                                required
                                value={maintenanceForm.date}
                                onChange={(e) => setMaintenanceForm({...maintenanceForm, date: e.target.value})}
                                className="mt-1 w-full rounded-lg border border-[#E1E3E5] p-1.5 text-xs bg-white text-[#1A1A1A]"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-[#6D7175] uppercase tracking-wider">Type d'entretien</label>
                              <select
                                value={maintenanceForm.type}
                                onChange={(e) => setMaintenanceForm({...maintenanceForm, type: e.target.value as any})}
                                className="mt-1 w-full rounded-lg border border-[#E1E3E5] p-1.5 text-xs bg-white text-[#1A1A1A]"
                              >
                                <option value="oil_change">Vidange Moteur</option>
                                <option value="tires">Changement Pneus</option>
                                <option value="brakes">Système de Freins</option>
                                <option value="engine">Révision Moteur</option>
                                <option value="other">Autre Intervention</option>
                              </select>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold text-[#6D7175] uppercase tracking-wider">Coût TTC (DHS)</label>
                              <input
                                type="number"
                                required
                                value={maintenanceForm.cost}
                                onChange={(e) => setMaintenanceForm({...maintenanceForm, cost: Number(e.target.value)})}
                                className="mt-1 w-full rounded-lg border border-[#E1E3E5] p-1.5 text-xs bg-white text-[#1A1A1A]"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-[#6D7175] uppercase tracking-wider">Prestataire / Garage</label>
                              <input
                                type="text"
                                required
                                placeholder="e.g. Garage de l'Atlas"
                                value={maintenanceForm.provider}
                                onChange={(e) => setMaintenanceForm({...maintenanceForm, provider: e.target.value})}
                                className="mt-1 w-full rounded-lg border border-[#E1E3E5] p-1.5 text-xs bg-white text-[#1A1A1A]"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-[#6D7175] uppercase tracking-wider">Description des travaux</label>
                            <input
                              type="text"
                              required
                              placeholder="Remplacement filtre, réglages, parallélisme..."
                              value={maintenanceForm.description}
                              onChange={(e) => setMaintenanceForm({...maintenanceForm, description: e.target.value})}
                              className="mt-1 w-full rounded-lg border border-[#E1E3E5] p-1.5 text-xs bg-white text-[#1A1A1A]"
                            />
                          </div>
                          <button
                            type="submit"
                            className="bg-[#008060] text-white py-1.5 text-xs font-bold rounded-lg w-full hover:bg-[#006e52]"
                          >
                            Enregistrer l'Entretien
                          </button>
                        </form>
                      )}

                      {/* Maintenance Log Table */}
                      <div className="space-y-2">
                        {(!v.maintenanceLogs || v.maintenanceLogs.length === 0) ? (
                          <p className="text-xs text-[#6D7175] italic py-2">Aucun entretien consigné à ce jour.</p>
                        ) : (
                          v.maintenanceLogs.map(log => (
                            <div key={log.id} className="flex justify-between items-center bg-[#FAFBFB] p-3 rounded-lg border border-[#E1E3E5] text-xs">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-[#1A1A1A]">
                                    {log.type === 'oil_change' ? 'Vidange' : log.type === 'tires' ? 'Pneus' : log.type === 'brakes' ? 'Freins' : log.type === 'engine' ? 'Moteur' : 'Autre'}
                                  </span>
                                  <span className="text-[10px] text-[#6D7175] font-mono">{new Date(log.date).toLocaleDateString('fr-FR')}</span>
                                </div>
                                <p className="text-[11px] text-[#6D7175] mt-0.5">{log.description} • <span className="font-semibold">{log.provider}</span></p>
                              </div>
                              <span className="font-bold text-red-600">-{log.cost} DHS</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Fuel Tracker Panel */}
                    <div className="rounded-xl bg-white p-5 border border-[#E1E3E5] shadow-xs space-y-4">
                      <div className="flex justify-between items-center border-b border-[#E1E3E5] pb-2">
                        <h4 className="text-sm font-bold text-[#1A1A1A] flex items-center gap-1.5">
                          <Fuel className="h-4 w-4 text-[#008060]" />
                          Suivi Consommation Carburant
                        </h4>
                        <button
                          onClick={() => setShowAddFuelForm(!showAddFuelForm)}
                          className="bg-gray-150 border border-gray-300 px-2.5 py-1 rounded text-[10px] font-bold text-gray-800 hover:bg-gray-200 cursor-pointer"
                        >
                          {showAddFuelForm ? "Fermer" : "+ Enregistrer Carburant"}
                        </button>
                      </div>

                      {showAddFuelForm && (
                        <form onSubmit={handleAddFuelSubmit} className="bg-[#FAFBFB] p-4 rounded-xl border border-[#E1E3E5] space-y-3.5 animate-slide-up">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold text-[#6D7175] uppercase tracking-wider">Date Ravitaillement</label>
                              <input
                                type="date"
                                required
                                value={fuelForm.date}
                                onChange={(e) => setFuelForm({...fuelForm, date: e.target.value})}
                                className="mt-1 w-full rounded-lg border border-[#E1E3E5] p-1.5 text-xs bg-white text-[#1A1A1A]"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-[#6D7175] uppercase tracking-wider">Volume (Litres)</label>
                              <input
                                type="number"
                                required
                                value={fuelForm.liters}
                                onChange={(e) => setFuelForm({...fuelForm, liters: Number(e.target.value)})}
                                className="mt-1 w-full rounded-lg border border-[#E1E3E5] p-1.5 text-xs bg-white text-[#1A1A1A]"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold text-[#6D7175] uppercase tracking-wider">Montant Payé (DHS)</label>
                              <input
                                type="number"
                                required
                                value={fuelForm.cost}
                                onChange={(e) => setFuelForm({...fuelForm, cost: Number(e.target.value)})}
                                className="mt-1 w-full rounded-lg border border-[#E1E3E5] p-1.5 text-xs bg-white text-[#1A1A1A]"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-[#6D7175] uppercase tracking-wider">Index Kilométrique (KM)</label>
                              <input
                                type="number"
                                required
                                value={fuelForm.mileage}
                                onChange={(e) => setFuelForm({...fuelForm, mileage: Number(e.target.value)})}
                                className="mt-1 w-full rounded-lg border border-[#E1E3E5] p-1.5 text-xs bg-white text-[#1A1A1A]"
                              />
                            </div>
                          </div>
                          <button
                            type="submit"
                            className="bg-[#008060] text-white py-1.5 text-xs font-bold rounded-lg w-full hover:bg-[#006e52]"
                          >
                            Consigner Carburant
                          </button>
                        </form>
                      )}

                      {/* Fuel Log Display */}
                      <div className="space-y-2">
                        {(!v.fuelLogs || v.fuelLogs.length === 0) ? (
                          <p className="text-xs text-[#6D7175] italic py-2">Aucun ticket carburant enregistré.</p>
                        ) : (
                          v.fuelLogs.map(log => (
                            <div key={log.id} className="flex justify-between items-center bg-[#FAFBFB] p-2.5 rounded-lg border border-[#E1E3E5] text-xs">
                              <div>
                                <span className="font-semibold text-gray-800">{log.liters}L de Gazole</span>
                                <span className="text-[10px] text-gray-500 font-mono ml-2">Index: {log.mileage.toLocaleString()} KM</span>
                              </div>
                              <span className="font-bold text-gray-900">{log.cost} DHS</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="bg-white p-12 text-center rounded-xl border border-[#E1E3E5] text-xs text-[#6D7175] font-semibold">
                Sélectionnez un véhicule dans la liste pour piloter sa fiche d'entretien et de carburant complète.
              </div>
            )}
          </div>
        </div>
          )}

          {/* SUB-TAB: MANAGEMENT DES ASSURANCES */}
          {fleetSubTab === 'insurance' && (
            <div className="space-y-6 w-full">
              {/* Alert Warning for soon to expire policies */}
              {(() => {
                const expiringSoon = vehicles.filter(v => {
                  if (!v.insuranceExpiry) return false;
                  const diffTime = new Date(v.insuranceExpiry).getTime() - Date.now();
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  return diffDays > 0 && diffDays <= 30;
                });
                if (expiringSoon.length === 0) return null;
                return (
                  <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 flex gap-3 text-amber-900">
                    <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                    <div>
                      <h4 className="font-bold text-sm">Alertes Échéance Assurance ({expiringSoon.length})</h4>
                      <p className="text-xs text-amber-700 mt-1">
                        Les véhicules suivants ont des contrats d'assurance arrivant à échéance dans les 30 prochains jours. Veuillez contacter votre courtier pour renouvellement.
                      </p>
                      <div className="mt-2.5 flex flex-wrap gap-2">
                        {expiringSoon.map(v => (
                          <span key={v.id} className="bg-amber-100 border border-amber-300 text-amber-800 font-extrabold px-2 py-0.5 rounded-md text-[10px]">
                            {v.brand} {v.model} ({v.plate}) • Expire le {v.insuranceExpiry}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Insurance Stats Overview */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="bg-white rounded-xl border border-[#E1E3E5] p-4 shadow-2xs flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-emerald-50 text-[#008060]">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-[#6D7175] font-bold uppercase block">Véhicules assurés</span>
                    <strong className="text-base text-[#1A1A1A]">{vehicles.length} / {vehicles.length}</strong>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-[#E1E3E5] p-4 shadow-2xs flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-amber-50 text-amber-600">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-[#6D7175] font-bold uppercase block">Alertes Échéances</span>
                    <strong className="text-base text-amber-600">
                      {vehicles.filter(v => {
                        if (!v.insuranceExpiry) return false;
                        const diff = new Date(v.insuranceExpiry).getTime() - Date.now();
                        return diff > 0 && diff <= (30 * 24 * 3600 * 1000);
                      }).length} véhicule(s)
                    </strong>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-[#E1E3E5] p-4 shadow-2xs flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
                    <Landmark className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-[#6D7175] font-bold uppercase block">Budget Estimé Annuel</span>
                    <strong className="text-base text-[#1A1A1A]">
                      {(vehicles.length * 4200).toLocaleString()} DHS
                    </strong>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-12">
                {/* Insurance policies table */}
                <div className="lg:col-span-8 bg-white rounded-xl border border-[#E1E3E5] p-5 shadow-2xs space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                    <h3 className="font-bold text-sm text-[#1A1A1A]">Contrats d'Assurances Actifs</h3>
                    <button
                      onClick={() => {
                        if (vehicles.length > 0) {
                          setSelectedInsuranceVehicleId(vehicles[0].id);
                          setShowInsuranceForm(true);
                        } else {
                          alert("Veuillez d'abord ajouter un véhicule dans la flotte.");
                        }
                      }}
                      className="px-3 py-1.5 bg-[#008060] hover:bg-[#006e52] text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Plus className="h-4 w-4" /> Mettre à jour police
                    </button>
                  </div>

                  <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-gray-100 text-[10px] font-bold text-[#6D7175] uppercase bg-gray-50/50">
                          <th className="py-2.5 px-3">Véhicule</th>
                          <th className="py-2.5 px-3">Compagnie</th>
                          <th className="py-2.5 px-3">N° Contrat</th>
                          <th className="py-2.5 px-3">Couverture</th>
                          <th className="py-2.5 px-3">Échéance</th>
                          <th className="py-2.5 px-3 text-right">Statut / Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {vehicles.map(v => {
                          const expiryDateStr = v.insuranceExpiry || "2026-12-31";
                          const diffTime = new Date(expiryDateStr).getTime() - Date.now();
                          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                          const isExpired = diffDays <= 0;
                          const isUrgent = diffDays > 0 && diffDays <= 30;

                          return (
                            <tr key={v.id} className="hover:bg-slate-50/50 transition">
                              <td className="py-3 px-3">
                                <div className="font-extrabold text-[#1A1A1A]">{v.brand} {v.model}</div>
                                <div className="text-[10px] font-mono font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded inline-block mt-0.5">{v.plate}</div>
                              </td>
                              <td className="py-3 px-3">
                                <div className="flex items-center gap-1.5 font-semibold text-gray-700">
                                  <Shield className="h-3.5 w-3.5 text-[#008060]" />
                                  <span>AXA Assurance Maroc</span>
                                </div>
                              </td>
                              <td className="py-3 px-3">
                                <span className="font-mono text-gray-600 font-bold">POL-{(v.plate.replace(/[^0-9]/g, '') || "92837")}-2026</span>
                              </td>
                              <td className="py-3 px-3 font-medium text-gray-600">
                                Responsabilité Civile + Voyageurs (VIP)
                              </td>
                              <td className="py-3 px-3 font-semibold">
                                <div className={isExpired ? "text-red-600" : isUrgent ? "text-amber-600" : "text-gray-900"}>
                                  {expiryDateStr}
                                </div>
                                <div className="text-[10px] text-gray-500">
                                  {isExpired ? "Expiré" : `Reste ${diffDays} jours`}
                                </div>
                              </td>
                              <td className="py-3 px-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                                    isExpired 
                                      ? "bg-red-100 text-red-800 border border-red-200" 
                                      : isUrgent 
                                        ? "bg-amber-100 text-amber-800 border border-amber-200 animate-pulse" 
                                        : "bg-emerald-100 text-[#008060] border border-emerald-200"
                                  }`}>
                                    {isExpired ? "Inactif" : isUrgent ? "Échéance Proche" : "Garanti"}
                                  </span>
                                  <button
                                    onClick={() => {
                                      // Renew policy simulator
                                      const nextYear = new Date();
                                      nextYear.setFullYear(nextYear.getFullYear() + 1);
                                      onUpdateVehicle(v.id, {
                                        insuranceExpiry: nextYear.toISOString().split('T')[0]
                                      });
                                      setSuccessMessage(`Assurance renouvelée de 1 an pour le véhicule ${v.brand} (${v.plate}) !`);
                                    }}
                                    className="px-2 py-1 bg-white border border-[#E1E3E5] hover:bg-slate-50 text-gray-700 rounded text-[10px] font-bold cursor-pointer transition"
                                  >
                                    Renouveler 1 an
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Insurance policy dynamic updater panel */}
                <div className="lg:col-span-4 bg-white rounded-xl border border-[#E1E3E5] p-5 shadow-2xs space-y-4">
                  <h3 className="font-bold text-sm text-[#1A1A1A]">Mise à Jour Assurance</h3>
                  <p className="text-[11px] text-[#6D7175]">
                    Sélectionnez un véhicule de votre flotte pour modifier instantanément son assureur et sa date de validité.
                  </p>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!selectedInsuranceVehicleId) {
                        alert("Veuillez sélectionner un véhicule");
                        return;
                      }
                      onUpdateVehicle(selectedInsuranceVehicleId, {
                        insuranceExpiry: insuranceForm.endDate
                      });
                      setSuccessMessage("Police d'assurance mise à jour avec succès !");
                      setShowInsuranceForm(false);
                    }}
                    className="space-y-3"
                  >
                    <div>
                      <label className="block text-[10px] font-bold text-[#6D7175] uppercase">Véhicule à mettre à jour</label>
                      <select
                        value={selectedInsuranceVehicleId}
                        onChange={(e) => setSelectedInsuranceVehicleId(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-[#E1E3E5] px-2.5 py-1.5 text-xs text-[#1A1A1A] bg-white focus:outline-none font-bold"
                      >
                        <option value="">-- Choisir un véhicule --</option>
                        {vehicles.map(v => (
                          <option key={v.id} value={v.id}>{v.brand} {v.model} ({v.plate})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-[#6D7175] uppercase">Compagnie d'Assurance</label>
                      <select
                        value={insuranceForm.company}
                        onChange={(e) => setInsuranceForm({...insuranceForm, company: e.target.value})}
                        className="mt-1 w-full rounded-lg border border-[#E1E3E5] px-2.5 py-1.5 text-xs text-[#1A1A1A] bg-white focus:outline-none"
                      >
                        <option value="AXA Assurance Maroc">AXA Assurance Maroc</option>
                        <option value="RMA Watanya">RMA Watanya</option>
                        <option value="Wafa Assurance">Wafa Assurance</option>
                        <option value="Saham Assurance">Saham Assurance (Sanlam)</option>
                        <option value="Allianz Maroc">Allianz Maroc</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-[#6D7175] uppercase">Numéro de Contrat / Police</label>
                      <input
                        type="text"
                        required
                        placeholder="POL-293848-A"
                        value={insuranceForm.policyNum}
                        onChange={(e) => setInsuranceForm({...insuranceForm, policyNum: e.target.value})}
                        className="mt-1 w-full rounded-lg border border-[#E1E3E5] px-2.5 py-1.5 text-xs text-[#1A1A1A] bg-white focus:outline-none font-mono font-bold"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-[#6D7175] uppercase">Prime Annuelle (DHS)</label>
                        <input
                          type="number"
                          required
                          value={insuranceForm.cost}
                          onChange={(e) => setInsuranceForm({...insuranceForm, cost: Number(e.target.value)})}
                          className="mt-1 w-full rounded-lg border border-[#E1E3E5] px-2.5 py-1.5 text-xs text-[#1A1A1A] bg-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#6D7175] uppercase">Couverture</label>
                        <select
                          value={insuranceForm.coverage}
                          onChange={(e) => setInsuranceForm({...insuranceForm, coverage: e.target.value})}
                          className="mt-1 w-full rounded-lg border border-[#E1E3E5] px-2.5 py-1.5 text-xs text-[#1A1A1A] bg-white focus:outline-none"
                        >
                          <option value="RC + Transport Voyageurs">RC + Voyageurs</option>
                          <option value="Tous risques VIP">Tous risques VIP</option>
                          <option value="Tiers étendu">Tiers étendu</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-[#6D7175] uppercase">Date de Début</label>
                        <input
                          type="date"
                          value={insuranceForm.startDate}
                          onChange={(e) => setInsuranceForm({...insuranceForm, startDate: e.target.value})}
                          className="mt-1 w-full rounded-lg border border-[#E1E3E5] px-2.5 py-1.5 text-xs text-[#1A1A1A] bg-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#6D7175] uppercase">Échéance Fin</label>
                        <input
                          type="date"
                          value={insuranceForm.endDate}
                          onChange={(e) => setInsuranceForm({...insuranceForm, endDate: e.target.value})}
                          className="mt-1 w-full rounded-lg border border-[#E1E3E5] px-2.5 py-1.5 text-xs text-[#1A1A1A] bg-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 bg-[#008060] hover:bg-[#006e52] text-white text-xs font-bold rounded-lg transition mt-2 cursor-pointer"
                    >
                      Enregistrer & Générer l'Avenant d'Assurance
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* SUB-TAB: MAINTENANCE DES VÉHICULES */}
          {fleetSubTab === 'maintenance' && (
            <div className="space-y-6 w-full animate-fade-in">
              <div className="grid gap-4 sm:grid-cols-4">
                <div className="bg-white rounded-xl border border-[#E1E3E5] p-4 shadow-2xs">
                  <span className="text-[10px] text-[#6D7175] font-bold uppercase block">Total Entretiens Enregistrés</span>
                  <strong className="text-lg text-slate-800 mt-1 block">
                    {vehicles.reduce((sum, v) => sum + (v.maintenanceLogs?.length || 0), 0)} interventions
                  </strong>
                </div>

                <div className="bg-white rounded-xl border border-[#E1E3E5] p-4 shadow-2xs">
                  <span className="text-[10px] text-[#6D7175] font-bold uppercase block">Dépenses Globales Entretien</span>
                  <strong className="text-lg text-red-600 mt-1 block">
                    {vehicles.reduce((sum, v) => sum + (v.maintenanceLogs?.reduce((s, log) => s + log.cost, 0) || 0), 0).toLocaleString()} DHS
                  </strong>
                </div>

                <div className="bg-white rounded-xl border border-[#E1E3E5] p-4 shadow-2xs">
                  <span className="text-[10px] text-[#6D7175] font-bold uppercase block">Prochains contrôles techniques</span>
                  <strong className="text-lg text-amber-600 mt-1 block">
                    {vehicles.filter(v => v.technicalControlExpiry && new Date(v.technicalControlExpiry).getTime() > Date.now()).length} programmés
                  </strong>
                </div>

                <div className="bg-white rounded-xl border border-[#E1E3E5] p-4 shadow-2xs">
                  <span className="text-[10px] text-[#6D7175] font-bold uppercase block">Véhicules en panne/réparation</span>
                  <strong className="text-lg text-[#1A1A1A] mt-1 block">
                    {vehicles.filter(v => v.status === 'maintenance').length} en atelier
                  </strong>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-12">
                {/* Form to log a maintenance event */}
                <div className="lg:col-span-4 bg-white rounded-xl border border-[#E1E3E5] p-5 shadow-2xs space-y-4">
                  <h3 className="font-bold text-sm text-[#1A1A1A] flex items-center gap-1.5">
                    <Wrench className="h-4.5 w-4.5 text-[#008060]" />
                    Déclarer une Réparation ou Entretien
                  </h3>
                  <p className="text-[11px] text-[#6D7175]">
                    Renseignez les factures d'entretien (vidange, pneus, freins, moteur) pour suivre l'historique d'exploitation et la rentabilité.
                  </p>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!selectedVehicleId) {
                        alert("Veuillez choisir un véhicule");
                        return;
                      }
                      const v = vehicles.find(item => item.id === selectedVehicleId);
                      if (!v) return;

                      const newLog = {
                        id: `m-${Math.floor(100 + Math.random() * 900)}`,
                        date: maintenanceForm.date,
                        type: maintenanceForm.type,
                        cost: Number(maintenanceForm.cost),
                        description: maintenanceForm.description,
                        provider: maintenanceForm.provider
                      };

                      const currentLogs = v.maintenanceLogs || [];
                      onUpdateVehicle(selectedVehicleId, {
                        maintenanceLogs: [...currentLogs, newLog]
                      });

                      setSuccessMessage(`Entretien enregistré avec succès pour le véhicule ${v.brand} (${v.plate}) !`);
                      setMaintenanceForm({
                        date: new Date().toISOString().split('T')[0],
                        type: 'oil_change',
                        cost: 500,
                        description: '',
                        provider: ''
                      });
                    }}
                    className="space-y-3"
                  >
                    <div>
                      <label className="block text-[10px] font-bold text-[#6D7175] uppercase">Sélectionner Véhicule</label>
                      <select
                        value={selectedVehicleId || ''}
                        onChange={(e) => setSelectedVehicleId(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-[#E1E3E5] px-2.5 py-1.5 text-xs text-[#1A1A1A] bg-white focus:outline-none font-bold"
                      >
                        <option value="">-- Choisir --</option>
                        {vehicles.map(v => (
                          <option key={v.id} value={v.id}>{v.brand} {v.model} ({v.plate})</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-[#6D7175] uppercase">Date Intervention</label>
                        <input
                          type="date"
                          value={maintenanceForm.date}
                          onChange={(e) => setMaintenanceForm({...maintenanceForm, date: e.target.value})}
                          className="mt-1 w-full rounded-lg border border-[#E1E3E5] px-2.5 py-1.5 text-xs text-[#1A1A1A] bg-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#6D7175] uppercase">Type d'Entretien</label>
                        <select
                          value={maintenanceForm.type}
                          onChange={(e) => setMaintenanceForm({...maintenanceForm, type: e.target.value as any})}
                          className="mt-1 w-full rounded-lg border border-[#E1E3E5] px-2.5 py-1.5 text-xs text-[#1A1A1A] bg-white focus:outline-none font-semibold"
                        >
                          <option value="oil_change">Vidange Moteur & Filtres</option>
                          <option value="tires">Changement de Pneus</option>
                          <option value="brakes">Système de Freinage</option>
                          <option value="engine">Organes Moteurs & Boîte</option>
                          <option value="other">Autres Réparations (Clim, Élec)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-[#6D7175] uppercase">Coût Total (DHS TTC)</label>
                        <input
                          type="number"
                          required
                          value={maintenanceForm.cost}
                          onChange={(e) => setMaintenanceForm({...maintenanceForm, cost: Number(e.target.value)})}
                          className="mt-1 w-full rounded-lg border border-[#E1E3E5] px-2.5 py-1.5 text-xs text-[#1A1A1A] bg-white focus:outline-none font-bold text-gray-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#6D7175] uppercase">Garage / Prestataire</label>
                        <input
                          type="text"
                          required
                          placeholder="Mecano Marrakech, Auto Hall..."
                          value={maintenanceForm.provider}
                          onChange={(e) => setMaintenanceForm({...maintenanceForm, provider: e.target.value})}
                          className="mt-1 w-full rounded-lg border border-[#E1E3E5] px-2.5 py-1.5 text-xs text-[#1A1A1A] bg-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-[#6D7175] uppercase">Description des Travaux</label>
                      <textarea
                        required
                        placeholder="Détails des pièces changées et remarques..."
                        value={maintenanceForm.description}
                        onChange={(e) => setMaintenanceForm({...maintenanceForm, description: e.target.value})}
                        className="mt-1 w-full rounded-lg border border-[#E1E3E5] px-2.5 py-1.5 text-xs text-[#1A1A1A] bg-white focus:outline-none h-16 resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 bg-[#008060] hover:bg-[#006e52] text-white text-xs font-bold rounded-lg transition mt-2 cursor-pointer"
                    >
                      Enregistrer dans le Carnet de Bord numérique
                    </button>
                  </form>
                </div>

                {/* Maintenances Logs list across ALL vehicles */}
                <div className="lg:col-span-8 bg-white rounded-xl border border-[#E1E3E5] p-5 shadow-2xs space-y-4">
                  <h3 className="font-bold text-sm text-[#1A1A1A]">Historique Chronologique des Interventions</h3>

                  <div className="overflow-x-auto no-scrollbar">
                    {(() => {
                      // Flatten logs
                      const allLogs: Array<{ vehicle: Vehicle; log: any }> = [];
                      vehicles.forEach(v => {
                        if (v.maintenanceLogs) {
                          v.maintenanceLogs.forEach(l => {
                            allLogs.push({ vehicle: v, log: l });
                          });
                        }
                      });

                      // Sort by date desc
                      allLogs.sort((a, b) => new Date(b.log.date).getTime() - new Date(a.log.date).getTime());

                      if (allLogs.length === 0) {
                        return (
                          <div className="text-center py-12 text-gray-400">
                            Aucun entretien saisi dans le système pour le moment. Remplissez le formulaire de gauche pour alimenter l'historique de votre agence.
                          </div>
                        );
                      }

                      return (
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-gray-100 text-[10px] font-bold text-[#6D7175] uppercase bg-gray-50/50">
                              <th className="py-2.5 px-3">Date</th>
                              <th className="py-2.5 px-3">Véhicule</th>
                              <th className="py-2.5 px-3">Type Intervention</th>
                              <th className="py-2.5 px-3">Prestataire / Détails</th>
                              <th className="py-2.5 px-3 text-right font-mono">Montant</th>
                              <th className="py-2.5 px-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {allLogs.map(item => {
                              const v = item.vehicle;
                              const l = item.log;
                              return (
                                <tr key={l.id} className="hover:bg-slate-50/50 transition">
                                  <td className="py-2.5 px-3 font-semibold text-gray-800">{l.date}</td>
                                  <td className="py-2.5 px-3">
                                    <div className="font-extrabold text-[#1A1A1A]">{v.brand} {v.model}</div>
                                    <div className="text-[9px] font-bold text-gray-500 font-mono bg-gray-100 px-1 rounded inline-block">{v.plate}</div>
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <span className="font-bold text-xs flex items-center gap-1 text-slate-700">
                                      {l.type === 'oil_change' ? '🛢️ Vidange Moteur' :
                                       l.type === 'tires' ? '🛞 Pneus' :
                                       l.type === 'brakes' ? '🛑 Freins' :
                                       l.type === 'engine' ? '⚙️ Moteur' : '🔧 Entretien'}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <div className="font-bold text-gray-700">{l.provider}</div>
                                    <div className="text-[10px] text-gray-500 line-clamp-1">{l.description}</div>
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-black text-gray-900 font-mono text-xs">
                                    {l.cost.toLocaleString()} DHS
                                  </td>
                                  <td className="py-2.5 px-3 text-right">
                                    <button
                                      onClick={() => {
                                        const cleanLogs = v.maintenanceLogs?.filter(itemLog => itemLog.id !== l.id) || [];
                                        onUpdateVehicle(v.id, {
                                          maintenanceLogs: cleanLogs
                                        });
                                        setSuccessMessage("Entretien supprimé !");
                                      }}
                                      className="p-1 hover:bg-rose-50 text-rose-600 rounded transition cursor-pointer"
                                      title="Supprimer la facture"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SUB-TAB: SUIVI GAZOIL, KM ET DATE */}
          {fleetSubTab === 'fuel' && (
            <div className="space-y-6 w-full animate-fade-in">
              {/* Analytics & Metrics */}
              <div className="grid gap-4 sm:grid-cols-4">
                <div className="bg-white rounded-xl border border-[#E1E3E5] p-4 shadow-2xs flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[#6D7175] font-bold uppercase block">Budget Gazoil Cumulé</span>
                    <strong className="text-xl text-slate-800 font-mono font-black mt-1 block">
                      {vehicles.reduce((sum, v) => sum + (v.fuelLogs?.reduce((s, log) => s + log.cost, 0) || 0), 0).toLocaleString()} DHS
                    </strong>
                  </div>
                  <div className="p-2 bg-emerald-50 text-[#008060] rounded-lg">
                    <Fuel className="h-5 w-5" />
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-[#E1E3E5] p-4 shadow-2xs flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[#6D7175] font-bold uppercase block">Volume Total Consommé</span>
                    <strong className="text-xl text-slate-800 font-mono mt-1 block">
                      {vehicles.reduce((sum, v) => sum + (v.fuelLogs?.reduce((s, log) => s + log.liters, 0) || 0), 0).toLocaleString()} Litres
                    </strong>
                  </div>
                  <div className="p-2 bg-slate-100 text-slate-700 rounded-lg">
                    ⛽
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-[#E1E3E5] p-4 shadow-2xs flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[#6D7175] font-bold uppercase block">Prix Moyen au Litre</span>
                    <strong className="text-xl text-slate-800 mt-1 block">
                      12,90 DHS
                    </strong>
                  </div>
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    📊
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-[#E1E3E5] p-4 shadow-2xs flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[#6D7175] font-bold uppercase block">Distance Moyenne Entre Refill</span>
                    <strong className="text-xl text-slate-800 mt-1 block">
                      ~ 540 KM
                    </strong>
                  </div>
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                    🚗
                  </div>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-12">
                {/* Fuel Logging Form */}
                <div className="lg:col-span-4 bg-white rounded-xl border border-[#E1E3E5] p-5 shadow-2xs space-y-4">
                  <h3 className="font-bold text-sm text-[#1A1A1A] flex items-center gap-1.5">
                    <Fuel className="h-4.5 w-4.5 text-[#008060]" />
                    Saisie Ticket Gazoil & KM
                  </h3>
                  <p className="text-[11px] text-[#6D7175]">
                    Enregistrez chaque plein d'essence ou de gazole en indiquant la date, le volume en litres, le coût total en Dirhams et le kilométrage actuel au tableau de bord.
                  </p>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!selectedVehicleId) {
                        alert("Veuillez d'abord choisir un véhicule.");
                        return;
                      }
                      const v = vehicles.find(item => item.id === selectedVehicleId);
                      if (!v) return;

                      const newLog = {
                        id: `f-${Math.floor(100 + Math.random() * 900)}`,
                        date: fuelForm.date,
                        liters: Number(fuelForm.liters),
                        cost: Number(fuelForm.cost),
                        mileage: Number(fuelForm.mileage)
                      };

                      const currentLogs = v.fuelLogs || [];
                      const finalMileage = Number(fuelForm.mileage) > (v.mileage || 0) ? Number(fuelForm.mileage) : v.mileage;

                      onUpdateVehicle(selectedVehicleId, {
                        fuelLogs: [...currentLogs, newLog],
                        mileage: finalMileage
                      });

                      setSuccessMessage(`Ticket Gazoil enregistré : +${fuelForm.liters}L pour le véhicule ${v.brand} (${v.plate}) !`);
                      setFuelForm({
                        date: new Date().toISOString().split('T')[0],
                        liters: 45,
                        cost: 580,
                        mileage: finalMileage ? finalMileage + 450 : 45000
                      });
                    }}
                    className="space-y-3"
                  >
                    <div>
                      <label className="block text-[10px] font-bold text-[#6D7175] uppercase">Véhicule concerné</label>
                      <select
                        value={selectedVehicleId || ''}
                        onChange={(e) => {
                          const id = e.target.value;
                          setSelectedVehicleId(id);
                          const chosen = vehicles.find(item => item.id === id);
                          if (chosen) {
                            setFuelForm(prev => ({ ...prev, mileage: (chosen.mileage || 45000) + 400 }));
                          }
                        }}
                        className="mt-1 w-full rounded-lg border border-[#E1E3E5] px-2.5 py-1.5 text-xs text-[#1A1A1A] bg-white focus:outline-none font-bold"
                      >
                        <option value="">-- Choisir --</option>
                        {vehicles.map(v => (
                          <option key={v.id} value={v.id}>{v.brand} {v.model} ({v.plate})</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-[#6D7175] uppercase">Date du Plein</label>
                        <input
                          type="date"
                          value={fuelForm.date}
                          onChange={(e) => setFuelForm({...fuelForm, date: e.target.value})}
                          className="mt-1 w-full rounded-lg border border-[#E1E3E5] px-2.5 py-1.5 text-xs text-[#1A1A1A] bg-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#6D7175] uppercase">Volume en Litres</label>
                        <input
                          type="number"
                          required
                          value={fuelForm.liters}
                          onChange={(e) => setFuelForm({...fuelForm, liters: Number(e.target.value)})}
                          className="mt-1 w-full rounded-lg border border-[#E1E3E5] px-2.5 py-1.5 text-xs text-[#1A1A1A] bg-white focus:outline-none font-semibold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-[#6D7175] uppercase">Montant Payé (DHS)</label>
                        <input
                          type="number"
                          required
                          value={fuelForm.cost}
                          onChange={(e) => setFuelForm({...fuelForm, cost: Number(e.target.value)})}
                          className="mt-1 w-full rounded-lg border border-[#E1E3E5] px-2.5 py-1.5 text-xs text-[#1A1A1A] bg-white focus:outline-none font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#6D7175] uppercase">Kilométrage Actuel</label>
                        <input
                          type="number"
                          required
                          value={fuelForm.mileage}
                          onChange={(e) => setFuelForm({...fuelForm, mileage: Number(e.target.value)})}
                          className="mt-1 w-full rounded-lg border border-[#E1E3E5] px-2.5 py-1.5 text-xs text-[#1A1A1A] bg-white focus:outline-none font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-[#6D7175] uppercase">Station Service</label>
                      <select className="mt-1 w-full rounded-lg border border-[#E1E3E5] px-2.5 py-1.5 text-xs text-[#1A1A1A] bg-white focus:outline-none">
                        <option value="afriquia">Afriquia (Maroc)</option>
                        <option value="shell">Shell</option>
                        <option value="total">TotalEnergies</option>
                        <option value="petrom">Petrom</option>
                        <option value="ola">Ola Energy</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 bg-[#008060] hover:bg-[#006e52] text-white text-xs font-bold rounded-lg transition mt-2 cursor-pointer"
                    >
                      Enregistrer le ticket & Relever l'odomètre
                    </button>
                  </form>
                </div>

                {/* Combined Fuel Logs list across ALL vehicles */}
                <div className="lg:col-span-8 bg-white rounded-xl border border-[#E1E3E5] p-5 shadow-2xs space-y-4">
                  <h3 className="font-bold text-sm text-[#1A1A1A]">Journal d'Approvisionnement Carburant</h3>

                  <div className="overflow-x-auto no-scrollbar">
                    {(() => {
                      const allFuelLogs: Array<{ vehicle: Vehicle; log: any }> = [];
                      vehicles.forEach(v => {
                        if (v.fuelLogs) {
                          v.fuelLogs.forEach(f => {
                            allFuelLogs.push({ vehicle: v, log: f });
                          });
                        }
                      });

                      // Sort by date desc
                      allFuelLogs.sort((a, b) => new Date(b.log.date).getTime() - new Date(a.log.date).getTime());

                      if (allFuelLogs.length === 0) {
                        return (
                          <div className="text-center py-12 text-gray-400">
                            Aucune consommation enregistrée. Utilisez le formulaire de gauche pour ajouter votre premier ticket gazoil.
                          </div>
                        );
                      }

                      return (
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-gray-100 text-[10px] font-bold text-[#6D7175] uppercase bg-gray-50/50">
                              <th className="py-2.5 px-3">Date</th>
                              <th className="py-2.5 px-3">Véhicule</th>
                              <th className="py-2.5 px-3 font-mono">Volume (L)</th>
                              <th className="py-2.5 px-3 font-mono">Compteur (KM)</th>
                              <th className="py-2.5 px-3 text-right">Montant (DHS)</th>
                              <th className="py-2.5 px-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {allFuelLogs.map(item => {
                              const v = item.vehicle;
                              const l = item.log;
                              return (
                                <tr key={l.id} className="hover:bg-slate-50/50 transition">
                                  <td className="py-2.5 px-3 font-semibold text-gray-800">{l.date}</td>
                                  <td className="py-2.5 px-3">
                                    <div className="font-extrabold text-[#1A1A1A]">{v.brand} {v.model}</div>
                                    <div className="text-[9px] font-bold text-gray-500 font-mono bg-gray-100 px-1 rounded inline-block">{v.plate}</div>
                                  </td>
                                  <td className="py-2.5 px-3 font-mono font-bold text-gray-700">
                                    {l.liters} L
                                  </td>
                                  <td className="py-2.5 px-3 font-mono text-gray-600">
                                    {l.mileage.toLocaleString()} KM
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-mono font-black text-[#008060] text-xs">
                                    {l.cost.toLocaleString()} DHS
                                  </td>
                                  <td className="py-2.5 px-3 text-right">
                                    <button
                                      onClick={() => {
                                        const cleanLogs = v.fuelLogs?.filter(itemLog => itemLog.id !== l.id) || [];
                                        onUpdateVehicle(v.id, {
                                          fuelLogs: cleanLogs
                                        });
                                        setSuccessMessage("Ticket carburant supprimé !");
                                      }}
                                      className="p-1 hover:bg-rose-50 text-rose-600 rounded transition cursor-pointer"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SUB-TAB: LIVE GPS TRACKING & RADAR */}
          {fleetSubTab === 'gps' && (
            <div className="space-y-6 w-full animate-fade-in text-left">
              {!gpsIsConnected ? (
                /* GORGEOUS API GPS CONNECTION FORM */
                <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-[#E1E3E5] shadow-sm p-6 space-y-6 animate-fade-in">
                  <div className="border-b border-[#E1E3E5] pb-4 flex items-center gap-3">
                    <div className="p-3 bg-[#EBF5F1] rounded-2xl border border-[#BBE3D1]/50 text-[#008060] shrink-0">
                      <Compass className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base text-gray-900">🔗 Intégration API de Géolocalisation Flotte</h3>
                      <p className="text-[11px] text-gray-500 font-medium">Connectez les plateformes GPS les plus connues du marché pour suivre votre flotte en temps réel.</p>
                    </div>
                  </div>

                  {gpsIsConnecting ? (
                    <div className="py-12 flex flex-col items-center justify-center space-y-4">
                      <Loader2 className="h-10 w-10 text-[#008060] animate-spin" />
                      <div className="text-center">
                        <p className="text-xs font-black text-gray-900">Initialisation de la connexion API...</p>
                        <p className="text-[10px] text-gray-500 mt-1 font-mono">
                          Requête de poignée de main (handshake) sur {gpsApiUrl}...
                        </p>
                      </div>
                      <div className="max-w-md w-full bg-slate-950 rounded-xl p-3 border border-slate-800 font-mono text-[9px] text-emerald-400 h-32 overflow-y-auto space-y-1">
                        <div>&gt; RESOLUTION DNS: {gpsApiUrl.replace('https://', '')}</div>
                        <div className="animate-pulse">&gt; ÉTABLISSEMENT DE SESSION: SSL/TLS Chiffrement Actif...</div>
                        <div className="delay-100 animate-pulse">&gt; AUTHENTIFICATION: Validation de la clé d'API Token...</div>
                        <div className="delay-200 animate-pulse">&gt; SYNCHRONISATION: Téléchargement de l'index des balises de la flotte...</div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider">Sélectionnez votre Plateforme GPS Professionnelle</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {[
                            { id: 'samsara', label: 'Samsara IoT', desc: 'api.samsara.com' },
                            { id: 'geotab', label: 'MyGeotab SDK', desc: 'my.geotab.com/api' },
                            { id: 'webfleet', label: 'TomTom Webfleet', desc: 'webfleet.com/api' },
                            { id: 'verizon', label: 'Verizon Connect', desc: 'reveal.verizon.com' },
                            { id: 'garmin', label: 'Garmin Fleet API', desc: 'garmin.com/fleet' },
                            { id: 'custom', label: 'REST API Custom', desc: 'Saisir URL Endpoint' }
                          ].map(plat => (
                            <div
                              key={plat.id}
                              onClick={() => {
                                setGpsApiPlatform(plat.id);
                                if (plat.id === 'samsara') setGpsApiUrl('https://api.samsara.com/v1');
                                else if (plat.id === 'geotab') setGpsApiUrl('https://my.geotab.com/apiv1');
                                else if (plat.id === 'webfleet') setGpsApiUrl('https://api.webfleet.com/connect');
                                else if (plat.id === 'verizon') setGpsApiUrl('https://api.reveal.verizonconnect.com');
                                else if (plat.id === 'garmin') setGpsApiUrl('https://fleet.api.garmin.com');
                                else setGpsApiUrl('https://my-custom-endpoint.com/gps/live');
                              }}
                              className={`p-3 rounded-xl border-2 cursor-pointer text-left transition-all flex flex-col justify-between h-20 ${
                                gpsApiPlatform === plat.id 
                                  ? 'border-[#008060] bg-[#EBF5F1]/45' 
                                  : 'border-gray-200 hover:border-gray-300 bg-white'
                              }`}
                            >
                              <strong className={`text-xs block ${gpsApiPlatform === plat.id ? 'text-[#008060]' : 'text-slate-800'}`}>{plat.label}</strong>
                              <span className="text-[9px] font-mono text-slate-400 block mt-1">{plat.desc}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2 pt-2">
                        <div className="space-y-1.5 text-left">
                          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider">Clé d'API Secrète (Token / Bearer Key)</label>
                          <input
                            type="password"
                            placeholder="Saisir le token d'accès API..."
                            value={gpsApiKey}
                            onChange={(e) => setGpsApiKey(e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-800 font-mono focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1.5 text-left">
                          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider">ID de Client / Compte (Optionnel)</label>
                          <input
                            type="text"
                            placeholder="ex: Atlas_Transport_Samsara_Main"
                            value={gpsClientId}
                            onChange={(e) => setGpsClientId(e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-800 focus:outline-none"
                          />
                        </div>

                        <div className="sm:col-span-2 space-y-1.5 text-left">
                          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider">URL Endpoint de Connexion Télématique</label>
                          <input
                            type="text"
                            value={gpsApiUrl}
                            onChange={(e) => setGpsApiUrl(e.target.value)}
                            className="w-full bg-gray-50 border border-[#E1E3E5] rounded-lg px-3 py-2 text-xs text-gray-650 font-mono focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-100">
                        <button
                          type="button"
                          onClick={() => {
                            // Demo quick filling
                            setGpsApiKey("sam_api_live_45a9829bce01e2311f9");
                            setGpsClientId("Demo_Atlas_Marrakech_Samsara");
                            setGpsIsConnecting(true);
                            setTimeout(() => {
                              setGpsIsConnecting(false);
                              setGpsIsConnected(true);
                              setSuccessMessage("✓ Télématique Connectée avec Succès via Samsara Live API Cloud !");
                            }, 2500);
                          }}
                          className="px-4 py-2 text-xs font-black text-[#008060] hover:text-[#006e52] bg-emerald-50 hover:bg-emerald-100/70 rounded-xl transition cursor-pointer"
                        >
                          🔑 Utiliser l'API Démo Pré-Configurée (Samsara Cloud)
                        </button>

                        <button
                          type="button"
                          disabled={!gpsApiKey && gpsApiPlatform !== 'custom'}
                          onClick={() => {
                            setGpsIsConnecting(true);
                            setTimeout(() => {
                              setGpsIsConnecting(false);
                              setGpsIsConnected(true);
                              setSuccessMessage("✓ Télématique Connectée avec Succès via l'API " + gpsApiPlatform.toUpperCase() + " !");
                            }, 2500);
                          }}
                          className="px-5 py-2 text-xs font-black text-white bg-[#008060] hover:bg-[#006e52] rounded-xl transition cursor-pointer disabled:opacity-40"
                        >
                          Vérifier & Connecter la Flotte →
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* CONNECTED VIEW SHOWING MAP & ACTUAL SYNCHRONIZATION */
                <div className="space-y-6 animate-fade-in">
                  {/* Connected Header Banner */}
                  <div className="bg-emerald-50 border border-[#BBE3D1] rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-3xs text-left">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-[#EBF5F1] text-[#008060] rounded-xl border border-[#BBE3D1]/50 flex items-center justify-center shrink-0">
                        <Compass className="h-5 w-5 animate-spin" />
                      </div>
                      <div>
                        <h4 className="text-xs font-extrabold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                          ✓ API Télématique Connectée & Synchronisée
                        </h4>
                        <p className="text-[10.5px] text-emerald-800 font-semibold mt-0.5">
                          Fournisseur : <strong className="uppercase">{gpsApiPlatform} API</strong> • URL : <span className="font-mono text-[9px] text-emerald-700">{gpsApiUrl}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] bg-[#008060] text-white font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider animate-pulse shrink-0">
                        ● API Synced Live
                      </span>
                      <button 
                        onClick={() => {
                          setGpsIsConnected(false);
                          setSuccessMessage("API Télématique déconnectée.");
                        }}
                        className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-[10.5px] font-black rounded-lg transition-all cursor-pointer"
                      >
                        Changer d'API
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-6 lg:grid-cols-12 w-full">
                    {/* Live Tracking Map Simulator (8 cols) */}
                    <div className="lg:col-span-8 bg-[#0F172A] rounded-2xl border border-slate-800 p-5 shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[460px]">
                      {/* Top bar */}
                      <div className="flex justify-between items-center z-10 shrink-0">
                        <div className="flex items-center gap-2">
                          <span className="flex h-2.5 w-2.5 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                          </span>
                          <h3 className="font-mono text-[9px] font-black text-white uppercase tracking-wider">
                            API {gpsApiPlatform.toUpperCase()} LIVE FEED • SYNC OK
                          </h3>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              const newLogs = [...gpsSimulatedLogs];
                              const keys = Object.keys(gpsLocations);
                              const selectedKey = keys[Math.floor(Math.random() * keys.length)];
                              const chosenVeh = vehicles.find(item => item.id === selectedKey) || vehicles[0];
                              const newSpeed = Math.floor(Math.random() * 95);
                              const locationNames = ["Riad El Fenn", "Avenue de France", "Palmeraie Club", "Route du barrage Lalla Takerkoust", "Medina Bab Doukkala", "Chérifia", "M'hamid"];
                              const newLoc = locationNames[Math.floor(Math.random() * locationNames.length)];
                              
                              const baseLat = 31.6295;
                              const baseLng = -7.9811;
                              const randomLat = baseLat + (Math.random() - 0.5) * 0.05;
                              const randomLng = baseLng + (Math.random() - 0.5) * 0.05;

                              setGpsLocations(prev => ({
                                ...prev,
                                [selectedKey]: {
                                  ...prev[selectedKey],
                                  lat: randomLat,
                                  lng: randomLng,
                                  speed: newSpeed,
                                  status: newSpeed === 0 ? 'idle' : 'moving',
                                  locationName: newLoc
                                }
                              }));

                              newLogs.unshift(`[${new Date().toLocaleTimeString()}] [GET] /vehicles/${selectedKey}/stats -> 200 OK. ${chosenVeh.brand} à ${newLoc}`);
                              setGpsSimulatedLogs(newLogs.slice(0, 10));
                              setPingingVehicleId(selectedKey);
                              setSelectedGpsVehicleId(selectedKey);
                              setTimeout(() => setPingingVehicleId(null), 1500);
                              setSuccessMessage("Données GPS mises à jour depuis l'API !");
                            }}
                            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[9.5px] rounded-lg transition border border-slate-700 cursor-pointer flex items-center gap-1"
                          >
                            <RefreshCw className="h-3 w-3 animate-spin" /> Forcer Rafraîchissement API
                          </button>
                        </div>
                      </div>

                      {/* Real Leaflet Map Container */}
                      <div 
                        ref={mapContainerRef} 
                        className="my-4 h-64 border border-slate-800 bg-slate-950 rounded-xl overflow-hidden z-0"
                        style={{ minHeight: '256px' }}
                      ></div>

                      {/* Bottom Console logs area */}
                      <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-850 font-mono text-[9.5px] text-emerald-400 space-y-1 shrink-0 h-24 overflow-y-auto">
                        <div className="text-slate-500 text-[8.5px] font-bold uppercase tracking-wider pb-1 flex justify-between items-center">
                          <span>CONSOLE DE LOGS D'API SÉCURISÉE (TÉLÉMÉTRIE CLOUD)</span>
                          <span className="text-[#008060]">CONNECTED ●</span>
                        </div>
                        <div className="text-gray-500">[FETCH] Authenticated using Bearer Key {gpsApiKey.substring(0, 8)}...</div>
                        {gpsSimulatedLogs.map((logStr, i) => (
                          <div key={i} className="line-clamp-1 text-[9px]">
                            <span className="text-slate-500">&gt;&gt;</span> {logStr}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Telemetrics control and list right side panel (4 cols) */}
                    <div className="lg:col-span-4 bg-white rounded-2xl border border-[#E1E3E5] p-5 shadow-xs space-y-4 flex flex-col justify-between min-h-[460px]">
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-extrabold text-sm text-[#1A1A1A]">Index Flotte GPS</h3>
                          <p className="text-[11px] text-gray-500">Cliquez sur un véhicule pour isoler son signal traceur satellite.</p>
                        </div>

                        <div className="space-y-2 max-h-[170px] overflow-y-auto pr-1">
                          {vehicles.map(v => {
                            const loc = gpsLocations[v.id] || { speed: 64, status: 'moving', locationName: 'Avenue de France' };
                            const isSelected = selectedGpsVehicleId === v.id;
                            return (
                              <div
                                key={v.id}
                                onClick={() => setSelectedGpsVehicleId(v.id)}
                                className={`p-2.5 rounded-xl border transition cursor-pointer flex justify-between items-center ${
                                  isSelected 
                                    ? "bg-slate-50 border-slate-400 ring-1 ring-slate-400" 
                                    : "bg-white border-[#E1E3E5] hover:bg-slate-50/50"
                                }`}
                              >
                                <div>
                                  <strong className="text-xs text-slate-800">{v.brand} {v.model}</strong>
                                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">{v.plate} • {loc.locationName}</p>
                                </div>
                                <div className="text-right">
                                  <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${
                                    loc.status === 'moving' 
                                      ? 'bg-emerald-500 animate-pulse' 
                                      : loc.status === 'idle' 
                                        ? 'bg-amber-500 animate-pulse' 
                                        : 'bg-slate-400'
                                  }`}></span>
                                  <span className="text-[10px] font-black text-slate-800">{loc.speed} km/h</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Active telemetries device card */}
                      {(() => {
                        const activeVeh = vehicles.find(v => v.id === selectedGpsVehicleId) || vehicles[0];
                        if (!activeVeh) return null;
                        const activeLoc = gpsLocations[activeVeh.id] || { speed: 64, status: 'moving', locationName: 'Avenue de France', fuel: 75 };

                        return (
                          <div className="bg-slate-900 text-white rounded-xl p-4 space-y-3 shrink-0">
                            <div className="flex justify-between items-start border-b border-slate-800 pb-2">
                              <div>
                                <span className="text-[9px] font-mono font-bold text-slate-400 uppercase">Données Traceur API</span>
                                <h4 className="text-xs font-black">{activeVeh.brand} {activeVeh.model}</h4>
                                <span className="text-[9.5px] font-mono text-slate-400">{activeVeh.plate}</span>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                                activeLoc.status === 'moving' 
                                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                                  : activeLoc.status === 'idle' 
                                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" 
                                    : "bg-slate-800 text-slate-400"
                              }`}>
                                {activeLoc.status === 'moving' ? 'En mouvement' : activeLoc.status === 'idle' ? 'Moteur ralenti' : 'Arrêté'}
                              </span>
                            </div>

                            {/* Telemetry info fields */}
                            <div className="grid grid-cols-2 gap-3 text-[10px] font-mono">
                              <div>
                                <span className="text-[8px] text-slate-500 block uppercase">Vitesse API</span>
                                <strong className="text-slate-200 text-xs">{activeLoc.speed} km/h</strong>
                              </div>
                              <div>
                                <span className="text-[8px] text-slate-500 block uppercase">Carburant CanBus</span>
                                <strong className="text-slate-200 text-xs">{activeLoc.fuel}%</strong>
                              </div>
                              <div>
                                <span className="text-[8px] text-slate-500 block uppercase">Requêtes API</span>
                                <strong className="text-emerald-400 text-xs">OK (200)</strong>
                              </div>
                              <div>
                                <span className="text-[8px] text-slate-500 block uppercase">Statut API</span>
                                <strong className="text-slate-200 text-xs">Actif ({gpsApiPlatform})</strong>
                              </div>
                            </div>

                            <div className="text-[10px] font-mono pt-1">
                              <span className="text-[8.5px] text-slate-500 block uppercase">Dernières Coordonnées GPS</span>
                              <span className="text-slate-300 text-[9px]">
                                lat: {activeLoc.lat.toFixed(5)} / lng: {activeLoc.lng.toFixed(5)}
                              </span>
                            </div>

                            <button
                              onClick={() => {
                                setPingingVehicleId(activeVeh.id);
                                const updatedLogs = [...gpsSimulatedLogs];
                                updatedLogs.unshift(`[${new Date().toLocaleTimeString()}] [GET] /vehicles/${activeVeh.id}/positions -> Response 200 OK (8ms), position lat:${activeLoc.lat.toFixed(4)} lng:${activeLoc.lng.toFixed(4)}`);
                                setGpsSimulatedLogs(updatedLogs.slice(0, 10));
                                setTimeout(() => setPingingVehicleId(null), 1500);
                                setSuccessMessage(`Ping API envoyé avec succès vers le traceur du véhicule ${activeVeh.brand}`);
                              }}
                              className="w-full py-2 bg-[#008060] hover:bg-[#006e52] text-white font-black text-xs rounded-lg transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              🛰️ Ping Requête API Traceur
                            </button>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              )}

              {/* HISTORICAL PLAYBACK & GEOFENCE CONTROLLER PANEL GRID */}
              <div className="grid gap-6 lg:grid-cols-12 w-full mt-6">
                {/* Historical Playback Controller */}
                <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-4 text-left">
                  <div className="border-b border-gray-100 pb-3 text-left">
                    <h4 className="text-sm font-black text-gray-900 flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-[#008060]" />
                      Rejeu Historique d'Itinéraire (Playback)
                    </h4>
                    <p className="text-[10.5px] text-gray-500 font-medium font-semibold">Rejouez les trajets historiques de n'importe quel véhicule avec télémétrie complète.</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="text-left flex-1 min-w-[150px]">
                      <label className="block text-[9px] font-black text-gray-500 uppercase tracking-wider mb-1">Véhicule à analyser</label>
                      <select
                        value={playbackVehicleId}
                        onChange={(e) => {
                          setPlaybackVehicleId(e.target.value);
                          setPlaybackProgress(0);
                          setPlaybackIsRunning(false);
                        }}
                        className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs font-semibold text-gray-700 focus:outline-none"
                      >
                        {vehicles.map(v => (
                          <option key={v.id} value={v.id}>{v.brand} {v.model} ({v.plate})</option>
                        ))}
                      </select>
                    </div>

                    <div className="text-left">
                      <label className="block text-[9px] font-black text-gray-500 uppercase tracking-wider mb-1">Vitesse de Rejeu</label>
                      <div className="flex bg-gray-150 p-0.5 rounded-lg border border-gray-200">
                        {[1, 2, 4].map(s => (
                          <button
                            type="button"
                            key={s}
                            onClick={() => setPlaybackSpeed(s)}
                            className={`px-2.5 py-1 text-[10px] font-black rounded-md transition ${
                              playbackSpeed === s ? "bg-[#008060] text-white shadow-3xs" : "text-gray-600 hover:text-gray-900"
                            }`}
                          >
                            {s}x
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Playback simulation status bar */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-gray-150 space-y-3 text-left">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-gray-400 font-black uppercase">Progression du Trajet</span>
                      <strong className="text-xs font-bold text-gray-900">{playbackProgress}% ({Math.round(playbackProgress * 1.2)} min écoulées)</strong>
                    </div>

                    {/* Progress slider bar */}
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={playbackProgress}
                      onChange={(e) => {
                        setPlaybackProgress(Number(e.target.value));
                        if (playbackIsRunning) setPlaybackIsRunning(false);
                      }}
                      className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#008060]"
                    />

                    <div className="flex gap-2.5 justify-center">
                      <button
                        type="button"
                        onClick={() => setPlaybackIsRunning(!playbackIsRunning)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1 ${
                          playbackIsRunning 
                            ? "bg-amber-650 text-white hover:bg-amber-700" 
                            : "bg-[#008060] text-white hover:bg-[#006e52]"
                        }`}
                      >
                        {playbackIsRunning ? "⏸️ Pause" : "▶️ Play"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPlaybackProgress(0);
                          setPlaybackIsRunning(false);
                        }}
                        className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 rounded-lg text-xs font-bold transition cursor-pointer"
                      >
                        🔄 RàS
                      </button>
                    </div>
                  </div>

                  {/* Playback timeline logs */}
                  <div className="bg-slate-900 text-slate-300 font-mono text-[9.5px] p-3 rounded-lg border border-slate-800 space-y-1.5 max-h-[140px] overflow-y-auto text-left">
                    <span className="text-slate-500 block text-[8.5px] font-bold uppercase tracking-widest border-b border-slate-800 pb-1 mb-1">
                      JOURNAL DE TÉLÉMÉTRIE DU PARCOURS
                    </span>
                    {playbackLogs.map((l, i) => (
                      <div key={i} className="line-clamp-1">
                        <span className="text-emerald-500">✔</span> {l}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Geofence Draw Zone & Alerts Manager */}
                <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-4 text-left">
                  <div className="border-b border-gray-100 pb-3 text-left">
                    <h4 className="text-sm font-black text-gray-900 flex items-center gap-1.5">
                      <Compass className="h-4 w-4 text-[#008060]" />
                      Gestionnaire de Zones de Geofencing
                    </h4>
                    <p className="text-[10.5px] text-gray-500 font-medium font-semibold">Définissez des barrières virtuelles autour des aéroports et hôtels avec alertes instantanées de franchissement.</p>
                  </div>

                  {/* Geofence zones listing */}
                  <div className="space-y-2 max-h-[170px] overflow-y-auto pr-1">
                    {geofenceZones.map(zone => (
                      <div key={zone.id} className="p-2.5 rounded-xl border border-gray-150 flex justify-between items-center text-xs text-left">
                        <div className="flex items-center gap-2">
                          <span className={`w-3 h-3 rounded-full border ${zone.color}`}></span>
                          <div>
                            <strong className="text-gray-900 font-bold block">{zone.name}</strong>
                            <span className="text-[9.5px] text-gray-400 font-mono mt-0.5">Centre: {zone.center} | Rayon: {zone.radius} m</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setGeofenceZones(prev => prev.map(z => z.id === zone.id ? { ...z, active: !z.active } : z));
                            }}
                            className={`px-2 py-1 rounded text-[10px] font-black uppercase border ${
                              zone.active 
                                ? "bg-emerald-50 text-[#008060] border-[#BBE3D1]" 
                                : "bg-gray-50 text-gray-500 border-gray-200"
                            }`}
                          >
                            {zone.active ? "Activée" : "Désactivée"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add a new Mock Geofence Zone */}
                  <div className="bg-gray-50/70 p-3 rounded-xl border border-gray-200 space-y-2.5 text-left">
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider block text-left">🆕 Tracer une Nouvelle Barrière Virtuelle</span>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const f = e.currentTarget;
                        const name = (f.elements.namedItem('gName') as HTMLInputElement).value;
                        const center = (f.elements.namedItem('gCoords') as HTMLInputElement).value;
                        const radius = Number((f.elements.namedItem('gRadius') as HTMLInputElement).value);

                        const newZone = {
                          id: `gf-${Math.floor(100 + Math.random() * 900)}`,
                          name,
                          color: 'border-purple-500 bg-purple-500/10 text-purple-400',
                          center,
                          radius,
                          active: true
                        };
                        setGeofenceZones(prev => [...prev, newZone]);
                        f.reset();
                        alert("Nouvelle zone virtuelle '" + name + "' enregistrée ! Tout franchissement de véhicule sera tracé.");
                      }}
                      className="grid gap-2 sm:grid-cols-3 text-xs"
                    >
                      <input
                        type="text"
                        name="gName"
                        required
                        placeholder="Nom de la Zone"
                        className="bg-white border rounded-lg p-1.5 focus:outline-none"
                      />
                      <input
                        type="text"
                        name="gCoords"
                        required
                        placeholder="Coords ex: 31.62, -7.99"
                        className="bg-white border rounded-lg p-1.5 focus:outline-none"
                      />
                      <input
                        type="number"
                        name="gRadius"
                        required
                        placeholder="Rayon (mètres)"
                        className="bg-white border rounded-lg p-1.5 focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="sm:col-span-3 bg-[#008060] hover:bg-[#006e52] text-white py-1.5 rounded-lg text-xs font-black transition cursor-pointer"
                      >
                        Enregistrer la Zone Virtuelle
                      </button>
                    </form>
                  </div>

                  {/* Real-time geofence violations/alerts */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-gray-150 text-xs text-left space-y-2">
                    <span className="text-[9.5px] font-black text-red-600 uppercase tracking-wider block">🚨 Alertes de Geofencing en Direct</span>
                    <div className="space-y-2 max-h-[110px] overflow-y-auto pr-1">
                      {geofenceAlerts.map(alert => (
                        <div key={alert.id} className="p-2 bg-white rounded border border-red-100 flex justify-between items-start text-[11px] text-left">
                          <div>
                            <span className="font-mono text-red-650 font-bold block">[{alert.timestamp}] {alert.message}</span>
                            <span className="text-[10px] text-gray-400 font-semibold mt-0.5">Véhicule : Plate {alert.vehiclePlate}</span>
                          </div>
                          <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-black uppercase ${
                            alert.type === 'enter' ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-700"
                          }`}>
                            {alert.type === 'enter' ? "Entrée" : "Sortie"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {showAddVehicleForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
              <div className="bg-white rounded-xl border border-[#E1E3E5] max-w-lg w-full p-5 space-y-4 shadow-xl">
                <div className="flex justify-between items-center border-b border-[#E1E3E5] pb-3">
                  <h4 className="text-sm font-bold text-[#1A1A1A]">{isEditingVehicle ? 'Modifier les spécifications du véhicule' : 'Enregistrer un nouveau véhicule'}</h4>
                  <button onClick={() => setShowAddVehicleForm(false)} className="text-gray-400 hover:text-gray-600 font-bold">×</button>
                </div>
                <form onSubmit={handleSaveVehicleSubmit} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-[#6D7175] uppercase tracking-wider">Marque</label>
                      <input
                        type="text"
                        required
                        placeholder="Mercedes-Benz"
                        value={vehicleForm.brand}
                        onChange={(e) => setVehicleForm({...vehicleForm, brand: e.target.value})}
                        className="mt-1 w-full rounded-lg border border-[#E1E3E5] px-2.5 py-1.5 text-xs text-[#1A1A1A] bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#6D7175] uppercase tracking-wider">Modèle</label>
                      <input
                        type="text"
                        required
                        placeholder="Sprinter Tourer"
                        value={vehicleForm.model}
                        onChange={(e) => setVehicleForm({...vehicleForm, model: e.target.value})}
                        className="mt-1 w-full rounded-lg border border-[#E1E3E5] px-2.5 py-1.5 text-xs text-[#1A1A1A] bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-[#6D7175] uppercase tracking-wider">Matricule / Plaque</label>
                      <input
                        type="text"
                        required
                        placeholder="12-A-12345"
                        value={vehicleForm.plate}
                        onChange={(e) => setVehicleForm({...vehicleForm, plate: e.target.value})}
                        className="mt-1 w-full rounded-lg border border-[#E1E3E5] px-2.5 py-1.5 text-xs text-[#1A1A1A] bg-white focus:outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#6D7175] uppercase tracking-wider">Capacité (Pax)</label>
                      <input
                        type="number"
                        required
                        value={vehicleForm.capacity}
                        onChange={(e) => setVehicleForm({...vehicleForm, capacity: Number(e.target.value)})}
                        className="mt-1 w-full rounded-lg border border-[#E1E3E5] px-2.5 py-1.5 text-xs text-[#1A1A1A] bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#6D7175] uppercase tracking-wider">Année</label>
                      <input
                        type="number"
                        required
                        value={vehicleForm.year}
                        onChange={(e) => setVehicleForm({...vehicleForm, year: Number(e.target.value)})}
                        className="mt-1 w-full rounded-lg border border-[#E1E3E5] px-2.5 py-1.5 text-xs text-[#1A1A1A] bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-[#6D7175] uppercase tracking-wider">Échéance Assurance</label>
                      <input
                        type="date"
                        value={vehicleForm.insuranceExpiry}
                        onChange={(e) => setVehicleForm({...vehicleForm, insuranceExpiry: e.target.value})}
                        className="mt-1 w-full rounded-lg border border-[#E1E3E5] px-2.5 py-1.5 text-xs text-[#1A1A1A] bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#6D7175] uppercase tracking-wider">Échéance Contrôle Technique</label>
                      <input
                        type="date"
                        value={vehicleForm.technicalControlExpiry}
                        onChange={(e) => setVehicleForm({...vehicleForm, technicalControlExpiry: e.target.value})}
                        className="mt-1 w-full rounded-lg border border-[#E1E3E5] px-2.5 py-1.5 text-xs text-[#1A1A1A] bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-[#6D7175] uppercase tracking-wider">Type Carburant</label>
                      <select
                        value={vehicleForm.fuelType}
                        onChange={(e) => setVehicleForm({...vehicleForm, fuelType: e.target.value as any})}
                        className="mt-1 w-full rounded-lg border border-[#E1E3E5] px-2.5 py-1.5 text-xs text-[#1A1A1A] bg-white focus:outline-none"
                      >
                        <option value="Gazole">Gazole (Moroccan diesel)</option>
                        <option value="Essence">Essence</option>
                        <option value="Hybride">Hybride</option>
                        <option value="Électrique">Électrique</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#6D7175] uppercase tracking-wider">Kilométrage initial</label>
                      <input
                        type="number"
                        value={vehicleForm.mileage}
                        onChange={(e) => setVehicleForm({...vehicleForm, mileage: Number(e.target.value)})}
                        className="mt-1 w-full rounded-lg border border-[#E1E3E5] px-2.5 py-1.5 text-xs text-[#1A1A1A] bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#6D7175] uppercase tracking-wider">Moy. Conso (L/100)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={vehicleForm.avgConsumption}
                        onChange={(e) => setVehicleForm({...vehicleForm, avgConsumption: Number(e.target.value)})}
                        className="mt-1 w-full rounded-lg border border-[#E1E3E5] px-2.5 py-1.5 text-xs text-[#1A1A1A] bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#6D7175] uppercase tracking-wider">Statut</label>
                    <select
                      value={vehicleForm.status}
                      onChange={(e) => setVehicleForm({...vehicleForm, status: e.target.value as any})}
                      className="mt-1 w-full rounded-lg border border-[#E1E3E5] px-2.5 py-1.5 text-xs text-[#1A1A1A] bg-white focus:outline-none font-bold"
                    >
                      <option value="available">Disponible</option>
                      <option value="maintenance">En Maintenance</option>
                      <option value="on_duty">En Mission</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#6D7175] uppercase tracking-wider">Notes & Options (ex: WIFI, VIP, Bagages)</label>
                    <textarea
                      placeholder="Indiquez les options du véhicule..."
                      value={vehicleForm.notes}
                      onChange={(e) => setVehicleForm({...vehicleForm, notes: e.target.value})}
                      className="mt-1 w-full rounded-lg border border-[#E1E3E5] px-2.5 py-1.5 text-xs text-[#1A1A1A] bg-white focus:outline-none h-16 resize-none"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddVehicleForm(false)}
                      className="w-1/2 py-2 rounded-lg text-xs font-bold border border-[#E1E3E5] text-gray-700 hover:bg-gray-50"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="w-1/2 py-2 rounded-lg text-xs font-bold bg-[#008060] text-white hover:bg-[#006e52]"
                    >
                      {isEditingVehicle ? 'Mettre à jour' : 'Enregistrer'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: DRIVERS REGISTER */}
      {activeTab === 'drivers' && (
        <div className="grid gap-6 lg:grid-cols-12 animate-fade-in">
          {/* Left Column: Drivers List - 5 cols */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-xl bg-white p-5 border border-[#E1E3E5] shadow-xs space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-[#1A1A1A]">Dossiers Chauffeurs ({drivers.length})</h3>
                <button
                  onClick={() => {
                    setIsEditingDriver(false);
                    setDriverForm({
                      name: '',
                      phone: '',
                      email: '',
                      licenseNumber: '',
                      licenseCategory: 'D (Transport en Commun)',
                      licenseExpiry: new Date().toISOString().split('T')[0],
                      cnssNumber: '',
                      hireDate: new Date().toISOString().split('T')[0],
                      salary: 6000,
                      notes: '',
                      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
                      medicalCheckExpiry: new Date().toISOString().split('T')[0],
                      licenseCategories: []
                    });
                    setShowAddDriverForm(true);
                  }}
                  className="bg-[#008060] text-white px-2.5 py-1.5 rounded-lg text-xs font-bold hover:bg-[#006e52] cursor-pointer"
                >
                  + Ajouter Chauffeur
                </button>
              </div>

              <div className="space-y-2">
                {drivers.map(d => (
                  <div
                    key={d.id}
                    onClick={() => setSelectedDriverId(d.id)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition flex items-center justify-between ${
                      selectedDriverId === d.id 
                        ? 'bg-[#EBF5F1] border-[#BBE3D1] shadow-2xs' 
                        : 'bg-[#F6F6F7] border-[#E1E3E5] hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img src={d.avatarUrl} className="h-10 w-10 rounded-full object-cover border border-[#E1E3E5]" />
                      <div>
                        <p className="font-bold text-[#1A1A1A]">{d.name}</p>
                        <p className="text-[10px] text-[#6D7175] mt-0.5">{d.phone}</p>
                        <div className="flex items-center gap-1 text-[10px] text-amber-500 font-bold mt-0.5">
                          <Star className="h-3 w-3 fill-amber-500" />
                          <span>{d.rating} / 5</span>
                        </div>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded border text-[9px] font-bold uppercase tracking-wider ${
                      d.status === 'active' ? 'bg-white text-[#008060] border-[#BBE3D1]' : 'bg-red-50 text-red-700 border-red-200'
                    }`}>
                      {d.status === 'active' ? 'Actif' : 'Indisponible'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Driver CRM Dossier & Profile Detail - 7 cols */}
          <div className="lg:col-span-7 space-y-6">
            {selectedDriverId && drivers.find(d => d.id === selectedDriverId) ? (
              (() => {
                const d = drivers.find(dr => dr.id === selectedDriverId)!;
                return (
                  <div className="rounded-xl bg-white p-5 border border-[#E1E3E5] shadow-xs space-y-5">
                    <div className="flex justify-between items-start border-b border-[#E1E3E5] pb-3">
                      <div className="flex items-center gap-4">
                        <img src={d.avatarUrl} className="h-14 w-14 rounded-full object-cover border-2 border-[#008060]" />
                        <div>
                          <h3 className="text-base font-bold text-[#1A1A1A]">{d.name}</h3>
                          <p className="text-xs text-[#008060] font-bold flex items-center gap-1">
                            Chauffeur Certifié Mumy • {d.rating} ★
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditDriverClick(d)}
                          className="text-gray-700 border border-[#E1E3E5] hover:bg-gray-50 transition px-2.5 py-1 text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer"
                        >
                          <Edit className="h-3.5 w-3.5" /> Modifier
                        </button>
                        <button
                          onClick={() => {
                            if (confirm("Supprimer définitivement le chauffeur de votre registre d'entreprise ?")) {
                              onDeleteDriver(d.id);
                              setSelectedDriverId(drivers.find(dr => dr.id !== d.id)?.id || null);
                            }
                          }}
                          className="text-red-500 border border-red-200 hover:bg-red-50 transition p-1 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Detailed Info Grid */}
                    <div className="grid grid-cols-2 gap-4 text-xs font-medium text-gray-700">
                      <div className="bg-[#F6F6F7] p-3 rounded-lg border border-[#E1E3E5]/50">
                        <span className="text-[9px] text-[#6D7175] uppercase block">Numéro de Permis</span>
                        <span className="text-xs font-bold text-[#1A1A1A] block mt-1">{d.licenseNumber || '12/45789-Morocco'}</span>
                      </div>
                      <div className="bg-[#F6F6F7] p-3 rounded-lg border border-[#E1E3E5]/50">
                        <span className="text-[9px] text-[#6D7175] uppercase block">Catégorie du Permis</span>
                        <span className="text-xs font-bold text-[#1A1A1A] block mt-1">{d.licenseCategory || 'D (Transport Routier Public)'}</span>
                      </div>
                      <div className="bg-[#F6F6F7] p-3 rounded-lg border border-[#E1E3E5]/50">
                        <span className="text-[9px] text-[#6D7175] uppercase block">Date d'Expiration Permis</span>
                        <span className="text-xs font-bold text-[#1A1A1A] block mt-1">
                          {d.licenseExpiry ? new Date(d.licenseExpiry).toLocaleDateString('fr-FR') : 'N/A'}
                        </span>
                      </div>
                      <div className="bg-[#F6F6F7] p-3 rounded-lg border border-[#E1E3E5]/50">
                        <span className="text-[9px] text-[#6D7175] uppercase block">Immatriculation CNSS</span>
                        <span className="text-xs font-bold text-[#1A1A1A] block mt-1">{d.cnssNumber || 'Non renseigné'}</span>
                      </div>
                      <div className="bg-[#F6F6F7] p-3 rounded-lg border border-[#E1E3E5]/50">
                        <span className="text-[9px] text-[#6D7175] uppercase block">Date de Recrutement</span>
                        <span className="text-xs font-bold text-[#1A1A1A] block mt-1">
                          {d.hireDate ? new Date(d.hireDate).toLocaleDateString('fr-FR') : 'N/A'}
                        </span>
                      </div>
                      <div className="bg-[#F6F6F7] p-3 rounded-lg border border-[#E1E3E5]/50">
                        <span className="text-[9px] text-[#6D7175] uppercase block">Salaire Contractuel Mensuel</span>
                        <span className="text-xs font-bold text-[#1A1A1A] block mt-1">{d.salary ? `${d.salary.toLocaleString()} DHS/mois` : '6,000 DHS/mois'}</span>
                      </div>
                      <div className="bg-emerald-50/50 p-3 rounded-lg border border-emerald-200 col-span-2">
                        <span className="text-[9px] text-emerald-800 uppercase block font-bold flex items-center gap-1">
                          <Heart className="h-3 w-3 text-emerald-600 fill-emerald-600 animate-pulse" />
                          Visite Médicale (Expiration)
                        </span>
                        <span className="text-xs font-bold text-gray-900 block mt-1 flex justify-between items-center">
                          <span>{d.medicalCheckExpiry ? new Date(d.medicalCheckExpiry).toLocaleDateString('fr-FR') : 'Non renseignée'}</span>
                          {d.medicalCheckExpiry && new Date(d.medicalCheckExpiry).getTime() < new Date().getTime() ? (
                            <span className="text-red-600 font-bold text-[10px] bg-red-50 border border-red-200 px-1.5 py-0.5 rounded uppercase">⚠️ Expirée</span>
                          ) : (
                            <span className="text-emerald-700 font-bold text-[10px] bg-emerald-100/75 border border-emerald-200 px-1.5 py-0.5 rounded uppercase">À jour</span>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Contact Methods */}
                    <div className="grid grid-cols-2 gap-4 pt-1 border-t border-[#E1E3E5]/50 text-xs">
                      <div className="flex items-center gap-2 text-gray-800">
                        <Phone className="h-4 w-4 text-[#008060]" />
                        <span>Téléphone : <strong className="font-bold">{d.phone}</strong></span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-800">
                        <Mail className="h-4 w-4 text-[#008060]" />
                        <span>Email : <strong className="font-bold">{d.email || `${d.name.toLowerCase().replace(/ /g, '.')}@driver.ma`}</strong></span>
                      </div>
                    </div>

                    {d.notes && (
                      <div className="bg-[#EBF5F1]/30 p-3 rounded-lg border border-[#BBE3D1]/50 text-xs text-gray-700 italic">
                        📝 Notes de service : {d.notes}
                      </div>
                    )}

                    {/* Job History / Active Mission assigned */}
                    <div className="space-y-2 pt-2">
                      <h4 className="text-xs font-bold uppercase text-[#6D7175] tracking-wider">Mission Actuellement Dispatchée</h4>
                      {requests.filter(r => r.assignedDriverId === d.id && r.status !== 'completed').length === 0 ? (
                        <p className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg border border-[#E1E3E5]">Ce chauffeur est actuellement au repos ou en attente de dispatch.</p>
                      ) : (
                        requests.filter(r => r.assignedDriverId === d.id && r.status !== 'completed').map(req => (
                          <div key={req.id} className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs flex justify-between items-center">
                            <div>
                              <p className="font-bold text-blue-900">{req.origin} → {req.destination}</p>
                              <p className="text-[10px] text-blue-700 mt-0.5">Client: {req.clientName} • Passager: {req.passengerName}</p>
                            </div>
                            <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded border border-blue-200 capitalize">
                              {req.status === 'accepted' ? 'Confirmé' : req.status === 'en_route' ? 'En transit' : 'Pris en charge'}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="bg-white p-12 text-center rounded-xl border border-[#E1E3E5] text-xs text-[#6D7175] font-semibold">
                Sélectionnez un chauffeur dans la liste pour voir sa fiche d'immatriculation CNSS, contrat, salaire et historique de conduite.
              </div>
            )}
          </div>

          {/* ADD / EDIT DRIVER MODAL */}
          {showAddDriverForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
              <div className="bg-white rounded-xl border border-[#E1E3E5] max-w-lg w-full p-5 space-y-4 shadow-xl">
                <div className="flex justify-between items-center border-b border-[#E1E3E5] pb-3">
                  <h4 className="text-sm font-bold text-[#1A1A1A]">{isEditingDriver ? 'Modifier la fiche chauffeur' : 'Enregistrer / Recruter un nouveau chauffeur'}</h4>
                  <button onClick={() => setShowAddDriverForm(false)} className="text-gray-400 hover:text-gray-600 font-bold">×</button>
                </div>
                <form onSubmit={handleAddDriverSubmit} className="space-y-3.5">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-[#6D7175] uppercase tracking-wider">Nom Complet</label>
                      <input
                        type="text"
                        required
                        placeholder="Ahmed El Mansouri"
                        value={driverForm.name}
                        onChange={(e) => setDriverForm({...driverForm, name: e.target.value})}
                        className="mt-1 w-full rounded-lg border border-[#E1E3E5] px-2.5 py-1.5 text-xs text-[#1A1A1A] bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#6D7175] uppercase tracking-wider">Téléphone Professionnel</label>
                      <input
                        type="text"
                        required
                        placeholder="+212 6 00 00 00 00"
                        value={driverForm.phone}
                        onChange={(e) => setDriverForm({...driverForm, phone: e.target.value})}
                        className="mt-1 w-full rounded-lg border border-[#E1E3E5] px-2.5 py-1.5 text-xs text-[#1A1A1A] bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-[#6D7175] uppercase tracking-wider">Adresse Email</label>
                      <input
                        type="email"
                        placeholder="chauffeur@gmail.com"
                        value={driverForm.email}
                        onChange={(e) => setDriverForm({...driverForm, email: e.target.value})}
                        className="mt-1 w-full rounded-lg border border-[#E1E3E5] px-2.5 py-1.5 text-xs text-[#1A1A1A] bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#6D7175] uppercase tracking-wider">Numéro de Sécurité Sociale (CNSS)</label>
                      <input
                        type="text"
                        placeholder="985472145"
                        value={driverForm.cnssNumber}
                        onChange={(e) => setDriverForm({...driverForm, cnssNumber: e.target.value})}
                        className="mt-1 w-full rounded-lg border border-[#E1E3E5] px-2.5 py-1.5 text-xs text-[#1A1A1A] bg-white focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div className="bg-[#FAFBFB] p-3 rounded-lg border border-[#E1E3E5] space-y-2">
                    <label className="block text-[10px] font-bold text-[#6D7175] uppercase tracking-wider">Catégorie(s) de Permis (Sélection multiple possible)</label>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {['A', 'B', 'C', 'D', 'E'].map(cat => {
                        const isChecked = driverForm.licenseCategories.includes(cat);
                        return (
                          <label key={cat} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold cursor-pointer transition select-none ${
                            isChecked 
                              ? 'bg-[#008060] text-white border-[#008060]' 
                              : 'bg-white text-gray-700 border-[#E1E3E5] hover:bg-gray-50'
                          }`}>
                            <input
                              type="checkbox"
                              className="hidden"
                              checked={isChecked}
                              onChange={() => {
                                const newCats = isChecked 
                                  ? driverForm.licenseCategories.filter(c => c !== cat)
                                  : [...driverForm.licenseCategories, cat];
                                setDriverForm({ ...driverForm, licenseCategories: newCats });
                              }}
                            />
                            <span>Permis {cat}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-[#6D7175] uppercase tracking-wider">N° de Permis de Conduire</label>
                      <input
                        type="text"
                        required
                        placeholder="12/12345"
                        value={driverForm.licenseNumber}
                        onChange={(e) => setDriverForm({...driverForm, licenseNumber: e.target.value})}
                        className="mt-1 w-full rounded-lg border border-[#E1E3E5] px-2.5 py-1.5 text-xs text-[#1A1A1A] bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#6D7175] uppercase tracking-wider">Date Expiration Permis</label>
                      <input
                        type="date"
                        required
                        value={driverForm.licenseExpiry}
                        onChange={(e) => setDriverForm({...driverForm, licenseExpiry: e.target.value})}
                        className="mt-1 w-full rounded-lg border border-[#E1E3E5] px-2.5 py-1.5 text-xs text-[#1A1A1A] bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Visite Médicale Expi.</label>
                      <input
                        type="date"
                        required
                        value={driverForm.medicalCheckExpiry}
                        onChange={(e) => setDriverForm({...driverForm, medicalCheckExpiry: e.target.value})}
                        className="mt-1 w-full rounded-lg border border-emerald-200 px-2.5 py-1.5 text-xs text-emerald-950 bg-emerald-50/50 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-[#6D7175] uppercase tracking-wider">Date d'embauche</label>
                      <input
                        type="date"
                        required
                        value={driverForm.hireDate}
                        onChange={(e) => setDriverForm({...driverForm, hireDate: e.target.value})}
                        className="mt-1 w-full rounded-lg border border-[#E1E3E5] px-2.5 py-1.5 text-xs text-[#1A1A1A] bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#6D7175] uppercase tracking-wider">Salaire Mensuel Brut (DHS)</label>
                      <input
                        type="number"
                        required
                        value={driverForm.salary}
                        onChange={(e) => setDriverForm({...driverForm, salary: Number(e.target.value)})}
                        className="mt-1 w-full rounded-lg border border-[#E1E3E5] px-2.5 py-1.5 text-xs text-[#1A1A1A] bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#6D7175] uppercase tracking-wider">URL de l'avatar (Photo de Profil)</label>
                    <input
                      type="text"
                      value={driverForm.avatarUrl}
                      onChange={(e) => setDriverForm({...driverForm, avatarUrl: e.target.value})}
                      className="mt-1 w-full rounded-lg border border-[#E1E3E5] px-2.5 py-1.5 text-xs text-[#1A1A1A] bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#6D7175] uppercase tracking-wider">Notes contractuelles ou commentaires d'entretien</label>
                    <textarea
                      placeholder="Indiquez les contraintes ou spécificités..."
                      value={driverForm.notes}
                      onChange={(e) => setDriverForm({...driverForm, notes: e.target.value})}
                      className="mt-1 w-full rounded-lg border border-[#E1E3E5] px-2.5 py-1.5 text-xs text-[#1A1A1A] bg-white focus:outline-none h-16 resize-none"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddDriverForm(false)}
                      className="w-1/2 py-2 rounded-lg text-xs font-bold border border-[#E1E3E5] text-gray-700 hover:bg-gray-50"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="w-1/2 py-2 rounded-lg text-xs font-bold bg-[#008060] text-white hover:bg-[#006e52]"
                    >
                      {isEditingDriver ? 'Enregistrer les modifications' : 'Recruter le Chauffeur'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: ERP & DISPATCH */}
      {activeTab === 'erp' && (
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Dispatch List - 7 cols */}
          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-xl bg-white p-5 border border-[#E1E3E5] shadow-xs">
              <h3 className="text-sm font-bold text-[#1A1A1A] mb-2">Dispatcher & Assigner Chauffeurs</h3>
              <p className="text-xs text-[#6D7175] mb-5 font-medium leading-relaxed">Attribuez des chauffeurs certifiés et des véhicules disponibles aux demandes acceptées pour mettre à jour les statuts en temps réel.</p>
              
              <div className="space-y-4">
                {requests.filter(r => r.status !== 'completed').map(req => (
                  <div key={req.id} className="rounded-xl bg-[#F6F6F7] p-4 border border-[#E1E3E5] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[9px] font-bold uppercase rounded bg-white border border-[#E1E3E5] px-2 py-0.5 text-[#1A1A1A]">ID: {req.id}</span>
                      <span className="text-xs font-bold text-[#1A1A1A]">{req.clientName}</span>
                    </div>
                    <div className="text-xs font-bold text-[#1A1A1A]">{req.origin} → {req.destination}</div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-1.5 border-t border-[#E1E3E5]">
                      {/* Driver Assign selector */}
                      <div>
                        <label className="block text-[10px] font-bold text-[#6D7175] uppercase tracking-wider mb-1">Chauffeur Assigné</label>
                        <select
                          value={req.assignedDriverId || ''}
                          onChange={(e) => onAssignDriver(req.id, e.target.value)}
                          className="w-full rounded-lg border border-[#E1E3E5] p-2 text-xs bg-white text-[#1A1A1A] focus:ring-1 focus:ring-[#008060] focus:border-[#008060] focus:outline-none"
                        >
                          <option value="">-- Assigner Chauffeur --</option>
                          {drivers.map(d => (
                            <option key={d.id} value={d.id}>{d.name} ({d.rating} ★)</option>
                          ))}
                        </select>
                      </div>

                      {/* Current driver info visual */}
                      <div className="flex items-center gap-2 pt-4">
                        {req.assignedDriverId ? (
                          <>
                            <img 
                              src={drivers.find(d => d.id === req.assignedDriverId)?.avatarUrl} 
                              className="h-8 w-8 rounded-full object-cover border border-[#E1E3E5]" 
                            />
                            <div>
                              <p className="text-[11px] font-bold text-[#1A1A1A]">{drivers.find(d => d.id === req.assignedDriverId)?.name}</p>
                              <span className="text-[9px] text-[#008060] font-bold bg-[#EBF5F1] px-1.5 py-0.5 rounded border border-[#BBE3D1] uppercase tracking-wider">Actif</span>
                            </div>
                          </>
                        ) : (
                          <span className="text-[10px] text-amber-800 font-bold bg-amber-50 border border-amber-200 px-2 py-1 rounded">⚠️ Aucun chauffeur</span>
                        )}
                      </div>
                    </div>

                    {/* ATTACHMENT MANAGER COMPONENT */}
                    <div className="pt-2.5 border-t border-dashed border-[#E1E3E5] mt-2.5 text-left space-y-2">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <span className="text-[10px] text-[#6D7175] font-black uppercase tracking-wider flex items-center gap-1">
                          <FileText className="h-3.5 w-3.5 text-[#008060]" /> Documents de Mission (Instantané Chauffeur)
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            req.attachments = [
                              { name: "Manifeste_Voyage_" + req.id + ".pdf", url: "#manifest", type: "manifest", date: new Date().toLocaleDateString('fr-FR') },
                              { name: "Facture_Prestation_" + req.id + ".pdf", url: "#invoice", type: "invoice", date: new Date().toLocaleDateString('fr-FR') }
                            ];
                            // Trick React to force re-render
                            setUploadedManifestName("Manifeste_Voyage_" + req.id + ".pdf");
                            alert("Manifeste officiel et Facture commerciale liés avec succès à la mission ! Le chauffeur Ahmed est notifié et peut les consulter en temps réel sur sa console PWA.");
                          }}
                          className="bg-emerald-50 border border-emerald-250 text-[#008060] hover:bg-emerald-100/60 px-2 py-1 rounded-md text-[10px] font-black flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          ➕ Lier Manifeste & Facture PDF
                        </button>
                      </div>

                      {/* Display attached documents if present */}
                      {req.attachments && req.attachments.length > 0 ? (
                        <div className="bg-emerald-50/40 border border-emerald-150 rounded-lg p-2.5 space-y-2 animate-fade-in">
                          {req.attachments.map((doc, idx) => (
                            <div key={idx} className="flex justify-between items-center text-[11px] font-semibold text-gray-800">
                              <span className="flex items-center gap-1 text-gray-700">
                                {doc.type === 'manifest' ? '📄' : '🧾'} {doc.name}
                              </span>
                              <span className="text-[9px] text-[#008060] font-black uppercase bg-[#EBF5F1] px-1.5 py-0.5 rounded border border-[#BBE3D1]">
                                En ligne ✓
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-[10px] text-gray-400 italic">
                          Aucun document joint. Le chauffeur Ahmed n'a pas accès au manifeste numérique de cette course.
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Fleet Management - 5 cols */}
          <div className="lg:col-span-5 space-y-6">
            {/* Add vehicle form */}
            <div className="rounded-xl bg-white p-5 border border-[#E1E3E5] shadow-xs">
              <h3 className="text-sm font-bold text-[#1A1A1A] mb-3 flex items-center gap-1.5">
                <Plus className="h-4 w-4 text-[#008060]" />
                Ajouter un Véhicule à la Flotte
              </h3>
              <form onSubmit={handleAddVehicleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-[#6D7175] uppercase tracking-wider">Marque</label>
                    <input
                      type="text"
                      required
                      placeholder="Mercedes-Benz"
                      value={newVehicle.brand}
                      onChange={(e) => setNewVehicle({...newVehicle, brand: e.target.value})}
                      className="mt-1 w-full rounded-lg border border-[#E1E3E5] px-2.5 py-1.5 text-xs text-[#1A1A1A] bg-white focus:outline-none focus:border-[#008060] focus:ring-1 focus:ring-[#008060]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#6D7175] uppercase tracking-wider">Modèle</label>
                    <input
                      type="text"
                      required
                      placeholder="Sprinter Tourer"
                      value={newVehicle.model}
                      onChange={(e) => setNewVehicle({...newVehicle, model: e.target.value})}
                      className="mt-1 w-full rounded-lg border border-[#E1E3E5] px-2.5 py-1.5 text-xs text-[#1A1A1A] bg-white focus:outline-none focus:border-[#008060] focus:ring-1 focus:ring-[#008060]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-[#6D7175] uppercase tracking-wider">Matricule</label>
                    <input
                      type="text"
                      required
                      placeholder="12-A-34567"
                      value={newVehicle.plate}
                      onChange={(e) => setNewVehicle({...newVehicle, plate: e.target.value})}
                      className="mt-1 w-full rounded-lg border border-[#E1E3E5] px-2.5 py-1.5 text-xs font-mono text-[#1A1A1A] bg-white focus:outline-none focus:border-[#008060] focus:ring-1 focus:ring-[#008060]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#6D7175] uppercase tracking-wider">Capacité (Pax)</label>
                    <input
                      type="number"
                      required
                      value={newVehicle.capacity}
                      onChange={(e) => setNewVehicle({...newVehicle, capacity: Number(e.target.value)})}
                      className="mt-1 w-full rounded-lg border border-[#E1E3E5] px-2.5 py-1.5 text-xs text-[#1A1A1A] bg-white focus:outline-none focus:border-[#008060] focus:ring-1 focus:ring-[#008060]"
                    />
                  </div>
                </div>

                <button type="submit" className="w-full rounded-lg bg-[#008060] border border-[#008060] py-2.5 text-xs font-bold text-white hover:bg-[#006e52] shadow-xs cursor-pointer transition">
                  Ajouter le Véhicule
                </button>
              </form>
            </div>

            {/* Active fleet list */}
            <div className="rounded-xl bg-white p-5 border border-[#E1E3E5] shadow-xs">
              <h3 className="text-sm font-bold text-[#1A1A1A] mb-3">Véhicules de la Flotte ({vehicles.length})</h3>
              <div className="space-y-2">
                {vehicles.map(v => (
                  <div key={v.id} className="flex items-center justify-between p-2.5 rounded-lg bg-[#F6F6F7] border border-[#E1E3E5] text-xs hover:bg-white transition">
                    <div>
                      <p className="font-bold text-[#1A1A1A]">{v.brand} {v.model}</p>
                      <p className="text-[10px] text-[#6D7175] font-mono mt-0.5">Matricule: {v.plate} • {v.capacity} Pax</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded border text-[9px] font-bold uppercase tracking-wider ${
                        v.status === 'available' ? 'bg-[#EBF5F1] text-[#008060] border-[#BBE3D1]' : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}>
                        {v.status === 'available' ? 'Disponible' : 'En service'}
                      </span>
                      <button onClick={() => onDeleteVehicle(v.id)} className="text-red-500 hover:text-red-700 transition p-1 rounded hover:bg-red-50 cursor-pointer">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* VMS planning sub-section */}
          <div className="lg:col-span-12 border-t border-[#E1E3E5] pt-6 mt-4">
            <div className="rounded-xl bg-white p-5 border border-[#E1E3E5] shadow-xs space-y-6">
              <div>
                <h3 className="text-sm font-bold text-[#1A1A1A] flex items-center gap-2">
                  <Truck className="h-4 w-4 text-[#008060]" />
                  Système VMS : Planning de Rotation & Liaison Chauffeur-Véhicule
                </h3>
                <p className="text-xs text-[#6D7175] mt-1">Liez durablement les chauffeurs aux véhicules de la flotte et visualisez leur planning hebdomadaire.</p>
              </div>

              <div className="grid gap-6 lg:grid-cols-12">
                {/* Form to Link Chauffeur-Vehicle */}
                <form onSubmit={handleVmsSubmit} className="lg:col-span-4 bg-[#F6F6F7] p-4 rounded-xl border border-[#E1E3E5] space-y-4 h-fit">
                  <h4 className="text-xs font-bold uppercase text-[#1A1A1A] tracking-wider">Créer une Liaison de Rotation</h4>
                  
                  <div>
                    <label className="block text-[10px] font-bold text-[#6D7175] uppercase tracking-wider mb-1">Chauffeur</label>
                    <select
                      required
                      value={vmsForm.driverId}
                      onChange={(e) => setVmsForm({...vmsForm, driverId: e.target.value})}
                      className="w-full rounded-lg border border-[#E1E3E5] p-2 text-xs bg-white text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#008060]"
                    >
                      <option value="">-- Sélectionner Chauffeur --</option>
                      {drivers.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#6D7175] uppercase tracking-wider mb-1">Véhicule</label>
                    <select
                      required
                      value={vmsForm.vehicleId}
                      onChange={(e) => setVmsForm({...vmsForm, vehicleId: e.target.value})}
                      className="w-full rounded-lg border border-[#E1E3E5] p-2 text-xs bg-white text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#008060]"
                    >
                      <option value="">-- Sélectionner Véhicule --</option>
                      {vehicles.map(v => (
                        <option key={v.id} value={v.id}>{v.brand} {v.model} ({v.plate})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#6D7175] uppercase tracking-wider mb-1">Shift / Rotation</label>
                    <select
                      value={vmsForm.shift}
                      onChange={(e) => setVmsForm({...vmsForm, shift: e.target.value as any})}
                      className="w-full rounded-lg border border-[#E1E3E5] p-2 text-xs bg-white text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#008060]"
                    >
                      <option value="full_day">Journée Complète</option>
                      <option value="morning">Rotation Matin</option>
                      <option value="afternoon">Rotation Après-midi</option>
                      <option value="night">Rotation Nuit</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-[#6D7175] uppercase tracking-wider mb-1">Heure de Début</label>
                      <input
                        type="time"
                        required
                        value={vmsForm.startTime}
                        onChange={(e) => setVmsForm({...vmsForm, startTime: e.target.value})}
                        className="w-full rounded-lg border border-[#E1E3E5] p-2 text-xs bg-white text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#008060]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#6D7175] uppercase tracking-wider mb-1">Heure de Fin</label>
                      <input
                        type="time"
                        required
                        value={vmsForm.endTime}
                        onChange={(e) => setVmsForm({...vmsForm, endTime: e.target.value})}
                        className="w-full rounded-lg border border-[#E1E3E5] p-2 text-xs bg-white text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#008060]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#6D7175] uppercase tracking-wider mb-1">Date de Rotation</label>
                    <input
                      type="date"
                      required
                      value={vmsForm.date}
                      onChange={(e) => {
                        const selectedDate = e.target.value;
                        const computedDay = getFrenchDayOfWeek(selectedDate);
                        setVmsForm({
                          ...vmsForm,
                          date: selectedDate,
                          dayOfWeek: computedDay as any
                        });
                      }}
                      className="w-full rounded-lg border border-[#E1E3E5] p-2 text-xs bg-white text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#008060]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#6D7175] uppercase tracking-wider mb-1">Commentaires de rotation</label>
                    <input
                      type="text"
                      placeholder="Ex: Trajet d'excursion, navette hôtel..."
                      value={vmsForm.notes}
                      onChange={(e) => setVmsForm({...vmsForm, notes: e.target.value})}
                      className="w-full rounded-lg border border-[#E1E3E5] p-2 text-xs bg-white text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#008060]"
                    />
                  </div>

                  <button type="submit" className="w-full bg-[#008060] text-white py-2 rounded-lg text-xs font-bold hover:bg-[#006e52] cursor-pointer transition">
                    Créer la Liaison & Planning
                  </button>
                </form>

                {/* VMS Weekly Planning Grid Calendar (8 cols) */}
                <div className="lg:col-span-8 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 border border-slate-200 p-3 rounded-xl">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-[#008060]" />
                      <div>
                        <h4 className="text-xs font-bold uppercase text-[#1A1A1A] tracking-wider">Planning Hebdomadaire Visualisé</h4>
                        <p className="text-[10px] text-gray-500 font-medium">
                          Visualisation du {availableWeeks.find(w => w.start === selectedWeekStart)?.start.split('-').reverse().join('/')} au {availableWeeks.find(w => w.start === selectedWeekStart)?.end.split('-').reverse().join('/')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={availableWeeks.findIndex(w => w.start === selectedWeekStart) <= 0}
                        onClick={() => {
                          const idx = availableWeeks.findIndex(w => w.start === selectedWeekStart);
                          if (idx > 0) setSelectedWeekStart(availableWeeks[idx - 1].start);
                        }}
                        className="p-1.5 rounded-lg border border-[#E1E3E5] bg-white hover:bg-slate-100 text-gray-600 hover:text-[#1A1A1A] cursor-pointer transition disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Semaine précédente"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>

                      <select
                        value={selectedWeekStart}
                        onChange={(e) => setSelectedWeekStart(e.target.value)}
                        className="rounded-lg border border-[#E1E3E5] px-2 py-1 text-xs bg-white text-[#1A1A1A] font-bold focus:outline-none focus:ring-1 focus:ring-[#008060] cursor-pointer"
                      >
                        {availableWeeks.map(w => (
                          <option key={w.start} value={w.start}>{w.label}</option>
                        ))}
                      </select>

                      <button
                        type="button"
                        disabled={availableWeeks.findIndex(w => w.start === selectedWeekStart) >= availableWeeks.length - 1}
                        onClick={() => {
                          const idx = availableWeeks.findIndex(w => w.start === selectedWeekStart);
                          if (idx < availableWeeks.length - 1) setSelectedWeekStart(availableWeeks[idx + 1].start);
                        }}
                        className="p-1.5 rounded-lg border border-[#E1E3E5] bg-white hover:bg-slate-100 text-gray-600 hover:text-[#1A1A1A] cursor-pointer transition disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Semaine suivante"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto no-scrollbar rounded-xl border border-[#E1E3E5]">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-[#F6F6F7] border-b border-[#E1E3E5] text-[#6D7175] font-bold">
                          <th className="p-3">Chauffeur</th>
                          {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'].map(day => (
                            <th key={day} className="p-3 text-center">
                              <div>{day}</div>
                              <div className="text-[9px] font-medium text-gray-400 mt-0.5">
                                {formatDateToFrenchShort(getDayDateString(selectedWeekStart, day))}
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E1E3E5]">
                        {drivers.map(d => (
                          <tr key={d.id} className="hover:bg-gray-50/50">
                            <td className="p-3 font-bold text-[#1A1A1A]">
                              <div className="flex items-center gap-2">
                                <img src={d.avatarUrl} className="h-6 w-6 rounded-full object-cover border border-[#E1E3E5]" />
                                <span>{d.name}</span>
                              </div>
                            </td>
                            {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'].map(day => {
                              const targetDate = getDayDateString(selectedWeekStart, day);
                              const activeLinks = vmsLiaisons.filter(l => l.driverId === d.id && (l.date === targetDate || (!l.date && l.dayOfWeek === day)));
                              return (
                                <td key={day} className="p-2 text-center min-w-[100px]">
                                  {activeLinks.length > 0 ? (
                                    activeLinks.map(link => {
                                      const v = vehicles.find(veh => veh.id === link.vehicleId);
                                      return (
                                        <div key={link.id} className="p-1.5 rounded-lg bg-[#EBF5F1] border border-[#BBE3D1] text-[10px] text-[#008060] font-semibold relative group space-y-0.5">
                                          <div className="font-bold">{v ? `${v.brand}` : 'Véhicule'}</div>
                                          <div className="text-[9px] text-gray-500 font-mono font-medium">{v ? v.plate : ''}</div>
                                          <div className="text-[8px] bg-white border border-[#BBE3D1] rounded px-1 inline-block mt-0.5 uppercase tracking-wide">
                                            {link.shift === 'full_day' ? '24h' : link.shift === 'morning' ? 'Matin' : link.shift === 'afternoon' ? 'Aprem' : 'Nuit'}
                                          </div>
                                          {link.startTime && link.endTime && (
                                            <div className="text-[8px] text-[#008060] font-mono font-bold bg-white/80 py-0.5 px-1 rounded border border-[#BBE3D1]/40">
                                              🕒 {link.startTime} - {link.endTime}
                                            </div>
                                          )}
                                          {link.date && (
                                            <div className="text-[8px] text-slate-600 font-bold bg-white/40 rounded px-1">
                                              📅 {link.date.split('-').reverse().join('/')}
                                            </div>
                                          )}
                                          <button
                                            type="button"
                                            onClick={() => handleDeleteVmsLiaison(link.id)}
                                            className="absolute -top-1.5 -right-1.5 bg-red-100 hover:bg-red-200 text-red-600 rounded-full h-4.5 w-4.5 flex items-center justify-center border border-red-200 cursor-pointer shadow-xs font-bold text-[10px]"
                                            title="Retirer cette liaison"
                                          >
                                            ×
                                          </button>
                                        </div>
                                      );
                                    })
                                  ) : (
                                    <span className="text-[10px] text-gray-300 font-medium">-</span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: COMPTA & FACTURATION */}
      {activeTab === 'finance' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* KYC DOCUMENT COMPLIANCE PANEL */}
          <div className="rounded-xl bg-white p-5 border border-[#E1E3E5] shadow-xs">
            <div className="flex items-center justify-between border-b border-[#E1E3E5] pb-3 mb-4 flex-wrap gap-2">
              <div>
                <h3 className="text-sm font-bold text-[#1A1A1A] flex items-center gap-1.5">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#008060] animate-pulse"></span>
                  Dossier Réglementaire & Statut de Conformité KYC
                </h3>
                <p className="text-xs text-[#6D7175] mt-0.5 font-medium">Vos documents sont vérifiés par la commission de sécurité Mumy pour vous garantir un accès prioritaire.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[#6D7175] font-semibold">Statut global :</span>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                  currentUser.status === 'verified' 
                    ? 'bg-[#EBF5F1] text-[#008060] border border-[#BBE3D1]' 
                    : currentUser.status === 'pending'
                      ? 'bg-amber-50 text-amber-800 border border-amber-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {currentUser.status === 'verified' ? 'Vérifié & Conforme' : currentUser.status === 'pending' ? 'En Cours de Revue' : 'Non Conforme / Documents Requis'}
                </span>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Document 1: Licence de Transport */}
              <div className="rounded-lg bg-[#F6F6F7] border border-[#E1E3E5] p-3.5 space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold text-[#6D7175] uppercase tracking-wider block">1. Licence de Transport</span>
                    <span className={`h-2 w-2 rounded-full ${
                      currentUser.kycLicenceStatus === 'verified' ? 'bg-[#008060]' : currentUser.kycLicenceStatus === 'pending' ? 'bg-amber-500' : 'bg-red-500'
                    }`}></span>
                  </div>
                  <p className="text-[11px] font-bold text-[#1A1A1A] mt-1 leading-snug">Autorisation Ministérielle (DRE)</p>
                  <p className="text-[9px] text-[#6D7175] mt-0.5 font-medium font-mono">
                    {currentUser.kycLicenceUrl ? `Réf: ${currentUser.kycLicenceUrl}` : "Aucun fichier soumis"}
                  </p>
                </div>
                <div className="pt-2 border-t border-[#E1E3E5]/50 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-[#6D7175]">Statut:</span>
                    <span className={`font-bold ${
                      currentUser.kycLicenceStatus === 'verified' ? 'text-[#008060]' : currentUser.kycLicenceStatus === 'pending' ? 'text-amber-600' : 'text-red-600'
                    }`}>
                      {currentUser.kycLicenceStatus === 'verified' ? 'Validé' : currentUser.kycLicenceStatus === 'pending' ? 'En attente' : 'Manquant'}
                    </span>
                  </div>
                  {currentUser.kycLicenceStatus !== 'verified' && (
                    <div className="flex gap-1">
                      <input 
                        type="text" 
                        placeholder="N° Licence / Fichier" 
                        className="w-full bg-white border border-[#E1E3E5] px-1.5 py-1 text-[10px] rounded focus:outline-none"
                        id="licence_ref"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleKycSubmit('licence', (e.target as HTMLInputElement).value);
                            (e.target as HTMLInputElement).value = '';
                          }
                        }}
                      />
                      <button 
                        onClick={() => {
                          const val = (document.getElementById('licence_ref') as HTMLInputElement)?.value;
                          if (val) {
                            handleKycSubmit('licence', val);
                            (document.getElementById('licence_ref') as HTMLInputElement).value = '';
                          }
                        }}
                        className="bg-[#008060] text-white px-2 py-1 text-[9px] font-bold rounded hover:bg-[#006e52]"
                      >
                        Soumettre
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Document 2: Registre de Commerce */}
              <div className="rounded-lg bg-[#F6F6F7] border border-[#E1E3E5] p-3.5 space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold text-[#6D7175] uppercase tracking-wider block">2. Modèle J (RC)</span>
                    <span className={`h-2 w-2 rounded-full ${
                      currentUser.kycRcStatus === 'verified' ? 'bg-[#008060]' : currentUser.kycRcStatus === 'pending' ? 'bg-amber-500' : 'bg-red-500'
                    }`}></span>
                  </div>
                  <p className="text-[11px] font-bold text-[#1A1A1A] mt-1 leading-snug">Registre du Tribunal de Commerce</p>
                  <p className="text-[9px] text-[#6D7175] mt-0.5 font-medium font-mono">
                    {currentUser.kycRcUrl ? `Réf: ${currentUser.kycRcUrl}` : "Aucun fichier soumis"}
                  </p>
                </div>
                <div className="pt-2 border-t border-[#E1E3E5]/50 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-[#6D7175]">Statut:</span>
                    <span className={`font-bold ${
                      currentUser.kycRcStatus === 'verified' ? 'text-[#008060]' : currentUser.kycRcStatus === 'pending' ? 'text-amber-600' : 'text-red-600'
                    }`}>
                      {currentUser.kycRcStatus === 'verified' ? 'Validé' : currentUser.kycRcStatus === 'pending' ? 'En attente' : 'Manquant'}
                    </span>
                  </div>
                  {currentUser.kycRcStatus !== 'verified' && (
                    <div className="flex gap-1">
                      <input 
                        type="text" 
                        placeholder="N° Registre" 
                        className="w-full bg-white border border-[#E1E3E5] px-1.5 py-1 text-[10px] rounded focus:outline-none"
                        id="rc_ref"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleKycSubmit('rc', (e.target as HTMLInputElement).value);
                            (e.target as HTMLInputElement).value = '';
                          }
                        }}
                      />
                      <button 
                        onClick={() => {
                          const val = (document.getElementById('rc_ref') as HTMLInputElement)?.value;
                          if (val) {
                            handleKycSubmit('rc', val);
                            (document.getElementById('rc_ref') as HTMLInputElement).value = '';
                          }
                        }}
                        className="bg-[#008060] text-white px-2 py-1 text-[9px] font-bold rounded hover:bg-[#006e52]"
                      >
                        Soumettre
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Document 3: Assurance RC Passagers */}
              <div className="rounded-lg bg-[#F6F6F7] border border-[#E1E3E5] p-3.5 space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold text-[#6D7175] uppercase tracking-wider block">3. Assurance RC & Passagers</span>
                    <span className={`h-2 w-2 rounded-full ${
                      currentUser.kycInsuranceStatus === 'verified' ? 'bg-[#008060]' : currentUser.kycInsuranceStatus === 'pending' ? 'bg-amber-500' : 'bg-red-500'
                    }`}></span>
                  </div>
                  <p className="text-[11px] font-bold text-[#1A1A1A] mt-1 leading-snug">Attestation Responsabilité Civile</p>
                  <p className="text-[9px] text-[#6D7175] mt-0.5 font-medium font-mono">
                    {currentUser.kycInsuranceUrl ? `Réf: ${currentUser.kycInsuranceUrl}` : "Aucun fichier soumis"}
                  </p>
                </div>
                <div className="pt-2 border-t border-[#E1E3E5]/50 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-[#6D7175]">Statut:</span>
                    <span className={`font-bold ${
                      currentUser.kycInsuranceStatus === 'verified' ? 'text-[#008060]' : currentUser.kycInsuranceStatus === 'pending' ? 'text-amber-600' : 'text-red-600'
                    }`}>
                      {currentUser.kycInsuranceStatus === 'verified' ? 'Validé' : currentUser.kycInsuranceStatus === 'pending' ? 'En attente' : 'Manquant'}
                    </span>
                  </div>
                  {currentUser.kycInsuranceStatus !== 'verified' && (
                    <div className="flex gap-1">
                      <input 
                        type="text" 
                        placeholder="N° Police" 
                        className="w-full bg-white border border-[#E1E3E5] px-1.5 py-1 text-[10px] rounded focus:outline-none"
                        id="insurance_ref"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleKycSubmit('insurance', (e.target as HTMLInputElement).value);
                            (e.target as HTMLInputElement).value = '';
                          }
                        }}
                      />
                      <button 
                        onClick={() => {
                          const val = (document.getElementById('insurance_ref') as HTMLInputElement)?.value;
                          if (val) {
                            handleKycSubmit('insurance', val);
                            (document.getElementById('insurance_ref') as HTMLInputElement).value = '';
                          }
                        }}
                        className="bg-[#008060] text-white px-2 py-1 text-[9px] font-bold rounded hover:bg-[#006e52]"
                      >
                        Soumettre
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Document 4: Patente */}
              <div className="rounded-lg bg-[#F6F6F7] border border-[#E1E3E5] p-3.5 space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold text-[#6D7175] uppercase tracking-wider block">4. Attestation Patente</span>
                    <span className={`h-2 w-2 rounded-full ${
                      currentUser.kycPatenteStatus === 'verified' ? 'bg-[#008060]' : currentUser.kycPatenteStatus === 'pending' ? 'bg-amber-500' : 'bg-red-500'
                    }`}></span>
                  </div>
                  <p className="text-[11px] font-bold text-[#1A1A1A] mt-1 leading-snug">Taxe Professionnelle d'État</p>
                  <p className="text-[9px] text-[#6D7175] mt-0.5 font-medium font-mono">
                    {currentUser.kycPatenteUrl ? `Réf: ${currentUser.kycPatenteUrl}` : "Aucun fichier soumis"}
                  </p>
                </div>
                <div className="pt-2 border-t border-[#E1E3E5]/50 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-[#6D7175]">Statut:</span>
                    <span className={`font-bold ${
                      currentUser.kycPatenteStatus === 'verified' ? 'text-[#008060]' : currentUser.kycPatenteStatus === 'pending' ? 'text-amber-600' : 'text-red-600'
                    }`}>
                      {currentUser.kycPatenteStatus === 'verified' ? 'Validé' : currentUser.kycPatenteStatus === 'pending' ? 'En attente' : 'Manquant'}
                    </span>
                  </div>
                  {currentUser.kycPatenteStatus !== 'verified' && (
                    <div className="flex gap-1">
                      <input 
                        type="text" 
                        placeholder="N° Patente" 
                        className="w-full bg-white border border-[#E1E3E5] px-1.5 py-1 text-[10px] rounded focus:outline-none"
                        id="patente_ref"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleKycSubmit('patente', (e.target as HTMLInputElement).value);
                            (e.target as HTMLInputElement).value = '';
                          }
                        }}
                      />
                      <button 
                        onClick={() => {
                          const val = (document.getElementById('patente_ref') as HTMLInputElement)?.value;
                          if (val) {
                            handleKycSubmit('patente', val);
                            (document.getElementById('patente_ref') as HTMLInputElement).value = '';
                          }
                        }}
                        className="bg-[#008060] text-white px-2 py-1 text-[9px] font-bold rounded hover:bg-[#006e52]"
                      >
                        Soumettre
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* TWO COLUMN INTERACTION LAYER */}
          <div className="grid gap-6 lg:grid-cols-12">
            
            {/* LEFT COLUMN: STATS, COMPANY PROFILE & PARTNERS DIRECTORY */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Stats overview */}
              <div className="rounded-xl bg-white p-5 border border-[#E1E3E5] shadow-xs">
                <h3 className="text-sm font-bold text-[#1A1A1A] mb-4">Indicateurs de Trésorerie (DHS)</h3>
                
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="rounded-lg bg-[#EBF5F1] p-3 border border-[#BBE3D1]">
                    <span className="text-[9px] text-[#008060] uppercase font-bold tracking-wider">Revenus</span>
                    <p className="text-xs font-bold text-[#008060] mt-1">{totalRevenue} DHS</p>
                  </div>
                  <div className="rounded-lg bg-red-50 p-3 border border-red-100">
                    <span className="text-[9px] text-red-700 uppercase font-bold tracking-wider">Dépenses</span>
                    <p className="text-xs font-bold text-red-700 mt-1">{totalExpenses} DHS</p>
                  </div>
                  <div className="rounded-lg bg-[#F6F6F7] p-3 border border-[#E1E3E5]">
                    <span className="text-[9px] text-[#6D7175] uppercase font-bold tracking-wider">Marge</span>
                    <p className="text-xs font-bold text-[#1A1A1A] mt-1">{netProfit} DHS</p>
                  </div>
                </div>

                <div className="space-y-1.5 pt-3 border-t border-[#E1E3E5]">
                  <p className="text-[10px] font-bold text-[#6D7175] uppercase tracking-wider mb-2">Historique des Flux Financiers</p>
                  <div className="divide-y divide-[#E1E3E5]/50">
                    {finances.map(record => (
                      <div key={record.id} className="flex justify-between items-center text-xs py-2">
                        <div>
                          <p className="font-bold text-[#1A1A1A]">{record.label}</p>
                          <span className="text-[9px] text-[#6D7175] font-medium">{record.date} • {record.category}</span>
                        </div>
                        <span className={`font-mono font-bold text-xs ${record.type === 'revenue' ? 'text-[#008060]' : 'text-rose-600'}`}>
                          {record.type === 'revenue' ? '+' : '-'}{record.amount} DHS
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Company Legal Profile Settings (ICE etc) */}
              <div className="rounded-xl bg-white p-5 border border-[#E1E3E5] shadow-xs">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-bold text-[#1A1A1A] flex items-center gap-1.5">
                    <Landmark className="h-4 w-4 text-[#008060]" />
                    Informations Légales & ICE
                  </h3>
                  <button 
                    onClick={() => setShowLegalConfig(!showLegalConfig)}
                    className="text-xs text-[#008060] font-bold hover:underline"
                  >
                    {showLegalConfig ? "Réduire" : "Modifier"}
                  </button>
                </div>

                {!showLegalConfig ? (
                  <div className="bg-[#F6F6F7] rounded-lg p-3 text-xs border border-[#E1E3E5] grid grid-cols-2 gap-y-2 gap-x-4">
                    <div className="col-span-2">
                      <span className="text-[9px] text-[#6D7175] uppercase font-bold tracking-wider">Raison Sociale</span>
                      <p className="font-bold text-[#1A1A1A]">{currentUser.companyName || 'Non configurée'}</p>
                    </div>
                    <div>
                      <span className="text-[9px] text-[#6D7175] uppercase font-bold tracking-wider">I.C.E.</span>
                      <p className="font-mono text-[11px] font-bold text-[#1A1A1A]">{currentUser.ice || 'Non renseigné'}</p>
                    </div>
                    <div>
                      <span className="text-[9px] text-[#6D7175] uppercase font-bold tracking-wider">Patente</span>
                      <p className="font-mono text-[11px] text-[#1A1A1A]">{currentUser.patente || 'Non renseignée'}</p>
                    </div>
                    <div>
                      <span className="text-[9px] text-[#6D7175] uppercase font-bold tracking-wider">Reg. Commerce (RC)</span>
                      <p className="font-mono text-[11px] text-[#1A1A1A]">{currentUser.rc || 'Non renseigné'}</p>
                    </div>
                    <div>
                      <span className="text-[9px] text-[#6D7175] uppercase font-bold tracking-wider">Identifiant Fiscal (I.F.)</span>
                      <p className="font-mono text-[11px] text-[#1A1A1A]">{currentUser.ifFiscal || 'Non renseigné'}</p>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSaveLegalConfig} className="space-y-3">
                    <div>
                      <label className="block text-[9px] font-bold text-[#6D7175] uppercase tracking-wider">Raison Sociale de l'Entreprise</label>
                      <input 
                        type="text" 
                        required
                        value={legalForm.companyName}
                        onChange={(e) => setLegalForm({...legalForm, companyName: e.target.value})}
                        className="mt-1 w-full rounded-lg border border-[#E1E3E5] px-2.5 py-1.5 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#008060]"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] font-bold text-[#6D7175] uppercase tracking-wider">I.C.E. (15 chiffres)</label>
                        <input 
                          type="text" 
                          required
                          value={legalForm.ice}
                          onChange={(e) => setLegalForm({...legalForm, ice: e.target.value})}
                          className="mt-1 w-full font-mono rounded-lg border border-[#E1E3E5] px-2.5 py-1.5 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#008060]"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-[#6D7175] uppercase tracking-wider">N° de Patente</label>
                        <input 
                          type="text" 
                          required
                          value={legalForm.patente}
                          onChange={(e) => setLegalForm({...legalForm, patente: e.target.value})}
                          className="mt-1 w-full font-mono rounded-lg border border-[#E1E3E5] px-2.5 py-1.5 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#008060]"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[9px] font-bold text-[#6D7175] uppercase tracking-wider">N° RC</label>
                        <input 
                          type="text" 
                          required
                          value={legalForm.rc}
                          onChange={(e) => setLegalForm({...legalForm, rc: e.target.value})}
                          className="mt-1 w-full font-mono rounded-lg border border-[#E1E3E5] px-2.5 py-1.5 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#008060]"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-[#6D7175] uppercase tracking-wider font-mono">I.F.</label>
                        <input 
                          type="text" 
                          required
                          value={legalForm.ifFiscal}
                          onChange={(e) => setLegalForm({...legalForm, ifFiscal: e.target.value})}
                          className="mt-1 w-full font-mono rounded-lg border border-[#E1E3E5] px-2.5 py-1.5 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#008060]"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-[#6D7175] uppercase tracking-wider font-mono">CNSS</label>
                        <input 
                          type="text" 
                          required
                          value={legalForm.cnss}
                          onChange={(e) => setLegalForm({...legalForm, cnss: e.target.value})}
                          className="mt-1 w-full font-mono rounded-lg border border-[#E1E3E5] px-2.5 py-1.5 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#008060]"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button 
                        type="submit" 
                        className="flex-1 bg-[#008060] hover:bg-[#006e52] text-white text-xs font-bold py-2 rounded-lg cursor-pointer transition"
                      >
                        Enregistrer
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setShowLegalConfig(false)}
                        className="bg-white border border-[#E1E3E5] text-[#1A1A1A] text-xs font-bold py-2 px-3 rounded-lg hover:bg-gray-50 transition"
                      >
                        Annuler
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Partners (Clients & Suppliers) Directory */}
              <div className="rounded-xl bg-white p-5 border border-[#E1E3E5] shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-[#1A1A1A] flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-[#008060]" />
                    Annuaire Clients & Fournisseurs ({partners.length})
                  </h3>
                  <button 
                    onClick={() => setShowAddPartnerForm(!showAddPartnerForm)}
                    className="flex items-center gap-1 bg-[#EBF5F1] text-[#008060] font-bold border border-[#BBE3D1] px-2 py-1 text-[10px] rounded hover:bg-white transition cursor-pointer"
                  >
                    <Plus className="h-3 w-3" /> Nouveau
                  </button>
                </div>

                {showAddPartnerForm && (
                  <form onSubmit={handleAddPartner} className="p-3 bg-[#F6F6F7] rounded-lg border border-[#E1E3E5] mb-4 space-y-2.5">
                    <p className="text-[10px] font-bold text-[#1A1A1A] uppercase">Ajouter un partenaire professionnel</p>
                    <div>
                      <label className="block text-[9px] font-bold text-[#6D7175] uppercase">Type de Partenaire</label>
                      <select 
                        value={partnerForm.type}
                        onChange={(e) => setPartnerForm({...partnerForm, type: e.target.value as any})}
                        className="mt-1 w-full rounded border border-[#E1E3E5] p-1.5 text-xs text-[#1A1A1A] bg-white focus:outline-none"
                      >
                        <option value="client">Client Pro (Riad, Agence, Hôtel)</option>
                        <option value="supplier">Fournisseur (Pièces, Carburant, Assurance)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-[#6D7175] uppercase">Nom / Raison Sociale</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="Riad Star Marrakech"
                        value={partnerForm.name}
                        onChange={(e) => setPartnerForm({...partnerForm, name: e.target.value})}
                        className="mt-1 w-full rounded border border-[#E1E3E5] p-1.5 text-xs text-[#1A1A1A] bg-white focus:outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] font-bold text-[#6D7175] uppercase">I.C.E. (Maroc)</label>
                        <input 
                          type="text" 
                          required 
                          placeholder="001254789000054"
                          value={partnerForm.ice}
                          onChange={(e) => setPartnerForm({...partnerForm, ice: e.target.value})}
                          className="mt-1 w-full font-mono rounded border border-[#E1E3E5] p-1.5 text-xs text-[#1A1A1A] bg-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-[#6D7175] uppercase">Téléphone</label>
                        <input 
                          type="text" 
                          placeholder="+212 5 24 ..."
                          value={partnerForm.phone}
                          onChange={(e) => setPartnerForm({...partnerForm, phone: e.target.value})}
                          className="mt-1 w-full rounded border border-[#E1E3E5] p-1.5 text-xs text-[#1A1A1A] bg-white focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] font-bold text-[#6D7175] uppercase">E-mail</label>
                        <input 
                          type="email" 
                          placeholder="booking@riadstar.ma"
                          value={partnerForm.email}
                          onChange={(e) => setPartnerForm({...partnerForm, email: e.target.value})}
                          className="mt-1 w-full rounded border border-[#E1E3E5] p-1.5 text-xs text-[#1A1A1A] bg-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-[#6D7175] uppercase">Adresse (Ville)</label>
                        <input 
                          type="text" 
                          placeholder="Marrakech Medina"
                          value={partnerForm.address}
                          onChange={(e) => setPartnerForm({...partnerForm, address: e.target.value})}
                          className="mt-1 w-full rounded border border-[#E1E3E5] p-1.5 text-xs text-[#1A1A1A] bg-white focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button 
                        type="submit" 
                        className="flex-1 bg-[#008060] text-white text-xs font-bold py-1.5 rounded hover:bg-[#006e52] cursor-pointer"
                      >
                        Enregistrer
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setShowAddPartnerForm(false)}
                        className="border border-[#E1E3E5] bg-white text-xs font-bold py-1.5 px-3 rounded hover:bg-gray-100"
                      >
                        Annuler
                      </button>
                    </div>
                  </form>
                )}

                <div className="space-y-2 max-h-[250px] overflow-y-auto">
                  {partners.map(p => (
                    <div key={p.id} className="flex justify-between items-center p-2.5 rounded-lg bg-[#F6F6F7] border border-[#E1E3E5] hover:bg-white transition text-xs">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className={`h-1.5 w-1.5 rounded-full ${p.type === 'client' ? 'bg-[#008060]' : 'bg-blue-600'}`}></span>
                          <p className="font-bold text-[#1A1A1A]">{p.name}</p>
                        </div>
                        <p className="text-[10px] text-[#6D7175] mt-0.5 font-medium font-mono">ICE: {p.ice}</p>
                        <p className="text-[9px] text-[#6D7175] font-medium">{p.phone} • {p.email}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                        p.type === 'client' ? 'bg-[#EBF5F1] text-[#008060] border border-[#BBE3D1]' : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        {p.type === 'client' ? 'Client' : 'Frn'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: PROFESSIONAL QUOTE, INVOICE & ORDER GENERATOR WITH LOGO AND DOWNLOAD/SHARE HISTORY */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* LOGO CONFIGURATION CARD */}
              <div className="rounded-xl bg-white p-5 border border-[#E1E3E5] shadow-xs space-y-4">
                <div className="flex items-center gap-2">
                  <Upload className="h-4 w-4 text-[#008060]" />
                  <h3 className="text-sm font-bold text-[#1A1A1A]">Logo de votre Entreprise</h3>
                </div>
                <p className="text-xs text-[#6D7175] leading-relaxed">
                  Personnalisez vos documents officiels. Importez votre propre logo ou choisissez un preset pour vos devis, factures et bons de commande.
                </p>
                
                <div className="flex flex-col sm:flex-row items-center gap-4 bg-[#F6F6F7] p-3 rounded-lg border border-[#E1E3E5]">
                  <div className="h-16 w-16 bg-white rounded-lg border border-[#E1E3E5] flex items-center justify-center overflow-hidden p-1 shrink-0">
                    {companyLogoUrl ? (
                      <img src={companyLogoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
                    ) : (
                      <span className="text-[10px] text-[#6D7175] font-bold">Aucun</span>
                    )}
                  </div>
                  <div className="flex-1 space-y-2 w-full">
                    <div>
                      <label className="block text-[10px] font-bold text-[#6D7175] uppercase tracking-wider">URL du Logo</label>
                      <input 
                        type="text" 
                        placeholder="https://votre-site.com/logo.png"
                        value={companyLogoUrl}
                        onChange={(e) => setCompanyLogoUrl(e.target.value)}
                        className="mt-1 w-full rounded border border-[#E1E3E5] px-2 py-1 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#008060]"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-[10px] font-bold text-[#6D7175] uppercase tracking-wider mb-1">Ou Importer un fichier image</label>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              if (typeof reader.result === 'string') {
                                setCompanyLogoUrl(reader.result);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#EBF5F1] file:text-[#008060] hover:file:bg-[#D5EDE2] cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Presets */}
                <div>
                  <span className="block text-[9px] font-bold text-[#6D7175] uppercase tracking-wider mb-1.5">Presets Professionnels Mumy</span>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_LOGOS.map((logo, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCompanyLogoUrl(logo.url)}
                        className={`px-2 py-1 rounded text-[10px] border font-medium transition ${
                          companyLogoUrl === logo.url 
                            ? 'bg-[#EBF5F1] text-[#008060] border-[#008060]' 
                            : 'bg-white text-[#1A1A1A] border-[#E1E3E5] hover:bg-gray-50'
                        }`}
                      >
                        {logo.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* DOCUMENT GENERATION CARD */}
              <div className="rounded-xl bg-white p-5 border border-[#E1E3E5] shadow-xs">
                <h3 className="text-sm font-bold text-[#1A1A1A] mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-[#008060]" />
                  Éditeur de Documents d'Affaires (Devis, Factures, BC)
                </h3>
                <p className="text-xs text-[#6D7175] mb-4 font-medium leading-relaxed">
                  Générez instantanément des devis, factures officielles, bons de commande ou factures proforma. Les mentions légales réglementaires de votre profil d'entreprise y seront apposées.
                </p>

                {/* GENERATION FORM */}
                <form onSubmit={handleInvoiceGenerate} className="space-y-4 border-b border-[#E1E3E5] pb-5 mb-5">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <label className="block text-[10px] font-bold text-[#6D7175] uppercase tracking-wider">Type de document</label>
                      <select
                        value={invoiceForm.docType}
                        onChange={(e) => setInvoiceForm({...invoiceForm, docType: e.target.value as any})}
                        className="mt-1 w-full rounded-lg border border-[#E1E3E5] p-2 text-xs text-[#1A1A1A] bg-white focus:outline-none focus:border-[#008060]"
                      >
                        <option value="Devis">Devis Commercial</option>
                        <option value="Facture">Facture Officielle</option>
                        <option value="Bon de commande">Bon de Commande (B.C.)</option>
                        <option value="Facture Proforma">Facture Proforma</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#6D7175] uppercase tracking-wider">Client Partenaire</label>
                      <select
                        value={invoiceForm.partnerId}
                        onChange={(e) => setInvoiceForm({...invoiceForm, partnerId: e.target.value})}
                        className="mt-1 w-full rounded-lg border border-[#E1E3E5] p-2 text-xs text-[#1A1A1A] bg-white focus:outline-none focus:border-[#008060]"
                      >
                        {partners.map(p => (
                          <option key={p.id} value={p.id}>{p.name} ({p.type === 'client' ? 'Client' : 'Fournisseur'})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#6D7175] uppercase tracking-wider">Passager principal / Réf</label>
                      <input
                        type="text"
                        required
                        value={invoiceForm.passengerName}
                        onChange={(e) => setInvoiceForm({...invoiceForm, passengerName: e.target.value})}
                        className="mt-1 w-full rounded-lg border border-[#E1E3E5] p-2 text-xs text-[#1A1A1A] bg-white focus:outline-none focus:border-[#008060]"
                      />
                    </div>
                  </div>

                  {/* Prestations / Line Items list */}
                  <div className="rounded-lg border border-[#E1E3E5] p-3 bg-[#F6F6F7]/50 space-y-3">
                    <p className="text-[10px] font-bold text-[#1A1A1A] uppercase tracking-wider">Détails des prestations (Multi-Lignes)</p>
                    
                    {invoiceItems.length > 0 ? (
                      <div className="border border-[#E1E3E5] rounded bg-white overflow-hidden text-xs divide-y divide-[#E1E3E5]">
                        {invoiceItems.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center p-2">
                            <div className="flex-1 pr-4">
                              <p className="font-bold text-[#1A1A1A]">{item.description}</p>
                              <span className="text-[10px] text-[#6D7175] font-mono">Qte: {item.quantity} • P.U: {item.unitPrice} DHS</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-mono font-bold text-[#1A1A1A]">{item.quantity * item.unitPrice} DHS</span>
                              <button 
                                type="button" 
                                onClick={() => handleRemoveInvoiceItem(idx)}
                                className="text-red-500 hover:text-red-700 transition"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center py-4 text-xs text-[#6D7175] font-medium bg-white rounded border border-[#E1E3E5]">Aucune prestation saisie. Veuillez en ajouter ci-dessous.</p>
                    )}

                    {/* Add Item form */}
                    <div className="grid gap-2 sm:grid-cols-12 items-end">
                      <div className="sm:col-span-6">
                        <label className="block text-[9px] font-bold text-[#6D7175] uppercase">Service / Trajet</label>
                        <input 
                          type="text"
                          placeholder="Ex: Transfert Marrakech → Casablanca (Van VIP)"
                          value={newItemDesc}
                          onChange={(e) => setNewItemDesc(e.target.value)}
                          className="mt-1 w-full rounded border border-[#E1E3E5] p-1.5 text-xs text-[#1A1A1A] bg-white focus:outline-none"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[9px] font-bold text-[#6D7175] uppercase">Quantité</label>
                        <input 
                          type="number"
                          min="1"
                          value={newItemQty}
                          onChange={(e) => setNewItemQty(Number(e.target.value))}
                          className="mt-1 w-full rounded border border-[#E1E3E5] p-1.5 text-xs text-[#1A1A1A] bg-white focus:outline-none font-mono"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <label className="block text-[9px] font-bold text-[#6D7175] uppercase">P.U. (DHS)</label>
                        <input 
                          type="number"
                          value={newItemPrice}
                          onChange={(e) => setNewItemPrice(Number(e.target.value))}
                          className="mt-1 w-full rounded border border-[#E1E3E5] p-1.5 text-xs text-[#1A1A1A] bg-white focus:outline-none font-mono"
                        />
                      </div>
                      <div className="sm:col-span-1">
                        <button 
                          type="button"
                          onClick={handleAddInvoiceItem}
                          className="w-full bg-[#008060] hover:bg-[#006e52] text-white p-2 rounded flex justify-center transition cursor-pointer"
                          title="Ajouter la ligne"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* TVA and Notes */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-[10px] font-bold text-[#6D7175] uppercase tracking-wider">Taux de T.V.A. applicable</label>
                      <select
                        value={invoiceForm.tvaRate}
                        onChange={(e) => setInvoiceForm({...invoiceForm, tvaRate: Number(e.target.value)})}
                        className="mt-1 w-full rounded-lg border border-[#E1E3E5] p-2 text-xs text-[#1A1A1A] bg-white focus:outline-none focus:border-[#008060]"
                      >
                        <option value="0">TVA 0% (Exonération art. 92/94)</option>
                        <option value="10">TVA 10% (Transport Touristique Maroc)</option>
                        <option value="14">TVA 14% (Opérations de transport)</option>
                        <option value="20">TVA 20% (Taux standard)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#6D7175] uppercase tracking-wider">Notes & Conditions d'encaissement</label>
                      <input
                        type="text"
                        value={invoiceForm.notes}
                        onChange={(e) => setInvoiceForm({...invoiceForm, notes: e.target.value})}
                        className="mt-1 w-full rounded-lg border border-[#E1E3E5] p-2 text-xs text-[#1A1A1A] bg-white focus:outline-none focus:border-[#008060]"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={invoiceItems.length === 0}
                    className="w-full rounded-lg bg-[#008060] border border-[#008060] py-2.5 text-xs font-bold text-white hover:bg-[#006e52] shadow-xs cursor-pointer transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Générer et certifier le document
                  </button>
                </form>

                {/* OUTPUT COMPLIANT PREVIEW (GRAND MODELE CRM) */}
                {generatedDoc && (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-emerald-100 bg-white p-6 sm:p-8 font-sans text-xs text-[#1A1A1A] space-y-6 shadow-md relative overflow-hidden">
                      {/* CRM Stamp Watermark */}
                      <div className="absolute -right-10 -bottom-10 opacity-[0.03] pointer-events-none select-none">
                        <Truck className="h-64 w-64 text-[#008060]" />
                      </div>

                      {/* CRM Premium Header: Logo & Legal Information */}
                      <div className="flex justify-between items-start border-b-2 border-[#008060] pb-6 flex-wrap gap-4">
                        <div className="space-y-2">
                          {companyLogoUrl ? (
                            <img 
                              src={companyLogoUrl} 
                              alt="Logo" 
                              referrerPolicy="no-referrer"
                              className="h-10 object-contain max-w-[200px]" 
                            />
                          ) : (
                            <div className="h-10 w-10 bg-[#008060] text-white flex items-center justify-center font-extrabold rounded-lg text-lg">
                              {currentUser.companyName?.substring(0, 2).toUpperCase() || 'TR'}
                            </div>
                          )}
                          <div>
                            <p className="font-extrabold text-[#008060] uppercase tracking-wider text-sm">{currentUser.companyName || 'Atlas Trans Marrakech'}</p>
                            <p className="text-[10px] text-gray-500 font-medium">Prestataire de Transport National & Touristique Agréé</p>
                          </div>
                        </div>

                        {/* Professional Legal Coordinates */}
                        <div className="text-right text-[10px] text-gray-600 bg-gray-50 p-3 rounded-lg border border-[#E1E3E5] max-w-full sm:max-w-[280px]">
                          <p className="font-bold text-gray-800 uppercase tracking-wider text-[9px] border-b border-gray-200 pb-1 mb-1.5">Identifiants Légaux Maroc</p>
                          <p className="font-semibold text-gray-900">ICE : <span className="font-mono text-[#008060]">{currentUser.ice || '001548796000085'}</span></p>
                          <p className="mt-0.5">Patente : <span className="font-mono">{currentUser.patente || '45879621'}</span> | RC : <span className="font-mono">{currentUser.rc || '98455-Marrakech'}</span></p>
                          <p className="mt-0.5">I.F. : <span className="font-mono">{currentUser.ifFiscal || '12457896'}</span> | CNSS : <span className="font-mono">{currentUser.cnss || '8547963'}</span></p>
                        </div>
                      </div>

                      {/* Document Meta Information Banner */}
                      <div className="flex justify-between items-center bg-emerald-50/70 border border-emerald-100 rounded-lg p-3.5">
                        <div>
                          <span className="text-[9px] font-bold text-[#008060] uppercase tracking-widest block">Type de Document</span>
                          <h4 className="font-extrabold text-base text-[#1A1A1A]">{generatedDoc.docType}</h4>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">Numéro de Pièce</span>
                          <p className="font-mono font-extrabold text-gray-900 text-sm">{generatedDoc.id}</p>
                          <p className="text-[10px] text-gray-500 font-medium">Émis le {generatedDoc.date}</p>
                        </div>
                      </div>

                      {/* CRM Client & Mission Information Block */}
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="bg-gray-50 p-3.5 rounded-lg border border-[#E1E3E5] space-y-2">
                          <span className="font-bold uppercase text-[9px] text-[#6D7175] block tracking-wider border-b border-[#E1E3E5] pb-1">CLIENT DESTINATAIRE</span>
                          <p className="font-bold text-[#1A1A1A] text-xs">{generatedDoc.partner?.name}</p>
                          <div className="text-[10px] text-gray-600 space-y-0.5">
                            <p>ICE : <span className="font-mono font-semibold">{generatedDoc.partner?.ice}</span></p>
                            <p>Tél : {generatedDoc.partner?.phone}</p>
                            <p>Email : {generatedDoc.partner?.email}</p>
                            <p>Adresse : {generatedDoc.partner?.address}</p>
                          </div>
                        </div>

                        <div className="bg-gray-50 p-3.5 rounded-lg border border-[#E1E3E5] flex flex-col justify-between">
                          <div>
                            <span className="font-bold uppercase text-[9px] text-[#6D7175] block tracking-wider border-b border-[#E1E3E5] pb-1">RÉFÉRENCE MISSION / PASSAGERS</span>
                            <div className="mt-2 space-y-1">
                              <p className="text-gray-800 font-bold text-xs">{generatedDoc.passengerName}</p>
                              <p className="text-[10px] text-[#008060] font-semibold">Statut Mission : Certifié & Validé</p>
                            </div>
                          </div>
                          <div className="text-[9px] text-gray-400 italic">
                            Généré via Mumy Enterprise CRM v2.0
                          </div>
                        </div>
                      </div>

                      {/* Dynamic Items CRM Grid Table */}
                      <div className="border border-[#E1E3E5] rounded-lg overflow-hidden">
                        <div className="grid grid-cols-12 bg-gray-50 p-3 text-[9px] font-bold uppercase tracking-wider text-[#6D7175] border-b border-[#E1E3E5]">
                          <span className="col-span-7">Désignation de la prestation transport</span>
                          <span className="col-span-2 text-center">Quantité</span>
                          <span className="col-span-3 text-right">Montant HT</span>
                        </div>
                        <div className="divide-y divide-[#E1E3E5]">
                          {generatedDoc.items?.map((item: any, i: number) => (
                            <div key={i} className="grid grid-cols-12 p-3 text-xs">
                              <span className="col-span-7 font-semibold text-[#1A1A1A]">{item.description}</span>
                              <span className="col-span-2 text-center font-mono font-semibold">{item.quantity}</span>
                              <span className="col-span-3 text-right font-mono font-bold text-gray-900">{item.quantity * item.unitPrice} DHS</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Totals & Financial breakdown */}
                      <div className="flex justify-end">
                        <div className="w-full sm:w-80 bg-gray-50 p-4 rounded-lg border border-[#E1E3E5] space-y-2">
                          <div className="flex justify-between text-gray-600 text-xs font-medium">
                            <span>Total Hors Taxes (HT) :</span>
                            <span className="font-mono font-bold">{generatedDoc.subtotal} DHS</span>
                          </div>
                          <div className="flex justify-between text-gray-600 text-xs font-medium">
                            <span>T.V.A. ({generatedDoc.tvaRate}%) :</span>
                            <span className="font-mono font-bold">{generatedDoc.tvaAmount} DHS</span>
                          </div>
                          <div className="flex justify-between font-extrabold text-[#1A1A1A] pt-2 border-t border-gray-200 text-sm">
                            <span>Total TTC (DHS) :</span>
                            <span className="text-[#008060] font-mono font-extrabold">{generatedDoc.totalTtc} DHS</span>
                          </div>
                        </div>
                      </div>

                      {/* Professional Stamp and legal mentions */}
                      <div className="grid gap-4 sm:grid-cols-2 pt-4 border-t border-gray-100 text-[10px] text-gray-500">
                        <div>
                          <p className="font-bold text-gray-700">Conditions de règlement :</p>
                          <p className="mt-0.5 leading-relaxed">{generatedDoc.notes || 'Règlement à la réception de la facture.'}</p>
                        </div>
                        <div className="flex justify-end items-center">
                          <div className="border-2 border-dashed border-emerald-600/30 rounded-xl px-5 py-2.5 text-center transform -rotate-1 select-none bg-emerald-50/20">
                            <p className="text-[8px] font-bold text-emerald-600 uppercase tracking-widest">Document Certifié</p>
                            <p className="font-extrabold text-[#008060] text-sm mt-0.5 font-mono">CONFORME MUMY</p>
                            <p className="text-[7px] text-gray-400 mt-0.5 font-mono">ID: {generatedDoc.id}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ACTIONS BAR FOR DOWNLOAD & SHARE */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-[#F6F6F7] p-4 rounded-xl border border-[#E1E3E5]">
                      <button
                        type="button"
                        onClick={() => handleDownloadDoc(generatedDoc)}
                        className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-[#008060] text-white text-xs font-bold px-4 py-2.5 rounded-lg hover:bg-[#006e52] shadow-xs transition cursor-pointer"
                      >
                        <Download className="h-4 w-4" />
                        Télécharger (.HTML / PDF)
                      </button>

                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <span className="text-[11px] text-[#6D7175] font-bold shrink-0">Partager avec :</span>
                        <select
                          id="share_recipient_select"
                          className="text-xs rounded border border-[#E1E3E5] bg-white p-1.5 text-[#1A1A1A] focus:outline-none"
                        >
                          {partners.map(p => (
                            <option key={p.id} value={p.name}>{p.name} ({p.type === 'client' ? 'Client' : 'Fournisseur'})</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => {
                            const recipient = (document.getElementById('share_recipient_select') as HTMLSelectElement)?.value || partners[0]?.name;
                            if (recipient) {
                              handleShareDoc(generatedDoc.id, recipient);
                            }
                          }}
                          className="flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-xs transition cursor-pointer"
                        >
                          <Share2 className="h-4 w-4" />
                          Partager
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* INVOICE HISTORY TABLE */}
              <div className="rounded-xl bg-white p-5 border border-[#E1E3E5] shadow-xs space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-[#1A1A1A] flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-[#008060]" />
                    Historique des Pièces Émises ({invoiceHistory.length})
                  </h3>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-[#1A1A1A] border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-[#E1E3E5] text-[10px] font-bold text-[#6D7175] uppercase tracking-wider">
                        <th className="p-3">Réf / Date</th>
                        <th className="p-3">Type</th>
                        <th className="p-3">Destinataire</th>
                        <th className="p-3">Total TTC</th>
                        <th className="p-3">Statut</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E1E3E5]">
                      {invoiceHistory.map((doc) => (
                        <tr key={doc.id} className="hover:bg-gray-50 transition">
                          <td className="p-3">
                            <p className="font-mono font-bold text-[#008060]">{doc.id}</p>
                            <p className="text-[10px] text-[#6D7175]">{doc.date}</p>
                          </td>
                          <td className="p-3 font-semibold">
                            <span className={`px-2 py-0.5 rounded text-[10px] ${
                              doc.docType === 'Devis' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                              doc.docType === 'Facture' ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                              doc.docType === 'Bon de commande' ? 'bg-purple-50 text-purple-800 border border-purple-200' :
                              'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            }`}>
                              {doc.docType}
                            </span>
                          </td>
                          <td className="p-3 font-medium">{doc.partner?.name || doc.passengerName}</td>
                          <td className="p-3 font-mono font-bold">{doc.totalTtc} DHS</td>
                          <td className="p-3">
                            {doc.status === 'shared' ? (
                              <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded font-bold">
                                Partagé → {doc.sharedWith}
                              </span>
                            ) : (
                              <span className="text-[10px] text-gray-500 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded">
                                Créé
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleDownloadDoc(doc)}
                                className="p-1.5 rounded text-[#008060] hover:bg-[#EBF5F1]"
                                title="Télécharger"
                              >
                                <Download className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const rec = doc.partner?.name || partners[0]?.name;
                                  handleShareDoc(doc.id, rec);
                                }}
                                className="p-1.5 rounded text-blue-600 hover:bg-blue-50"
                                title="Partager"
                              >
                                <Share2 className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setGeneratedDoc(doc)}
                                className="p-1.5 rounded text-gray-600 hover:bg-gray-100"
                                title="Voir l'aperçu"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: LEADS / APPELS D'OFFRES */}
      {activeTab === 'leads' && (
        <div className="rounded-xl bg-white p-5 border border-[#E1E3E5] shadow-xs animate-fade-in">
          <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="text-sm font-bold text-[#1A1A1A]">Appels d'Offres Flash de Riads & Hôtels</h3>
              <p className="text-xs text-[#6D7175] mt-1 font-medium">Formulez instantanément une proposition commerciale pour remporter la course.</p>
            </div>
            
            {/* Yield widget */}
            <div className="rounded-xl bg-amber-50 p-3 border border-amber-200 text-xs max-w-sm flex gap-2 items-start shrink-0 shadow-xs">
              <Sparkles className="h-4 w-4 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
              <div>
                {loadingYield ? (
                  <div className="flex items-center gap-1.5">
                    <Loader2 className="h-3 w-3 animate-spin text-amber-600" />
                    <span className="text-[11px] font-bold text-amber-900">Calcul du Yield intelligent...</span>
                  </div>
                ) : (
                  <p className="text-[10.5px] font-bold text-amber-950 leading-snug">{yieldAdvice}</p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {requests.filter(r => r.status === 'pending').map(req => {
              const hasBid = bids.some(b => b.requestId === req.id);
              const currentBid = bids.find(b => b.requestId === req.id);

              return (
                <div key={req.id} className="rounded-xl bg-[#F6F6F7] p-5 border border-[#E1E3E5] hover:border-[#6D7175] transition-all flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-[#1A1A1A] px-2 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider">Flash RFP</span>
                        <span className="text-xs font-bold text-[#6D7175]">{req.clientName}</span>
                      </div>
                      <p className="text-sm font-bold text-[#1A1A1A]">{req.origin} → {req.destination}</p>
                      <p className="text-xs text-[#6D7175] font-medium">Date: {new Date(req.dateTime).toLocaleString('fr-FR')} • Pax: {req.paxCount}</p>
                    </div>

                    <div className="shrink-0 w-full sm:w-auto text-right">
                      {hasBid ? (
                        <div className="rounded-xl bg-[#EBF5F1] p-3 border border-[#BBE3D1] text-xs text-[#008060] text-center sm:text-right font-bold">
                          Offre Soumise : <span className="font-mono text-sm">{currentBid?.priceDHS} DHS</span>
                          <p className="text-[10px] text-[#008060] font-medium mt-0.5">Véhicule/Chauffeur : {currentBid?.vehicleType}</p>
                          <p className="text-[9px] text-gray-500 font-semibold mt-1">Statut: En attente de confirmation</p>
                        </div>
                      ) : (
                        activeBidRequestId !== req.id && (
                          <button
                            onClick={() => {
                              setActiveBidRequestId(req.id);
                              setBidForm({
                                price: 1200,
                                vehicleId: vehicles[0]?.id || '',
                                driverId: drivers[0]?.id || '',
                                customMessage: ''
                              });
                            }}
                            className="rounded-lg bg-[#008060] border border-[#008060] px-4 py-2 text-xs font-bold text-white hover:bg-[#006e52] cursor-pointer shadow-xs transition w-full sm:w-auto"
                          >
                            Postuler à l'offre
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  {/* Expanded structured Bidding Form */}
                  {activeBidRequestId === req.id && (
                    <form onSubmit={(e) => handlePostulerBid(e, req.id)} className="bg-white p-4 rounded-lg border border-[#E1E3E5] space-y-4 animate-fade-in mt-2">
                      <div className="border-b border-[#E1E3E5] pb-2">
                        <h4 className="text-xs font-bold uppercase text-[#1A1A1A] tracking-wider">Formulaire de Candidature (Appel d'Offre)</h4>
                        <p className="text-[10px] text-[#6D7175] mt-0.5">Saisissez vos critères et proposez un chauffeur certifié pour maximiser vos chances de l'obtenir.</p>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-4">
                        <div>
                          <label className="block text-[10px] font-bold text-[#6D7175] uppercase tracking-wider mb-1">Prix Proposé (DHS)</label>
                          <div className="relative">
                            <input
                              type="number"
                              required
                              value={bidForm.price}
                              onChange={(e) => setBidForm({...bidForm, price: Number(e.target.value)})}
                              className="w-full rounded-lg border border-[#E1E3E5] p-2 pr-8 text-xs font-mono font-bold text-[#1A1A1A] bg-white focus:outline-none"
                            />
                            <span className="absolute right-2.5 top-2.5 text-[10px] font-bold text-[#6D7175] font-mono">DHS</span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-[#6D7175] uppercase tracking-wider mb-1">Véhicule Assigné</label>
                          <select
                            value={bidForm.vehicleId}
                            onChange={(e) => setBidForm({...bidForm, vehicleId: e.target.value})}
                            className="w-full rounded-lg border border-[#E1E3E5] p-2 text-xs bg-white text-[#1A1A1A] focus:outline-none"
                          >
                            <option value="">-- Sans Véhicule Précis --</option>
                            {vehicles.map(v => (
                              <option key={v.id} value={v.id}>{v.brand} {v.model} ({v.plate})</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-[#6D7175] uppercase tracking-wider mb-1">Chauffeur Assigné</label>
                          <select
                            value={bidForm.driverId}
                            onChange={(e) => setBidForm({...bidForm, driverId: e.target.value})}
                            className="w-full rounded-lg border border-[#E1E3E5] p-2 text-xs bg-white text-[#1A1A1A] focus:outline-none"
                          >
                            <option value="">-- Sans Chauffeur Précis --</option>
                            {drivers.map(d => (
                              <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-[#6D7175] uppercase tracking-wider mb-1">Message d'accompagnement</label>
                          <input
                            type="text"
                            placeholder="Climatisation, Wifi, etc."
                            value={bidForm.customMessage}
                            onChange={(e) => setBidForm({...bidForm, customMessage: e.target.value})}
                            className="w-full rounded-lg border border-[#E1E3E5] p-2 text-xs text-[#1A1A1A] bg-white focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t border-[#E1E3E5]">
                        <button
                          type="button"
                          onClick={() => setActiveBidRequestId(null)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold border border-[#E1E3E5] text-gray-700 hover:bg-gray-50"
                        >
                          Annuler
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#008060] text-white hover:bg-[#006e52] cursor-pointer"
                        >
                          Soumettre ma candidature
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB CONTENT: PUBLIER UN RETOUR À VIDE */}
      {activeTab === 'returns' && (
        <div className="grid gap-6 md:grid-cols-12 animate-fade-in">
          
          <div className="md:col-span-5 rounded-xl bg-white p-5 border border-[#E1E3E5] shadow-xs">
            <h3 className="text-sm font-bold text-[#1A1A1A] mb-2">Publier un retour à vide</h3>
            <p className="text-xs text-[#6D7175] mb-5 font-medium leading-relaxed">Vos véhicules rentrent d'excursion sans passagers ? Publiez ce trajet. L'algorithme applique une réduction automatique de 50% pour vendre le trajet instantanément.</p>

            <form onSubmit={handleReturnSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-[#6D7175] uppercase tracking-wider">Ville de Départ (Excursion)</label>
                <input
                  type="text"
                  required
                  value={newReturn.origin}
                  onChange={(e) => setNewReturn({...newReturn, origin: e.target.value})}
                  className="mt-1 w-full rounded-lg border border-[#E1E3E5] p-2.5 text-xs text-[#1A1A1A] bg-white focus:outline-none focus:border-[#008060] focus:ring-1 focus:ring-[#008060]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#6D7175] uppercase tracking-wider">Ville de Destination (Base / Marrakech)</label>
                <input
                  type="text"
                  required
                  value={newReturn.destination}
                  onChange={(e) => setNewReturn({...newReturn, destination: e.target.value})}
                  className="mt-1 w-full rounded-lg border border-[#E1E3E5] p-2.5 text-xs text-[#1A1A1A] bg-white focus:outline-none focus:border-[#008060] focus:ring-1 focus:ring-[#008060]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#6D7175] uppercase tracking-wider">Date & Heure de Départ du retour</label>
                <input
                  type="datetime-local"
                  required
                  value={newReturn.dateTime}
                  onChange={(e) => setNewReturn({...newReturn, dateTime: e.target.value})}
                  className="mt-1 w-full rounded-lg border border-[#E1E3E5] p-2.5 text-xs text-[#1A1A1A] bg-white focus:outline-none focus:border-[#008060] focus:ring-1 focus:ring-[#008060]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#6D7175] uppercase tracking-wider">Tarif Réduit Proposé (DHS) (-50%)</label>
                <input
                  type="number"
                  required
                  value={newReturn.basePriceDHS}
                  onChange={(e) => setNewReturn({...newReturn, basePriceDHS: Number(e.target.value)})}
                  className="mt-1 w-full rounded-lg border border-[#E1E3E5] p-2.5 text-xs font-mono text-[#1A1A1A] bg-white focus:outline-none focus:border-[#008060] focus:ring-1 focus:ring-[#008060]"
                />
                <p className="text-[10px] text-[#6D7175] mt-1.5 font-medium">Sera affiché à {(newReturn.basePriceDHS * 1.2).toFixed(0)} DHS pour le client (20% commission de service Mumy comprise).</p>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#6D7175] uppercase tracking-wider">Véhicule Assigné</label>
                <input
                  type="text"
                  required
                  value={newReturn.vehicleType}
                  onChange={(e) => setNewReturn({...newReturn, vehicleType: e.target.value})}
                  className="mt-1 w-full rounded-lg border border-[#E1E3E5] p-2.5 text-xs text-[#1A1A1A] bg-white focus:outline-none focus:border-[#008060] focus:ring-1 focus:ring-[#008060]"
                />
              </div>

              <button type="submit" className="w-full rounded-lg bg-[#008060] border border-[#008060] py-3 text-xs font-bold text-white hover:bg-[#006e52] cursor-pointer shadow-xs transition">
                Publier l'opportunité
              </button>
            </form>
          </div>

          {/* Current Published Empty Returns list */}
          <div className="md:col-span-7 space-y-6">
            <div className="rounded-xl bg-white p-5 border border-[#E1E3E5] shadow-xs">
              <h3 className="text-sm font-bold text-[#1A1A1A] mb-3">Vos Retours à Vide Publiés</h3>
              <div className="space-y-3">
                {emptyReturns.length === 0 ? (
                  <p className="text-xs text-gray-500 italic">Aucun retour à vide publié pour le moment.</p>
                ) : (
                  emptyReturns.map(item => (
                    <div key={item.id} className="rounded-lg border border-[#E1E3E5] p-4 bg-[#F6F6F7] text-xs hover:bg-white transition-all duration-200">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-[#1A1A1A]">{item.origin} → {item.destination}</span>
                        <span className={`px-2 py-0.5 rounded border text-[9px] font-bold uppercase tracking-wider ${
                          item.status === 'booked' ? 'bg-[#EBF5F1] text-[#008060] border-[#BBE3D1]' : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}>
                          {item.status === 'booked' ? 'VENDU' : 'DISPONIBLE'}
                        </span>
                      </div>
                      <p className="text-[#6D7175] text-[10px] font-medium mb-1">Véhicule : {item.vehicleType}</p>
                      <p className="text-[#6D7175] text-[10px] font-medium mb-3">Départ : {new Date(item.dateTime).toLocaleString('fr-FR')}</p>
                      
                      <div className="border-t border-[#E1E3E5] pt-2 flex justify-between items-center">
                        <span className="text-[10px] text-[#6D7175] font-bold">Votre gain net garanti</span>
                        <span className="font-bold text-[#1A1A1A] font-mono text-sm">{item.basePriceDHS} DHS</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-xl bg-white p-5 border border-[#E1E3E5] shadow-xs">
              <div className="mb-3">
                <h3 className="text-sm font-bold text-[#1A1A1A]">Opportunités Retours à Vide de mes Confrères</h3>
                <p className="text-[10.5px] text-[#6D7175] mt-0.5 font-medium">Trajets à vide publiés par d'autres sociétés. Entamez une négociation privée instantanée.</p>
              </div>
              <div className="space-y-3">
                {fellowEmptyReturns.map(item => (
                  <div key={item.id} className="rounded-lg border border-emerald-100 p-4 bg-emerald-50/20 text-xs hover:bg-emerald-50/50 transition-all duration-200">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-[#1A1A1A]">{item.origin} → {item.destination}</span>
                      <span className="bg-[#EBF5F1] text-[#008060] border border-[#BBE3D1] px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider">
                        ACTIF CONFRÈRE
                      </span>
                    </div>
                    <p className="text-gray-600 text-[10px] font-medium mb-1">Confrère : <span className="font-bold text-[#008060]">{item.transporterName}</span></p>
                    <p className="text-gray-500 text-[10px] mb-1">Véhicule : {item.vehicle}</p>
                    <p className="text-gray-500 text-[10px] mb-3">Départ : {new Date(item.dateTime).toLocaleString('fr-FR')}</p>
                    
                    <div className="border-t border-emerald-100/60 pt-2 flex justify-between items-center">
                      <div>
                        <span className="text-[9px] text-[#6D7175] block uppercase tracking-wider">Tarif Proposé</span>
                        <span className="font-mono font-bold text-sm text-[#008060]">{item.price} DHS</span>
                      </div>
                      <button
                        onClick={() => startPrivateChat(item)}
                        className="rounded-lg bg-[#008060] text-white px-3 py-1.5 text-xs font-bold hover:bg-[#006e52] cursor-pointer transition flex items-center gap-1.5 shadow-xs"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        Discuter Privément
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* TAB CONTENT: ESPACE COLLAB CONFRÈRES */}
      {activeTab === 'collab' && (
        <div className="rounded-xl bg-white p-5 border border-[#E1E3E5] space-y-4 shadow-xs animate-fade-in">
          <div>
            <h3 className="text-sm font-bold text-[#1A1A1A]">Espace Chat Privé Inter-Confrères</h3>
            <p className="text-xs text-[#6D7175] mt-1 font-medium">
              Négociez en privé l'achat ou la revente de trajets à vide avec d'autres sociétés de transport de l'écosystème Mumy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 rounded-xl border border-[#E1E3E5] overflow-hidden bg-[#F6F6F7] h-[450px]">
            {/* Sidebar with Chat Rooms */}
            <div className="md:col-span-4 border-r border-[#E1E3E5] bg-white flex flex-col h-full">
              <div className="p-3 bg-gray-50 border-b border-[#E1E3E5]">
                <span className="text-[9px] font-extrabold uppercase text-gray-400 tracking-wider">Conversations Actives</span>
              </div>
              <div className="divide-y divide-gray-100 overflow-y-auto flex-1">
                {/* Forum Public Channel */}
                <button
                  onClick={() => setActivePrivateChatPartner(null)}
                  className={`w-full text-left p-3 flex items-center gap-2.5 transition-all focus:outline-none ${
                    activePrivateChatPartner === null ? 'bg-emerald-50/60 border-l-4 border-[#008060]' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="rounded-full bg-emerald-100 p-2 text-[#008060] shrink-0">
                    <Users className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <strong className="text-xs text-[#1A1A1A] truncate font-bold">Forum Public</strong>
                      <span className="text-[8px] text-emerald-600 font-extrabold uppercase tracking-wider">Général</span>
                    </div>
                    <p className="text-[10px] text-gray-500 truncate mt-0.5">Partage d'infos de transport</p>
                  </div>
                </button>

                {/* Private Chats */}
                {Object.keys(privateChats).map(partner => {
                  const lastMsg = privateChats[partner]?.[privateChats[partner].length - 1];
                  return (
                    <button
                      key={partner}
                      onClick={() => setActivePrivateChatPartner(partner)}
                      className={`w-full text-left p-3 flex items-center gap-2.5 transition-all focus:outline-none ${
                        activePrivateChatPartner === partner ? 'bg-emerald-50/60 border-l-4 border-[#008060]' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="relative shrink-0">
                        <div className="rounded-full bg-[#1A1A1A]/10 p-2 text-[#1A1A1A] font-bold text-xs h-8 w-8 flex items-center justify-center">
                          {partner.charAt(0)}
                        </div>
                        <span className="absolute bottom-0 right-0 block h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white"></span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <strong className="text-xs text-[#1A1A1A] truncate font-bold">{partner}</strong>
                          <span className="text-[8px] text-gray-400 font-mono">{lastMsg?.timestamp || 'En ligne'}</span>
                        </div>
                        <p className="text-[10px] text-gray-500 truncate mt-0.5">{lastMsg?.message || 'Pas de message'}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Main Chat Screen */}
            <div className="md:col-span-8 flex flex-col h-full bg-white">
              {/* Active Chat Header */}
              <div className="p-3 bg-gray-50 border-b border-[#E1E3E5] flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                  <div className={`h-2.5 w-2.5 rounded-full ${activePrivateChatPartner ? 'bg-emerald-500 animate-pulse' : 'bg-emerald-400'}`}></div>
                  <h4 className="text-xs font-bold text-[#1A1A1A]">
                    {activePrivateChatPartner ? `Négociation avec ${activePrivateChatPartner}` : 'Forum Général (Inter-Transporteurs)'}
                  </h4>
                </div>
                <span className="text-[9px] bg-emerald-100 text-[#008060] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded">
                  {activePrivateChatPartner ? 'Chat Privé Chiffré' : 'Canal Public'}
                </span>
              </div>

              {/* Message Feed */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-gray-50/50">
                {activePrivateChatPartner === null ? (
                  /* Public Forum Messages */
                  collabChats.map(msg => (
                    <div key={msg.id} className="text-xs space-y-1">
                      <div className="flex items-center gap-1.5 text-gray-500 text-[10px]">
                        <span className="font-bold text-gray-800">{msg.senderName}</span>
                        <span className="text-[8px] uppercase tracking-wider bg-gray-200 text-gray-700 px-1 rounded font-extrabold">
                          {msg.senderRole}
                        </span>
                        <span className="font-mono text-[9px]">{msg.timestamp}</span>
                      </div>
                      <p className="bg-white text-[#1A1A1A] p-2.5 rounded-xl border border-[#E1E3E5] leading-relaxed max-w-[85%] inline-block font-medium shadow-xs">
                        {msg.message}
                      </p>
                    </div>
                  ))
                ) : (
                  /* Private Chat Messages with Left/Right Alignment */
                  (privateChats[activePrivateChatPartner] || []).map(msg => {
                    const isCurrentUser = msg.senderId === 'u-1';
                    return (
                      <div key={msg.id} className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'} text-xs`}>
                        <div className="flex items-center gap-1.5 text-gray-400 text-[9px] mb-0.5">
                          <span className="font-bold">{msg.senderName}</span>
                          <span className="font-mono text-[8px]">{msg.timestamp}</span>
                        </div>
                        <p className={`p-3 rounded-2xl max-w-[80%] leading-relaxed font-semibold shadow-xs ${
                          isCurrentUser 
                            ? 'bg-[#008060] text-white rounded-tr-none' 
                            : 'bg-white text-gray-800 rounded-tl-none border border-gray-200'
                        }`}>
                          {msg.message}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Message Input Form */}
              <form 
                onSubmit={activePrivateChatPartner ? handleSendPrivateMessage : handleSendCollab} 
                className="p-3 border-t border-[#E1E3E5] bg-white flex gap-2 shrink-0"
              >
                <input
                  type="text"
                  required
                  value={activePrivateChatPartner ? privateInput : collabInput}
                  onChange={(e) => activePrivateChatPartner ? setPrivateInput(e.target.value) : setCollabInput(e.target.value)}
                  placeholder={activePrivateChatPartner ? "Tapez votre offre ou message privé de négociation..." : "Discutez entre confrères du transport..."}
                  className="flex-1 rounded-lg border border-[#E1E3E5] px-3.5 py-2 text-xs text-[#1A1A1A] bg-[#F6F6F7] focus:bg-white focus:outline-none focus:border-[#008060] focus:ring-1 focus:ring-[#008060]"
                />
                <button type="submit" className="rounded-lg bg-[#008060] p-2.5 text-white hover:bg-[#006e52] cursor-pointer transition shadow-xs flex items-center justify-center">
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: ÉQUIPE & PERMISSIONS */}
      {activeTab === 'team_management' && (
        <div className="space-y-6 animate-fade-in text-xs">
          {/* Header Card */}
          <div className="rounded-xl bg-gradient-to-r from-emerald-500/10 to-[#008060]/10 p-5 border border-emerald-200/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <span className="bg-emerald-100 text-[#008060] text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border border-emerald-200">
                Administration Interne
              </span>
              <h3 className="text-base font-bold text-[#1A1A1A] mt-1.5 flex items-center gap-1.5">
                <Users className="h-5 w-5 text-[#008060]" />
                Gestion de l'Équipe & Permissions Collaborateurs
              </h3>
              <p className="text-xs text-[#6D7175] font-medium mt-1">
                Gérez les comptes d'accès de vos répartiteurs, comptables et commerciaux. Définissez des droits d'accès granulaires pour préserver la confidentialité de vos données financières et opérationnelles.
              </p>
            </div>
            <button
              onClick={() => setShowAddTeamMemberForm(!showAddTeamMemberForm)}
              className="px-4 py-2 bg-[#008060] hover:bg-[#006e52] text-white text-xs font-bold rounded-lg transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              {showAddTeamMemberForm ? "Annuler l'Ajout" : "➕ Ajouter un Collaborateur"}
            </button>
          </div>

          {/* Add Team Member Form */}
          {showAddTeamMemberForm && (
            <div className="bg-white rounded-xl border border-[#E1E3E5] p-5 shadow-xs animate-fade-in text-left">
              <h4 className="text-xs font-bold text-[#1A1A1A] border-b border-[#E1E3E5] pb-2.5 mb-4 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="h-4 w-4 text-[#008060]" />
                Enregistrer un nouveau Collaborateur
              </h4>
              <form onSubmit={handleAddTeamMember} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-[10px] font-bold text-[#6D7175] uppercase mb-1">Nom Complet</label>
                    <input
                      type="text"
                      required
                      value={teamMemberForm.name}
                      onChange={(e) => setTeamMemberForm({ ...teamMemberForm, name: e.target.value })}
                      className="w-full rounded-lg border border-[#E1E3E5] px-3.5 py-2 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#008060]"
                      placeholder="Ex: Youssef El Alami"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#6D7175] uppercase mb-1">Adresse E-mail</label>
                    <input
                      type="email"
                      required
                      value={teamMemberForm.email}
                      onChange={(e) => setTeamMemberForm({ ...teamMemberForm, email: e.target.value })}
                      className="w-full rounded-lg border border-[#E1E3E5] px-3.5 py-2 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#008060]"
                      placeholder="Ex: y.alami@entreprise.ma"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#6D7175] uppercase mb-1">Numéro de Téléphone</label>
                    <input
                      type="tel"
                      value={teamMemberForm.phone}
                      onChange={(e) => setTeamMemberForm({ ...teamMemberForm, phone: e.target.value })}
                      className="w-full rounded-lg border border-[#E1E3E5] px-3.5 py-2 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#008060]"
                      placeholder="Ex: +212 6 55 44 33 22"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-[10px] font-bold text-[#6D7175] uppercase mb-1">Rôle opérationnel</label>
                    <select
                      value={teamMemberForm.role}
                      onChange={(e) => setTeamMemberForm({ ...teamMemberForm, role: e.target.value as any })}
                      className="w-full bg-white rounded-lg border border-[#E1E3E5] px-3.5 py-2 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#008060]"
                    >
                      <option value="Dispatcher">Dispatcher / Répartiteur</option>
                      <option value="Comptable">Comptable / Facturation</option>
                      <option value="Commercial">Commercial / Chargé de clientèle</option>
                      <option value="Superviseur">Superviseur d'Équipe</option>
                      <option value="Gérant">Gérant d'Agence</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-[#6D7175] uppercase mb-1">Permissions d'Accès</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                      {[
                        { id: 'fleet_view', label: 'Voir la Flotte' },
                        { id: 'fleet_manage', label: 'Gérer les Véhicules' },
                        { id: 'erp_manage', label: 'Planifier les Courses' },
                        { id: 'finance_view', label: 'Voir Finances' },
                        { id: 'finance_edit', label: 'Éditer Factures' },
                        { id: 'leads_view', label: 'Voir Marché' },
                        { id: 'leads_bid', label: 'Soumissionner Marché' },
                        { id: 'collab_chat', label: 'Chat Confrères' }
                      ].map((perm) => {
                        const checked = teamMemberForm.permissions.includes(perm.id);
                        return (
                          <label key={perm.id} className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                if (checked) {
                                  setTeamMemberForm({
                                    ...teamMemberForm,
                                    permissions: teamMemberForm.permissions.filter(p => p !== perm.id)
                                  });
                                } else {
                                  setTeamMemberForm({
                                    ...teamMemberForm,
                                    permissions: [...teamMemberForm.permissions, perm.id]
                                  });
                                }
                              }}
                              className="rounded border-[#E1E3E5] text-[#008060] focus:ring-[#008060]"
                            />
                            <span>{perm.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowAddTeamMemberForm(false)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-[#1A1A1A] font-bold rounded-lg transition cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#008060] hover:bg-[#006e52] text-white font-bold rounded-lg transition cursor-pointer"
                  >
                    Enregistrer le Collaborateur
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Team List & Statistics */}
          <div className="grid gap-6 lg:grid-cols-12">
            {/* Team Members List (8 cols) */}
            <div className="lg:col-span-8 space-y-4">
              <div className="bg-white rounded-xl border border-[#E1E3E5] p-5 shadow-2xs text-left">
                <div className="flex justify-between items-center border-b border-[#E1E3E5] pb-3 mb-4">
                  <h4 className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider flex items-center gap-1.5">
                    🏢 Membres de l'Agence Atlas Trans Marrakech ({partnerTeam.length})
                  </h4>
                  <span className="text-[10px] text-[#6D7175] font-semibold">Dernière mise à jour: Aujourd'hui</span>
                </div>

                {partnerTeam.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 font-medium">
                    Aucun collaborateur enregistré. Cliquez sur "Ajouter un Collaborateur" pour commencer.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {partnerTeam.map((member) => (
                      <div key={member.id} className="py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-fade-in">
                        <div className="space-y-1.5 text-left flex-1">
                          <div className="flex items-center gap-2">
                            <strong className="text-sm font-black text-gray-950">{member.name}</strong>
                            <span className="bg-slate-100 text-slate-800 border border-slate-300 text-[9px] font-black uppercase px-2 py-0.5 rounded-md">
                              {member.role}
                            </span>
                            <span className={`h-2 w-2 rounded-full ${member.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-red-400'}`}></span>
                          </div>
                          
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-500 text-[11px] font-semibold">
                            <span>📧 {member.email}</span>
                            <span>📞 {member.phone}</span>
                            <span>📅 Ajouté le {member.createdAt}</span>
                          </div>

                          {/* Permissions badging */}
                          <div className="flex flex-wrap gap-1 pt-1.5">
                            {member.permissions.map((p) => {
                              const mapping: Record<string, string> = {
                                'fleet_view': 'Voir Flotte',
                                'fleet_manage': 'Gérer Flotte',
                                'erp_manage': 'Planning',
                                'finance_view': 'Voir Compta',
                                'finance_edit': 'Éditer Factures',
                                'leads_view': 'Voir Marché',
                                'leads_bid': 'Postuler Offres',
                                'collab_chat': 'Chat Confrères'
                              };
                              return (
                                <span key={p} className="bg-emerald-50 text-[#008060] border border-[#BBE3D1] text-[8.5px] font-black uppercase px-1.5 py-0.5 rounded">
                                  {mapping[p] || p}
                                </span>
                              );
                            })}
                          </div>
                        </div>

                        {/* Actions buttons */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleToggleTeamMemberStatus(member.id)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                              member.status === 'active'
                                ? 'bg-amber-50 hover:bg-amber-100/70 text-amber-800 border-amber-200'
                                : 'bg-emerald-50 hover:bg-emerald-100/70 text-[#008060] border-emerald-200'
                            }`}
                          >
                            {member.status === 'active' ? 'Suspendre' : 'Réactiver'}
                          </button>
                          <button
                            onClick={() => handleDeleteTeamMember(member.id)}
                            className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg border border-transparent hover:border-red-200 transition cursor-pointer"
                            title="Retirer le collaborateur"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Permissions Details & Policy (4 cols) */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-white rounded-xl border border-[#E1E3E5] p-5 shadow-2xs text-left space-y-4">
                <h4 className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider border-b border-[#E1E3E5] pb-2.5">
                  🔐 Guide des Droits d'Accès
                </h4>
                
                <div className="space-y-3 font-medium text-[11px] text-slate-700">
                  <div className="space-y-1">
                    <strong className="text-gray-900 block font-black">⭐ Gestion Flotte & Planning</strong>
                    <p className="text-slate-500 leading-normal">
                      Permet de modifier les fiches de véhicules, déclarer les primes d'assurance, et répartir les chauffeurs sur les missions de transport.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <strong className="text-gray-900 block font-black">💳 Comptabilité & Facturation</strong>
                    <p className="text-slate-500 leading-normal">
                      Autorise la visualisation de l'état financier de l'agence, l'édition de factures certifiées, de devis PDF et les suivis de caisse.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <strong className="text-gray-900 block font-black">🌐 Marché Public & Bids</strong>
                    <p className="text-slate-500 leading-normal">
                      Accorde le droit de consulter l'ensemble des leads exclusifs émis par les hôtels et de formuler des offres tarifaires en direct.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-900 text-slate-300 p-4 rounded-xl border border-slate-800 space-y-1.5">
                  <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest block">🔒 SÉCURITÉ DES ACCÈS</span>
                  <p className="text-[10px] leading-relaxed text-slate-400">
                    Chaque modification des permissions prend effet instantanément. En cas de départ d'un employé, nous vous préconisons de suspendre immédiatement son compte pour révoquer l'ensemble des jetons d'accès.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: EXCURSIONS MARKETPLACE & MANAGEMENT */}
      {activeTab === 'web_builder' && (
        <div className="space-y-6 animate-fade-in text-xs">
          
          {/* Header Area */}
          <div className="rounded-xl bg-gradient-to-r from-emerald-500/10 to-[#008060]/10 p-5 border border-emerald-200/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <span className="bg-emerald-100 text-[#008060] text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border border-emerald-200">
                MARKETPLACE EXCURSIONS v2.0
              </span>
              <h3 className="text-base font-bold text-[#1A1A1A] mt-1.5 flex items-center gap-1.5">
                <Compass className="h-5 w-5 text-[#008060]" />
                Portail Excursions Viator-Style & Ventes Inter-Collaborateurs
              </h3>
              <p className="text-xs text-[#6D7175] font-medium mt-1">
                Publiez vos fiches de circuits touristiques au format Viator et vendez des excursions entre membres du réseau de confiance (la plateforme prélève 20% de commission).
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid gap-4 md:grid-cols-4">
            <div className="bg-white rounded-xl border border-[#E1E3E5] p-4 shadow-2xs">
              <span className="text-[10px] font-bold text-[#6D7175] uppercase">Boutique de confiance</span>
              <p className="text-xl font-bold text-[#1A1A1A] mt-1">
                {excursions.filter(e => e.transporterId !== currentUser.id).length} dispo
              </p>
              <p className="text-[10px] text-[#008060] font-semibold mt-1">✓ Vente directe autorisée</p>
            </div>

            <div className="bg-white rounded-xl border border-[#E1E3E5] p-4 shadow-2xs">
              <span className="text-[10px] font-bold text-[#6D7175] uppercase">Tours & Excursions</span>
              <p className="text-xl font-bold text-[#1A1A1A] mt-1">
                {excursions.filter(e => e.transporterId === currentUser.id).length} publiés
              </p>
              <p className="text-[10px] text-indigo-600 font-semibold mt-1">✓ Fiche format Viator complète</p>
            </div>

            <div className="bg-white rounded-xl border border-[#E1E3E5] p-4 shadow-2xs">
              <span className="text-[10px] font-bold text-[#6D7175] uppercase">Réservations Directes</span>
              <p className="text-xl font-bold text-[#1A1A1A] mt-1">
                {excursionBookings.filter(b => b.transporterId === currentUser.id).length} reçues
              </p>
              <p className="text-[10px] text-amber-600 font-semibold mt-1">⚡ Taux de conversion : 14.5%</p>
            </div>

            <div className="bg-white rounded-xl border border-[#E1E3E5] p-4 shadow-2xs">
              <span className="text-[10px] font-bold text-[#6D7175] uppercase">Chiffre d'Affaire Excursions</span>
              <p className="text-xl font-bold text-emerald-600 mt-1">
                {excursionBookings.filter(b => b.transporterId === currentUser.id && b.status !== 'cancelled').reduce((acc, curr) => acc + curr.totalPriceDHS, 0)} DHS
              </p>
              <p className="text-[10px] text-[#6D7175] mt-1">Revenus garantis net de commissions</p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-12">
            
            {/* Left Column: Shared Partner Excursions Marketplace (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              
              <div className="bg-white rounded-xl border border-[#E1E3E5] p-5 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[#E1E3E5] pb-4">
                  <div>
                    <h4 className="text-xs font-black text-[#1A1A1A] flex items-center gap-1.5 uppercase tracking-wider">
                      <Compass className="h-4 w-4 text-amber-500 animate-pulse" />
                      Boutique des Excursions de Partenaires
                    </h4>
                    <p className="text-[10px] text-gray-500 font-medium mt-1">Revendez ces circuits à vos clients pro / voyageurs & gagnez ensemble</p>
                  </div>
                  
                  {/* Filters */}
                  <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                    <div className="relative flex-1 sm:flex-initial">
                      <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                      <input
                        type="text"
                        value={partSearch}
                        onChange={(e) => setPartSearch(e.target.value)}
                        placeholder="Rechercher..."
                        className="pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-xs w-full sm:w-40 focus:outline-none focus:border-[#008060]"
                      />
                    </div>
                    <select
                      value={partLoc}
                      onChange={(e) => setPartLoc(e.target.value)}
                      className="px-2 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-xs focus:outline-none"
                    >
                      <option value="all">Toutes Villes</option>
                      <option value="Marrakech">Marrakech</option>
                      <option value="Essaouira">Essaouira</option>
                      <option value="Agafay">Agafay</option>
                      <option value="Cascades d`Ouzoud">Ouzoud</option>
                    </select>
                  </div>
                </div>

                {/* Excursions Cards Stream */}
                <div className="space-y-6 max-h-[750px] overflow-y-auto pr-1">
                  {excursions.filter(e => e.transporterId !== currentUser.id).filter(e => {
                    const matchesSearch = e.title.toLowerCase().includes(partSearch.toLowerCase()) || e.description.toLowerCase().includes(partSearch.toLowerCase());
                    const matchesLoc = partLoc === "all" || e.location.toLowerCase() === partLoc.toLowerCase();
                    return matchesSearch && matchesLoc;
                  }).length === 0 ? (
                    <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                      <Compass className="h-12 w-12 mx-auto opacity-20 mb-3" />
                      <p className="text-xs font-bold text-gray-500">Aucun circuit trouvé</p>
                      <p className="text-[10px] mt-1 text-gray-400">Modifiez vos critères de recherche ou filtres.</p>
                    </div>
                  ) : (
                    excursions
                      .filter(e => e.transporterId !== currentUser.id)
                      .filter(e => {
                        const matchesSearch = e.title.toLowerCase().includes(partSearch.toLowerCase()) || e.description.toLowerCase().includes(partSearch.toLowerCase());
                        const matchesLoc = partLoc === "all" || e.location.toLowerCase() === partLoc.toLowerCase();
                        return matchesSearch && matchesLoc;
                      })
                      .map((exc) => {
                        const commPrice = Math.round(exc.priceDHS * 1.20); // Platform adds 20%
                        return (
                          <div key={exc.id} className="bg-white border border-[#E1E3E5] hover:border-amber-400 rounded-xl overflow-hidden shadow-2xs hover:shadow-xs transition-all flex flex-col md:flex-row">
                            <div className="md:w-48 h-48 md:h-auto relative shrink-0">
                              <img src={exc.imageUrl} alt={exc.title} className="w-full h-full object-cover" />
                              <div className="absolute top-2.5 left-2.5 bg-black/75 backdrop-blur-xs text-white font-black text-[9px] px-2.5 py-1 rounded-md uppercase tracking-wider">
                                📍 {exc.location}
                              </div>
                            </div>

                            <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                              <div className="space-y-1.5">
                                <div className="flex justify-between items-start gap-2">
                                  <h4 className="font-extrabold text-[#1A1A1A] text-sm leading-tight hover:text-[#008060] transition-colors">{exc.title}</h4>
                                  <span className="text-[9px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200 rounded-md px-2 py-0.5 shrink-0 uppercase">
                                    ⌛ {exc.duration}
                                  </span>
                                </div>
                                <p className="text-[11px] text-gray-500 leading-relaxed font-medium line-clamp-3">{exc.description}</p>
                              </div>

                              {/* Viator Specifics Panel */}
                              <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200/60 grid grid-cols-2 gap-2 text-[10px] text-gray-600 font-medium">
                                <div>
                                  <span className="text-slate-400 font-bold uppercase text-[8px] block">Heure de départ</span>
                                  <span className="text-gray-800 font-bold">{exc.departureTime || "08:30"}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 font-bold uppercase text-[8px] block">Langues supportées</span>
                                  <span className="text-gray-800 font-bold">{exc.languages ? exc.languages.join(", ") : "Français, Anglais"}</span>
                                </div>
                                <div className="col-span-2 border-t border-slate-200/50 pt-1.5">
                                  <span className="text-slate-400 font-bold uppercase text-[8px] block">Politique d`annulation</span>
                                  <span className="text-[#008060] font-semibold">{exc.cancellationPolicy || "Annulation gratuite jusqu`à 24h à l`avance"}</span>
                                </div>
                              </div>

                              {/* Highlights */}
                              {exc.highlights && exc.highlights.length > 0 && (
                                <div className="space-y-1">
                                  <span className="text-slate-400 font-bold uppercase text-[8px] block">Points forts</span>
                                  <ul className="grid grid-cols-1 gap-0.5 text-[10px] text-gray-700">
                                    {exc.highlights.slice(0, 2).map((hl, idx) => (
                                      <li key={idx} className="flex items-center gap-1.5 truncate">
                                        <span className="h-1 w-1 bg-amber-400 rounded-full shrink-0"></span>
                                        {hl}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              <div className="pt-3 border-t border-gray-100 flex justify-between items-center gap-4">
                                <div>
                                  <p className="text-[9px] text-gray-400 font-semibold uppercase">Prix de vente public (20% comm. incluse)</p>
                                  <p className="text-base font-black text-emerald-600">
                                    {commPrice} DHS <span className="text-[10px] text-gray-400 font-normal">/ pax</span>
                                  </p>
                                  <p className="text-[8.5px] text-gray-400 font-mono">Prix net fournisseur : {exc.priceDHS} DHS</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedBookingExcursion(exc);
                                    setBookingForm({
                                      clientName: "",
                                      clientPhone: "",
                                      clientEmail: "",
                                      date: new Date().toISOString().split("T")[0],
                                      paxCount: 2
                                    });
                                  }}
                                  className="px-4 py-2 bg-[#008060] hover:bg-[#006e52] text-white text-xs font-bold rounded-lg transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Compass className="h-4 w-4" />
                                  Réserver
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>

            </div>

            {/* Right Column: Manage Tours / Excursions (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              
              <div className="bg-white rounded-xl border border-[#E1E3E5] p-5 shadow-2xs space-y-4">
                <div className="flex justify-between items-center border-b border-[#E1E3E5] pb-3">
                  <div>
                    <h4 className="text-xs font-bold text-[#1A1A1A]">Catalogue des Excursions</h4>
                    <p className="text-[10px] text-gray-500">Catalogue d'excursions de type Viator</p>
                  </div>
                  <button
                    onClick={handleNewExcursionClick}
                    className="px-3 py-1.5 bg-[#008060] text-white font-bold text-[11px] rounded-lg hover:bg-[#006e52] cursor-pointer transition shadow-xs flex items-center gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Ajouter un Tour
                  </button>
                </div>

                {/* Excursions List */}
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                  {excursions.filter(e => e.transporterId === currentUser.id).length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <Compass className="h-10 w-10 mx-auto opacity-30 mb-2" />
                      <p className="text-xs font-medium">Aucune excursion publiée pour le moment.</p>
                      <p className="text-[10px] mt-1">Créez votre premier circuit touristique dès maintenant !</p>
                    </div>
                  ) : (
                    excursions
                      .filter(e => e.transporterId === currentUser.id)
                      .map((exc) => (
                        <div key={exc.id} className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-2xs hover:border-[#008060] transition-all">
                          <div className="h-28 relative">
                            <img src={exc.imageUrl} alt={exc.title} className="w-full h-full object-cover" />
                            <div className="absolute top-2 right-2 bg-white/95 backdrop-blur-xs text-slate-800 font-extrabold text-[10px] px-2 py-0.5 rounded-md border border-slate-200 shadow-sm">
                              {exc.priceDHS} DHS
                            </div>
                            <div className="absolute bottom-2 left-2 bg-[#008060]/95 text-white font-bold text-[9px] px-2 py-0.5 rounded shadow-sm">
                              📍 {exc.location}
                            </div>
                          </div>
                          
                          <div className="p-3.5 space-y-2">
                            <div className="flex justify-between items-start gap-1">
                              <h5 className="font-bold text-[#1A1A1A] text-xs leading-snug">{exc.title}</h5>
                              <span className="text-[9px] bg-slate-200 text-slate-700 rounded px-1.5 py-0.2 font-bold shrink-0">
                                ⌛ {exc.duration}
                              </span>
                            </div>

                            <p className="text-[10.5px] text-gray-500 line-clamp-2 leading-relaxed">{exc.description}</p>

                            <div className="pt-2.5 border-t border-slate-200 flex justify-between items-center gap-2">
                              <span className="text-[9px] text-[#6D7175]">Max : <strong>{exc.maxPax} Pax</strong></span>
                              <div className="flex gap-1.5">
                                <button
                                  onClick={() => handleEditExcursionClick(exc)}
                                  className="p-1.5 bg-white text-gray-700 hover:text-blue-600 rounded-lg border border-gray-300 hover:border-blue-300 transition"
                                  title="Modifier"
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    if(confirm("Êtes-vous sûr de vouloir supprimer cette excursion ?")) {
                                      onDeleteExcursion(exc.id);
                                      setSuccessMessage("L'excursion a été supprimée.");
                                    }
                                  }}
                                  className="p-1.5 bg-white text-gray-700 hover:text-red-600 rounded-lg border border-gray-300 hover:border-red-300 transition"
                                  title="Supprimer"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                  )}
                </div>

              </div>

              {/* Reservations History received via domain */}
              <div className="bg-white rounded-xl border border-[#E1E3E5] p-5 shadow-2xs space-y-4">
                <h4 className="text-xs font-bold text-[#1A1A1A] border-b border-[#E1E3E5] pb-3">
                  📋 Réservations d'Excursions Reçues
                </h4>

                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {excursionBookings.filter(b => b.transporterId === currentUser.id).length === 0 ? (
                    <p className="text-[11px] text-[#6D7175] text-center py-6 font-medium">Aucune réservation d'excursion enregistrée.</p>
                  ) : (
                    excursionBookings
                      .filter(b => b.transporterId === currentUser.id)
                      .map((bk) => (
                        <div key={bk.id} className="p-3 bg-emerald-50/40 rounded-xl border border-emerald-100 flex justify-between items-center gap-2">
                          <div className="space-y-1">
                            <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                              RÉSERVÉ
                            </span>
                            <h5 className="font-bold text-[#1A1A1A] text-xs mt-1">{bk.excursionTitle}</h5>
                            <p className="text-[10px] text-slate-600">
                              Client : <strong>{bk.clientName}</strong> ({bk.paxCount} Pax)
                            </p>
                            <p className="text-[9px] text-[#6D7175]">
                              📅 Date : {bk.date} &nbsp;|&nbsp; ☎ : {bk.clientPhone}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-mono text-xs font-extrabold text-emerald-700">
                              {bk.totalPriceDHS} DHS
                            </span>
                            <p className="text-[8px] text-gray-400 font-mono mt-1">ID: {bk.id}</p>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>

            </div>

          </div>

          {/* Add Excursion Modal / Form overlay */}
          {showAddExcursionForm && (
            <div className="fixed inset-0 bg-[#1A1A1A]/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl border border-[#E1E3E5] w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-4 bg-[#F6F6F7] border-b border-[#E1E3E5] flex justify-between items-center shrink-0">
                  <h4 className="text-xs font-bold text-[#1A1A1A]">
                    {isEditingExcursion ? "Modifier l'Excursion" : "Ajouter une Nouvelle Excursion (Format Viator)"}
                  </h4>
                  <button 
                    type="button"
                    onClick={() => {
                      setShowAddExcursionForm(false);
                      setIsEditingExcursion(false);
                      setEditingExcursionId(null);
                    }}
                    className="text-gray-500 hover:text-gray-800 font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSaveExcursion} className="p-5 overflow-y-auto space-y-4 flex-1">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-[10px] font-bold text-[#6D7175] uppercase">Nom du Tour / Excursion</label>
                      <input
                        type="text"
                        required
                        value={excursionForm.title}
                        onChange={(e) => setExcursionForm({ ...excursionForm, title: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-[#E1E3E5] px-3.5 py-1.5 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#008060]"
                        placeholder="Ex: Escapade d'une journée à Essaouira"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#6D7175] uppercase">Lieu de Visite</label>
                      <input
                        type="text"
                        required
                        value={excursionForm.location}
                        onChange={(e) => setExcursionForm({ ...excursionForm, location: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-[#E1E3E5] px-3.5 py-1.5 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#008060]"
                        placeholder="Ex: Désert d'Agafay, Essaouira..."
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#6D7175] uppercase">Description détaillée du Tour</label>
                    <textarea
                      required
                      rows={3}
                      value={excursionForm.description}
                      onChange={(e) => setExcursionForm({ ...excursionForm, description: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-[#E1E3E5] px-3.5 py-1.5 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#008060]"
                      placeholder="Décrivez l'itinéraire, l'atmosphère de l'excursion..."
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <label className="block text-[10px] font-bold text-[#6D7175] uppercase">Durée Totale</label>
                      <input
                        type="text"
                        required
                        value={excursionForm.duration}
                        onChange={(e) => setExcursionForm({ ...excursionForm, duration: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-[#E1E3E5] px-3 py-1.5 text-xs text-[#1A1A1A] focus:outline-none"
                        placeholder="Ex: 1 jour, 6 heures..."
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-[#6D7175] uppercase">Tarif par Client (DHS)</label>
                      <input
                        type="number"
                        required
                        value={excursionForm.priceDHS}
                        onChange={(e) => setExcursionForm({ ...excursionForm, priceDHS: Number(e.target.value) })}
                        className="mt-1 w-full rounded-lg border border-[#E1E3E5] px-3 py-1.5 text-xs text-[#1A1A1A] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-[#6D7175] uppercase">Capacité Max (Passagers)</label>
                      <input
                        type="number"
                        required
                        value={excursionForm.maxPax}
                        onChange={(e) => setExcursionForm({ ...excursionForm, maxPax: Number(e.target.value) })}
                        className="mt-1 w-full rounded-lg border border-[#E1E3E5] px-3 py-1.5 text-xs text-[#1A1A1A] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#6D7175] uppercase">Photo Principale (URL Unsplash)</label>
                    <input
                      type="text"
                      required
                      value={excursionForm.imageUrl}
                      onChange={(e) => setExcursionForm({ ...excursionForm, imageUrl: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-[#E1E3E5] px-3 py-1.5 text-xs text-[#1A1A1A] font-mono focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#6D7175] uppercase">Vidéo Promotionnelle YouTube (Optionnel)</label>
                    <input
                      type="text"
                      value={excursionForm.youtubeUrl}
                      onChange={(e) => setExcursionForm({ ...excursionForm, youtubeUrl: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-[#E1E3E5] px-3 py-1.5 text-xs text-[#1A1A1A] font-mono focus:outline-none"
                      placeholder="Ex: https://www.youtube.com/watch?v=F5gQ0uA7KzQ"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-[10px] font-bold text-[#6D7175] uppercase">Heure de Départ (Format Viator)</label>
                      <input
                        type="text"
                        required
                        value={excursionForm.departureTime}
                        onChange={(e) => setExcursionForm({ ...excursionForm, departureTime: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-[#E1E3E5] px-3.5 py-1.5 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#008060]"
                        placeholder="Ex: 08:30 ou Flexible"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#6D7175] uppercase">Langues Parlées (Séparées par virgule)</label>
                      <input
                        type="text"
                        required
                        value={excursionForm.languages}
                        onChange={(e) => setExcursionForm({ ...excursionForm, languages: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-[#E1E3E5] px-3.5 py-1.5 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#008060]"
                        placeholder="Ex: Français, Anglais, Espagnol"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-[10px] font-bold text-[#6D7175] uppercase">Point de Rendez-vous</label>
                      <input
                        type="text"
                        required
                        value={excursionForm.meetingPoint}
                        onChange={(e) => setExcursionForm({ ...excursionForm, meetingPoint: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-[#E1E3E5] px-3.5 py-1.5 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#008060]"
                        placeholder="Ex: Prise en charge gratuite à votre hôtel"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#6D7175] uppercase">Politique d'Annulation</label>
                      <input
                        type="text"
                        required
                        value={excursionForm.cancellationPolicy}
                        onChange={(e) => setExcursionForm({ ...excursionForm, cancellationPolicy: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-[#E1E3E5] px-3.5 py-1.5 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#008060]"
                        placeholder="Ex: Annulation gratuite jusqu'à 24h à l'avance"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#6D7175] uppercase">Points forts / Highlights (Un par ligne)</label>
                    <textarea
                      rows={2}
                      required
                      value={excursionForm.highlightsText}
                      onChange={(e) => setExcursionForm({ ...excursionForm, highlightsText: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-[#E1E3E5] px-3 py-1.5 text-xs text-[#1A1A1A] focus:outline-none"
                      placeholder="Ex: Visite guidée de la médina&#10;Déjeuner traditionnel&#10;Balade en dromadaire"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-[10px] font-bold text-[#6D7175] uppercase">Ce qui est inclus (Un par ligne)</label>
                      <textarea
                        rows={2}
                        required
                        value={excursionForm.includesText}
                        onChange={(e) => setExcursionForm({ ...excursionForm, includesText: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-[#E1E3E5] px-3 py-1.5 text-xs text-[#1A1A1A] focus:outline-none"
                        placeholder="Transport climatisé&#10;Chauffeur VIP"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#6D7175] uppercase">Ce qui est exclu (Un par ligne)</label>
                      <textarea
                        rows={2}
                        required
                        value={excursionForm.excludesText}
                        onChange={(e) => setExcursionForm({ ...excursionForm, excludesText: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-[#E1E3E5] px-3 py-1.5 text-xs text-[#1A1A1A] focus:outline-none"
                        placeholder="Pourboires&#10;Dépenses personnelles"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-3 border-t border-[#E1E3E5]">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddExcursionForm(false);
                        setIsEditingExcursion(false);
                        setEditingExcursionId(null);
                      }}
                      className="w-1/2 py-2 text-xs font-bold border border-[#E1E3E5] text-gray-700 hover:bg-gray-50 rounded-lg"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="w-1/2 py-2 text-xs font-bold bg-[#008060] text-white hover:bg-[#006e52] rounded-lg cursor-pointer"
                    >
                      {isEditingExcursion ? "Sauvegarder les modifications" : "Publier l'Excursion"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Simulated Public Site Preview Modal */}
          {showSitePreviewModal && (
            <div className="fixed inset-0 bg-[#1A1A1A]/85 backdrop-blur-md flex items-center justify-center z-50 p-2 sm:p-4 animate-fade-in">
              <div className="bg-[#FAFBFB] rounded-2xl border border-gray-300 w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] text-xs">
                
                {/* Browser-like Toolbar */}
                <div className="p-3 bg-slate-900 border-b border-slate-950 flex items-center justify-between shrink-0 text-white font-mono text-[10.5px]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                    <span className="ml-4 bg-slate-800 text-slate-300 px-3 py-1 rounded text-[10px] flex items-center gap-1.5 border border-slate-700/50 w-64 md:w-96 truncate">
                      <span className="text-emerald-500 font-extrabold">🔒 https://</span>{siteForm.customDomain || 'atlas-transports.ma'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="bg-emerald-600 text-white text-[8px] font-bold px-2 py-0.5 rounded border border-emerald-500">
                      SSL CRYPTO ACTIF
                    </span>
                    <button 
                      type="button"
                      onClick={() => setShowSitePreviewModal(false)}
                      className="text-slate-400 hover:text-white font-bold bg-slate-800 px-2.5 py-1 rounded border border-slate-700 cursor-pointer text-[10px]"
                    >
                      Fermer l'Aperçu
                    </button>
                  </div>
                </div>

                {/* Live Public Website Container */}
                <div className="flex-1 overflow-y-auto flex flex-col">
                  
                  {/* Brand Navigation Bar */}
                  <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-xs">
                    <div className="flex items-center gap-3">
                      {siteForm.logoUrl ? (
                        <img 
                          src={siteForm.logoUrl} 
                          alt="Logo Transporter" 
                          className="h-10 w-10 rounded-xl object-cover border border-slate-200 shadow-3xs" 
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div 
                          className="h-10 w-10 rounded-xl flex items-center justify-center font-black text-white text-sm shadow-xs"
                          style={{ backgroundColor: siteForm.primaryColor }}
                        >
                          {siteForm.siteTitle.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h3 className="text-xs font-black text-gray-900 tracking-tight leading-none uppercase">
                          {siteForm.siteTitle}
                        </h3>
                        <span className="text-[9px] text-gray-400 font-bold tracking-wider uppercase mt-0.5 block">
                          Transport Touristique Agréé
                        </span>
                      </div>
                    </div>

                    <div className="hidden md:flex items-center gap-5 text-[10px] font-black text-gray-500 uppercase tracking-wider">
                      <a href="#about" className="hover:text-gray-900 transition">Qui sommes-nous</a>
                      <a href="#excursions" className="hover:text-gray-900 transition">Excursions</a>
                      <a href="#contact" className="hover:text-gray-900 transition">Contact</a>
                      {siteForm.tripadvisorUrl && (
                        <a 
                          href={siteForm.tripadvisorUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="hover:opacity-80 transition flex items-center gap-1 text-[#00AF87] font-extrabold"
                        >
                          ★ TripAdvisor
                        </a>
                      )}
                    </div>

                    <div>
                      <a 
                        href={`tel:${siteForm.contactPhone}`}
                        className="px-4 py-2 text-white font-extrabold text-[10.5px] rounded-xl shadow-xs transition duration-200 uppercase tracking-wider hover:opacity-90 flex items-center gap-1.5"
                        style={{ backgroundColor: siteForm.primaryColor }}
                      >
                        <Phone className="h-3.5 w-3.5" />
                        {siteForm.contactPhone}
                      </a>
                    </div>
                  </div>

                  {/* Hero banner */}
                  <div 
                    className="h-80 relative bg-cover bg-center flex items-center justify-center text-center px-4 shrink-0" 
                    style={{ backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.65), rgba(15, 23, 42, 0.65)), url('${siteForm.headerImageUrl}')` }}
                  >
                    <div className="max-w-2xl space-y-3.5">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-extrabold text-white uppercase tracking-widest border border-white/20 bg-white/10 backdrop-blur-xs">
                        ✈️ CHAUFFEURS PRIVÉS & CIRCUITS VIP MAROC
                      </span>
                      <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                        {siteForm.siteSubtitle}
                      </h1>
                      <p className="text-[11px] sm:text-xs text-gray-300 font-medium max-w-lg mx-auto">
                        Découvrez le Maroc avec nos minibus de prestige, nos vans tout confort et nos chauffeurs certifiés bilingues pour vos vacances de rêve.
                      </p>
                      
                      <div className="pt-2 flex justify-center gap-3">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-xs rounded-lg text-[10.5px] font-bold text-gray-100 border border-white/10">
                          📞 WhatsApp : {siteForm.contactPhone}
                        </div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-xs rounded-lg text-[10.5px] font-bold text-gray-100 border border-white/10">
                          ✉️ Email : {siteForm.contactEmail}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Public Site Page Content */}
                  <div className="max-w-5xl mx-auto w-full p-5 sm:p-8 space-y-8 bg-slate-50 flex-1">
                    
                    {/* Unique Value Propositions (Prises de garanties) */}
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-3xs flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 shrink-0" style={{ color: siteForm.primaryColor, backgroundColor: siteForm.primaryColor + '10' }}>
                          <Shield className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Flotte 100% Assurée</h4>
                          <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">Véhicules récents avec agrément touristique et couverture passagers intégrale.</p>
                        </div>
                      </div>

                      <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-3xs flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-amber-50 text-amber-600 shrink-0" style={{ color: siteForm.primaryColor, backgroundColor: siteForm.primaryColor + '10' }}>
                          <Award className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Chauffeurs Agrées</h4>
                          <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">Conducteurs professionnels bilingues, discrets et habitués aux hôtels de prestige.</p>
                        </div>
                      </div>

                      <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-3xs flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-blue-50 text-blue-600 shrink-0" style={{ color: siteForm.primaryColor, backgroundColor: siteForm.primaryColor + '10' }}>
                          <Compass className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Meilleur Prix Garanti</h4>
                          <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">Pas de commissions intermédiaires. Tarification claire, nette et sans frais cachés.</p>
                        </div>
                      </div>
                    </div>

                    {/* About Section */}
                    <div id="about" className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-3">
                      <h2 className="text-sm font-black text-gray-900 flex items-center gap-1.5 uppercase tracking-wider">
                        <span className="h-4 w-1.5 rounded-full" style={{ backgroundColor: siteForm.primaryColor }}></span>
                        À propos de {siteForm.siteTitle}
                      </h2>
                      <p className="text-xs text-gray-600 leading-relaxed font-medium">
                        {siteForm.aboutText}
                      </p>
                    </div>

                    {/* Excursions Viator-Style Grid */}
                    <div id="excursions" className="space-y-4">
                      <div className="flex justify-between items-end border-b border-gray-200 pb-3">
                        <h2 className="text-sm font-black text-gray-900 flex items-center gap-1.5 uppercase tracking-wider">
                          <Compass className="h-5 w-5" style={{ color: siteForm.primaryColor }} />
                          Nos Circuits & Excursions Phares (Style Viator)
                        </h2>
                        <span className="text-[10px] bg-[#008060]/10 text-[#008060] font-black px-2.5 py-1 rounded-full border border-[#008060]/20" style={{ color: siteForm.primaryColor, backgroundColor: siteForm.primaryColor + '15', borderColor: siteForm.primaryColor + '30' }}>
                          ✓ Tarifs Directs Producteur
                        </span>
                      </div>

                      <div className="grid gap-6 sm:grid-cols-2">
                        {excursions.filter(e => e.transporterId === currentUser.id && e.isActive).length === 0 ? (
                          <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center col-span-2">
                            <Compass className="h-8 w-8 text-gray-300 mx-auto animate-pulse" />
                            <p className="text-xs text-gray-500 mt-2 font-bold">Aucune excursion n'est publiée pour le moment.</p>
                            <p className="text-[10px] text-gray-400 mt-1">Utilisez l'onglet 'Ajouter un circuit' à droite pour publier votre première offre !</p>
                          </div>
                        ) : (
                          excursions
                            .filter(e => e.transporterId === currentUser.id && e.isActive)
                            .map(exc => (
                              <div key={exc.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-2xs hover:shadow-md transition flex flex-col justify-between">
                                <div className="h-48 relative shrink-0 cursor-pointer" onClick={() => setSelectedPreviewExcursion(exc)}>
                                  <img src={exc.imageUrl} alt={exc.title} className="w-full h-full object-cover" />
                                  <div className="absolute top-3 right-3 bg-white text-slate-900 font-extrabold text-[11px] px-3 py-1 rounded-lg border border-gray-200 shadow-md">
                                    Dès <span className="text-emerald-600 font-black" style={{ color: siteForm.primaryColor }}>{exc.priceDHS} DHS</span>
                                  </div>
                                  <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-xs text-white text-[9.5px] font-bold px-2 py-0.5 rounded">
                                    📍 {exc.location}
                                  </div>
                                </div>

                                <div className="p-4 space-y-4 flex-1 flex flex-col justify-between bg-white">
                                  <div className="space-y-2 cursor-pointer" onClick={() => setSelectedPreviewExcursion(exc)}>
                                    <div className="flex justify-between items-center text-[10px] text-gray-500 font-bold">
                                      <span>⌛ Durée : {exc.duration}</span>
                                      <span className="flex items-center gap-0.5 text-amber-500">★ 4.9 (142 avis)</span>
                                    </div>
                                    <h3 className="text-xs font-black text-gray-900 leading-snug hover:text-emerald-600 transition" style={{ hoverColor: siteForm.primaryColor }}>{exc.title}</h3>
                                    <p className="text-[10.5px] text-gray-500 leading-relaxed line-clamp-3 font-medium">{exc.description}</p>
                                    
                                    {/* Viator Style Highlights */}
                                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 space-y-1">
                                      <span className="text-[9px] font-extrabold text-slate-700 uppercase tracking-wider block">Points Forts :</span>
                                      <ul className="space-y-0.5">
                                        {exc.highlights.slice(0, 3).map((hl, i) => (
                                          <li key={i} className="text-[9.5px] text-slate-600 flex items-start gap-1">
                                            <span className="text-emerald-500 mt-0.5" style={{ color: siteForm.primaryColor }}>✓</span> <span className="truncate">{hl}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setSelectedPreviewExcursion(exc)}
                                      className="py-2 text-slate-800 border border-slate-200 bg-slate-50 font-extrabold text-[10.5px] rounded-xl hover:bg-slate-100 transition flex items-center justify-center gap-1 uppercase tracking-wider cursor-pointer"
                                    >
                                      <Eye className="h-3 w-3 text-slate-500" />
                                      Détails
                                    </button>

                                    <a
                                      href={`https://wa.me/${siteForm.contactPhone.replace(/[^0-9]/g, '').replace(/^0/, '212')}?text=${encodeURIComponent(
                                        `Bonjour, je souhaite réserver l'excursion "${exc.title}" (${exc.priceDHS} DHS) via WhatsApp. Pouvez-vous me confirmer les disponibilités ?`
                                      )}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="py-2 bg-[#25D366] text-white font-extrabold text-[10.5px] rounded-xl hover:bg-[#20ba56] transition flex items-center justify-center gap-1 shadow-2xs uppercase tracking-wider text-center"
                                    >
                                      <MessageSquare className="h-3 w-3" />
                                      WhatsApp
                                    </a>
                                  </div>
                                </div>
                              </div>
                            ))
                        )}
                      </div>
                    </div>

                    {/* Footer public site */}
                    <div id="contact" className="border-t border-gray-200 pt-6 text-center space-y-3">
                      <div className="flex items-center justify-center gap-3">
                        {siteForm.logoUrl ? (
                          <img src={siteForm.logoUrl} alt="" className="h-8 w-8 rounded-lg object-cover" />
                        ) : (
                          <span className="font-extrabold" style={{ color: siteForm.primaryColor }}>★</span>
                        )}
                        <span className="text-xs text-gray-700 font-black uppercase tracking-wider">{siteForm.siteTitle}</span>
                        {siteForm.tripadvisorUrl && (
                          <a 
                            href={siteForm.tripadvisorUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-[10px] text-[#00AF87] font-black hover:underline"
                          >
                            ★ Avis TripAdvisor
                          </a>
                        )}
                      </div>
                      
                      <p className="text-[10px] text-gray-400 font-medium leading-relaxed max-w-lg mx-auto">
                        Agrément Ministériel N° {currentUser.ice ? currentUser.ice.substring(0,6) : '5841'}/2026. <br />
                        E-mail de support : <span className="text-gray-500 underline">{siteForm.contactEmail}</span> &nbsp;|&nbsp; Tél Réservations : <span className="text-gray-500 font-bold">{siteForm.contactPhone}</span>
                      </p>
                      <p className="text-[8.5px] text-gray-400 font-mono">
                        Propulsé de manière hautement sécurisée par Mumy Assistance. Tous droits réservés.
                      </p>
                    </div>

                  </div>

                </div>

              </div>
            </div>
          )}

          {/* Viator-Style Excursion Booking Modal */}
          {selectedBookingExcursion && (
            <div className="fixed inset-0 bg-[#1A1A1A]/85 backdrop-blur-md flex items-center justify-center z-50 p-2 sm:p-4 animate-fade-in">
              <div className="bg-[#FAFBFB] rounded-2xl border border-gray-300 w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[95vh] text-xs text-[#1a1a1a]">
                
                {/* Header */}
                <div className="p-4 bg-slate-900 border-b border-slate-950 flex justify-between items-center shrink-0 text-white">
                  <div className="flex items-center gap-2">
                    <Compass className="h-5 w-5 text-amber-400 animate-spin" />
                    <div>
                      <span className="font-black uppercase tracking-wider text-[9px] text-slate-400 block">Réserver un circuit</span>
                      <span className="font-bold text-xs truncate max-w-[280px] block">{selectedBookingExcursion.title}</span>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setSelectedBookingExcursion(null)}
                    className="text-slate-400 hover:text-white font-black bg-slate-800 h-7 w-7 rounded-full flex items-center justify-center cursor-pointer text-xs"
                  >
                    ✕
                  </button>
                </div>

                {/* Body Form */}
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    const totalPriceDHS = Math.round(selectedBookingExcursion.priceDHS * 1.20) * bookingForm.paxCount;
                    onBookExcursion({
                      excursionId: selectedBookingExcursion.id,
                      excursionTitle: selectedBookingExcursion.title,
                      transporterId: selectedBookingExcursion.transporterId,
                      transporterName: selectedBookingExcursion.transporterName,
                      clientName: bookingForm.clientName,
                      clientEmail: bookingForm.clientEmail,
                      clientPhone: bookingForm.clientPhone,
                      date: bookingForm.date,
                      paxCount: Number(bookingForm.paxCount),
                      totalPriceDHS
                    });
                    setSelectedBookingExcursion(null);
                  }} 
                  className="p-5 overflow-y-auto space-y-4"
                >
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex gap-3">
                    <img src={selectedBookingExcursion.imageUrl} alt="" className="h-16 w-16 rounded-lg object-cover border" />
                    <div className="space-y-1">
                      <h4 className="font-bold text-gray-800 leading-tight">{selectedBookingExcursion.title}</h4>
                      <div className="text-[10px] text-gray-500 font-medium">
                        <span>📍 {selectedBookingExcursion.location}</span>
                        <span className="mx-2">|</span>
                        <span>⌛ {selectedBookingExcursion.duration}</span>
                      </div>
                      <div className="text-[10px] text-emerald-600 font-bold">
                        Prix Unitaire Public (avec 20% commission) : {Math.round(selectedBookingExcursion.priceDHS * 1.20)} DHS
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase">Nom Complet du Client Voyageur</label>
                      <input
                        type="text"
                        required
                        value={bookingForm.clientName}
                        onChange={(e) => setBookingForm({ ...bookingForm, clientName: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3.5 py-2 text-xs text-gray-800 focus:outline-none focus:border-[#008060]"
                        placeholder="Ex: Jean Dupont"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase">Téléphone du Voyageur</label>
                        <input
                          type="text"
                          required
                          value={bookingForm.clientPhone}
                          onChange={(e) => setBookingForm({ ...bookingForm, clientPhone: e.target.value })}
                          className="mt-1 w-full rounded-lg border border-gray-300 px-3.5 py-2 text-xs text-gray-800 focus:outline-none focus:border-[#008060]"
                          placeholder="Ex: +33 6 12 34 56 78"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase">Email du Voyageur</label>
                        <input
                          type="email"
                          required
                          value={bookingForm.clientEmail}
                          onChange={(e) => setBookingForm({ ...bookingForm, clientEmail: e.target.value })}
                          className="mt-1 w-full rounded-lg border border-gray-300 px-3.5 py-2 text-xs text-gray-800 focus:outline-none focus:border-[#008060]"
                          placeholder="Ex: jean.dupont@gmail.com"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase">Date du Tour</label>
                        <input
                          type="date"
                          required
                          value={bookingForm.date}
                          onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
                          className="mt-1 w-full rounded-lg border border-gray-300 px-3.5 py-2 text-xs text-gray-800 focus:outline-none focus:border-[#008060]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase">Nombre de Participants (pax)</label>
                        <input
                          type="number"
                          required
                          min="1"
                          max={selectedBookingExcursion.maxPax || 20}
                          value={bookingForm.paxCount}
                          onChange={(e) => setBookingForm({ ...bookingForm, paxCount: Number(e.target.value) })}
                          className="mt-1 w-full rounded-lg border border-gray-300 px-3.5 py-2 text-xs text-gray-800 focus:outline-none focus:border-[#008060]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex justify-between items-center shrink-0">
                    <div>
                      <span className="text-[10px] font-bold text-[#008060] uppercase block">Total à payer</span>
                      <span className="text-xl font-black text-[#008060]">
                        {Math.round(selectedBookingExcursion.priceDHS * 1.20) * (bookingForm.paxCount || 1)} DHS
                      </span>
                      <span className="text-[8.5px] text-gray-400 block font-mono">Commission plateforme 20% incluse</span>
                    </div>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-[#008060] hover:bg-[#006e52] text-white text-xs font-bold rounded-lg transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="h-4 w-4" />
                      Confirmer Réservation
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Detailed Excursion Details & Video Modal */}
          {selectedPreviewExcursion && (
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
                    onClick={() => setSelectedPreviewExcursion(null)}
                    className="text-slate-400 hover:text-white font-black bg-slate-800 h-7 w-7 rounded-full flex items-center justify-center cursor-pointer text-xs"
                  >
                    ✕
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
                  {/* Big Cover Image */}
                  <div className="relative h-56 rounded-xl overflow-hidden shadow-sm border border-slate-200">
                    <img src={selectedPreviewExcursion.imageUrl} alt={selectedPreviewExcursion.title} className="w-full h-full object-cover" />
                    <div className="absolute top-3 right-3 bg-white text-slate-900 font-extrabold text-xs px-3 py-1.5 rounded-lg border border-gray-200 shadow-md">
                      Dès <span className="text-emerald-600 font-black" style={{ color: siteForm.primaryColor }}>{selectedPreviewExcursion.priceDHS} DHS</span>
                    </div>
                    <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-xs text-white text-[10px] font-black px-2.5 py-1 rounded">
                      📍 {selectedPreviewExcursion.location}
                    </div>
                  </div>

                  {/* Title & Metadata */}
                  <div className="space-y-2">
                    <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                      {selectedPreviewExcursion.title}
                    </h2>
                    <div className="flex flex-wrap gap-4 text-[10.5px] text-slate-500 font-bold border-b border-slate-100 pb-3">
                      <span className="flex items-center gap-1">⌛ Durée : {selectedPreviewExcursion.duration}</span>
                      <span className="flex items-center gap-1">👥 Max Voyageurs : {selectedPreviewExcursion.maxPax}</span>
                      <span className="flex items-center gap-0.5 text-amber-500">★ 4.9 (142 avis)</span>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <h4 className="font-extrabold text-slate-800 uppercase tracking-wider text-[10px]">Description de l'itinéraire</h4>
                    <p className="text-slate-600 leading-relaxed font-medium text-[11px] whitespace-pre-line bg-slate-50 p-4 rounded-xl border border-slate-100">
                      {selectedPreviewExcursion.description}
                    </p>
                  </div>

                  {/* YouTube Video Section */}
                  {selectedPreviewExcursion.youtubeUrl && (
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
                        const embedUrl = getEmbedUrl(selectedPreviewExcursion.youtubeUrl);
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
                              href={selectedPreviewExcursion.youtubeUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="block p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl font-bold hover:bg-red-100 transition text-center"
                            >
                              ▶ Ouvrir la vidéo sur YouTube : {selectedPreviewExcursion.youtubeUrl}
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
                        {selectedPreviewExcursion.highlights.map((hl, i) => (
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
                        {selectedPreviewExcursion.includes.map((inc, i) => (
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
                        {selectedPreviewExcursion.excludes.map((exc, i) => (
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
                    Tarif garanti direct producteur : <span className="text-slate-900 font-black">{selectedPreviewExcursion.priceDHS} DHS</span>
                  </span>

                  <div className="flex gap-2">
                    <a
                      href={`https://wa.me/${siteForm.contactPhone.replace(/[^0-9]/g, '').replace(/^0/, '212')}?text=${encodeURIComponent(
                        `Bonjour ${siteForm.siteTitle}, je souhaite réserver l'excursion "${selectedPreviewExcursion.title}" (${selectedPreviewExcursion.priceDHS} DHS) pour une date prochaine. Pouvez-vous me donner les disponibilités ?`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-[#25D366] text-white font-extrabold rounded-xl hover:bg-[#20ba56] transition shadow-xs flex items-center gap-1.5 uppercase tracking-wider text-center"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      Réserver WhatsApp
                    </a>

                    <button
                      type="button"
                      onClick={() => {
                        const clientName = prompt("Saisissez votre Nom Complet pour la réservation :");
                        const clientPhone = prompt("Saisissez votre numéro de Téléphone :");
                        const date = prompt("Saisissez la Date souhaitée (AAAA-MM-JJ) :", new Date().toISOString().split('T')[0]);
                        if (clientName && clientPhone && date) {
                          alert("Félicitations " + clientName + " ! Votre réservation pour '" + selectedPreviewExcursion.title + "' a été transmise à " + siteForm.siteTitle + ". Un conseiller de Mumy Assistance vous contactera sous peu.");
                          setSelectedPreviewExcursion(null);
                        }
                      }}
                      className="px-4 py-2 text-white font-extrabold rounded-xl hover:opacity-90 transition shadow-xs flex items-center gap-1.5 uppercase tracking-wider cursor-pointer"
                      style={{ backgroundColor: siteForm.primaryColor }}
                    >
                      <Calendar className="h-3.5 w-3.5" />
                      Réserver en Ligne
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>
      )}

        </div> {/* closes flex-1 min-w-0 space-y-6 w-full */}
      </div> {/* closes flex flex-col lg:flex-row gap-6 items-start */}
    </div>
  );
}
