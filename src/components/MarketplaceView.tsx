import React, { useState } from "react";
import { Search, Tag, EyeOff, ShieldCheck, CreditCard, ChevronRight, MapPin, Calendar, Clock, Sparkles, User, Users, CheckCircle, Info, X, Truck } from "lucide-react";
import { TransportRequest, EmptyReturn, User as UserType } from "../types";

interface MarketplaceViewProps {
  users?: UserType[];
  requests: TransportRequest[];
  emptyReturns: EmptyReturn[];
  onBookEmptyReturn: (id: string) => void;
}

export default function MarketplaceView({ users, requests, emptyReturns, onBookEmptyReturn }: MarketplaceViewProps) {
  const [activeTab, setActiveTab] = useState<'empty' | 'requests'>('empty');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItemForBooking, setSelectedItemForBooking] = useState<EmptyReturn | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState({
    cardName: '',
    cardNumber: '4242 4242 4242 4242',
    expiry: '12/28',
    cvc: '123'
  });

  const handleBookingConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForBooking) return;
    onBookEmptyReturn(selectedItemForBooking.id);
    setBookingSuccess(true);
    setTimeout(() => {
      setBookingSuccess(false);
      setSelectedItemForBooking(null);
    }, 2500);
  };

  const filteredEmptyReturns = emptyReturns.filter(item => 
    item.origin.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.destination.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredRequests = requests.filter(item => 
    item.origin.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.passengerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="rounded-xl bg-white p-6 border border-[#E1E3E5] shadow-xs">
      {/* Upper Promo Banner */}
      <div className="mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 rounded-xl bg-[#EBF5F1] p-4 border border-[#BBE3D1]">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-[#008060] p-2 text-white shrink-0">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-sans text-sm font-bold text-[#1A1A1A]">
              Optimisation de l'axe touristique : -30% Réduction nette
            </h3>
            <p className="text-xs text-[#1A1A1A] mt-1 leading-relaxed">
              Profitez des retours à vide des transporteurs certifiés. Prix final incluant 20% de commission de gestion Mumy, soit une économie totale de 30% par rapport aux tarifs standards de gré à gré.
            </p>
          </div>
        </div>
        <div className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-[#008060] border border-[#BBE3D1] shrink-0">
          FORMULE TRANS-YIELD ACTIVÉE
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="mb-6 flex items-center justify-between border-b border-[#E1E3E5] pb-1">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('empty')}
            className={`pb-3 text-sm font-semibold transition relative ${
              activeTab === 'empty' 
                ? "text-[#008060] border-b-2 border-[#008060]" 
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Opportunités Retours à Vide ({filteredEmptyReturns.length})
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`pb-3 text-sm font-semibold transition relative ${
              activeTab === 'requests' 
                ? "text-[#008060] border-b-2 border-[#008060]" 
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Demandes de Transport Actives ({filteredRequests.length})
          </button>
        </div>

        {/* Search input */}
        <div className="relative max-w-xs hidden sm:block">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher une ville..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-gray-200 py-1.5 pl-9 pr-4 text-xs focus:border-[#008060] focus:ring-1 focus:ring-[#008060] focus:outline-none"
          />
        </div>
      </div>

      {/* SEARCH ON MOBILE */}
      <div className="relative mb-4 block sm:hidden">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher une ville..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-md border border-gray-200 py-1.5 pl-9 pr-4 text-xs focus:border-[#008060] focus:ring-1 focus:ring-[#008060] focus:outline-none"
        />
      </div>

      {/* Marketplace Contents */}
      {activeTab === 'empty' ? (
        <div className="grid gap-6 md:grid-cols-2">
          {filteredEmptyReturns.length === 0 ? (
            <div className="col-span-full py-12 text-center">
              <Tag className="mx-auto h-8 w-8 text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">Aucun retour à vide disponible correspondant à vos critères.</p>
            </div>
          ) : (
            filteredEmptyReturns.map((item) => {
              // Formula check: Base reduced is 1000 DHS
              // Commission is 20% (200 DHS)
              // Final displayed is 1200 DHS (saves 30% on standard price 1700 DHS)
              const commission = item.basePriceDHS * 0.20;
              const finalPriceDHS = item.basePriceDHS + commission;
              const standardPriceDHS = Math.round(item.basePriceDHS * 1.7);
              const savingsDHS = standardPriceDHS - finalPriceDHS;
              const discountPercent = Math.round((savingsDHS / standardPriceDHS) * 100);

              const isBooked = item.status === 'booked';
              const transporterUser = users?.find(u => u.id === item.transporterId || u.companyName === item.transporterName || u.name === item.transporterName);
              const isFeatured = transporterUser?.isFeatured;

              return (
                <div 
                  key={item.id} 
                  className={`group relative rounded-lg p-5 border transition duration-200 ${
                    isBooked 
                      ? "bg-[#F6F6F7] border-gray-200 opacity-75" 
                      : isFeatured
                        ? "bg-amber-50/15 border-amber-400 shadow-sm ring-1 ring-amber-400/20"
                        : "bg-[#F6F6F7] border-transparent hover:border-gray-300"
                  }`}
                >
                  {/* Anti Churn Badge */}
                  {isFeatured ? (
                    <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-extrabold text-amber-900 border border-amber-300 shadow-3xs">
                      <Sparkles className="h-3 w-3 text-amber-500 fill-amber-500 shrink-0" />
                      <span>SÉLECTION HANDPICKED</span>
                    </div>
                  ) : (
                    <div className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-slate-900/10 px-2.5 py-1 text-[10px] font-bold text-slate-800">
                      <EyeOff className="h-3 w-3" />
                      <span>[ PRESTATAIRE CERTIFIÉ MUMY ]</span>
                    </div>
                  )}

                  <div className="mb-4">
                    <span className="inline-block rounded bg-teal-100 text-teal-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider mb-2">
                      {item.vehicleType}
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-semibold text-gray-900 text-base">{item.origin}</span>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                      <span className="font-semibold text-gray-900 text-base">{item.destination}</span>
                    </div>
                  </div>

                  {/* Route details */}
                  <div className="mb-4 grid grid-cols-2 gap-2 border-t border-b border-gray-200 py-3 text-xs text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-gray-400" />
                      <span>{new Date(item.dateTime).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-gray-400" />
                      <span>{new Date(item.dateTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  {/* Pricing Engine Calculation Card */}
                  <div className="mb-4 rounded-md bg-white p-3 border border-gray-150">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[11px] text-gray-500">Prix Standard Marché</span>
                      <span className="text-xs text-gray-400 line-through font-medium">{standardPriceDHS} DHS</span>
                    </div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[11px] text-gray-500 flex items-center gap-1">
                        Base Transporteur Réduit
                        <span title="Prix net proposé par le transporteur pour optimiser son trajet de retour">
                          <Info className="h-3 w-3 text-gray-400" />
                        </span>
                      </span>
                      <span className="text-xs text-gray-600 font-medium">{item.basePriceDHS} DHS</span>
                    </div>
                    <div className="flex justify-between items-center mb-2 pb-1.5 border-b border-gray-100">
                      <span className="text-[11px] text-gray-500">Commission Mumy (+20%)</span>
                      <span className="text-xs text-gray-600 font-medium font-mono">+{commission} DHS</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#008060] tracking-wider">Prix Final Riad</span>
                        <p className="text-lg font-bold text-gray-950 leading-none">{finalPriceDHS} DHS</p>
                      </div>
                      <div className="text-right">
                        <span className="inline-block rounded bg-[#008060]/10 px-2 py-0.5 text-xs font-bold text-[#008060]">
                          Économisez {savingsDHS} DHS (-{discountPercent}%)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action button */}
                  {isBooked ? (
                    <button disabled className="w-full rounded-md bg-gray-200 py-2.5 text-xs font-bold text-gray-500 cursor-not-allowed">
                      Réservé & Bloqué
                    </button>
                  ) : (
                    <button 
                      onClick={() => setSelectedItemForBooking(item)}
                      className="w-full rounded-md bg-[#008060] py-2.5 text-xs font-bold text-white transition hover:bg-[#006e52] shadow-sm"
                    >
                      Réserver & Valider le retour
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.length === 0 ? (
            <div className="py-12 text-center bg-[#F6F6F7] rounded-lg">
              <Truck className="mx-auto h-8 w-8 text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">Aucune demande active n'est enregistrée pour le moment.</p>
            </div>
          ) : (
            filteredRequests.map((req) => (
              <div 
                key={req.id} 
                className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 rounded-xl bg-white p-5 border border-[#E1E3E5] shadow-xs hover:border-[#008060] transition"
              >
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="rounded bg-gray-200 px-2.5 py-0.5 text-[10px] font-bold text-gray-700 uppercase">
                      ID: {req.id}
                    </span>
                    <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                      {req.serviceType === 'disposal' ? `Mise à disposition (${req.daysCount} jours)` : req.serviceType === 'round_trip' ? 'Aller-Retour' : 'Trajet Simple'}
                    </span>
                    <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                      req.status === 'completed' ? 'bg-green-100 text-green-800' :
                      req.status === 'en_route' ? 'bg-amber-100 text-amber-800' :
                      req.status === 'pending' ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      Statut: {req.status === 'pending' ? 'En attente d\'offres' : req.status === 'accepted' ? 'Assigné' : req.status === 'en_route' ? 'En Route' : req.status === 'picked_up' ? 'Client Récupéré' : req.status === 'completed' ? 'Terminé' : req.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-1">
                    <MapPin className="h-4 w-4 text-[#008060] shrink-0" />
                    <span className="text-sm font-semibold text-gray-900">{req.origin}</span>
                    <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
                    <span className="text-sm font-semibold text-gray-900">{req.destination}</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-gray-500 pt-1">
                    <div className="flex items-center gap-1">
                      <User className="h-3.5 w-3.5" />
                      <span>Passager: <strong className="text-gray-800">{req.passengerName}</strong></span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      <span>{req.paxCount} Pax</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{new Date(req.dateTime).toLocaleDateString('fr-FR')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{new Date(req.dateTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto shrink-0 border-t md:border-t-0 pt-3 md:pt-0">
                  <div className="text-left md:text-right mr-4">
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider">Créé par</span>
                    <p className="text-xs font-bold text-gray-800">{req.clientName}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* SECURE WHITE-LABEL PAYMENT MODAL (ANTI-CHURN PROCESS) */}
      {selectedItemForBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-md border border-[#E1E3E5]">
            <button 
              onClick={() => setSelectedItemForBooking(null)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>

            {bookingSuccess ? (
              <div className="py-8 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-[#008060]">
                  <CheckCircle className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-bold text-[#1A1A1A]">Paiement Sécurisé Réussi !</h3>
                <p className="mt-2 text-xs text-gray-600">
                  La course de retour à vide de <span className="font-semibold">{selectedItemForBooking.origin} → {selectedItemForBooking.destination}</span> est maintenant validée et bloquée à votre nom.
                </p>
                <p className="mt-1 text-[11px] text-[#008060] font-mono font-bold">
                  Facture Mumy Proforma générée : M-{(Math.random() * 10000).toFixed(0)}
                </p>
              </div>
            ) : (
              <form onSubmit={handleBookingConfirm} className="space-y-4">
                <div className="flex items-center gap-2 text-[#008060] mb-2">
                  <ShieldCheck className="h-5 w-5" />
                  <h3 className="font-sans text-base font-bold">Réservation Sécurisée Mumy App</h3>
                </div>

                <div className="rounded-lg bg-[#F6F6F7] p-3 text-xs text-gray-700 border border-[#E1E3E5]">
                  <p className="font-bold text-[#1A1A1A]">Résumé de l'opportunité (Anonyme)</p>
                  <p className="mt-1">Trajet : {selectedItemForBooking.origin} → {selectedItemForBooking.destination}</p>
                  <p>Type : {selectedItemForBooking.vehicleType}</p>
                  <p>Départ : {new Date(selectedItemForBooking.dateTime).toLocaleString('fr-FR')}</p>
                  <div className="mt-2 border-t border-[#E1E3E5] pt-2 flex justify-between font-bold text-gray-900">
                    <span>Montant total à payer :</span>
                    <span className="text-[#008060] font-mono">{(selectedItemForBooking.basePriceDHS * 1.20).toFixed(0)} DHS</span>
                  </div>
                  <p className="text-[10px] text-[#6D7175] mt-1">
                    * Comprend 100% du prix réduit transporteur + 20% de frais plateformes Mumy.
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#6D7175] uppercase">Mode de Paiement</label>
                    <div className="mt-1 flex items-center gap-2 rounded-lg border border-[#E1E3E5] bg-white p-2.5 text-xs">
                      <CreditCard className="h-4 w-4 text-[#008060]" />
                      <span className="font-semibold text-gray-700">Carte Bancaire Professionnelle (CMI)</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#6D7175] uppercase">Nom du Riad / Titulaire de la Carte</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Riad Royal Marrakech"
                      value={paymentDetails.cardName}
                      onChange={(e) => setPaymentDetails({...paymentDetails, cardName: e.target.value})}
                      className="mt-1 w-full rounded-lg border border-[#E1E3E5] bg-[#F6F6F7] px-3 py-2.5 text-xs text-[#1A1A1A] focus:border-[#008060] focus:ring-1 focus:ring-[#008060] focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <label className="block text-[11px] font-bold text-[#6D7175] uppercase">Numéro de Carte</label>
                      <input
                        type="text"
                        required
                        value={paymentDetails.cardNumber}
                        onChange={(e) => setPaymentDetails({...paymentDetails, cardNumber: e.target.value})}
                        className="mt-1 w-full rounded-lg border border-[#E1E3E5] bg-[#F6F6F7] px-3 py-2.5 text-xs font-mono text-[#1A1A1A] focus:border-[#008060] focus:ring-1 focus:ring-[#008060] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#6D7175] uppercase">CVV</label>
                      <input
                        type="text"
                        required
                        maxLength={3}
                        value={paymentDetails.cvc}
                        onChange={(e) => setPaymentDetails({...paymentDetails, cvc: e.target.value})}
                        className="mt-1 w-full rounded-lg border border-[#E1E3E5] bg-[#F6F6F7] px-3 py-2.5 text-xs font-mono text-[#1A1A1A] focus:border-[#008060] focus:ring-1 focus:ring-[#008060] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full rounded-lg bg-[#008060] py-3 text-xs font-bold text-white transition hover:bg-[#006e52] shadow-xs"
                  >
                    Confirmer le Paiement & Sécuriser la course
                  </button>
                  <p className="text-[10px] text-center text-gray-500 mt-2">
                    🔒 Flux crypté SSL. Aucun contact direct hors-plateforme n'est toléré pour garantir la couverture d'assurance Mumy.
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
