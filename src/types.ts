// Wire-format types this frontend uses to talk to the Mumy backend API. Kept as a local
// file (not a shared package) since backend and frontend now live in separate repos —
// keep this in sync by hand if the backend's response shapes change.

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'transporter' | 'client' | 'driver';
  status: 'pending' | 'verified' | 'suspended';
  companyName?: string;
  phone?: string;
  avatarUrl?: string;
  kycDocUrl?: string;
  kycUploadedAt?: string;
  isFeatured?: boolean;
  ice?: string;
  patente?: string;
  rc?: string;
  ifFiscal?: string;
  cnss?: string;
  kycLicenceUrl?: string;
  kycLicenceStatus?: 'missing' | 'pending' | 'verified' | 'rejected';
  kycRcUrl?: string;
  kycRcStatus?: 'missing' | 'pending' | 'verified' | 'rejected';
  kycInsuranceUrl?: string;
  kycInsuranceStatus?: 'missing' | 'pending' | 'verified' | 'rejected';
  kycPatenteUrl?: string;
  kycPatenteStatus?: 'missing' | 'pending' | 'verified' | 'rejected';
  kycRejectReason?: string;
  errorCount?: number;
  riskErrors?: Array<{ id: string; type: string; date: string; description: string; resolved: boolean }>;
  lastLoginAt?: string;
  googleId?: string;
}

