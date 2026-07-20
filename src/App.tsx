import React from "react";
import { TransportRequest, TeamMember, Excursion, TransporterWebsite, ExcursionBooking, AdBanner } from "./types";
import Header from "./components/Header";
import MarketplaceView from "./components/MarketplaceView";
import AdminHub from "./components/AdminHub";
import TransportHub from "./components/TransportHub";
import ClientHub from "./components/ClientHub";
import DriverHub from "./components/DriverHub";
import SupportChatFloating from "./components/SupportChatFloating";
import PublicMissionTracker from "./components/PublicMissionTracker";
import LoginScreen from "./components/LoginScreen";
import { Cpu, Truck, UserCheck, Smartphone, ShoppingBag, Loader2 } from "lucide-react";
import { useAuth } from "./lib/AuthContext";
import { useUsers, useAddUser, useUpdateUser, useVerifyUser, useBanUser } from "./hooks/useUsers";
import { useVehicles, useAddVehicle, useUpdateVehicle, useDeleteVehicle } from "./hooks/useVehicles";
import { useDrivers, useAddDriver, useUpdateDriver, useDeleteDriver } from "./hooks/useDrivers";
import {
  useRequests, useCreateRequest, useAssignDriver, useUpdateRequestStatus, useRateRequest, useFlagReview,
} from "./hooks/useRequests";
import { useBids, useSubmitBid, useAcceptBid } from "./hooks/useBids";
import { useEmptyReturns, usePublishEmptyReturn, useBookEmptyReturn } from "./hooks/useEmptyReturns";
import { useFinances } from "./hooks/useFinances";
import { useCollabChats, useSendCollabMessage } from "./hooks/useChats";
import { useSentimentAlerts } from "./hooks/useSentimentAlerts";
import { useExcursions, useAddExcursion, useUpdateExcursion, useDeleteExcursion } from "./hooks/useExcursions";
import { useWebsites, useUpdateWebsite } from "./hooks/useWebsites";
import { useExcursionBookings, useBookExcursion } from "./hooks/useExcursionBookings";
import {
  useBanners, useAddBanner, useUpdateBanner, useDeleteBanner, useRegisterImpression, useRegisterClick,
} from "./hooks/useBanners";
import { useTeamMembers, useAddTeamMember, useDeleteTeamMember } from "./hooks/useTeamMembers";

export default function App() {
  // Public tracking URL search query detection — reached before any auth check.
  const [trackingRequestId, setTrackingRequestId] = React.useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("track");
  });

  if (trackingRequestId) {
    return (
      <PublicMissionTracker
        requestId={trackingRequestId}
        onClose={() => {
          setTrackingRequestId(null);
          window.history.pushState({}, '', window.location.pathname);
        }}
      />
    );
  }

  const { user, isLoading, logout, updateUser } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F6F6F7]">
        <Loader2 className="h-6 w-6 animate-spin text-[#008060]" />
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return <AuthenticatedApp currentUser={user} onLogout={logout} onCurrentUserUpdated={updateUser} />;
}

