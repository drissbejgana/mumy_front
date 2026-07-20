import React, { useEffect, useState } from "react";
import { AdBanner } from "../types";
import { Megaphone, ExternalLink, Sparkles, Eye, MousePointerClick } from "lucide-react";

interface SimulationAdBannerProps {
  role: 'transporter' | 'client' | 'driver' | 'public';
  banners: AdBanner[];
  onRegisterImpression: (id: string) => void;
  onRegisterClick: (id: string) => void;
}

export default function SimulationAdBanner({
  role,
  banners,
  onRegisterImpression,
  onRegisterClick
}: SimulationAdBannerProps) {
  // Filter active banners matching targetRole = role OR 'all'
  const matchingBanners = banners.filter(b => 
    b.isActive && (b.targetRole === 'all' || b.targetRole === role)
  );

  const [currentIndex, setCurrentIndex] = useState(0);

  // If we change role, reset index
  useEffect(() => {
    setCurrentIndex(0);
  }, [role]);

  const activeBanner = matchingBanners[currentIndex];

  // Register impression when the active banner changes or mounts
  useEffect(() => {
    if (activeBanner) {
      onRegisterImpression(activeBanner.id);
    }
  }, [activeBanner?.id]); // Safely track only the active banner's id

  if (matchingBanners.length === 0) {
    return null; // No active banners for this screen
  }

  const handleBannerClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onRegisterClick(activeBanner.id);
    // Open in new tab
    window.open(activeBanner.linkUrl, '_blank', 'noopener,noreferrer');
  };

  const handleNextBanner = () => {
    setCurrentIndex((prev) => (prev + 1) % matchingBanners.length);
  };

  // MOBILE OPTIMIZATION FOR DRIVER PWA APP
  if (role === 'driver') {
    return (
      <div className="w-full bg-[#EBF5F1]/90 hover:bg-[#EBF5F1] transition border border-[#BBE3D1] rounded-xl p-3 mb-4 shadow-3xs relative overflow-hidden group animate-fade-in text-xs">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-16 h-16 bg-[#008060]/5 rounded-full blur-lg pointer-events-none" />
        
        {/* Main interactive area: click banner to open link */}
        <div className="cursor-pointer" onClick={handleBannerClick}>
          <div className="flex gap-2.5 items-start">
            {/* Image */}
            <div className="relative shrink-0">
              <img 
                src={activeBanner.imageUrl} 
                alt={activeBanner.title} 
                className="w-12 h-12 rounded-md object-cover border border-[#BBE3D1] shadow-3xs"
              />
              <span className="absolute -top-1 -left-1 bg-yellow-400 text-yellow-950 p-0.5 rounded-full shadow-3xs">
                <Sparkles className="h-2 w-2 fill-current" />
              </span>
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0 space-y-0.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="bg-[#008060] text-white px-1.5 py-0.2 rounded text-[8px] font-extrabold uppercase tracking-wider">
                  Sponsorisé
                </span>
                <span className="text-[9px] text-[#008060] font-bold truncate">
                  Régie Mumy
                </span>
              </div>
              <h4 className="font-sans text-[11px] font-bold text-gray-900 leading-tight truncate">
                {activeBanner.title}
              </h4>
              <p className="text-[10px] text-gray-500 leading-tight line-clamp-2">
                {activeBanner.description}
              </p>
            </div>
          </div>
        </div>

        {/* Compact CTA + Next buttons */}
        <div className="mt-2 pt-2 border-t border-[#BBE3D1]/30 flex items-center justify-between gap-2">
          {matchingBanners.length > 1 ? (
            <button
              onClick={handleNextBanner}
              type="button"
              className="rounded bg-white/95 hover:bg-white text-gray-600 border border-gray-200 px-2 py-1 text-[9px] font-bold transition cursor-pointer"
            >
              Suivant ({currentIndex + 1}/{matchingBanners.length})
            </button>
          ) : (
            <div />
          )}

          <a
            href={activeBanner.linkUrl}
            onClick={handleBannerClick}
            className="rounded bg-[#008060] hover:bg-[#006e52] text-white px-2.5 py-1 text-[9px] font-bold transition flex items-center gap-1 hover:scale-102 cursor-pointer"
          >
            Voir l'offre
            <ExternalLink className="h-2.5 w-2.5" />
          </a>
        </div>

        {/* Micro simulator panel */}
        <div className="mt-2 -mx-3 -mb-3 px-3 py-1 bg-[#EBF5F1]/50 rounded-b-xl border-t border-[#BBE3D1]/20 flex justify-between items-center text-[8px] font-mono text-[#008060]">
          <span className="font-sans font-bold uppercase text-[7px] text-[#008060]">Sim Chauffeur</span>
          <div className="flex items-center gap-2">
            <span>{activeBanner.impressions} imp</span>
            <span>•</span>
            <span>{activeBanner.clicks} clics</span>
            <span>•</span>
            <span className="font-bold">{activeBanner.spent.toFixed(2)} DHS</span>
            <span className="bg-[#008060]/10 px-1 py-0.1 rounded text-[7px] font-bold uppercase">
              {activeBanner.optimizationType === 'cpc' ? `+${activeBanner.cpcValue} DHS/clic` : 
               activeBanner.optimizationType === 'cpm' ? `+${(activeBanner.cpmValue/1000).toFixed(3)} DHS/imp` :
               activeBanner.optimizationType === 'weekly' ? 'Forfait Hebdo' : 'Forfait Mensuel'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#EBF5F1]/80 hover:bg-[#EBF5F1] transition border border-[#BBE3D1] rounded-xl p-4 mb-6 shadow-2xs relative overflow-hidden group animate-fade-in">
      {/* Decorative accent lines */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-[#008060]/5 rounded-full blur-xl pointer-events-none" />
      <div className="absolute -bottom-8 -left-8 w-16 h-16 bg-[#008060]/5 rounded-full blur-lg pointer-events-none" />

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        
        {/* Banner Details */}
        <div className="flex items-start gap-3.5 flex-1">
          {/* Cover image */}
          <div className="relative shrink-0">
            <img 
              src={activeBanner.imageUrl} 
              alt={activeBanner.title} 
              className="w-16 h-16 md:w-20 md:h-20 rounded-lg object-cover border border-[#BBE3D1] shadow-2xs group-hover:scale-102 transition duration-300"
            />
            <span className="absolute -top-1.5 -left-1.5 bg-yellow-400 text-yellow-950 p-1 rounded-full shadow-2xs" title="Publicité Certifiée">
              <Sparkles className="h-2.5 w-2.5 fill-current" />
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 bg-[#008060] text-white px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider">
                <Megaphone className="h-2.5 w-2.5" /> Sponsorisé
              </span>
              <span className="text-[10px] text-[#008060] font-bold uppercase tracking-wide">
                Régie Publicitaire Mumy
              </span>
              <span className="text-[10px] text-gray-400">•</span>
              <span className="bg-white/80 border border-[#BBE3D1] text-[#008060] px-1.5 py-0.2 rounded text-[8px] font-mono font-bold uppercase">
                {activeBanner.optimizationType === 'cpc' ? 'Optimisé CPC' :
                 activeBanner.optimizationType === 'cpm' ? 'Optimisé CPM' :
                 activeBanner.optimizationType === 'weekly' ? 'Forfait Hebdo' : 'Forfait Mensuel'}
              </span>
            </div>

            <h4 className="font-sans text-xs md:text-sm font-bold text-gray-900 leading-snug">
              {activeBanner.title}
            </h4>
            
            <p className="text-[11px] md:text-xs text-gray-600 leading-relaxed max-w-2xl">
              {activeBanner.description}
            </p>
          </div>
        </div>

        {/* CTA & Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0 w-full md:w-auto">
          {matchingBanners.length > 1 && (
            <button
              onClick={handleNextBanner}
              type="button"
              className="rounded-lg bg-white/90 hover:bg-white text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-300 px-3 py-2 text-[10px] font-bold transition cursor-pointer text-center"
            >
              Suivant ({currentIndex + 1}/{matchingBanners.length})
            </button>
          )}
          
          <a
            href={activeBanner.linkUrl}
            onClick={handleBannerClick}
            className="rounded-lg bg-[#008060] hover:bg-[#006e52] text-white px-4 py-2 text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5 hover:scale-102 cursor-pointer"
          >
            Découvrir l'offre
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Interactive Simulation / Debug Monitor at the bottom */}
      <div className="mt-3 pt-2 border-t border-[#BBE3D1]/40 flex flex-wrap items-center justify-between gap-2 text-[10px] text-[#008060] font-semibold bg-[#EBF5F1]/30 -mx-4 -mb-4 px-4 py-1.5 rounded-b-xl">
        <div className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-full bg-[#008060] animate-ping" />
          <span>Simulation Active :</span>
          <span className="text-gray-600 font-medium">
            Affiché sur l'espace <strong className="text-[#008060] uppercase">{role === 'public' ? 'suivi public' : role}</strong>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-0.5 text-gray-500 font-mono">
            <Eye className="h-3 w-3" /> {activeBanner.impressions} imp
          </span>
          <span className="flex items-center gap-0.5 text-indigo-600 font-mono">
            <MousePointerClick className="h-3 w-3" /> {activeBanner.clicks} clics
          </span>
          <span className="text-slate-500">
            Frais : {activeBanner.spent.toFixed(2)} DHS / {activeBanner.budget} DHS
          </span>
          <span className="bg-[#008060]/10 text-[#008060] px-2 py-0.5 rounded text-[9px] font-extrabold uppercase">
            {activeBanner.optimizationType === 'cpc' ? `+${activeBanner.cpcValue} DHS par clic` : 
             activeBanner.optimizationType === 'cpm' ? `+${(activeBanner.cpmValue/1000).toFixed(3)} DHS par impression` :
             activeBanner.optimizationType === 'weekly' ? 'Facturation Hebdomadaire' : 'Facturation Mensuelle'}
          </span>
        </div>
      </div>
    </div>
  );
}
