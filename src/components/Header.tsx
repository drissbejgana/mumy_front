import React from "react";
import { ShieldCheck, Truck, UserCheck, Smartphone, Cpu, Menu, LogOut, ChevronDown } from "lucide-react";
import { User } from "../types";
import { useI18n, LANGUAGES } from "../lib/LanguageContext";

interface HeaderProps {
  currentRole: 'admin' | 'transporter' | 'client' | 'driver';
  currentUser: User;
  onLogout: () => void;
}

export default function Header({ currentRole, currentUser, onLogout }: HeaderProps) {
  const { language, setLanguage } = useI18n();
  const activeLang = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];

  const roles = [
    { id: 'admin', label: 'Admin', icon: Cpu, desc: 'Modération & IA' },
    { id: 'transporter', label: 'Transporteur', icon: Truck, desc: 'ERP & Yield' },
    { id: 'client', label: 'Client Pro', icon: UserCheck, desc: 'Hôtels & Riads' },
    { id: 'driver', label: 'Chauffeur', icon: Smartphone, desc: 'Vue Mobile PWA' }
  ] as const;

  const activeRoleInfo = roles.find(r => r.id === currentRole);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#E1E3E5] bg-white px-4 py-3 md:px-8 shrink-0">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        {/* Logo and Brand */}
        <div className="flex items-center gap-6">
          <div className="flex items-center">
            <img 
              src="https://www.mumy.app/logo.png" 
              alt="Mumy" 
              referrerPolicy="no-referrer"
              className="h-10 w-auto object-contain"
              onError={(e) => {
                // Fallback in case of network blocking or missing asset
                e.currentTarget.style.display = 'none';
                const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = 'block';
              }}
            />
            <span style={{ display: 'none' }} className="text-xl font-extrabold tracking-tight font-sans text-[#008060]">
              Mumy
            </span>
          </div>

          {/* Current role badge (read-only: role comes from the logged-in account) */}
          <div className="hidden md:flex items-center gap-1.5 bg-[#F6F6F7] px-3 py-1.5 rounded-lg border border-[#E1E3E5]">
            {activeRoleInfo && (
              <>
                <activeRoleInfo.icon className="h-3.5 w-3.5 text-[#008060]" />
                <span className="text-xs font-semibold text-[#1A1A1A]">{activeRoleInfo.label}</span>
              </>
            )}
          </div>
        </div>

        {/* Right Actions: User Profile & Logout */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 rounded-lg border border-[#E1E3E5] bg-[#F6F6F7] px-3 py-1.5 text-xs font-semibold text-[#1A1A1A] md:hidden">
            {activeRoleInfo && (
              <>
                <activeRoleInfo.icon className="h-3.5 w-3.5 text-[#008060]" />
                <span>{activeRoleInfo.label}</span>
              </>
            )}
          </div>

          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#F1F2F3] rounded-full border border-[#E1E3E5]/50">
            <div className="w-2 h-2 bg-[#008060] rounded-full animate-pulse"></div>
            {/* <span className="text-[11px] font-semibold text-gray-700">Solde : 42 500 DHS</span> */}
          </div>

          {/* Language Selector Dropdown */}
          <div className="relative group">
            <button className="flex items-center gap-1.5 rounded-lg border border-[#E1E3E5] bg-[#F6F6F7] px-2.5 py-1.5 text-xs font-semibold text-[#1A1A1A] transition hover:bg-gray-150 cursor-pointer">
              <span className="text-sm leading-none">{activeLang.flag}</span>
              <span className="hidden sm:inline uppercase text-[9px] tracking-wider text-gray-500 font-bold">{activeLang.code}</span>
              <ChevronDown className="h-3 w-3 text-gray-500" />
            </button>
            
            <div className="absolute right-0 mt-1 w-36 origin-top-right rounded-lg border border-[#E1E3E5] bg-white p-1 shadow-md opacity-0 pointer-events-none group-focus-within:opacity-100 group-focus-within:pointer-events-auto group-hover:opacity-100 group-hover:pointer-events-auto transition duration-150 z-50">
              {LANGUAGES.map((lang) => {
                const isSelected = lang.code === language;
                return (
                  <button
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    className={`flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs transition cursor-pointer ${
                      isSelected
                        ? "bg-[#008060]/10 text-[#008060] font-semibold"
                        : "text-[#1A1A1A] hover:bg-gray-50"
                    }`}
                  >
                    <span className="text-sm leading-none">{lang.flag}</span>
                    <span className="font-semibold text-gray-700 text-[11px]">{lang.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-2 border-l border-[#E1E3E5] pl-4">
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.name}
              className="h-8 w-8 rounded-full border border-[#E1E3E5] object-cover"
            />
            <div className="hidden text-left md:block">
              <div className="text-xs font-semibold text-[#1A1A1A] max-w-[120px] truncate">{currentUser.name}</div>
              <div className="text-[10px] text-[#008060] font-semibold uppercase tracking-wider leading-none">{currentUser.companyName || 'Utilisateur'}</div>
            </div>
            <button
              onClick={onLogout}
              title="Se déconnecter"
              className="ml-1 flex h-8 w-8 items-center justify-center rounded-lg border border-[#E1E3E5] text-[#6D7175] transition hover:bg-[#F6F6F7] hover:text-[#1A1A1A]"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