function AuthenticatedApp({
  currentUser,
  onLogout,
  onCurrentUserUpdated,
}: {
  currentUser: import("./types").User;
  onLogout: () => void;
  onCurrentUserUpdated: (u: import("./types").User) => void;
}) {
  const currentRole = currentUser.role;
  const [showGlobalMarketplace, setShowGlobalMarketplace] = React.useState(false);

  // Data — fetched via React Query, scoped server-side per the caller's role.
  const { data: users = [] } = useUsers();
  const { data: vehicles = [] } = useVehicles(currentRole === 'transporter' || currentRole === 'admin');
  const { data: drivers = [] } = useDrivers(currentRole === 'transporter' || currentRole === 'admin');
  const { data: requests = [] } = useRequests();
  const { data: bids = [] } = useBids();
  const { data: emptyReturns = [] } = useEmptyReturns();
  const { data: finances = [] } = useFinances(currentRole === 'transporter' || currentRole === 'admin');
  const { data: collabChats = [] } = useCollabChats();
  const { data: sentimentAlerts = [] } = useSentimentAlerts();
  const { data: excursions = [] } = useExcursions();
  const { data: websites = [] } = useWebsites();
  const { data: excursionBookings = [] } = useExcursionBookings(currentRole === 'transporter' || currentRole === 'admin');
  const { data: banners = [] } = useBanners();
  const { data: teamMembers = [] } = useTeamMembers(currentRole === 'transporter' || currentRole === 'admin');

  // Mutations
  const addUserMutation = useAddUser();
  const updateUserMutation = useUpdateUser();
  const verifyUserMutation = useVerifyUser();
  const banUserMutation = useBanUser();

  const addVehicleMutation = useAddVehicle();
  const updateVehicleMutation = useUpdateVehicle();
  const deleteVehicleMutation = useDeleteVehicle();

  const addDriverMutation = useAddDriver();
  const updateDriverMutation = useUpdateDriver();
  const deleteDriverMutation = useDeleteDriver();

  const createRequestMutation = useCreateRequest();
  const assignDriverMutation = useAssignDriver();
  const updateRequestStatusMutation = useUpdateRequestStatus();
  const rateRequestMutation = useRateRequest();
  const flagReviewMutation = useFlagReview();

  const submitBidMutation = useSubmitBid();
  const acceptBidMutation = useAcceptBid();

  const publishEmptyReturnMutation = usePublishEmptyReturn();
  const bookEmptyReturnMutation = useBookEmptyReturn();

  const sendCollabMessageMutation = useSendCollabMessage();

  const addExcursionMutation = useAddExcursion();
  const updateExcursionMutation = useUpdateExcursion();
  const deleteExcursionMutation = useDeleteExcursion();

  const updateWebsiteMutation = useUpdateWebsite();
  const bookExcursionMutation = useBookExcursion();

  const addBannerMutation = useAddBanner();
  const updateBannerMutation = useUpdateBanner();
  const deleteBannerMutation = useDeleteBanner();
  const registerImpressionMutation = useRegisterImpression();
  const registerClickMutation = useRegisterClick();

  const addTeamMemberMutation = useAddTeamMember();
  const deleteTeamMemberMutation = useDeleteTeamMember();

  // --- Handlers (same names/signatures the Hub components already expect) ---

  const handleVerifyUser = (id: string) => verifyUserMutation.mutate(id);
  const handleBanUser = (id: string) => banUserMutation.mutate(id);
  const handleAddUser = (newUser: Omit<import("./types").User, 'id'>) => addUserMutation.mutate(newUser);
  const handleUpdateUser = (id: string, updated: Partial<import("./types").User>) =>
    updateUserMutation.mutate({ id, updated });

  // Admin's "add user" flow also submits a driver-shaped payload for role=driver, but a
  // Driver record is an operational fleet asset owned by a transporter — only transporters
  // may create one (see backend requireRole on POST /api/drivers). When this fires from the
  // admin panel we still create the login account (handleAddUser above) but skip the
  // fleet record; the transporter adds the operational Driver from their own Transport Hub.
  const handleAddDriver = (driver: import("./types").Driver) => {
    if (currentUser.role !== 'transporter') return;
    const { id, transporterId, linkedUserId, ...rest } = driver;
    addDriverMutation.mutate(rest);
  };

  const handleUpdateVehicle = (id: string, updated: Partial<import("./types").Vehicle>) =>
    updateVehicleMutation.mutate({ id, updated });
  const handleDeleteVehicle = (id: string) => deleteVehicleMutation.mutate(id);
  const handleAddVehicle = (v: Omit<import("./types").Vehicle, 'id'>) => addVehicleMutation.mutate(v);

  const handleUpdateDriver = (id: string, updated: Partial<import("./types").Driver>) =>
    updateDriverMutation.mutate({ id, updated });
  const handleDeleteDriver = (id: string) => deleteDriverMutation.mutate(id);

  const handleAssignDriver = (requestId: string, driverId: string) =>
    assignDriverMutation.mutate({ requestId, driverId });

  const handleSubmitBid = (requestId: string, priceDHS: number, vehicleType: string) =>
    submitBidMutation.mutate({ requestId, priceDHS, vehicleType });

  const handlePublishEmptyReturn = (
    ret: Omit<import("./types").EmptyReturn, 'id' | 'transporterId' | 'transporterName' | 'status' | 'createdAt'>
  ) => publishEmptyReturnMutation.mutate(ret);

  const handleSendCollabMessage = (message: string) => sendCollabMessageMutation.mutate(message);

  const handleBookEmptyReturn = (id: string) => bookEmptyReturnMutation.mutate(id);

  const handleCreateRequest = (
    req: Omit<TransportRequest, 'id' | 'clientId' | 'clientName' | 'status' | 'createdAt'>
  ) => createRequestMutation.mutate(req);

  const handleAcceptBid = (bidId: string, requestId: string) => acceptBidMutation.mutate({ bidId, requestId });

  const handleRateDriver = (
    requestId: string,
    driverRating: number,
    driverComment: string,
    transporterRating: number,
    transporterComment: string
  ) => rateRequestMutation.mutate({ requestId, driverRating, driverComment, transporterRating, transporterComment });

  const handleFlagReview = (requestId: string, reason: string) => flagReviewMutation.mutate({ requestId, reason });

  const handleUpdateStatus = (requestId: string, status: TransportRequest['status']) =>
    updateRequestStatusMutation.mutate({ requestId, status });

  const handleAddExcursion = (exc: Omit<Excursion, 'id'>) => addExcursionMutation.mutate(exc);
  const handleUpdateExcursion = (id: string, updated: Partial<Excursion>) =>
    updateExcursionMutation.mutate({ id, updated });
  const handleDeleteExcursion = (id: string) => deleteExcursionMutation.mutate(id);

  const handleUpdateWebsite = (transporterId: string, updated: Partial<TransporterWebsite>) =>
    updateWebsiteMutation.mutate({ transporterId, updated });

  const handleBookExcursion = (booking: Omit<ExcursionBooking, 'id' | 'status' | 'createdAt'>) =>
    bookExcursionMutation.mutate(booking);

  const handleAddBanner = (
    banner: Omit<AdBanner, 'id' | 'spent' | 'impressions' | 'clicks' | 'createdAt'>
  ) => addBannerMutation.mutate(banner);
  const handleUpdateBanner = (id: string, updated: Partial<AdBanner>) => updateBannerMutation.mutate({ id, updated });
  const handleDeleteBanner = (id: string) => deleteBannerMutation.mutate(id);
  const handleRegisterImpression = (id: string) => registerImpressionMutation.mutate(id);
  const handleRegisterClick = (id: string) => registerClickMutation.mutate(id);

  const handleAddTeamMember = (member: Omit<TeamMember, 'id'>) => addTeamMemberMutation.mutate(member);
  const handleDeleteTeamMember = (id: string) => deleteTeamMemberMutation.mutate(id);

  // Redact free-text contact info accidentally embedded in excursion-booking-derived leads
  // before it reaches the transporter/driver UI (same masking the original app applied).
  const redactedRequests = requests.map(r => {
    if (r.notes && r.notes.includes("Excursion Viator")) {
      return { ...r, notes: r.notes.replace(/Tél: [^.]+\. Email: [^.]+/, "Tél: [Donnée Protégée]. Email: [Donnée Protégée]") };
    }
    return r;
  });

  // Platform State Summary object for Gemini Prompt ingestion
  const platformState = {
    requestsCount: requests.length,
    emptyReturnsCount: emptyReturns.length,
    vehiclesCount: vehicles.length,
    driversCount: drivers.length,
    bidsCount: bids.length,
    alertsCount: sentimentAlerts.length
  };

  return (
    <div className="min-h-screen bg-[#F6F6F7] text-[#1A1A1A] flex flex-col font-sans">
      <Header currentRole={currentRole} currentUser={currentUser} onLogout={onLogout} />

      <div className="bg-white border-b border-[#E1E3E5] py-3 px-4 md:px-8">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {currentRole === 'admin' && <Cpu className="h-4.5 w-4.5 text-[#008060]" />}
            {currentRole === 'transporter' && <Truck className="h-4.5 w-4.5 text-[#008060]" />}
            {currentRole === 'client' && <UserCheck className="h-4.5 w-4.5 text-[#008060]" />}
            {currentRole === 'driver' && <Smartphone className="h-4.5 w-4.5 text-[#008060]" />}
            <span className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider">
              {currentRole === 'admin' && "Espace de Pilotage Administrateur"}
              {currentRole === 'transporter' && "ERP Transporteur & Yield Management"}
              {currentRole === 'client' && "Portail Réservation Riad / Hôtel"}
              {currentRole === 'driver' && "Application Chauffeur embarquée"}
            </span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowGlobalMarketplace(false)}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition border ${
                !showGlobalMarketplace
                  ? "bg-[#1A1A1A] text-white border-[#1A1A1A]"
                  : "bg-[#F6F6F7] text-[#6D7175] border-[#E1E3E5] hover:text-[#1A1A1A] hover:bg-[#EDEEEF]"
              }`}
            >
              Tableau de Bord
            </button>
            <button
              onClick={() => setShowGlobalMarketplace(true)}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition flex items-center gap-1.5 border ${
                showGlobalMarketplace
                  ? "bg-[#008060] text-white border-[#008060]"
                  : "bg-[#F6F6F7] text-[#6D7175] border-[#E1E3E5] hover:text-[#1A1A1A] hover:bg-[#EDEEEF]"
              }`}
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              Marketplace Centrale
            </button>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8">
        {showGlobalMarketplace ? (
          <MarketplaceView
            users={users}
            requests={requests}
            emptyReturns={emptyReturns}
            onBookEmptyReturn={handleBookEmptyReturn}
          />
        ) : (
          <div>
            {currentRole === 'admin' && (
              <AdminHub
                users={users}
                teamMembers={teamMembers}
                sentimentAlerts={sentimentAlerts}
                onVerifyUser={handleVerifyUser}
                onBanUser={handleBanUser}
                onAddTeamMember={handleAddTeamMember}
                onDeleteTeamMember={handleDeleteTeamMember}
                onAddUser={handleAddUser}
                onAddDriver={handleAddDriver}
                onUpdateUser={handleUpdateUser}
                platformState={platformState}
                banners={banners}
                onAddBanner={handleAddBanner}
                onUpdateBanner={handleUpdateBanner}
                onDeleteBanner={handleDeleteBanner}
                excursions={excursions}
                excursionBookings={excursionBookings}
              />
            )}

            {currentRole === 'transporter' && (
              <TransportHub
                vehicles={vehicles}
                drivers={drivers}
                requests={redactedRequests}
                bids={bids}
                emptyReturns={emptyReturns}
                finances={finances}
                collabChats={collabChats}
                currentUser={currentUser}
                onUpdateCurrentUser={(updated) =>
                  updateUserMutation.mutate(
                    { id: currentUser.id, updated },
                    { onSuccess: (fresh) => onCurrentUserUpdated(fresh) }
                  )
                }
                onAddVehicle={handleAddVehicle}
                onUpdateVehicle={handleUpdateVehicle}
                onDeleteVehicle={handleDeleteVehicle}
                onAddDriver={handleAddDriver}
                onUpdateDriver={handleUpdateDriver}
                onDeleteDriver={handleDeleteDriver}
                onAssignDriver={handleAssignDriver}
                onUpdateRequestStatus={handleUpdateStatus}
                onSubmitBid={handleSubmitBid}
                onPublishEmptyReturn={handlePublishEmptyReturn}
                onSendCollabMessage={handleSendCollabMessage}
                banners={banners}
                onRegisterImpression={handleRegisterImpression}
                onRegisterClick={handleRegisterClick}
                excursions={excursions}
                websites={websites}
                excursionBookings={excursionBookings.map(b => ({
                  ...b,
                  clientPhone: "[Donnée Protégée - RGPD]",
                  clientEmail: "[Donnée Protégée - RGPD]"
                }))}
                onAddExcursion={handleAddExcursion}
                onUpdateExcursion={handleUpdateExcursion}
                onDeleteExcursion={handleDeleteExcursion}
                onUpdateWebsite={handleUpdateWebsite}
                onBookExcursion={handleBookExcursion}
                onFlagReview={handleFlagReview}
              />
            )}

            {currentRole === 'client' && (
              <ClientHub
                users={users}
                requests={requests}
                bids={bids}
                emptyReturns={emptyReturns}
                onCreateRequest={handleCreateRequest}
                onAcceptBid={handleAcceptBid}
                onRateDriver={handleRateDriver}
                banners={banners}
                onRegisterImpression={handleRegisterImpression}
                onRegisterClick={handleRegisterClick}
                excursions={excursions}
                websites={websites}
                onBookExcursion={handleBookExcursion}
                excursionBookings={[]}
                emptyReturnMarketplace={
                  <MarketplaceView
                    users={users}
                    requests={requests}
                    emptyReturns={emptyReturns}
                    onBookEmptyReturn={handleBookEmptyReturn}
                  />
                }
              />
            )}

            {currentRole === 'driver' && (
              <DriverHub
                requests={redactedRequests}
                drivers={[]}
                onUpdateStatus={handleUpdateStatus}
                banners={banners}
                onRegisterImpression={handleRegisterImpression}
                onRegisterClick={handleRegisterClick}
              />
            )}
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-gray-150 py-4 px-4 text-center text-xs text-gray-400 shrink-0">
        <p>© 2026 Mumy App — Plateforme de Transport Touristique B2B. Tous droits réservés.</p>
      </footer>

      {(currentRole === 'transporter' || currentRole === 'client') && (
        <SupportChatFloating currentUser={currentUser} />
      )}
    </div>
  );
}