export interface ClientSupplier {
  id: string;
  transporterId?: string;
  name: string;
  type: 'client' | 'supplier';
  ice: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface Vehicle {
  id: string;
  transporterId?: string;
  brand: string;
  model: string;
  plate: string;
  capacity: number;
  status: 'available' | 'maintenance' | 'on_duty';
  year?: number;
  insuranceExpiry?: string;
  technicalControlExpiry?: string;
  fuelType?: 'Gazole' | 'Essence' | 'Hybride' | 'Électrique';
  mileage?: number;
  avgConsumption?: number;
  notes?: string;
  maintenanceLogs?: Array<{
    id: string;
    date: string;
    type: 'oil_change' | 'tires' | 'brakes' | 'engine' | 'other';
    cost: number;
    description: string;
    provider: string;
  }>;
  fuelLogs?: Array<{
    id: string;
    date: string;
    liters: number;
    cost: number;
    mileage: number;
  }>;
}

export interface Driver {
  id: string;
  transporterId?: string;
  linkedUserId?: string;
  name: string;
  phone: string;
  avatarUrl: string;
  rating: number;
  status: 'active' | 'inactive';
  email?: string;
  licenseNumber?: string;
  licenseCategory?: string;
  licenseExpiry?: string;
  cnssNumber?: string;
  hireDate?: string;
  salary?: number;
  notes?: string;
  medicalCheckExpiry?: string;
  licenseCategories?: string[];
  isOnline?: boolean;
  lastSeen?: string;
}

export interface TransportRequest {
  id: string;
  clientId: string;
  clientName: string;
  passengerName: string;
  origin: string;
  destination: string;
  dateTime: string;
  paxCount: number;
  serviceType: 'simple' | 'round_trip' | 'disposal' | 'multistop';
  daysCount?: number;
  isHalfDay?: boolean;
  waypoints?: string[];
  welcomeSign?: string;
  b2bPaymentTerms?: 'on_receipt' | '30_days_eom' | 'end_of_month';
  status: 'pending' | 'accepted' | 'en_route' | 'picked_up' | 'completed' | 'cancelled';
  assignedDriverId?: string;
  assignedVehicleId?: string;
  transporterId?: string;
  driverRating?: number;
  driverComment?: string;
  transporterRating?: number;
  transporterComment?: string;
  ratingCreatedAt?: string;
  ratingIsFlagged?: boolean;
  ratingFlagReason?: string;
  priceDHS?: number;
  notes?: string;
  createdAt: string;
  attachments?: Array<{ name: string; url: string; type: 'manifest' | 'invoice'; date: string }>;
  podSignature?: string;
}

export interface Bid {
  id: string;
  requestId: string;
  transporterId: string;
  transporterName: string;
  priceDHS: number;
  vehicleType: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface EmptyReturn {
  id: string;
  transporterId: string;
  transporterName: string;
  origin: string;
  destination: string;
  dateTime: string;
  basePriceDHS: number;
  vehicleType: string;
  status: 'available' | 'booked';
  createdAt: string;
}

export interface FinancialRecord {
  id: string;
  transporterId: string;
  date: string;
  type: 'revenue' | 'expense';
  amount: number;
  label: string;
  category: string;
}

export interface TeamMember {
  id: string;
  transporterId?: string | null;
  name: string;
  email: string;
  phone?: string;
  role: string;
  permissions: string[];
  status?: 'active' | 'suspended';
  createdAt?: string;
}

export interface ChatMessage {
  id: string;
  threadId?: string;
  senderId: string;
  senderName: string;
  senderRole: 'transporter' | 'client' | 'admin' | 'driver';
  message: string;
  timestamp: string;
}

export interface SentimentAlert {
  id: string;
  chatId: string;
  sentiment: 'negative' | 'neutral' | 'positive';
  message: string;
  timestamp: string;
}

export interface AdBanner {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  linkUrl: string;
  targetRole: 'all' | 'transporter' | 'client' | 'driver' | 'public';
  optimizationType: 'cpm' | 'cpc' | 'weekly' | 'monthly';
  cpcValue: number;
  cpmValue: number;
  weeklyRate?: number;
  monthlyRate?: number;
  durationUnits?: number;
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  isActive: boolean;
  createdAt: string;
}

export interface Excursion {
  id: string;
  transporterId: string;
  transporterName: string;
  title: string;
  description: string;
  duration: string;
  priceDHS: number;
  imageUrl: string;
  location: string;
  maxPax: number;
  highlights: string[];
  includes: string[];
  excludes: string[];
  isActive: boolean;
  youtubeUrl?: string;
  cancellationPolicy?: string;
  departureTime?: string;
  meetingPoint?: string;
  languages?: string[];
}

export interface TransporterWebsite {
  id?: string;
  transporterId: string;
  transporterName: string;
  customDomain?: string;
  dnsStatus: 'not_configured' | 'pending' | 'active';
  aRecord?: string;
  cnameRecord?: string;
  siteTitle: string;
  siteSubtitle: string;
  aboutText: string;
  primaryColor: string;
  contactEmail: string;
  contactPhone: string;
  headerImageUrl: string;
  logoUrl?: string;
  tripadvisorUrl?: string;
}

export interface ExcursionBooking {
  id: string;
  excursionId: string;
  excursionTitle: string;
  transporterId: string;
  transporterName: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  date: string;
  paxCount: number;
  totalPriceDHS: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
}

export interface SupportMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'transporter' | 'client' | 'admin' | 'agent' | 'system';
  message: string;
  createdAt?: string;
}

export interface SupportSession {
  id: string;
  userId: string;
  userName: string;
  userRole: 'transporter' | 'client';
  messages: SupportMessage[];
  needsHuman: boolean;
  status: 'ai' | 'pending_human' | 'chatting_human' | 'resolved';
  updatedAt?: string;
}

// --- Auth ---

export interface LoginRequest {
  email: string;
  password: string;
}

export interface GoogleLoginRequest {
  // The ID token JWT returned by Google Identity Services on the frontend.
  credential: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

// --- Non-CRUD API contracts (gemini/*, support/*, track/*) ---

export interface TranslateRequest {
  text: string;
  targetLanguage: string;
}

export interface TranslateResponse {
  translated: string;
}

export interface GeminiChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface GeminiAssistantRequest {
  messages: GeminiChatMessage[];
  platformState?: {
    requestsCount?: number;
    emptyReturnsCount?: number;
    vehiclesCount?: number;
    driversCount?: number;
    alertsCount?: number;
  };
}

export interface GeminiAssistantResponse {
  reply: string;
  isSimulated?: boolean;
  note?: string;
}

export interface GeminiAuditRequest {
  platformState?: {
    requestsCount?: number;
    bidsCount?: number;
    emptyReturnsCount?: number;
    alertsCount?: number;
  };
}

export interface GeminiAuditResponse {
  report: string;
  isSimulated?: boolean;
  note?: string;
}

export interface GeminiYieldRequest {
  route?: string;
  demandLevel?: string;
}

export interface GeminiYieldResponse {
  advice: string;
  isSimulated?: boolean;
}

// Redacted, unauthenticated view of a mission for the public ?track= page.
export interface PublicTrackingView {
  request: Pick<
    TransportRequest,
    'id' | 'origin' | 'destination' | 'status' | 'dateTime' | 'serviceType' | 'podSignature' | 'passengerName' | 'paxCount' | 'daysCount'
  >;
  driver: Pick<Driver, 'id' | 'name' | 'phone' | 'avatarUrl' | 'rating'> | null;
  vehicle: Pick<Vehicle, 'id' | 'brand' | 'model' | 'plate' | 'fuelType'> | null;
  banners: AdBanner[];
}
