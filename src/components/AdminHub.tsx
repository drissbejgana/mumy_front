import React, { useState, useEffect } from "react";
import { 
  Users, ShieldAlert, FileText, Check, AlertCircle, Trash2, UserPlus, Send, 
  Sparkles, ClipboardList, Loader2, RefreshCw, BadgeHelp, CheckCircle2, XCircle, Info,
  AlertTriangle, MessageSquare, Megaphone, MousePointerClick, Eye, TrendingUp, Plus, Coins,
  CreditCard, Calendar, Sliders, Search, FileDown, Settings
} from "lucide-react";
import { User, TeamMember, SentimentAlert, Driver, AdBanner, Excursion, ExcursionBooking, SupportSession, TransportRequest } from "../types";
import { apiFetch } from "../lib/apiClient";

interface AdminHubProps {
  users: User[];
  teamMembers: TeamMember[];
  sentimentAlerts: SentimentAlert[];
  // Needed to compute real platform revenue instead of hardcoded totals.
  requests: TransportRequest[];
  currentUser: User;
  onVerifyUser: (id: string) => void;
  onBanUser: (id: string) => void;
  onAddTeamMember: (member: Omit<TeamMember, 'id'>) => void;
  onDeleteTeamMember: (id: string) => void;
  onAddUser: (user: Omit<User, 'id'>) => void;
  onAddDriver: (driver: Driver) => void;
  onUpdateUser: (id: string, updated: Partial<User>) => void;
  platformState: any;
  banners: AdBanner[];
  onAddBanner: (banner: Omit<AdBanner, 'id' | 'spent' | 'impressions' | 'clicks' | 'createdAt'>) => void;
  onUpdateBanner: (id: string, updated: Partial<AdBanner>) => void;
  onDeleteBanner: (id: string) => void;
  excursions?: Excursion[];
  excursionBookings?: ExcursionBooking[];
}

export default function AdminHub({
  users,
  teamMembers,
  sentimentAlerts,
  requests,
  currentUser,
  onVerifyUser,
  onBanUser,
  onAddTeamMember,
  onDeleteTeamMember,
  onAddUser,
  onAddDriver,
  onUpdateUser,
  platformState,
  banners,
  onAddBanner,
  onUpdateBanner,
  onDeleteBanner,
  excursions = [],
  excursionBookings = [],
}: AdminHubProps) {
  const currentAdminName = currentUser.companyName || currentUser.name;

  // Support & Collaborator Chats State
  const [supportSessions, setSupportSessions] = useState<SupportSession[]>([]);
  // Holds the target session's userId (what the admin API keys sessions by), not the session's own id.
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [adminReplyText, setAdminReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [supportTab, setSupportTab] = useState<'support' | 'team'>('support');

  // Additional Admin Features
  const [selectedDocPreview, setSelectedDocPreview] = useState<{ type: 'licence' | 'rc' | 'insurance' | 'patente', user: User } | null>(null);
  const [paidBookingIds, setPaidBookingIds] = useState<string[]>([]);

  // Platform revenue, derived from what the platform actually recorded. These were three
  // hardcoded numbers (154 800 / 24 960 / 8 450 DHS) with a button that added 2 400 DHS of
  // imaginary commission to the total.
  const PLATFORM_COMMISSION_RATE = 0.2;

  const completedMissionsValue = requests
    .filter(r => r.status === 'completed')
    .reduce((sum, r) => sum + (r.priceDHS || 0), 0);
  const excursionsValue = excursionBookings
    .filter(b => b.status !== 'cancelled')
    .reduce((sum, b) => sum + b.totalPriceDHS, 0);

  const totalBusinessVolume = completedMissionsValue + excursionsValue;
  const collectedCommissions = Math.round(totalBusinessVolume * PLATFORM_COMMISSION_RATE);
  // Ad revenue is what the banner engine has actually billed to campaigns.
  const adEarnings = Math.round(banners.reduce((sum, b) => sum + (b.spent || 0), 0));
  
  // Advanced Payouts & FinTech States
  const [payoutSchedule, setPayoutSchedule] = useState<'weekly' | 'request'>('weekly');
  const [minPayoutThreshold, setMinPayoutThreshold] = useState<number>(500);
  // Payout bank details live on the transporter's own user record. They used to sit in this
  // component's state pre-filled with mock ids, so every RIB an admin entered was lost on
  // reload and the "Valider KYC" button changed nothing the rest of the platform could see.
  const getBankDetails = (userId: string) => {
    const owner = users.find(u => u.id === userId);
    return {
      bankName: owner?.bankName || 'Aucune banque',
      rib: owner?.rib || '-',
      kycStatus: owner?.bankKycStatus || 'pending',
      // Payout rows are grouped by transporterId; ids coming from seeded demo aggregates
      // have no matching user, and those rows are not editable.
      isRealUser: Boolean(owner)
    };
  };
  // Wire history starts empty and fills as payouts are actually executed from this console.
  // It used to open with two fictional 12 480 / 7 520 DHS transfers that counted towards
  // "déjà reversé".
  const [payoutHistory, setPayoutHistory] = useState<Array<{
    id: string;
    date: string;
    transporterId: string;
    transporterName: string;
    amount: number;
    commission: number;
    netAmount: number;
    status: 'success' | 'failed' | 'pending';
    reference: string;
    rib: string;
    period: string;
  }>>([]);
  const [payoutAnomalies, setPayoutAnomalies] = useState<Array<{
    id: string;
    date: string;
    transporterId: string;
    transporterName: string;
    amount: number;
    reason: string;
    status: 'failed' | 'retrying' | 'resolved';
    rib: string;
  }>>([]);
  const [payoutDisputes, setPayoutDisputes] = useState<Array<{
    id: string;
    date: string;
    bookingId: string;
    transporterName: string;
    amount: number;
    type: string;
    description: string;
    status: 'open' | 'refunded_client' | 'deducted_next_payout' | 'closed_no_action';
  }>>([]);
  const [selectedStatementPayout, setSelectedStatementPayout] = useState<any | null>(null);
  const [payoutTab, setPayoutTab] = useState<'overview' | 'transactions' | 'carriers' | 'config' | 'anomalies'>('overview');
  const [editingRibPartnerId, setEditingRibPartnerId] = useState<string | null>(null);
  const [editingRibValue, setEditingRibValue] = useState<string>('');
  const [editingBankName, setEditingBankName] = useState<string>('');

  // Audit trail for actions taken during this session. It used to open with four invented
  // entries attributed to named colleagues; it now starts empty and only records what the
  // signed-in administrator actually does. (Not yet persisted — see the note in the panel.)
  const [complianceLogs, setComplianceLogs] = useState<Array<{ id: string; timestamp: string; actor: string; action: string; category: 'kyc' | 'sentiment' | 'billing' | 'ads'; level: 'info' | 'warning' | 'success' }>>([]);

  const addComplianceLog = (action: string, category: 'kyc' | 'sentiment' | 'billing' | 'ads', level: 'info' | 'warning' | 'success' = 'info') => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setComplianceLogs(prev => [
      {
        id: `log-${Date.now()}`,
        timestamp: timeStr,
        actor: currentAdminName,
        action,
        category,
        level
      },
      ...prev
    ]);
  };

  // Team collaborators chats (simulated messages)
  const [selectedCollaboratorId, setSelectedCollaboratorId] = useState<string | null>(null);
  // Internal notes exchanged with staff members during this session. Previously pre-filled
  // with two invented conversations attributed to real-looking colleagues.
  const [collaboratorChats, setCollaboratorChats] = useState<{ [key: string]: any[] }>({});
  const [collabReplyText, setCollabReplyText] = useState("");

  const fetchSupportSessions = async () => {
    try {
      const data = await apiFetch<SupportSession[]>("/api/support/sessions");
      setSupportSessions(data);
    } catch (error) {
      console.error("Error fetching admin support sessions:", error);
    }
  };

  useEffect(() => {
    fetchSupportSessions();
    const interval = setInterval(fetchSupportSessions, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSendAdminReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminReplyText.trim() || !selectedSessionId || sendingReply) return;

    const reply = adminReplyText.trim();
    setAdminReplyText("");
    setSendingReply(true);

    try {
      const updatedSession = await apiFetch<SupportSession>("/api/support/message", {
        method: "POST",
        body: JSON.stringify({ userId: selectedSessionId, message: reply })
      });
      setSupportSessions(prev => prev.map(s => s.userId === selectedSessionId ? updatedSession : s));
    } catch (error) {
      console.error("Error sending admin reply:", error);
    } finally {
      setSendingReply(false);
    }
  };

  const handleResolveSession = async (userId: string) => {
    try {
      const updatedSession = await apiFetch<SupportSession>("/api/support/message", {
        method: "POST",
        body: JSON.stringify({ userId, resolveSession: true, message: "Session résolue par l'administrateur" })
      });
      setSupportSessions(prev => prev.map(s => s.userId === userId ? updatedSession : s));
    } catch (error) {
      console.error("Error resolving support session:", error);
    }
  };

  const handleSendCollabReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!collabReplyText.trim() || !selectedCollaboratorId) return;

    const reply = collabReplyText.trim();
    setCollabReplyText("");

    const updatedChats = { ...collaboratorChats };
    if (!updatedChats[selectedCollaboratorId]) {
      updatedChats[selectedCollaboratorId] = [];
    }
    updatedChats[selectedCollaboratorId].push({
      sender: "Moi",
      text: reply,
      time: "À l'instant"
    });

    setCollaboratorChats(updatedChats);

    setTimeout(() => {
      const collaboratorName = teamMembers.find(tm => tm.id === selectedCollaboratorId)?.name || "Collaborateur";
      const answers = [
        "Reçu ! Je m'occupe de cette tâche dès maintenant.",
        "Entendu, je mets à jour le dossier sur-le-champ.",
        "Parfait, merci pour l'information Youssef !",
        "Je regarde ça tout de suite et je te fais un retour dans 5 minutes."
      ];
      const randomAnswer = answers[Math.floor(Math.random() * answers.length)];

      setCollaboratorChats(prev => {
        const next = { ...prev };
        next[selectedCollaboratorId] = [
          ...(next[selectedCollaboratorId] || []),
          { sender: collaboratorName, text: randomAnswer, time: "À l'instant" }
        ];
        return next;
      });
    }, 1000);
  };

  // Assistant IA State
  const [assistantMessages, setAssistantMessages] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([
    { role: 'assistant', content: "Bonjour Youssef. Je suis l'Assistant Gemini Mumy. J'analyse en continu le flux d'affaires, les dossiers KYC et l'humeur des discussions. Comment puis-je vous éclairer aujourd'hui ?" }
  ]);
  const [userInput, setUserInput] = useState('');
  const [loadingAssistant, setLoadingAssistant] = useState(false);

  // Weekly Audit State
  const [auditReport, setAuditReport] = useState<string | null>(null);
  const [loadingAudit, setLoadingAudit] = useState(false);

  // Manual User Creation State
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [addUserForm, setAddUserForm] = useState({
    name: '',
    email: '',
    role: 'transporter' as 'transporter' | 'client' | 'driver',
    companyName: '',
    phone: '',
    ice: '',
    patente: '',
    rc: '',
    ifFiscal: '',
    cnss: '',
    status: 'pending' as 'pending' | 'verified',
    driverRating: 5.0
  });

  // Selected User for KYC Details State
  const [selectedKycUser, setSelectedKycUser] = useState<User | null>(null);
  const [kycRejectReason, setKycRejectReason] = useState('');

  // Team Member Form State
  const [selectedRoleType, setSelectedRoleType] = useState('Modérateur KYC');
  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    role: 'Modérateur KYC',
    permissions: ['validate_users', 'view_chat'] as string[]
  });

  // Ad Campaign Traffic Simulator State
  const [selectedSimBannerId, setSelectedSimBannerId] = useState<string>('');
  const [simImpressionsCount, setSimImpressionsCount] = useState<number>(500);
  const [simClicksCount, setSimClicksCount] = useState<number>(25);
  const [isAutoSimRunning, setIsAutoSimRunning] = useState<boolean>(false);

  // Automatic Background Traffic Simulation Effect
  useEffect(() => {
    if (!isAutoSimRunning) return;
    const interval = setInterval(() => {
      const activeBanners = banners.filter(b => b.isActive);
      if (activeBanners.length === 0) {
        setIsAutoSimRunning(false);
        return;
      }
      const randomBanner = activeBanners[Math.floor(Math.random() * activeBanners.length)];
      
      const isClick = Math.random() < 0.15; // 15% CTR simulation
      if (isClick) {
        let addedSpent = 0;
        if (randomBanner.optimizationType === 'cpc') {
          addedSpent = randomBanner.cpcValue;
        }
        const newSpent = Math.min(randomBanner.budget, Number((randomBanner.spent + addedSpent).toFixed(4)));
        onUpdateBanner(randomBanner.id, {
          clicks: randomBanner.clicks + 1,
          spent: newSpent,
          isActive: (randomBanner.optimizationType === 'weekly' || randomBanner.optimizationType === 'monthly')
            ? randomBanner.isActive
            : (newSpent < randomBanner.budget)
        });
      } else {
        let addedSpent = 0;
        if (randomBanner.optimizationType === 'cpm') {
          addedSpent = randomBanner.cpmValue / 1000;
        }
        const newSpent = Math.min(randomBanner.budget, Number((randomBanner.spent + addedSpent).toFixed(4)));
        onUpdateBanner(randomBanner.id, {
          impressions: randomBanner.impressions + 1,
          spent: newSpent,
          isActive: (randomBanner.optimizationType === 'weekly' || randomBanner.optimizationType === 'monthly')
            ? randomBanner.isActive
            : (newSpent < randomBanner.budget)
        });
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [isAutoSimRunning, banners, onUpdateBanner]);

  // Ad Banner Management Form State
  const [showAddBannerForm, setShowAddBannerForm] = useState(false);
  const [newBannerForm, setNewBannerForm] = useState({
    title: '',
    description: '',
    imageUrl: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400&auto=format&fit=crop&q=80',
    linkUrl: 'https://mumy.ma/promo-direct',
    targetRole: 'transporter' as 'all' | 'transporter' | 'client' | 'driver' | 'public',
    optimizationType: 'cpc' as 'cpm' | 'cpc' | 'weekly' | 'monthly',
    cpcValue: 2.0,
    cpmValue: 12.0,
    weeklyRate: 250.0,
    monthlyRate: 800.0,
    durationUnits: 4,
    budget: 300,
    isActive: true
  });


  const handleSendAssistant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    const userMsg = userInput;
    setUserInput('');
    setAssistantMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoadingAssistant(true);

    try {
      const data = await apiFetch<{ reply: string }>("/api/gemini/assistant", {
        method: "POST",
        body: JSON.stringify({
          messages: [...assistantMessages, { role: 'user', content: userMsg }],
          platformState
        })
      });
      setAssistantMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      console.error(err);
      setAssistantMessages(prev => [...prev, { role: 'assistant', content: "Désolé, une erreur s'est produite lors de la communication avec Gemini. Assurez-vous que l'application est bien démarrée." }]);
    } finally {
      setLoadingAssistant(false);
    }
  };

  const handleGenerateAudit = async () => {
    setLoadingAudit(true);
    setAuditReport(null);
    try {
      const data = await apiFetch<{ report: string }>("/api/gemini/audit", {
        method: "POST",
        body: JSON.stringify({ platformState })
      });
      setAuditReport(data.report);
    } catch (err) {
      console.error(err);
      setAuditReport("### Erreur\nImpossible de contacter le serveur de rapport Gemini.");
    } finally {
      setLoadingAudit(false);
    }
  };

  const handleAddUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addUserForm.name || !addUserForm.email) return;

    if (addUserForm.role === 'driver') {
      const driverId = `d-${Math.floor(100 + Math.random() * 900)}`;
      onAddDriver({
        id: driverId,
        name: addUserForm.name,
        phone: addUserForm.phone || "+212 6 00 00 00 00",
        avatarUrl: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80`,
        rating: Number(addUserForm.driverRating) || 5.0,
        status: addUserForm.status === 'verified' ? 'active' : 'inactive'
      });
      onAddUser({
        name: addUserForm.name,
        email: addUserForm.email,
        role: 'driver',
        status: addUserForm.status,
        phone: addUserForm.phone,
        companyName: addUserForm.companyName || 'Indépendant',
        avatarUrl: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80`
      });
    } else {
      onAddUser({
        name: addUserForm.name,
        email: addUserForm.email,
        role: addUserForm.role,
        status: addUserForm.status,
        phone: addUserForm.phone,
        companyName: addUserForm.companyName,
        ice: addUserForm.ice,
        patente: addUserForm.patente,
        rc: addUserForm.rc,
        ifFiscal: addUserForm.ifFiscal,
        cnss: addUserForm.cnss,
        avatarUrl: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80`,
        ...(addUserForm.role === 'transporter' ? {
          kycLicenceStatus: 'missing',
          kycRcStatus: 'missing',
          kycInsuranceStatus: 'missing',
          kycPatenteStatus: 'missing'
        } : {})
      });
    }

    setAddUserForm({
      name: '',
      email: '',
      role: 'transporter',
      companyName: '',
      phone: '',
      ice: '',
      patente: '',
      rc: '',
      ifFiscal: '',
      cnss: '',
      status: 'pending',
      driverRating: 5.0
    });
    setShowAddUserForm(false);
  };

  const handleAddBannerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBannerForm.title || !newBannerForm.description) return;
    onAddBanner({
      title: newBannerForm.title,
      description: newBannerForm.description,
      imageUrl: newBannerForm.imageUrl,
      linkUrl: newBannerForm.linkUrl,
      targetRole: newBannerForm.targetRole,
      optimizationType: newBannerForm.optimizationType,
      cpcValue: Number(newBannerForm.cpcValue),
      cpmValue: Number(newBannerForm.cpmValue),
      weeklyRate: Number(newBannerForm.weeklyRate),
      monthlyRate: Number(newBannerForm.monthlyRate),
      durationUnits: Number(newBannerForm.durationUnits),
      budget: Number(newBannerForm.budget),
      isActive: newBannerForm.isActive
    });
    setNewBannerForm({
      title: '',
      description: '',
      imageUrl: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400&auto=format&fit=crop&q=80',
      linkUrl: 'https://mumy.ma/promo-direct',
      targetRole: 'transporter',
      optimizationType: 'cpc',
      cpcValue: 2.0,
      cpmValue: 12.0,
      weeklyRate: 250.0,
      monthlyRate: 800.0,
      durationUnits: 4,
      budget: 300,
      isActive: true
    });
    setShowAddBannerForm(false);
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMember.name || !newMember.email || !newMember.role) return;
    onAddTeamMember({
      name: newMember.name,
      email: newMember.email,
      role: newMember.role,
      permissions: newMember.permissions.length > 0 ? newMember.permissions : ['view_dashboard']
    });
    setNewMember({
      name: '',
      email: '',
      role: 'Modérateur KYC',
      permissions: ['validate_users', 'view_chat']
    });
    setSelectedRoleType('Modérateur KYC');
  };

  const togglePermission = (perm: string) => {
    if (newMember.permissions.includes(perm)) {
      setNewMember({ ...newMember, permissions: newMember.permissions.filter(p => p !== perm) });
    } else {
      setNewMember({ ...newMember, permissions: [...newMember.permissions, perm] });
    }
  };

  // Simple custom Markdown parser to display Gemini reports nicely
  const renderMarkdown = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      if (line.startsWith('# ')) {
        return <h2 key={idx} className="text-xl font-bold text-gray-900 mt-4 mb-2 border-b border-gray-100 pb-1 font-sans">{line.replace('# ', '')}</h2>;
      }
      if (line.startsWith('## ')) {
        return <h3 key={idx} className="text-base font-bold text-gray-800 mt-3 mb-1.5 font-sans">{line.replace('## ', '')}</h3>;
      }
      if (line.startsWith('### ')) {
        return <h4 key={idx} className="text-sm font-semibold text-gray-800 mt-2 mb-1">{line.replace('### ', '')}</h4>;
      }
      if (line.startsWith('* ') || line.startsWith('- ')) {
        return <li key={idx} className="ml-4 list-disc text-xs text-gray-600 mb-1 leading-relaxed">{line.replace(/^[*|-]\s+/, '')}</li>;
      }
      if (line.trim() === '') {
        return <div key={idx} className="h-2"></div>;
      }
      // Basic bold formatting
      const boldRegex = /\*\*(.*?)\*\*/g;
      if (boldRegex.test(line)) {
        const parts = line.split('**');
        return (
          <p key={idx} className="text-xs text-gray-600 leading-relaxed mb-1.5">
            {parts.map((part, i) => i % 2 === 1 ? <strong key={i} className="text-[#1A1A1A] font-semibold">{part}</strong> : part)}
          </p>
        );
      }
      return <p key={idx} className="text-xs text-gray-600 leading-relaxed mb-1.5">{line}</p>;
    });
  };

  return (
    <div className="space-y-8">
      {/* Platform Financial & Commissions Dashboard */}
      <div className="rounded-xl border border-[#E1E3E5] bg-white p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E1E3E5] pb-3">
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-emerald-600" />
            <div>
              <h3 className="font-sans text-sm font-bold text-[#1A1A1A]">Rendement Financier & Commissions de la Plateforme (B2B Empty Returns)</h3>
              <p className="text-[10px] text-gray-500 font-medium">Suivi en direct des flux de commissions prélevés (20% sur les retours à vide) et revenus de la régie publicitaire.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-xl bg-slate-50 border border-[#E1E3E5] p-3.5 text-left space-y-1">
            <p className="text-[10px] font-bold text-[#6D7175] uppercase tracking-wider">Volume d'Affaires Global</p>
            <p className="text-xl font-extrabold text-slate-900 font-mono">{totalBusinessVolume.toLocaleString('fr-FR')} DHS</p>
            <p className="text-[9px] text-[#008060] font-bold">
              Missions terminées + réservations d'excursion
            </p>
          </div>
          <div className="rounded-xl bg-[#EBF5F1] border border-[#BBE3D1] p-3.5 text-left space-y-1">
            <p className="text-[10px] font-bold text-[#008060] uppercase tracking-wider">Commissions Collectées (20%)</p>
            <p className="text-xl font-extrabold text-[#008060] font-mono">{collectedCommissions.toLocaleString()} DHS</p>
            <p className="text-[9px] text-gray-500 font-semibold">Sur retours à vide optimisés</p>
          </div>
          <div className="rounded-xl bg-indigo-50 border border-indigo-200 p-3.5 text-left space-y-1">
            <p className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">Revenus Publicitaires (CPC/CPM)</p>
            <p className="text-xl font-extrabold text-indigo-950 font-mono">{adEarnings.toLocaleString()} DHS</p>
            <p className="text-[9px] text-gray-500 font-semibold">Régie sponsorisée Mumy Ads</p>
          </div>
          <div className="rounded-xl bg-slate-900 border border-slate-950 p-3.5 text-left space-y-1 text-white">
            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Bénéfice Net Plateforme</p>
            <p className="text-xl font-extrabold text-emerald-400 font-mono">{(collectedCommissions + adEarnings).toLocaleString()} DHS</p>
            <p className="text-[9px] text-slate-400 font-bold">Marge brute réinvestie : 100%</p>
          </div>
        </div>
      </div>

      {/* Collaborator Payouts & FinTech Administration Hub */}
      {(() => {
        // Calculate dynamic live financial flows
        const baseSalesExcursions = excursionBookings
          .filter(b => b.status !== 'cancelled')
          .reduce((sum, b) => sum + b.totalPriceDHS, 0);

        const baseCommissionsExcursions = excursionBookings
          .filter(b => b.status !== 'cancelled')
          .reduce((sum, b) => sum + Math.round(b.totalPriceDHS * 0.20), 0);

        // Every figure below is derived from recorded activity. It previously started from
        // three invented constants (154 800 / 30 960 / 104 000 DHS) plus a flat 12 800 DHS
        // of "simulated pending B2B", so the console never showed the real position.
        const financialFlows = {
          totalEncaisse: totalBusinessVolume,
          commissionsCumulees: collectedCommissions,
          dejaReverse: payoutHistory.filter(h => h.status === 'success').reduce((sum, h) => sum + h.netAmount, 0),
          enAttente: excursionBookings
            .filter(b => b.status !== 'cancelled' && !paidBookingIds.includes(b.id))
            .reduce((sum, b) => sum + Math.round(b.totalPriceDHS * 0.80), 0),
          disputesOnHold: payoutDisputes.filter(d => d.status === 'open').reduce((sum, d) => sum + d.amount, 0),
        };

        // Group excursion bookings for transporters list
        const transporterGroups: { [key: string]: {
          id: string;
          name: string;
          bookingsCount: number;
          totalSales: number;
          commission: number;
          netToPay: number;
          paidAmount: number;
          pendingAmount: number;
          bookings: ExcursionBooking[];
        }} = {};

        // This list used to be prepopulated with three fictional companies ("Atlas Trans",
        // "Marrakech Express", "Sahara Tours") carrying 154 800 DHS of invented sales, which
        // then flowed into the payout totals and the RIB table. It is now built purely from
        // recorded bookings.
        excursionBookings.forEach(booking => {
          if (booking.status === 'cancelled') return;
          const key = booking.transporterId;
          if (!key) return;
          const isPaid = paidBookingIds.includes(booking.id);
          
          const sales = booking.totalPriceDHS;
          const comm = Math.round(sales * 0.20);
          const net = sales - comm;
          
          if (!transporterGroups[key]) {
            transporterGroups[key] = {
              id: key,
              name: booking.transporterName || 'Partenaire Externe',
              bookingsCount: 0,
              totalSales: 0,
              commission: 0,
              netToPay: 0,
              paidAmount: 0,
              pendingAmount: 0,
              bookings: []
            };
          }
          
          transporterGroups[key].bookingsCount += 1;
          transporterGroups[key].totalSales += sales;
          transporterGroups[key].commission += comm;
          transporterGroups[key].netToPay += net;
          transporterGroups[key].bookings.push(booking);
          if (isPaid) {
            transporterGroups[key].paidAmount += net;
          } else {
            transporterGroups[key].pendingAmount += net;
          }
        });

        const collaboratorPayouts = Object.values(transporterGroups);

        // Search and filter for Transaction Table
        const [transSearch, setTransSearch] = useState('');
        const [transStatusFilter, setTransStatusFilter] = useState<'all' | 'pending' | 'paid' | 'disputed'>('all');

        // Real transactions only. Four hardcoded "B2B Shuttle" rows worth 24 500 DHS used to
        // be appended here and counted in the totals below.
        const allTransactions = [
          ...excursionBookings.map(b => ({
            id: b.id,
            date: b.date,
            partner: b.clientName,
            transporter: b.transporterName,
            transporterId: b.transporterId,
            tourTitle: b.excursionTitle,
            montantBrut: b.totalPriceDHS,
            commission: Math.round(b.totalPriceDHS * PLATFORM_COMMISSION_RATE),
            netDu: Math.round(b.totalPriceDHS * (1 - PLATFORM_COMMISSION_RATE)),
            status: paidBookingIds.includes(b.id) ? 'paid' : (payoutDisputes.some(d => d.bookingId === b.id && d.status === 'open') ? 'disputed' : 'pending'),
            type: 'Excursion'
          })),
          ...requests
            .filter(r => r.status === 'completed' && r.priceDHS)
            .map(r => ({
              id: r.id,
              date: r.dateTime,
              partner: r.clientName,
              transporter: r.transporterId ?? '—',
              transporterId: r.transporterId ?? '',
              tourTitle: `${r.origin} → ${r.destination}`,
              montantBrut: r.priceDHS as number,
              commission: Math.round((r.priceDHS as number) * PLATFORM_COMMISSION_RATE),
              netDu: Math.round((r.priceDHS as number) * (1 - PLATFORM_COMMISSION_RATE)),
              status: paidBookingIds.includes(r.id) ? 'paid' : 'pending',
              type: 'Mission B2B'
            }))
        ];

        const filteredTransactions = allTransactions.filter(t => {
          const matchesSearch = t.transporter.toLowerCase().includes(transSearch.toLowerCase()) || 
                                t.partner.toLowerCase().includes(transSearch.toLowerCase()) ||
                                t.tourTitle.toLowerCase().includes(transSearch.toLowerCase());
          const matchesStatus = transStatusFilter === 'all' || t.status === transStatusFilter;
          return matchesSearch && matchesStatus;
        });

        // Trigger manual/weekly payout process
        const triggerMassPayout = () => {
          let processedCount = 0;
          let totalReversed = 0;
          const newPaidIds = [...paidBookingIds];

          collaboratorPayouts.forEach(partner => {
            const minSeuil = minPayoutThreshold;
            if (partner.pendingAmount >= minSeuil) {
              // Get pending bookings of this partner
              const bank = getBankDetails(partner.id);

              if (bank.kycStatus !== 'verified') {
                addComplianceLog(`Échec virement de ${partner.pendingAmount} DHS pour ${partner.name} : KYC Bancaire non validé.`, 'billing', 'warning');
                // Create an anomaly entry
                setPayoutAnomalies(prev => [
                  {
                    id: `an-${Date.now()}-${partner.id}`,
                    date: '2026-07-17',
                    transporterId: partner.id,
                    transporterName: partner.name,
                    amount: partner.pendingAmount,
                    reason: `KYC Bancaire suspendu ou non vérifié (${bank.bankName})`,
                    status: 'failed',
                    rib: bank.rib
                  },
                  ...prev
                ]);
                return;
              }

              // Save to history
              const ref = `VIR-AUTO-${Date.now().toString().slice(-4)}-${partner.id.toUpperCase()}`;
              setPayoutHistory(prev => [
                {
                  id: `pay-${Date.now()}-${partner.id}`,
                  date: '2026-07-17',
                  transporterId: partner.id,
                  transporterName: partner.name,
                  amount: partner.totalSales,
                  commission: partner.commission,
                  netAmount: partner.pendingAmount,
                  status: 'success',
                  reference: ref,
                  rib: bank.rib,
                  period: 'Solde arrêté au 17/07/2026'
                },
                ...prev
              ]);

              // Mark partner bookings as paid
              partner.bookings.forEach(b => {
                if (!newPaidIds.includes(b.id)) {
                  newPaidIds.push(b.id);
                }
              });

              processedCount++;
              totalReversed += partner.pendingAmount;
            }
          });

          if (processedCount > 0) {
            setPaidBookingIds(newPaidIds);
            addComplianceLog(`Virement consolidé effectué : ${totalReversed.toLocaleString()} DHS versés à ${processedCount} transporteurs (Seuil minimum ${minPayoutThreshold} DHS respecté).`, 'billing', 'success');
            alert(`Succès : ${processedCount} virements bancaires initiés pour un montant net total de ${totalReversed.toLocaleString()} DHS !`);
          } else {
            alert(`Aucun transporteur n'a dépassé le seuil de reversement de ${minPayoutThreshold} DHS ou n'a son KYC bancaire validé.`);
          }
        };

        return (
          <div className="rounded-2xl border border-[#E1E3E5] bg-white p-6 shadow-sm space-y-6">
            
            {/* Header with Title and Custom Badge */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#E1E3E5] pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-sans text-base font-black text-slate-900">Module de Reversement & FinTech B2B — Super Admin</h3>
                  <p className="text-[11px] text-gray-500 font-medium">Contrôlez les flux financiers des circuits touristiques, gérez les IBAN, traitez les commissions de 20%, et débloquez les payouts.</p>
                </div>
              </div>
              
              {/* Tab Selector buttons */}
              <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl border self-start lg:self-center">
                <button
                  onClick={() => setPayoutTab('overview')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${payoutTab === 'overview' ? 'bg-white text-slate-900 shadow-xs border border-gray-200' : 'text-gray-500 hover:text-slate-900'}`}
                >
                  <TrendingUp className="h-3.5 w-3.5" />
                  Flux & KPI
                </button>
                <button
                  onClick={() => setPayoutTab('transactions')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${payoutTab === 'transactions' ? 'bg-white text-slate-900 shadow-xs border border-gray-200' : 'text-gray-500 hover:text-slate-900'}`}
                >
                  <FileText className="h-3.5 w-3.5" />
                  Transactions ({filteredTransactions.length})
                </button>
                <button
                  onClick={() => setPayoutTab('carriers')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${payoutTab === 'carriers' ? 'bg-white text-slate-900 shadow-xs border border-gray-200' : 'text-gray-500 hover:text-slate-900'}`}
                >
                  <Users className="h-3.5 w-3.5" />
                  KYC & RIB
                </button>
                <button
                  onClick={() => setPayoutTab('config')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${payoutTab === 'config' ? 'bg-white text-slate-900 shadow-xs border border-gray-200' : 'text-gray-500 hover:text-slate-900'}`}
                >
                  <Sliders className="h-3.5 w-3.5" />
                  Planning & PDF
                </button>
                <button
                  onClick={() => setPayoutTab('anomalies')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 relative ${payoutTab === 'anomalies' ? 'bg-white text-slate-900 shadow-xs border border-gray-200' : 'text-gray-500 hover:text-slate-900'}`}
                >
                  <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                  Anomalies & Litiges
                  {payoutAnomalies.length + payoutDisputes.filter(d => d.status === 'open').length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full text-[8px] h-4 w-4 flex items-center justify-center font-black">
                      {payoutAnomalies.length + payoutDisputes.filter(d => d.status === 'open').length}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* TAB 1: OVERVIEW & FLOWS */}
            {payoutTab === 'overview' && (
              <div className="space-y-6 animate-fade-in">
                {/* 5-Column High-Contrast FinTech KPI Blocks */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                  <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-1 text-left relative overflow-hidden">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">Volume Global Encaissé</span>
                    <span className="text-lg font-black text-slate-900 font-mono block">{financialFlows.totalEncaisse.toLocaleString()} DHS</span>
                    <span className="text-[9px] text-[#008060] font-bold block">✓ Comptes séquestres OK</span>
                    <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[#008060]"></div>
                  </div>

                  <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 space-y-1 text-left">
                    <span className="text-[9px] font-black text-amber-700 uppercase tracking-wider block">Marge / Commissions (20%)</span>
                    <span className="text-lg font-black text-amber-800 font-mono block">{financialFlows.commissionsCumulees.toLocaleString()} DHS</span>
                    <span className="text-[9px] text-gray-500 font-medium block">Prélèvement auto sur ventes</span>
                  </div>

                  <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 space-y-1 text-left">
                    <span className="text-[9px] font-black text-[#008060] uppercase tracking-wider block">Déjà Reversé (80%)</span>
                    <span className="text-lg font-black text-[#008060] font-mono block">{financialFlows.dejaReverse.toLocaleString()} DHS</span>
                    <span className="text-[9px] text-emerald-700 font-medium block">✓ Libéré par virement</span>
                  </div>

                  <div className="rounded-xl bg-indigo-50 border border-indigo-200 p-4 space-y-1 text-left relative">
                    <span className="text-[9px] font-black text-indigo-700 uppercase tracking-wider block">Dû / En Attente (80%)</span>
                    <span className="text-lg font-black text-indigo-900 font-mono block">{financialFlows.enAttente.toLocaleString()} DHS</span>
                    <span className="text-[9px] text-indigo-500 font-medium block">Clôtures hebdomadaires</span>
                    <span className="absolute bottom-2 right-2 text-[8px] bg-indigo-200/50 text-indigo-800 rounded px-1 font-mono uppercase">Non Réglé</span>
                  </div>

                  <div className="rounded-xl bg-red-50 border border-red-200 p-4 space-y-1 text-left col-span-2 lg:col-span-1">
                    <span className="text-[9px] font-black text-red-700 uppercase tracking-wider block">En Suspends / Litiges</span>
                    <span className="text-lg font-black text-red-950 font-mono block">{financialFlows.disputesOnHold.toLocaleString()} DHS</span>
                    <span className="text-[9px] text-red-600 font-bold block">⚠️ Retenue sur reversement</span>
                  </div>
                </div>

                {/* Sub banner & Unified payout trigger */}
                <div className="bg-slate-900 text-white rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1 text-left">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Statut du Cycle de Reversement Bancaire</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Calendrier actuel : <span className="font-bold text-white uppercase">{payoutSchedule === 'weekly' ? 'Hebdomadaire automatique' : 'Sur demande'}</span> • Seuil minimum : <span className="font-mono text-emerald-400 font-bold">{minPayoutThreshold} DHS</span>.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={triggerMassPayout}
                      className="px-4 py-2 bg-[#008060] hover:bg-[#006e52] text-white text-xs font-bold rounded-lg transition shadow-md flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      Lancer Règlement Global
                    </button>
                  </div>
                </div>

                {/* Table structure of live balance per collaborator */}
                <div className="space-y-2 text-left">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Soldes B2B Actuels par Collaborateur</span>
                  <div className="overflow-x-auto border border-[#E1E3E5] rounded-xl">
                    <table className="w-full text-left text-xs text-[#1A1A1A]">
                      <thead>
                        <tr className="border-b border-[#E1E3E5] bg-gray-50 text-[10px] font-bold text-[#6D7175] uppercase">
                          <th className="py-2.5 px-4">Transporteur</th>
                          <th className="py-2.5 px-4 text-center">Circuits Vendus</th>
                          <th className="py-2.5 px-4 text-right">Volume Brut</th>
                          <th className="py-2.5 px-4 text-right text-amber-700">Com. Mumy (20%)</th>
                          <th className="py-2.5 px-4 text-right text-emerald-700">Dû Net (80%)</th>
                          <th className="py-2.5 px-4 text-right text-indigo-700">Déjà Payé</th>
                          <th className="py-2.5 px-4 text-right text-red-700">En Attente</th>
                          <th className="py-2.5 px-4 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E1E3E5]">
                        {collaboratorPayouts.map(partner => {
                          const bank = getBankDetails(partner.id);
                          return (
                            <tr key={partner.id} className="hover:bg-gray-50/50 transition">
                              <td className="py-3 px-4 font-bold text-slate-900">
                                <div className="flex flex-col">
                                  <span>{partner.name}</span>
                                  <span className="text-[9px] text-gray-400 font-mono">{bank.bankName} - {bank.rib}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-center font-bold text-gray-500">{partner.bookingsCount} tours</td>
                              <td className="py-3 px-4 text-right font-mono text-gray-700">{(partner.totalSales).toLocaleString()} DHS</td>
                              <td className="py-3 px-4 text-right font-mono text-amber-600 font-semibold">-{partner.commission.toLocaleString()} DHS</td>
                              <td className="py-3 px-4 text-right font-mono text-emerald-600 font-bold">{partner.netToPay.toLocaleString()} DHS</td>
                              <td className="py-3 px-4 text-right font-mono text-[#008060] font-semibold">{partner.paidAmount.toLocaleString()} DHS</td>
                              <td className="py-3 px-4 text-right font-mono font-bold text-red-600">
                                {partner.pendingAmount.toLocaleString()} DHS
                              </td>
                              <td className="py-3 px-4 text-center">
                                <button
                                  disabled={partner.pendingAmount === 0}
                                  onClick={() => {
                                    if (bank.kycStatus !== 'verified') {
                                      alert(`Virement impossible : Le KYC Bancaire de ${partner.name} est au statut "${bank.kycStatus.toUpperCase()}". Veuillez d'abord valider son compte.`);
                                      return;
                                    }
                                    const newPaidIds = [...paidBookingIds];
                                    partner.bookings.forEach(b => {
                                      if (!newPaidIds.includes(b.id)) {
                                        newPaidIds.push(b.id);
                                      }
                                    });
                                    setPaidBookingIds(newPaidIds);
                                    
                                    // Add to history
                                    const ref = `VIR-MAN-${Date.now().toString().slice(-4)}`;
                                    setPayoutHistory(prev => [
                                      {
                                        id: `pay-${Date.now()}`,
                                        date: '2026-07-17',
                                        transporterId: partner.id,
                                        transporterName: partner.name,
                                        amount: partner.totalSales,
                                        commission: partner.commission,
                                        netAmount: partner.pendingAmount,
                                        status: 'success',
                                        reference: ref,
                                        rib: bank.rib,
                                        period: 'Règlement à la demande'
                                      },
                                      ...prev
                                    ]);

                                    addComplianceLog(`Reversement ponctuel à la demande libéré : +${partner.pendingAmount} DHS transférés à ${partner.name}.`, 'billing', 'success');
                                  }}
                                  className="px-2 py-1 bg-slate-900 text-white font-bold text-[10px] rounded hover:bg-slate-800 disabled:opacity-30 cursor-pointer transition"
                                >
                                  Payer Solde
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: DETAILED TRANSACTIONS TABLE */}
            {payoutTab === 'transactions' && (
              <div className="space-y-4 animate-fade-in text-left">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-gray-200">
                  <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Rechercher partenaire, circuit..."
                      value={transSearch}
                      onChange={(e) => setTransSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-gray-300 focus:outline-none focus:border-[#008060] bg-white text-gray-800"
                    />
                  </div>
                  
                  <div className="flex items-center gap-1.5 self-stretch sm:self-auto">
                    <span className="text-[10px] font-bold text-gray-500 uppercase shrink-0">Filtrer Statut :</span>
                    <select
                      value={transStatusFilter}
                      onChange={(e: any) => setTransStatusFilter(e.target.value)}
                      className="px-2 py-1 text-xs rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none"
                    >
                      <option value="all">Toutes ({allTransactions.length})</option>
                      <option value="pending">En attente</option>
                      <option value="paid">Payées</option>
                      <option value="disputed">Contestées / Litige</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto border border-[#E1E3E5] rounded-xl">
                  <table className="w-full text-left text-xs text-[#1A1A1A]">
                    <thead>
                      <tr className="border-b border-[#E1E3E5] bg-gray-50 text-[10px] font-bold text-[#6D7175] uppercase">
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">ID & Type</th>
                        <th className="py-2.5 px-3">Voyageur / Agent</th>
                        <th className="py-2.5 px-3">Circuit / Excursion</th>
                        <th className="py-2.5 px-3">Transporteur</th>
                        <th className="py-2.5 px-3 text-right">Montant Public</th>
                        <th className="py-2.5 px-3 text-right text-amber-600">Com. 20%</th>
                        <th className="py-2.5 px-3 text-right text-emerald-600">Net Partenaire</th>
                        <th className="py-2.5 px-3 text-center">Statut</th>
                        <th className="py-2.5 px-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E1E3E5]">
                      {filteredTransactions.map((t, idx) => (
                        <tr key={t.id || idx} className="hover:bg-gray-50/50 transition">
                          <td className="py-3 px-3 font-mono text-[10px] text-gray-500">{t.date}</td>
                          <td className="py-3 px-3">
                            <span className="font-mono text-[9px] text-gray-500 block">#{t.id}</span>
                            <span className="text-[8px] bg-slate-100 text-slate-700 px-1 py-0.5 rounded uppercase font-bold">{t.type}</span>
                          </td>
                          <td className="py-3 px-3 font-semibold text-slate-900">{t.partner}</td>
                          <td className="py-3 px-3 truncate max-w-[160px] font-medium text-gray-700" title={t.tourTitle}>{t.tourTitle}</td>
                          <td className="py-3 px-3 font-bold text-slate-800">{t.transporter}</td>
                          <td className="py-3 px-3 text-right font-mono text-gray-900">{t.montantBrut.toLocaleString()} DHS</td>
                          <td className="py-3 px-3 text-right font-mono text-amber-600">-{t.commission.toLocaleString()} DHS</td>
                          <td className="py-3 px-3 text-right font-mono text-[#008060] font-bold">{t.netDu.toLocaleString()} DHS</td>
                          <td className="py-3 px-3 text-center">
                            {t.status === 'paid' && (
                              <span className="text-[9px] font-bold uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">✓ Payé</span>
                            )}
                            {t.status === 'pending' && (
                              <span className="text-[9px] font-bold uppercase bg-amber-100 text-amber-800 px-2 py-0.5 rounded">⌛ En attente</span>
                            )}
                            {t.status === 'disputed' && (
                              <span className="text-[9px] font-bold uppercase bg-red-100 text-red-800 px-2 py-0.5 rounded">⚠️ Litige</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {t.status === 'pending' && (
                                <button
                                  onClick={() => {
                                    setPaidBookingIds(prev => [...prev, t.id]);
                                    addComplianceLog(`Règlement unitaire validé manuellement pour la transaction #${t.id} (${t.netDu} DHS).`, 'billing', 'success');
                                  }}
                                  className="text-[9.5px] text-[#008060] hover:underline font-bold"
                                >
                                  Libérer
                                </button>
                              )}
                              {t.status !== 'disputed' ? (
                                <button
                                  onClick={() => {
                                    // Add dispute
                                    setPayoutDisputes(prev => [
                                      {
                                        id: `disp-${Date.now()}`,
                                        date: new Date().toISOString().split('T')[0],
                                        bookingId: t.id,
                                        transporterName: t.transporter,
                                        amount: Math.round(t.montantBrut * 0.30),
                                        type: 'Retard / Litige',
                                        description: `Litige ouvert manuellement pour la commande #${t.id}. Réclamation voyageur sur la qualité du service.`,
                                        status: 'open'
                                      },
                                      ...prev
                                    ]);
                                    addComplianceLog(`Litige financier ouvert sur la commande #${t.id} (${t.transporter}). Reversement gelé.`, 'billing', 'warning');
                                  }}
                                  className="text-[9.5px] text-red-600 hover:underline font-semibold"
                                >
                                  Litige
                                </button>
                              ) : (
                                <span className="text-[9px] text-gray-400">Bloqué</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredTransactions.length === 0 && (
                        <tr>
                          <td colSpan={10} className="py-8 text-center text-gray-400 font-medium bg-slate-50">
                            Aucune transaction ne correspond à vos filtres.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 3: TRANSPORTERS MANAGEMENT & BANK KYC */}
            {payoutTab === 'carriers' && (
              <div className="space-y-4 animate-fade-in text-left">
                <div className="grid md:grid-cols-3 gap-4">
                  {/* Carriers Table List */}
                  <div className="col-span-2 border border-[#E1E3E5] rounded-xl overflow-hidden bg-white">
                    <div className="p-3.5 bg-slate-50 border-b border-gray-200">
                      <span className="text-xs font-bold text-slate-900 block">Dossiers Financiers & Coordonnées Bancaires</span>
                    </div>
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-gray-200 bg-gray-100/50 text-[10px] font-bold text-gray-500 uppercase">
                          <th className="py-2 px-3">Partenaire</th>
                          <th className="py-2 px-3">Banque & RIB (24 Chiffres)</th>
                          <th className="py-2 px-3 text-center">Statut KYC</th>
                          <th className="py-2 px-3 text-center font-bold">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {collaboratorPayouts.map(p => {
                          const bank = getBankDetails(p.id);
                          const isEditing = editingRibPartnerId === p.id;
                          return (
                            <tr key={p.id} className="hover:bg-slate-50/50">
                              <td className="py-3 px-3">
                                <span className="font-bold text-slate-900 block">{p.name}</span>
                                <span className="text-[9px] text-gray-400 font-mono block">ID: {p.id}</span>
                              </td>
                              <td className="py-3 px-3">
                                {isEditing ? (
                                  <div className="space-y-1.5 max-w-[200px]">
                                    <input
                                      type="text"
                                      placeholder="Nom de la banque"
                                      value={editingBankName}
                                      onChange={(e) => setEditingBankName(e.target.value)}
                                      className="w-full px-2 py-0.5 text-xs rounded border border-gray-300 bg-white text-gray-800"
                                    />
                                    <input
                                      type="text"
                                      placeholder="RIB (24 chiffres)"
                                      value={editingRibValue}
                                      onChange={(e) => setEditingRibValue(e.target.value)}
                                      className="w-full px-2 py-0.5 text-xs rounded border border-gray-300 font-mono bg-white text-gray-800"
                                    />
                                  </div>
                                ) : (
                                  <div className="font-mono text-[10.5px]">
                                    <span className="font-bold text-slate-800 block">{bank.bankName}</span>
                                    <span className="text-gray-500">{bank.rib}</span>
                                  </div>
                                )}
                              </td>
                              <td className="py-3 px-3 text-center">
                                {bank.kycStatus === 'verified' && (
                                  <span className="text-[9px] font-black uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">✓ Validé</span>
                                )}
                                {bank.kycStatus === 'pending' && (
                                  <span className="text-[9px] font-black uppercase bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full animate-pulse">⏳ En révision</span>
                                )}
                                {bank.kycStatus === 'rejected' && (
                                  <span className="text-[9px] font-black uppercase bg-red-100 text-red-800 px-2 py-0.5 rounded-full">✕ Rejeté</span>
                                )}
                              </td>
                              <td className="py-3 px-3 text-center">
                                {isEditing ? (
                                  <div className="flex items-center gap-1 justify-center">
                                    <button
                                      onClick={() => {
                                        onUpdateUser(p.id, {
                                          bankName: editingBankName,
                                          rib: editingRibValue,
                                          bankKycStatus: 'verified' // Auto verify on update
                                        });
                                        setEditingRibPartnerId(null);
                                        addComplianceLog(`RIB de ${p.name} mis à jour : ${editingBankName} (${editingRibValue}). KYC Validé d'office.`, 'billing', 'success');
                                      }}
                                      className="px-1.5 py-0.5 bg-emerald-600 text-white rounded font-bold text-[9px] hover:bg-emerald-700"
                                    >
                                      Sauver
                                    </button>
                                    <button
                                      onClick={() => setEditingRibPartnerId(null)}
                                      className="px-1.5 py-0.5 bg-gray-200 text-gray-700 rounded font-bold text-[9px]"
                                    >
                                      Annuler
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex flex-col gap-1 items-center justify-center">
                                    <button
                                      onClick={() => {
                                        setEditingRibPartnerId(p.id);
                                        setEditingBankName(bank.isRealUser ? bank.bankName : '');
                                        setEditingRibValue(bank.isRealUser ? bank.rib : '');
                                      }}
                                      disabled={!bank.isRealUser}
                                      title={bank.isRealUser ? undefined : "Ce partenaire n'a pas encore de compte Mumy."}
                                      className="text-[10px] text-slate-800 font-bold hover:underline disabled:cursor-not-allowed disabled:text-gray-300 disabled:no-underline"
                                    >
                                      Modifier RIB
                                    </button>
                                    {bank.isRealUser && bank.kycStatus === 'pending' && (
                                      <button
                                        onClick={() => {
                                          onUpdateUser(p.id, { bankKycStatus: 'verified' });
                                          addComplianceLog(`Dossier KYC Bancaire de ${p.name} approuvé par l'administrateur.`, 'kyc', 'success');
                                        }}
                                        className="text-[9px] text-[#008060] font-black hover:underline"
                                      >
                                        Valider KYC
                                      </button>
                                    )}
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Wire History Panel */}
                  <div className="border border-[#E1E3E5] rounded-xl overflow-hidden bg-slate-50/50">
                    <div className="p-3.5 bg-slate-100 border-b border-gray-200 text-left flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 block">Historique de Virements (B2B)</span>
                      <span className="text-[9px] font-black uppercase text-slate-500 font-mono">Bourse de virement</span>
                    </div>
                    <div className="p-3.5 space-y-3 max-h-[300px] overflow-y-auto">
                      {payoutHistory.map(h => (
                        <div key={h.id} className="p-3 bg-white rounded-lg border border-gray-200 text-left space-y-1.5 shadow-2xs">
                          <div className="flex items-center justify-between text-[10px] font-bold text-gray-400">
                            <span>📅 {h.date}</span>
                            <span className="text-emerald-700 font-mono">{h.reference}</span>
                          </div>
                          <div>
                            <span className="text-xs font-black text-slate-900 block">{h.transporterName}</span>
                            <span className="text-[9.5px] text-gray-500 block">Période : {h.period}</span>
                          </div>
                          <div className="flex justify-between items-center bg-gray-50 p-1.5 rounded font-mono text-[10px] border border-dashed border-gray-200">
                            <span className="text-gray-500">Montant Net :</span>
                            <span className="font-black text-[#008060]">{h.netAmount.toLocaleString()} DHS</span>
                          </div>
                          <div className="flex justify-between items-center text-[9px]">
                            <span className="text-gray-400">RIB: {h.rib.slice(0, 4)}...{h.rib.slice(-4)}</span>
                            <button
                              onClick={() => setSelectedStatementPayout(h)}
                              className="text-[#008060] font-bold hover:underline flex items-center gap-0.5"
                            >
                              <FileDown className="h-3 w-3" />
                              Facture PDF
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: PLANNING CONFIG & PDF GENERATOR */}
            {payoutTab === 'config' && (
              <div className="space-y-6 animate-fade-in text-left">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Configurer reversements */}
                  <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
                    <div className="flex items-center gap-2 border-b pb-2">
                      <Settings className="h-4 w-4 text-slate-800" />
                      <span className="text-xs font-black text-slate-900">Paramètres de Planification Automatique</span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-black text-gray-500 uppercase">Calendrier de Reversement Bancaire</label>
                        <div className="grid grid-cols-2 gap-2 mt-1.5">
                          <label className={`border rounded-lg p-3 flex flex-col cursor-pointer transition ${payoutSchedule === 'weekly' ? 'border-[#008060] bg-[#EBF5F1]/30' : 'border-gray-200 hover:bg-gray-50'}`}>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="radio"
                                name="schedule"
                                value="weekly"
                                checked={payoutSchedule === 'weekly'}
                                onChange={() => {
                                  setPayoutSchedule('weekly');
                                  addComplianceLog("Calendrier configuré sur Hebdomadaire automatique (Chaque Vendredi).", "billing", "info");
                                }}
                                className="text-[#008060]"
                              />
                              <span className="text-xs font-bold text-slate-900">Hebdomadaire</span>
                            </div>
                            <span className="text-[9px] text-gray-400 mt-1 block">Règlement automatique tous les vendredis à 14:00 UTC pour les comptes validés.</span>
                          </label>

                          <label className={`border rounded-lg p-3 flex flex-col cursor-pointer transition ${payoutSchedule === 'request' ? 'border-[#008060] bg-[#EBF5F1]/30' : 'border-gray-200 hover:bg-gray-50'}`}>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="radio"
                                name="schedule"
                                value="request"
                                checked={payoutSchedule === 'request'}
                                onChange={() => {
                                  setPayoutSchedule('request');
                                  addComplianceLog("Calendrier configuré sur Demande manuelle par le partenaire.", "billing", "info");
                                }}
                                className="text-[#008060]"
                              />
                              <span className="text-xs font-bold text-slate-900">Sur Demande</span>
                            </div>
                            <span className="text-[9px] text-gray-400 mt-1 block">Les transporteurs demandent eux-mêmes leur reversement via leur tableau de bord.</span>
                          </label>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-black text-gray-500 uppercase">Seuil Minimum de Virement (DHS)</label>
                        <div className="flex gap-2 mt-1">
                          <input
                            type="number"
                            min="100"
                            step="100"
                            value={minPayoutThreshold}
                            onChange={(e) => setMinPayoutThreshold(Number(e.target.value))}
                            className="px-3 py-1.5 text-xs rounded-lg border border-gray-300 w-32 bg-white text-gray-800 font-mono"
                          />
                          <button
                            onClick={() => {
                              addComplianceLog(`Seuil minimum de reversement mis à jour : ${minPayoutThreshold} DHS.`, 'billing', 'success');
                              alert(`Seuil minimum enregistré : ${minPayoutThreshold} DHS.`);
                            }}
                            className="px-3.5 py-1.5 bg-slate-950 text-white font-bold text-xs rounded-lg hover:bg-slate-800 transition cursor-pointer"
                          >
                            Enregistrer
                          </button>
                        </div>
                        <span className="text-[9px] text-gray-400 mt-1 block">Protège la plateforme contre les frais de virement bancaire sur de trop petites sommes.</span>
                      </div>
                    </div>
                  </div>

                  {/* Relevé PDF Generator mockup */}
                  <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 border-b pb-2">
                        <FileDown className="h-4 w-4 text-[#008060]" />
                        <span className="text-xs font-black text-slate-900">Générateur de Relevés Comptables Mensuels</span>
                      </div>
                      <p className="text-[10px] text-gray-500">Sélectionnez un transporteur partenaire pour modéliser et exporter son relevé consolidé au format comptable légal.</p>
                      
                      <div className="space-y-2">
                        <div>
                          <label className="block text-[9px] font-bold text-gray-400 uppercase">Partenaire</label>
                          <select className="w-full mt-1 px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 bg-white text-slate-800">
                            {collaboratorPayouts.map(p => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-gray-400 uppercase">Période du Relevé</label>
                          <select className="w-full mt-1 px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 bg-white text-slate-800">
                            <option value="current">Juillet 2026 (Mois en cours)</option>
                            <option value="last">Juin 2026 (Consolidé)</option>
                            <option value="may">Mai 2026 (Consolidé)</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Builds a consolidated statement from the period's real figures. It
                        used to open a fixed 72 000 DHS statement for "Atlas Trans" whatever
                        the console actually contained. */}
                    <button
                      onClick={() => {
                        if (collaboratorPayouts.length === 0) {
                          addComplianceLog(
                            "Relevé consolidé impossible : aucune transaction enregistrée sur la période.",
                            'billing',
                            'warning'
                          );
                          return;
                        }
                        const gross = collaboratorPayouts.reduce((sum, p) => sum + p.totalSales, 0);
                        const commission = collaboratorPayouts.reduce((sum, p) => sum + p.commission, 0);
                        setSelectedStatementPayout({
                          id: 'releve-consolide',
                          date: new Date().toISOString().split('T')[0],
                          transporterId: '',
                          transporterName: `${collaboratorPayouts.length} partenaire(s)`,
                          amount: gross,
                          commission,
                          netAmount: gross - commission,
                          status: 'success',
                          reference: `RELEVE-CONSOLIDE-${new Date().toISOString().slice(0, 7)}`,
                          rib: '—',
                          period: `Relevé consolidé arrêté au ${new Date().toLocaleDateString('fr-FR')}`
                        });
                        addComplianceLog('Relevé financier consolidé généré.', 'billing', 'success');
                      }}
                      className="w-full py-2 bg-[#008060] hover:bg-[#006e52] text-white text-xs font-bold rounded-lg transition text-center flex items-center justify-center gap-1 cursor-pointer mt-4"
                    >
                      <FileDown className="h-4 w-4" />
                      Générer & Télécharger Relevé PDF
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: WIRE ANOMALIES & DISPUTES */}
            {payoutTab === 'anomalies' && (
              <div className="space-y-6 animate-fade-in text-left">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Anomalies de virement (rejets bancaires) */}
                  <div className="rounded-xl border border-red-200 bg-red-50/20 p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-red-200 pb-2">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-600 animate-bounce" />
                        <span className="text-xs font-black text-red-950">Anomalies de Payout & Rejets Bancaires</span>
                      </div>
                      <span className="text-[9px] font-bold uppercase tracking-wide bg-red-100 text-red-800 px-1.5 rounded">Rejet API</span>
                    </div>

                    {payoutAnomalies.length === 0 ? (
                      <p className="text-xs text-gray-400 py-6 text-center font-medium">Aucune anomalie de reversement détectée sur le réseau bancaire.</p>
                    ) : (
                      <div className="space-y-3">
                        {payoutAnomalies.map(an => (
                          <div key={an.id} className="p-3.5 bg-white border border-red-200 rounded-lg space-y-2 relative shadow-2xs">
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="font-mono text-gray-400">{an.date}</span>
                              <span className="font-bold text-red-600 uppercase tracking-wide text-[9px] bg-red-50 px-1 py-0.5 rounded border border-red-100">
                                {an.status === 'failed' ? 'Rejet Bank' : 'Traitement...'}
                              </span>
                            </div>
                            <div>
                              <span className="text-xs font-black text-slate-950 block">{an.transporterName}</span>
                              <span className="text-[9.5px] text-gray-500 font-mono">RIB erroné : {an.rib}</span>
                            </div>
                            <div className="bg-red-50/50 p-2 rounded text-[10px] text-red-800 font-medium border border-red-100/50">
                              ⚠️ <span className="font-bold">Motif :</span> {an.reason}
                            </div>
                            <div className="flex justify-between items-center bg-slate-50 px-2 py-1.5 rounded font-mono text-[10px]">
                              <span className="text-gray-500">Montant Rejeté :</span>
                              <span className="font-black text-slate-900">{an.amount.toLocaleString()} DHS</span>
                            </div>
                            <div className="flex justify-end gap-1.5 pt-1">
                              <button
                                onClick={() => {
                                  // Open edit rib
                                  setEditingRibPartnerId(an.transporterId);
                                  setEditingBankName("Veuillez changer de Banque");
                                  setEditingRibValue("");
                                  setPayoutTab('carriers');
                                  alert(`Veuillez saisir les coordonnées corrigées pour ${an.transporterName} dans l'onglet "KYC & RIB".`);
                                }}
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-[9px] rounded transition"
                              >
                                Modifier RIB
                              </button>
                              <button
                                onClick={() => {
                                  // Simulate correction
                                  setPayoutAnomalies(prev => prev.filter(item => item.id !== an.id));
                                  // Save to payoutHistory
                                  setPayoutHistory(prev => [
                                    {
                                      id: `pay-${Date.now()}`,
                                      date: '2026-07-17',
                                      transporterId: an.transporterId,
                                      transporterName: an.transporterName,
                                      amount: an.amount * 1.25, // public seed sales
                                      commission: Math.round(an.amount * 0.25),
                                      netAmount: an.amount,
                                      status: 'success',
                                      reference: 'VIR-FORCE-MAN',
                                      rib: an.rib,
                                      period: 'Règlement forcé après incident'
                                    },
                                    ...prev
                                  ]);
                                  addComplianceLog(`Anomalie résolue : Le virement de ${an.amount} DHS pour ${an.transporterName} a été forcé manuellement après confirmation du service de conformité.`, 'billing', 'success');
                                  alert("Virement relancé avec succès. Statut résolu.");
                                }}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[9px] rounded transition"
                              >
                                Forcer Relance
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Litiges et ajustements post-reversement */}
                  <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
                    <div className="flex items-center justify-between border-b pb-2">
                      <div className="flex items-center gap-2">
                        <BadgeHelp className="h-4 w-4 text-amber-500" />
                        <span className="text-xs font-black text-slate-900">Litiges, Ajustements & Remboursements</span>
                      </div>
                      <span className="text-[9px] font-bold uppercase tracking-wide bg-slate-100 text-slate-700 px-1.5 rounded">Post-Vente</span>
                    </div>

                    <div className="space-y-3">
                      {payoutDisputes.map(disp => (
                        <div key={disp.id} className="p-3 bg-slate-50 border rounded-lg space-y-2 relative text-left">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="font-mono text-gray-400">📅 {disp.date}</span>
                            <span className={`font-black uppercase text-[8.5px] px-1.5 py-0.5 rounded ${
                              disp.status === 'open' ? 'bg-amber-100 text-amber-800' : 
                              disp.status === 'deducted_next_payout' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {disp.status === 'open' ? '⚠️ En cours' : 
                               disp.status === 'deducted_next_payout' ? '✂️ Déduit du Payout' : '✓ Résolu'}
                            </span>
                          </div>

                          <div>
                            <span className="text-xs font-black text-slate-950 block">{disp.transporterName}</span>
                            <span className="text-[10px] text-gray-500 font-medium block">Commande : <span className="font-mono">{disp.bookingId}</span></span>
                          </div>

                          <p className="text-[10px] text-gray-600 leading-relaxed bg-white p-2 rounded border border-gray-200">
                            <span className="font-bold text-gray-800">{disp.type} :</span> {disp.description}
                          </p>

                          <div className="flex justify-between items-center bg-white border border-gray-100 p-2 rounded font-mono text-[10.5px]">
                            <span className="text-gray-500 font-sans text-[10px]">Impact Financier (Retenue) :</span>
                            <span className="font-black text-red-600">-{disp.amount.toLocaleString()} DHS</span>
                          </div>

                          {disp.status === 'open' && (
                            <div className="flex justify-end gap-1.5 pt-1">
                              <button
                                onClick={() => {
                                  // Close dispute
                                  setPayoutDisputes(prev => prev.map(d => d.id === disp.id ? { ...d, status: 'closed_no_action' } : d));
                                  addComplianceLog(`Litige #${disp.id} clos pour ${disp.transporterName} sans impact financier.`, 'billing', 'info');
                                }}
                                className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-[9px] rounded transition"
                              >
                                Rejeter Réclamation
                              </button>
                              <button
                                onClick={() => {
                                  // Deduct from payout
                                  setPayoutDisputes(prev => prev.map(d => d.id === disp.id ? { ...d, status: 'deducted_next_payout' } : d));
                                  addComplianceLog(`Remboursement accordé au voyageur pour le litige #${disp.id} : -${disp.amount} DHS déduits du prochain virement de ${disp.transporterName}.`, 'billing', 'success');
                                  alert(`Retenue de ${disp.amount} DHS appliquée avec succès sur le prochain virement de ce transporteur !`);
                                }}
                                className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white font-bold text-[9px] rounded transition"
                              >
                                Valider la Déduction (80%)
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STATEMENT PDF PREVIEW DIALOG / OVERLAY */}
            {selectedStatementPayout && (
              <div className="fixed inset-0 bg-[#1A1A1A]/80 backdrop-blur-md flex items-center justify-center z-55 p-4 animate-fade-in">
                <div className="bg-white rounded-2xl border border-gray-300 w-full max-w-xl shadow-2xl overflow-hidden flex flex-col text-xs text-slate-900 max-h-[90vh]">
                  
                  {/* Header */}
                  <div className="p-4 bg-slate-900 border-b border-slate-950 flex justify-between items-center text-white shrink-0">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-emerald-400" />
                      <div>
                        <span className="font-black uppercase tracking-wider text-[9px] text-slate-400 block">RELEVÉ DE COMPTE / FACTURE PDF</span>
                        <span className="font-bold text-xs">Aperçu du relevé officiel consolidé</span>
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setSelectedStatementPayout(null)}
                      className="text-slate-400 hover:text-white font-black bg-slate-800 h-7 w-7 rounded-full flex items-center justify-center cursor-pointer text-xs"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Body PDF printable page style */}
                  <div className="p-8 overflow-y-auto space-y-6 text-left bg-[#FCFCFD] select-text">
                    {/* Invoice header */}
                    <div className="flex justify-between items-start border-b pb-6">
                      <div>
                        <h2 className="text-lg font-black text-slate-900 tracking-tight">MUMY EXPRESS TECH</h2>
                        <span className="text-[10px] text-gray-500 block font-mono">FINANCIAL SETTLEMENTS & ESCROW DEPT</span>
                        <p className="text-[9.5px] text-gray-500 mt-1">
                          Bd Abdelmoumen, Casablanca, Maroc<br />
                          Contact: finance@mumy-express.com
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-black text-[#008060] block">RELEVÉ DE COMPTE</span>
                        <span className="font-mono text-[10px] text-gray-500 font-bold block">Réf : {selectedStatementPayout.reference}</span>
                        <span className="text-[9.5px] text-gray-400 block">Émis le : {selectedStatementPayout.date}</span>
                      </div>
                    </div>

                    {/* Partner and Bank details */}
                    <div className="grid grid-cols-2 gap-4 text-[10.5px]">
                      <div className="p-3 bg-slate-50 border rounded-lg">
                        <span className="text-[8.5px] font-bold text-gray-400 uppercase tracking-wider block">Bénéficiaire Partenaire B2B</span>
                        <strong className="text-slate-950 text-xs block mt-0.5">{selectedStatementPayout.transporterName}</strong>
                        <span className="text-gray-500 block">ID Fournisseur : {selectedStatementPayout.transporterId}</span>
                        <span className="text-gray-500 block">Coopération Touristique Mumy</span>
                      </div>
                      <div className="p-3 bg-slate-50 border rounded-lg font-mono">
                        <span className="text-[8.5px] font-bold text-gray-400 uppercase tracking-wider block">Coordonnées Bancaires de Virement</span>
                        <strong className="text-slate-950 block text-[10px] mt-0.5">{selectedStatementPayout.rib.split(' ')[0]}</strong>
                        <span className="text-slate-700 block text-[10px] truncate">RIB : {selectedStatementPayout.rib}</span>
                        <span className="text-gray-400 block text-[9px]">Statut KYC de la Banque : APPROUVÉ ✓</span>
                      </div>
                    </div>

                    {/* Settlement summary table */}
                    <div className="space-y-2">
                      <span className="text-[9.5px] font-bold text-gray-400 uppercase tracking-wider block">Décompte Financier de la Période</span>
                      <div className="border rounded-lg overflow-hidden bg-white">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b bg-gray-50 text-[10px] font-bold text-gray-500 uppercase">
                              <th className="py-2 px-3">Description du flux</th>
                              <th className="py-2 px-3 text-right">Montant Public (Brut)</th>
                              <th className="py-2 px-3 text-right text-amber-700">Commission Mumy (20%)</th>
                              <th className="py-2 px-3 text-right text-[#008060]">Reversement Net (80%)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y font-mono">
                            <tr>
                              <td className="py-2.5 px-3 font-sans font-bold text-slate-800">
                                Vente d'excursions & navettes touristiques consolidées
                                <span className="text-[9px] text-gray-400 block font-normal font-sans">{selectedStatementPayout.period}</span>
                              </td>
                              <td className="py-2.5 px-3 text-right text-gray-700">{selectedStatementPayout.amount.toLocaleString()} DHS</td>
                              <td className="py-2.5 px-3 text-right text-amber-600">-{selectedStatementPayout.commission.toLocaleString()} DHS</td>
                              <td className="py-2.5 px-3 text-right text-emerald-600 font-bold">{selectedStatementPayout.netAmount.toLocaleString()} DHS</td>
                            </tr>
                            <tr className="bg-emerald-50/50 font-sans text-xs">
                              <td colSpan={3} className="py-3 px-3 text-right font-black text-slate-900">MONTANT NET TOTAL TRANSFÉRÉ :</td>
                              <td className="py-3 px-3 text-right font-black text-[#008060] font-mono text-sm">{selectedStatementPayout.netAmount.toLocaleString()} DHS</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Legal disclaimer and stamps */}
                    <div className="flex justify-between items-center border-t pt-6 text-[9px] text-gray-400">
                      <div>
                        <p>✓ Opération de transfert interbancaire certifiée conforme par Mumy Express.</p>
                        <p>Ce document fait office d'accord de facturation tiers et de reversement de commission.</p>
                      </div>
                      <div className="text-center">
                        <span className="text-[8px] font-bold uppercase text-slate-500 block">Cachet Mumy Finance</span>
                        <div className="mt-1 h-14 w-14 rounded-full border border-dashed border-emerald-500 flex items-center justify-center mx-auto text-[7px] font-black text-emerald-600 uppercase tracking-widest rotate-6 animate-pulse bg-emerald-50/50 p-1 leading-normal">
                          MUMY PAID APPROVED
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="p-4 bg-slate-50 border-t flex justify-end gap-2 shrink-0">
                    <button
                      onClick={() => window.print()}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer"
                    >
                      <FileDown className="h-4 w-4" />
                      Imprimer / Enregistrer PDF
                    </button>
                    <button
                      onClick={() => setSelectedStatementPayout(null)}
                      className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold rounded-lg transition cursor-pointer"
                    >
                      Fermer l'Aperçu
                    </button>
                  </div>

                </div>
              </div>
            )}

          </div>
        );
      })()}

      {/* 1. Real-Time Sentiment Alerts Row */}
      {sentimentAlerts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-red-600" />
            <h3 className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider">
              Analyse de sentiment en temps réel (IA Gemini)
            </h3>
          </div>
          <div className="grid gap-3">
            {sentimentAlerts.map(alert => (
              <div 
                key={alert.id}
                className="flex items-start justify-between gap-4 rounded-xl bg-red-50/50 p-4 border border-red-200/80 animate-pulse"
              >
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-red-950">{alert.message}</p>
                    <p className="text-[10px] text-red-700 mt-1 font-medium leading-relaxed">
                      Canal de Chat: <span className="font-mono bg-red-100/50 px-1 py-0.5 rounded">{alert.chatId}</span> • <span className="font-bold text-red-800">Recommandation IA :</span> Proposer immédiatement au client une réaffectation gratuite ou un remboursement partiel.
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-red-600 shrink-0 uppercase tracking-widest bg-red-100 px-2 py-0.5 rounded">Live</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Main Admin Operations Grid */}
      <div className="grid gap-8 lg:grid-cols-12">
        
        {/* Users Management / KYC - 7 cols */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-xl bg-white p-5 border border-[#E1E3E5] shadow-xs">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-[#008060]" />
                <h3 className="font-sans text-sm font-bold text-[#1A1A1A]">Gestion des Comptes & KYC Fournisseurs</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAddUserForm(!showAddUserForm)}
                  className="rounded-lg bg-slate-900 hover:bg-black px-3 py-1.5 text-[11px] font-bold text-white transition shadow-xs cursor-pointer flex items-center gap-1"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  {showAddUserForm ? 'Fermer Formulaire' : 'Ajouter Manuel'}
                </button>
                <span className="rounded-full bg-emerald-50 border border-[#BBE3D1] px-2.5 py-0.5 text-xs font-bold text-[#008060]">
                  {users.length} Utilisateurs
                </span>
              </div>
            </div>

            {/* Manual user creation form */}
            {showAddUserForm && (
              <form onSubmit={handleAddUserSubmit} className="mb-6 rounded-xl border border-dashed border-[#BBE3D1] p-4 bg-[#EBF5F1]/30 space-y-4 animate-fade-in">
                <div className="flex items-center justify-between border-b border-[#BBE3D1] pb-2">
                  <span className="text-xs font-bold text-[#008060] flex items-center gap-1.5">
                    <UserPlus className="h-4 w-4" />
                    Ajouter manuellement un partenaire (Transmetteur, Client ou Chauffeur)
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-[#6D7175] uppercase tracking-wider">Rôle du Nouveau Compte</label>
                    <select
                      value={addUserForm.role}
                      onChange={(e) => setAddUserForm({...addUserForm, role: e.target.value as any})}
                      className="mt-1 w-full rounded-lg border border-[#E1E3E5] p-2 text-xs text-[#1A1A1A] bg-white focus:outline-none"
                    >
                      <option value="transporter">Transporteur Touristique (Fournisseur)</option>
                      <option value="client">Client Professionnel (Hôtel / Agence / Riad)</option>
                      <option value="driver">Chauffeur Privé</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#6D7175] uppercase tracking-wider">Statut d'Accès Initial</label>
                    <select
                      value={addUserForm.status}
                      onChange={(e) => setAddUserForm({...addUserForm, status: e.target.value as any})}
                      className="mt-1 w-full rounded-lg border border-[#E1E3E5] p-2 text-xs text-[#1A1A1A] bg-white focus:outline-none"
                    >
                      <option value="pending">En attente de KYC</option>
                      <option value="verified">Vérifié d'office (Certifié Mumy)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-[#6D7175] uppercase tracking-wider">Nom du Responsable / Chauffeur</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Hassan El Mansouri"
                      value={addUserForm.name}
                      onChange={(e) => setAddUserForm({...addUserForm, name: e.target.value})}
                      className="mt-1 w-full rounded-lg border border-[#E1E3E5] p-2 text-xs text-[#1A1A1A] bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#6D7175] uppercase tracking-wider">Adresse E-mail</label>
                    <input
                      type="email"
                      required
                      placeholder="hassan@entreprise.ma"
                      value={addUserForm.email}
                      onChange={(e) => setAddUserForm({...addUserForm, email: e.target.value})}
                      className="mt-1 w-full rounded-lg border border-[#E1E3E5] p-2 text-xs text-[#1A1A1A] bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-[#6D7175] uppercase tracking-wider">N° de Téléphone (WhatsApp)</label>
                    <input
                      type="text"
                      placeholder="+212 6 00 00 00 00"
                      value={addUserForm.phone}
                      onChange={(e) => setAddUserForm({...addUserForm, phone: e.target.value})}
                      className="mt-1 w-full rounded-lg border border-[#E1E3E5] p-2 text-xs text-[#1A1A1A] bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#6D7175] uppercase tracking-wider">Nom de l'Entreprise / Affiliation</label>
                    <input
                      type="text"
                      placeholder="e.g. Mansouri Cars S.A.R.L"
                      value={addUserForm.companyName}
                      onChange={(e) => setAddUserForm({...addUserForm, companyName: e.target.value})}
                      className="mt-1 w-full rounded-lg border border-[#E1E3E5] p-2 text-xs text-[#1A1A1A] bg-white focus:outline-none"
                    />
                  </div>
                </div>

                {addUserForm.role === 'transporter' && (
                  <div className="border-t border-[#BBE3D1] pt-3 space-y-3">
                    <p className="text-[10px] font-bold text-[#008060] uppercase tracking-wider">Informations Légales & Fiscales Obligatoires (Maroc)</p>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[9px] font-bold text-[#6D7175]">ICE (15 chiffres)</label>
                        <input
                          type="text"
                          placeholder="ICE de l'entreprise"
                          value={addUserForm.ice}
                          onChange={(e) => setAddUserForm({...addUserForm, ice: e.target.value})}
                          className="mt-1 w-full rounded-lg border border-[#E1E3E5] p-1.5 text-xs font-mono text-[#1A1A1A] bg-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-[#6D7175]">N° Patente</label>
                        <input
                          type="text"
                          placeholder="Patente de l'entreprise"
                          value={addUserForm.patente}
                          onChange={(e) => setAddUserForm({...addUserForm, patente: e.target.value})}
                          className="mt-1 w-full rounded-lg border border-[#E1E3E5] p-1.5 text-xs font-mono text-[#1A1A1A] bg-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-[#6D7175]">N° RC</label>
                        <input
                          type="text"
                          placeholder="N° Registre Commerce"
                          value={addUserForm.rc}
                          onChange={(e) => setAddUserForm({...addUserForm, rc: e.target.value})}
                          className="mt-1 w-full rounded-lg border border-[#E1E3E5] p-1.5 text-xs font-mono text-[#1A1A1A] bg-white focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] font-bold text-[#6D7175]">Identifiant Fiscal (I.F.)</label>
                        <input
                          type="text"
                          placeholder="I.F. de l'entreprise"
                          value={addUserForm.ifFiscal}
                          onChange={(e) => setAddUserForm({...addUserForm, ifFiscal: e.target.value})}
                          className="mt-1 w-full rounded-lg border border-[#E1E3E5] p-1.5 text-xs font-mono text-[#1A1A1A] bg-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-[#6D7175]">Affiliation CNSS</label>
                        <input
                          type="text"
                          placeholder="N° Affiliation"
                          value={addUserForm.cnss}
                          onChange={(e) => setAddUserForm({...addUserForm, cnss: e.target.value})}
                          className="mt-1 w-full rounded-lg border border-[#E1E3E5] p-1.5 text-xs font-mono text-[#1A1A1A] bg-white focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {addUserForm.role === 'driver' && (
                  <div className="border-t border-[#BBE3D1] pt-3">
                    <label className="block text-[10px] font-bold text-[#6D7175] uppercase tracking-wider">Note d'évaluation de départ (1.0 à 5.0)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      max="5"
                      value={addUserForm.driverRating}
                      onChange={(e) => setAddUserForm({...addUserForm, driverRating: Number(e.target.value)})}
                      className="mt-1 w-24 rounded-lg border border-[#E1E3E5] p-2 text-xs font-mono text-[#1A1A1A] bg-white focus:outline-none"
                    />
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddUserForm(false)}
                    className="rounded-lg border border-[#E1E3E5] bg-white px-3 py-1.5 text-xs font-bold text-[#6D7175] hover:bg-[#F6F6F7] cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-[#008060] border border-[#008060] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#006e52] cursor-pointer"
                  >
                    Enregistrer le Nouveau Compte
                  </button>
                </div>
              </form>
            )}

            {/* Interactive KYC detailed review panel */}
            {selectedKycUser && (
              <div className="mb-6 rounded-xl border-2 border-[#008060]/30 p-5 bg-[#EBF5F1]/10 space-y-4 animate-fade-in">
                <div className="flex justify-between items-start border-b border-[#E1E3E5] pb-3">
                  <div className="flex items-center gap-3">
                    <img src={selectedKycUser.avatarUrl} className="h-10 w-10 rounded-full border border-[#E1E3E5] object-cover" />
                    <div>
                      <h4 className="font-bold text-sm text-[#1A1A1A]">{selectedKycUser.name}</h4>
                      <p className="text-[11px] text-[#6D7175] font-semibold">
                        {selectedKycUser.companyName || 'Indépendant'} • {selectedKycUser.email} • {selectedKycUser.phone}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedKycUser(null)}
                    className="text-[10px] font-bold text-[#6D7175] hover:text-[#1A1A1A] bg-white px-2.5 py-1 rounded-md border border-[#E1E3E5] shadow-xs cursor-pointer"
                  >
                    Masquer Dossier
                  </button>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-bold text-[#1A1A1A] uppercase tracking-wider flex items-center gap-1.5">
                    <ClipboardList className="h-4 w-4 text-[#008060]" />
                    Processus de validation KYC complet (4 documents réglementaires marocains)
                  </p>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {/* Document 1: Licence */}
                    <div className="rounded-lg bg-white p-3 border border-[#E1E3E5] space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-bold text-[#1A1A1A]">1. Licence de Transport</span>
                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${
                          selectedKycUser.kycLicenceStatus === 'verified' ? 'bg-[#EBF5F1] text-[#008060]' :
                          selectedKycUser.kycLicenceStatus === 'pending' ? 'bg-amber-100 text-amber-800' :
                          selectedKycUser.kycLicenceStatus === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {selectedKycUser.kycLicenceStatus === 'verified' ? 'Vérifié' :
                           selectedKycUser.kycLicenceStatus === 'pending' ? 'En attente' :
                           selectedKycUser.kycLicenceStatus === 'rejected' ? 'Rejeté' : 'Non fourni'}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#6D7175] font-mono truncate">{selectedKycUser.kycLicenceUrl || 'Licence_Transport_Tourist.pdf'}</p>
                      <div className="flex gap-1.5 justify-between items-center w-full">
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              onUpdateUser(selectedKycUser.id, { kycLicenceStatus: 'verified' });
                              setSelectedKycUser({...selectedKycUser, kycLicenceStatus: 'verified'});
                              addComplianceLog(`Licence de transport validée pour ${selectedKycUser.name}`, 'kyc', 'success');
                            }}
                            className="bg-[#EBF5F1] text-[#008060] border border-[#BBE3D1] hover:bg-[#d8edd3] px-2 py-0.5 rounded text-[9px] font-bold cursor-pointer"
                          >
                            Valider
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onUpdateUser(selectedKycUser.id, { kycLicenceStatus: 'rejected' });
                              setSelectedKycUser({...selectedKycUser, kycLicenceStatus: 'rejected'});
                              addComplianceLog(`Licence de transport rejetée pour ${selectedKycUser.name}`, 'kyc', 'warning');
                            }}
                            className="bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 px-2 py-0.5 rounded text-[9px] font-bold cursor-pointer"
                          >
                            Rejeter
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedDocPreview({ type: 'licence', user: selectedKycUser })}
                          className="bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 px-2 py-0.5 rounded text-[9px] font-bold cursor-pointer inline-flex items-center gap-0.5"
                        >
                          <Eye className="h-3 w-3" /> Visualiser
                        </button>
                      </div>
                    </div>

                    {/* Document 2: RC */}
                    <div className="rounded-lg bg-white p-3 border border-[#E1E3E5] space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-bold text-[#1A1A1A]">2. Registre de Commerce (RC)</span>
                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${
                          selectedKycUser.kycRcStatus === 'verified' ? 'bg-[#EBF5F1] text-[#008060]' :
                          selectedKycUser.kycRcStatus === 'pending' ? 'bg-amber-100 text-amber-800' :
                          selectedKycUser.kycRcStatus === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {selectedKycUser.kycRcStatus === 'verified' ? 'Vérifié' :
                           selectedKycUser.kycRcStatus === 'pending' ? 'En attente' :
                           selectedKycUser.kycRcStatus === 'rejected' ? 'Rejeté' : 'Non fourni'}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#6D7175] font-mono truncate">N° RC : {selectedKycUser.rc || '98455-Marrakech'}</p>
                      <div className="flex gap-1.5 justify-between items-center w-full">
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              onUpdateUser(selectedKycUser.id, { kycRcStatus: 'verified' });
                              setSelectedKycUser({...selectedKycUser, kycRcStatus: 'verified'});
                              addComplianceLog(`Registre de Commerce (RC) validé pour ${selectedKycUser.name}`, 'kyc', 'success');
                            }}
                            className="bg-[#EBF5F1] text-[#008060] border border-[#BBE3D1] hover:bg-[#d8edd3] px-2 py-0.5 rounded text-[9px] font-bold cursor-pointer"
                          >
                            Valider
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onUpdateUser(selectedKycUser.id, { kycRcStatus: 'rejected' });
                              setSelectedKycUser({...selectedKycUser, kycRcStatus: 'rejected'});
                              addComplianceLog(`Registre de Commerce (RC) rejeté pour ${selectedKycUser.name}`, 'kyc', 'warning');
                            }}
                            className="bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 px-2 py-0.5 rounded text-[9px] font-bold cursor-pointer"
                          >
                            Rejeter
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedDocPreview({ type: 'rc', user: selectedKycUser })}
                          className="bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 px-2 py-0.5 rounded text-[9px] font-bold cursor-pointer inline-flex items-center gap-0.5"
                        >
                          <Eye className="h-3 w-3" /> Visualiser
                        </button>
                      </div>
                    </div>

                    {/* Document 3: Assurance Passagers */}
                    <div className="rounded-lg bg-white p-3 border border-[#E1E3E5] space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-bold text-[#1A1A1A]">3. Assurance Passagers</span>
                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${
                          selectedKycUser.kycInsuranceStatus === 'verified' ? 'bg-[#EBF5F1] text-[#008060]' :
                          selectedKycUser.kycInsuranceStatus === 'pending' ? 'bg-amber-100 text-amber-800' :
                          selectedKycUser.kycInsuranceStatus === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {selectedKycUser.kycInsuranceStatus === 'verified' ? 'Vérifié' :
                           selectedKycUser.kycInsuranceStatus === 'pending' ? 'En attente' :
                           selectedKycUser.kycInsuranceStatus === 'rejected' ? 'Rejeté' : 'Non fourni'}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#6D7175] font-mono truncate">{selectedKycUser.kycInsuranceUrl || 'Assurance_Transport_Voyageurs.pdf'}</p>
                      <div className="flex gap-1.5 justify-between items-center w-full">
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              onUpdateUser(selectedKycUser.id, { kycInsuranceStatus: 'verified' });
                              setSelectedKycUser({...selectedKycUser, kycInsuranceStatus: 'verified'});
                              addComplianceLog(`Assurance passagers validée pour ${selectedKycUser.name}`, 'kyc', 'success');
                            }}
                            className="bg-[#EBF5F1] text-[#008060] border border-[#BBE3D1] hover:bg-[#d8edd3] px-2 py-0.5 rounded text-[9px] font-bold cursor-pointer"
                          >
                            Valider
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onUpdateUser(selectedKycUser.id, { kycInsuranceStatus: 'rejected' });
                              setSelectedKycUser({...selectedKycUser, kycInsuranceStatus: 'rejected'});
                              addComplianceLog(`Assurance passagers rejetée pour ${selectedKycUser.name}`, 'kyc', 'warning');
                            }}
                            className="bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 px-2 py-0.5 rounded text-[9px] font-bold cursor-pointer"
                          >
                            Rejeter
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedDocPreview({ type: 'insurance', user: selectedKycUser })}
                          className="bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 px-2 py-0.5 rounded text-[9px] font-bold cursor-pointer inline-flex items-center gap-0.5"
                        >
                          <Eye className="h-3 w-3" /> Visualiser
                        </button>
                      </div>
                    </div>

                    {/* Document 4: Patente */}
                    <div className="rounded-lg bg-white p-3 border border-[#E1E3E5] space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-bold text-[#1A1A1A]">4. Patente & I.F.</span>
                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${
                          selectedKycUser.kycPatenteStatus === 'verified' ? 'bg-[#EBF5F1] text-[#008060]' :
                          selectedKycUser.kycPatenteStatus === 'pending' ? 'bg-amber-100 text-amber-800' :
                          selectedKycUser.kycPatenteStatus === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {selectedKycUser.kycPatenteStatus === 'verified' ? 'Vérifié' :
                           selectedKycUser.kycPatenteStatus === 'pending' ? 'En attente' :
                           selectedKycUser.kycPatenteStatus === 'rejected' ? 'Rejeté' : 'Non fourni'}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#6D7175] font-mono truncate">N° Patente : {selectedKycUser.patente || '45879621'}</p>
                      <div className="flex gap-1.5 justify-between items-center w-full">
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              onUpdateUser(selectedKycUser.id, { kycPatenteStatus: 'verified' });
                              setSelectedKycUser({...selectedKycUser, kycPatenteStatus: 'verified'});
                              addComplianceLog(`Attestation Patente validée pour ${selectedKycUser.name}`, 'kyc', 'success');
                            }}
                            className="bg-[#EBF5F1] text-[#008060] border border-[#BBE3D1] hover:bg-[#d8edd3] px-2 py-0.5 rounded text-[9px] font-bold cursor-pointer"
                          >
                            Valider
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onUpdateUser(selectedKycUser.id, { kycPatenteStatus: 'rejected' });
                              setSelectedKycUser({...selectedKycUser, kycPatenteStatus: 'rejected'});
                              addComplianceLog(`Attestation Patente rejetée pour ${selectedKycUser.name}`, 'kyc', 'warning');
                            }}
                            className="bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 px-2 py-0.5 rounded text-[9px] font-bold cursor-pointer"
                          >
                            Rejeter
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedDocPreview({ type: 'patente', user: selectedKycUser })}
                          className="bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 px-2 py-0.5 rounded text-[9px] font-bold cursor-pointer inline-flex items-center gap-0.5"
                        >
                          <Eye className="h-3 w-3" /> Visualiser
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Summary Business IDs */}
                  <div className="rounded-lg bg-white p-3 border border-[#E1E3E5] text-[10px] grid grid-cols-2 md:grid-cols-4 gap-2 text-[#6D7175]">
                    {/* Never fall back to specimen numbers on a KYC screen: an administrator
                        approving a dossier must see exactly what the transporter declared,
                        including the blanks. */}
                    <div><span className="font-bold text-[#1A1A1A]">ICE:</span> <span className="font-mono">{selectedKycUser.ice || <em className="text-amber-700 not-italic font-bold">non déclaré</em>}</span></div>
                    <div><span className="font-bold text-[#1A1A1A]">R.C.:</span> <span className="font-mono">{selectedKycUser.rc || <em className="text-amber-700 not-italic font-bold">non déclaré</em>}</span></div>
                    <div><span className="font-bold text-[#1A1A1A]">Patente:</span> <span className="font-mono">{selectedKycUser.patente || <em className="text-amber-700 not-italic font-bold">non déclarée</em>}</span></div>
                    <div><span className="font-bold text-[#1A1A1A]">I.F.:</span> <span className="font-mono">{selectedKycUser.ifFiscal || <em className="text-amber-700 not-italic font-bold">non déclaré</em>}</span></div>
                  </div>

                  {selectedKycUser.role === 'transporter' && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <h5 className="text-xs font-bold text-amber-950 uppercase tracking-wider flex items-center gap-1">
                            <AlertTriangle className="h-4 w-4 text-amber-600" />
                            SUIVI DE FIABILITÉ & SCORE DE RISQUE
                          </h5>
                          <p className="text-[10px] text-amber-800 font-medium">
                            Le score diminue de 15% par incident. À partir de 3 incidents, le compte est considéré "À RISQUE".
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs font-extrabold px-2.5 py-1 rounded-lg border ${
                            (selectedKycUser.errorCount || 0) === 0 ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                            (selectedKycUser.errorCount || 0) === 1 ? 'bg-amber-100 text-amber-800 border-amber-300' :
                            (selectedKycUser.errorCount || 0) === 2 ? 'bg-orange-100 text-orange-800 border-orange-300' :
                            'bg-red-100 text-red-800 border-red-300'
                          }`}>
                            Score: {Math.max(0, 100 - (selectedKycUser.errorCount || 0) * 15)}/100 
                            ({(selectedKycUser.errorCount || 0) >= 3 ? 'À RISQUE' : 'SANS RISQUE'})
                          </span>
                        </div>
                      </div>

                      {/* Add Simulated/New incident button */}
                      <div className="flex gap-2 items-center">
                        <select
                          id="admin_incident_type"
                          className="text-xs rounded border border-amber-200 bg-white p-1.5 text-[#1A1A1A] focus:outline-none"
                        >
                          <option value="Retard">Retard de service (supérieur à 10 min)</option>
                          <option value="Annulation">Annulation de course sans préavis</option>
                          <option value="Véhicule non conforme">Véhicule non conforme ou sale</option>
                          <option value="Comportement">Comportement inapproprié du chauffeur</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => {
                            const type = (document.getElementById('admin_incident_type') as HTMLSelectElement)?.value || 'Incident';
                            const desc = type === 'Retard' ? 'Retard de service constaté à la prise en charge.' :
                                         type === 'Annulation' ? 'Course annulée moins de 2 heures avant le départ.' :
                                         type === 'Véhicule non conforme' ? 'Véhicule ne correspondant pas aux standards ou n\'ayant pas été nettoyé.' :
                                         'Incident de comportement signalé par le client.';
                            const newErrors = [
                              ...(selectedKycUser.riskErrors || []),
                              { id: `err-${Math.floor(1000 + Math.random() * 9000)}`, type, date: new Date().toISOString().split('T')[0], description: desc, resolved: false }
                            ];
                            const newCount = (selectedKycUser.errorCount || 0) + 1;
                            onUpdateUser(selectedKycUser.id, { errorCount: newCount, riskErrors: newErrors });
                            setSelectedKycUser({ ...selectedKycUser, errorCount: newCount, riskErrors: newErrors });
                          }}
                          className="rounded bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1.5 text-[10px] uppercase tracking-wider shadow-xs transition cursor-pointer"
                        >
                          + Ajouter Incident
                        </button>
                        {(selectedKycUser.errorCount || 0) > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              onUpdateUser(selectedKycUser.id, { errorCount: 0, riskErrors: [] });
                              setSelectedKycUser({ ...selectedKycUser, errorCount: 0, riskErrors: [] });
                            }}
                            className="rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 text-[10px] uppercase tracking-wider shadow-xs transition cursor-pointer"
                          >
                            Réinitialiser
                          </button>
                        )}
                      </div>

                      {/* List of active errors */}
                      <div className="space-y-1.5 max-h-[140px] overflow-y-auto">
                        {(!selectedKycUser.riskErrors || selectedKycUser.riskErrors.length === 0) ? (
                          <p className="text-[10px] text-gray-500 italic">Aucun incident enregistré pour ce transporteur.</p>
                        ) : (
                          selectedKycUser.riskErrors.map((err) => (
                            <div key={err.id} className="flex justify-between items-center bg-white p-2 rounded border border-amber-100 text-[10px]">
                              <div>
                                <span className="font-extrabold text-amber-800 uppercase tracking-wider">[{err.type}]</span>
                                <span className="text-gray-400 mx-1">• {err.date}</span>
                                <p className="text-gray-700 font-medium mt-0.5">{err.description}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const newErrors = (selectedKycUser.riskErrors || []).filter(e => e.id !== err.id);
                                  const newCount = Math.max(0, (selectedKycUser.errorCount || 0) - 1);
                                  onUpdateUser(selectedKycUser.id, { errorCount: newCount, riskErrors: newErrors });
                                  setSelectedKycUser({ ...selectedKycUser, errorCount: newCount, riskErrors: newErrors });
                                }}
                                className="text-red-600 hover:text-red-800 font-bold uppercase tracking-wider hover:bg-red-50 p-1 rounded cursor-pointer"
                              >
                                Supprimer
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions final for user */}
                  <div className="flex flex-wrap gap-2.5 pt-2 border-t border-[#E1E3E5] justify-between items-center">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          onVerifyUser(selectedKycUser.id);
                          setSelectedKycUser({...selectedKycUser, status: 'verified', kycLicenceStatus: 'verified', kycRcStatus: 'verified', kycInsuranceStatus: 'verified', kycPatenteStatus: 'verified'});
                        }}
                        className="rounded-lg bg-[#008060] hover:bg-[#006e52] px-4 py-1.5 text-xs font-bold text-white shadow-xs cursor-pointer"
                      >
                        Valider d'office & certifier (Vérifié)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onUpdateUser(selectedKycUser.id, { status: 'pending', kycRejectReason });
                          setSelectedKycUser({...selectedKycUser, status: 'pending', kycRejectReason});
                          setKycRejectReason('');
                        }}
                        className="rounded-lg bg-amber-500 hover:bg-amber-600 px-3.5 py-1.5 text-xs font-bold text-white cursor-pointer"
                      >
                        Signaler dossier incomplet
                      </button>
                    </div>

                    <div className="flex-1 min-w-[200px]">
                      <input
                        type="text"
                        placeholder="Motif d'incomplétude ou rejet..."
                        value={kycRejectReason}
                        onChange={(e) => setKycRejectReason(e.target.value)}
                        className="w-full rounded-lg border border-[#E1E3E5] p-1.5 text-xs text-[#1A1A1A] bg-white focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E1E3E5] text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="pb-3 font-bold text-[#6D7175]">Utilisateur / Entreprise</th>
                    <th className="pb-3 font-bold text-[#6D7175]">Rôle</th>
                    <th className="pb-3 font-bold text-[#6D7175]">ICE / N° Patente</th>
                    <th className="pb-3 font-bold text-[#6D7175]">Statut KYC</th>
                    <th className="pb-3 text-right font-bold text-[#6D7175]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E1E3E5]/60">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-[#F6F6F7]/50 transition">
                      <td className="py-3">
                        <div className="flex items-center gap-2.5">
                          <img src={user.avatarUrl} alt={user.name} className="h-8 w-8 rounded-full object-cover border border-[#E1E3E5]" />
                          <div>
                            <div className="font-bold text-[#1A1A1A] text-xs flex items-center gap-1.5 flex-wrap">
                              {user.name}
                              {user.isFeatured && (
                                <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-800 border border-amber-200">
                                  <Sparkles className="h-2.5 w-2.5 text-amber-500 fill-amber-500" />
                                  Sélectionné par Mumy
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-[#6D7175] font-medium">{user.companyName || 'Aucune Entreprise'}</div>
                            <div className="text-[9px] text-[#6D7175] font-mono">{user.email}</div>
                            {user.role === 'transporter' && (
                              <div className="mt-1">
                                <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-bold border ${
                                  (user.errorCount || 0) === 0 ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                                  (user.errorCount || 0) === 1 ? 'bg-amber-50 text-amber-800 border-amber-200' :
                                  (user.errorCount || 0) === 2 ? 'bg-orange-50 text-orange-800 border-orange-200' :
                                  'bg-red-50 text-red-800 border-red-200'
                                }`}>
                                  Score : {Math.max(0, 100 - (user.errorCount || 0) * 15)}/100 
                                  ({user.errorCount || 0} {(user.errorCount || 0) > 1 ? 'incidents' : 'incident'})
                                  {(user.errorCount || 0) >= 3 ? ' ⚠️ À RISQUE' : ' ✓ CONFIANCE'}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 font-mono text-[10px]">
                        <span className="rounded bg-[#F6F6F7] border border-[#E1E3E5] px-1.5 py-0.5 text-[#1A1A1A] uppercase font-bold text-[9px]">
                          {user.role === 'transporter' ? 'Transporteur' : user.role === 'client' ? 'Client Pro' : user.role === 'driver' ? 'Chauffeur' : 'Admin'}
                        </span>
                      </td>
                      <td className="py-3 font-mono text-[10px]">
                        {user.ice ? (
                          <div>
                            <div className="font-bold text-[#1A1A1A]">ICE: {user.ice}</div>
                            {user.patente && <div className="text-[#6D7175] text-[9px]">Patente: {user.patente}</div>}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-[10px]">N/A</span>
                        )}
                      </td>
                      <td className="py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                          user.status === 'verified' ? 'bg-[#EBF5F1] text-[#008060] border-[#BBE3D1]' :
                          user.status === 'suspended' ? 'bg-red-50 text-red-800 border-red-100' : 'bg-amber-50 text-amber-800 border-amber-100'
                        }`}>
                          {user.status === 'verified' && <Check className="h-3 w-3" />}
                          {user.status === 'verified' ? 'Vérifié' : user.status === 'suspended' ? 'Banni' : 'En Attente'}
                        </span>
                      </td>
                      <td className="py-3 text-right space-x-1">
                        {user.role === 'transporter' && (
                          <button
                            onClick={() => onUpdateUser(user.id, { isFeatured: !user.isFeatured })}
                            title={user.isFeatured ? "Retirer de la sélection handpicked" : "Ajouter à la sélection handpicked"}
                            className={`rounded-lg px-2 py-1 text-[10px] font-bold transition cursor-pointer inline-flex items-center gap-1 border ${
                              user.isFeatured 
                                ? 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200 shadow-2xs' 
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <Sparkles className={`h-3 w-3 ${user.isFeatured ? 'text-amber-500 fill-amber-500' : 'text-slate-400'}`} />
                            {user.isFeatured ? '★ Sélectionné' : '☆ Sélectionner'}
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedKycUser(user)}
                          className="rounded-lg bg-white border border-[#E1E3E5] px-2 py-1 text-[10px] font-bold text-[#1A1A1A] hover:bg-[#F6F6F7] transition cursor-pointer"
                        >
                          Dossier KYC
                        </button>
                        {user.status !== 'verified' && (
                          <button 
                            onClick={() => onVerifyUser(user.id)}
                            className="rounded-lg bg-[#008060] border border-[#008060] px-2 py-1 text-[10px] font-bold text-white transition hover:bg-[#006e52] shadow-xs cursor-pointer"
                          >
                            Valider
                          </button>
                        )}
                        {user.status !== 'suspended' && (
                          <button 
                            onClick={() => onBanUser(user.id)}
                            className="rounded-lg bg-red-50 border border-red-100 px-2 py-1 text-[10px] font-bold text-red-700 transition hover:bg-red-100 cursor-pointer"
                          >
                            Bannir
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Team Delegation Panel */}
          <div className="rounded-xl bg-white p-5 border border-[#E1E3E5] shadow-xs">
            <div className="mb-4 flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-[#008060]" />
              <h3 className="font-sans text-sm font-bold text-[#1A1A1A]">Délégation d'Équipe & Autorisations</h3>
            </div>

            <form onSubmit={handleAddMember} className="space-y-4 border border-dashed border-[#BBE3D1] p-4 bg-[#EBF5F1]/10 rounded-xl mb-6">
              <div className="flex items-center gap-2 text-xs font-bold text-[#008060]">
                <UserPlus className="h-4 w-4" />
                <span>Nouveau collaborateur & Rôles d'accès</span>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-[10px] font-bold text-[#6D7175] uppercase tracking-wider">Nom Complet</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Samir Driss"
                    value={newMember.name}
                    onChange={(e) => setNewMember({...newMember, name: e.target.value})}
                    className="mt-1 w-full rounded-lg border border-[#E1E3E5] px-2.5 py-1.5 text-xs text-[#1A1A1A] bg-white focus:border-[#008060] focus:ring-1 focus:ring-[#008060] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#6D7175] uppercase tracking-wider">E-mail</label>
                  <input
                    type="email"
                    required
                    placeholder="samir@mumy.ma"
                    value={newMember.email}
                    onChange={(e) => setNewMember({...newMember, email: e.target.value})}
                    className="mt-1 w-full rounded-lg border border-[#E1E3E5] px-2.5 py-1.5 text-xs text-[#1A1A1A] bg-white focus:border-[#008060] focus:ring-1 focus:ring-[#008060] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#6D7175] uppercase tracking-wider">Fonction / Rôle</label>
                  <select
                    value={selectedRoleType}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedRoleType(val);
                      if (val !== 'custom') {
                        // Automatically suggest standard permissions based on role type
                        let defaultPerms: string[] = [];
                        if (val === 'Modérateur KYC') defaultPerms = ['validate_users', 'view_chat'];
                        else if (val === 'Support Client') defaultPerms = ['view_chat', 'resolve_disputes'];
                        else if (val === 'Contrôleur Financier') defaultPerms = ['view_finance'];
                        else if (val === 'Gestionnaire Publicitaire') defaultPerms = ['manage_banners'];
                        else if (val === 'Gestionnaire de Flotte') defaultPerms = ['manage_fleet'];
                        
                        setNewMember({...newMember, role: val, permissions: defaultPerms});
                      } else {
                        setNewMember({...newMember, role: '', permissions: []});
                      }
                    }}
                    className="mt-1 w-full rounded-lg border border-[#E1E3E5] px-2.5 py-1.5 text-xs text-[#1A1A1A] bg-white focus:border-[#008060] focus:outline-none"
                  >
                    <option value="Modérateur KYC">Modérateur KYC</option>
                    <option value="Support Client">Support Client</option>
                    <option value="Contrôleur Financier">Contrôleur Financier</option>
                    <option value="Gestionnaire Publicitaire">Gestionnaire Publicitaire</option>
                    <option value="Gestionnaire de Flotte">Gestionnaire de Flotte</option>
                    <option value="custom">Autre (Saisir manuellement...)</option>
                  </select>
                </div>
              </div>

              {selectedRoleType === 'custom' && (
                <div className="animate-fade-in">
                  <label className="block text-[10px] font-bold text-[#6D7175] uppercase tracking-wider">Saisir l'intitulé de la fonction</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Directeur de Région"
                    value={newMember.role}
                    onChange={(e) => setNewMember({...newMember, role: e.target.value})}
                    className="mt-1 w-full rounded-lg border border-[#E1E3E5] px-2.5 py-1.5 text-xs text-[#1A1A1A] bg-white focus:border-[#008060] focus:ring-1 focus:ring-[#008060] focus:outline-none"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-[#6D7175] uppercase tracking-wider">Autorisations & Accès assignés :</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 bg-white rounded-lg border border-[#E1E3E5] p-3">
                  {[
                    { id: 'validate_users', label: 'Validation KYC & Comptes', desc: 'Vérifier, valider ou bannir les transporteurs et clients B2B.' },
                    { id: 'view_chat', label: 'Surveillance des messageries & IA', desc: 'Accéder aux conversations directes et lire les alertes Gemini.' },
                    { id: 'resolve_disputes', label: 'Résolution des litiges', desc: 'Intervenir dans le chat et résoudre les réclamations clients.' },
                    { id: 'manage_banners', label: 'Gestion de la Régie Pub (CPM/CPC)', desc: 'Créer, éditer, activer et suspendre les bannières sponsorisées.' },
                    { id: 'view_finance', label: 'Audit Financier & Facturation', desc: 'Consulter l\'ERP financier et exporter les registres de transactions.' },
                    { id: 'manage_fleet', label: 'Gestion de la Flotte & Chauffeurs', desc: 'Superviser les véhicules enregistrés et assigner les missions.' }
                  ].map(perm => {
                    const isChecked = newMember.permissions.includes(perm.id);
                    return (
                      <label 
                        key={perm.id} 
                        className={`flex items-start gap-3 p-2 rounded-lg border transition cursor-pointer select-none ${
                          isChecked 
                            ? 'bg-[#EBF5F1]/40 border-[#008060] text-gray-900' 
                            : 'bg-slate-50/50 border-gray-200 text-gray-500 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => togglePermission(perm.id)}
                          className="mt-0.5 rounded text-[#008060] focus:ring-[#008060] h-3.5 w-3.5 border-gray-300"
                        />
                        <div className="text-left">
                          <p className="text-xs font-bold text-gray-800">{perm.label}</p>
                          <p className="text-[10px] text-gray-500 font-medium leading-tight mt-0.5">{perm.desc}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="rounded-lg bg-[#008060] hover:bg-[#006e52] px-5 py-2 text-xs font-bold text-white transition shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="h-4 w-4" />
                  Inscrire et déléguer
                </button>
              </div>
            </form>

            <div className="space-y-3">
              <p className="text-[10px] font-bold text-[#6D7175] uppercase tracking-wider">Collaborateurs Actifs</p>
              <div className="divide-y divide-[#E1E3E5]/60 bg-slate-50/30 rounded-xl border border-[#E1E3E5] px-4">
                {teamMembers.map(member => (
                  <div key={member.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-3.5 gap-2 text-xs">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-[#1A1A1A] text-sm">{member.name}</span>
                        <span className="rounded bg-[#EBF5F1] border border-[#BBE3D1] px-2 py-0.5 text-[#008060] font-sans text-[10px] font-bold">{member.role}</span>
                        <span className="text-[10px] text-gray-400 font-mono">ID: {member.id}</span>
                      </div>
                      <p className="text-[11px] text-[#6D7175] font-medium mt-0.5">{member.email}</p>
                      
                      {/* Permissions detail */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Autorisations :</span>
                        {member.permissions && member.permissions.includes('all') ? (
                          <span className="inline-flex items-center gap-0.5 rounded bg-amber-50 border border-amber-200 px-1.5 py-0.2 text-[9px] text-amber-800 font-semibold uppercase">
                            <Check className="h-2 w-2 stroke-[3]" /> Accès Total (Super Admin)
                          </span>
                        ) : member.permissions && member.permissions.length > 0 ? (
                          member.permissions.map(p => {
                            let label = p;
                            if (p === 'validate_users') label = 'KYC & Comptes';
                            if (p === 'view_chat') label = 'Messagerie & IA';
                            if (p === 'resolve_disputes') label = 'Résolution Litiges';
                            if (p === 'manage_banners') label = 'Régie Pub';
                            if (p === 'view_finance') label = 'Finance';
                            if (p === 'manage_fleet') label = 'Flotte & Chauffeurs';
                            return (
                              <span key={p} className="inline-flex items-center gap-1 rounded bg-white border border-gray-200 px-2 py-0.5 text-[9px] text-gray-600 font-medium">
                                <Check className="h-2.5 w-2.5 text-[#008060] stroke-[3]" /> {label}
                              </span>
                            );
                          })
                        ) : (
                          <span className="text-[10px] text-gray-400 italic font-medium">Aucun droit spécifique</span>
                        )}
                      </div>
                    </div>
                    {member.role !== 'Super Admin' && (
                      <div className="self-end sm:self-center">
                        <button 
                          onClick={() => onDeleteTeamMember(member.id)}
                          className="text-red-500 hover:text-red-700 transition cursor-pointer p-1.5 rounded-lg hover:bg-red-50 border border-transparent hover:border-red-100 flex items-center gap-1"
                          title="Retirer"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sm:hidden text-[10px] font-bold">Retirer</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Banner Campaign Management Panel */}
          <div className="rounded-xl bg-white p-5 border border-[#E1E3E5] shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#E1E3E5] pb-3">
              <div className="flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-[#008060]" />
                <h3 className="font-sans text-sm font-bold text-[#1A1A1A]">Régie Publicitaire B2B & Simulation (CPM / CPC)</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddBannerForm(!showAddBannerForm)}
                className="rounded-lg bg-slate-900 hover:bg-black px-3 py-1.5 text-[11px] font-bold text-white transition shadow-xs cursor-pointer flex items-center gap-1"
              >
                <Plus className="h-3.5 w-3.5" />
                {showAddBannerForm ? 'Fermer' : 'Nouvelle Campagne'}
              </button>
            </div>

            {/* Campaign Creation Form */}
            {showAddBannerForm && (
              <form onSubmit={handleAddBannerSubmit} className="rounded-xl border border-dashed border-[#BBE3D1] p-4 bg-[#EBF5F1]/30 space-y-4 animate-fade-in">
                <div className="flex items-center gap-2 text-xs font-bold text-[#008060]">
                  <Plus className="h-4 w-4" />
                  <span>Paramétrer une nouvelle bannière publicitaire</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-[#6D7175] uppercase tracking-wider">Titre de la campagne</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Assurance Pro AXA -15%"
                      value={newBannerForm.title}
                      onChange={(e) => setNewBannerForm({...newBannerForm, title: e.target.value})}
                      className="mt-1 w-full rounded-lg border border-[#E1E3E5] p-2 text-xs text-[#1A1A1A] bg-white focus:outline-none focus:border-[#008060]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#6D7175] uppercase tracking-wider">Lien de redirection (Destination URL)</label>
                    <input
                      type="text"
                      required
                      placeholder="https://partenaire.ma/promo"
                      value={newBannerForm.linkUrl}
                      onChange={(e) => setNewBannerForm({...newBannerForm, linkUrl: e.target.value})}
                      className="mt-1 w-full rounded-lg border border-[#E1E3E5] p-2 text-xs text-[#1A1A1A] bg-white focus:outline-none focus:border-[#008060]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#6D7175] uppercase tracking-wider">Description de l'offre</label>
                  <textarea
                    required
                    placeholder="Saisissez un message d'accroche percutant pour le public cible..."
                    value={newBannerForm.description}
                    onChange={(e) => setNewBannerForm({...newBannerForm, description: e.target.value})}
                    rows={2}
                    className="mt-1 w-full rounded-lg border border-[#E1E3E5] p-2 text-xs text-[#1A1A1A] bg-white focus:outline-none focus:border-[#008060]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-[#6D7175] uppercase tracking-wider">Image de couverture (Unsplash URL)</label>
                    <input
                      type="text"
                      value={newBannerForm.imageUrl}
                      onChange={(e) => setNewBannerForm({...newBannerForm, imageUrl: e.target.value})}
                      className="mt-1 w-full rounded-lg border border-[#E1E3E5] p-2 text-xs text-[#1A1A1A] bg-white focus:outline-none focus:border-[#008060]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#6D7175] uppercase tracking-wider">Audience ciblée</label>
                    <select
                      value={newBannerForm.targetRole}
                      onChange={(e) => setNewBannerForm({...newBannerForm, targetRole: e.target.value as any})}
                      className="mt-1 w-full rounded-lg border border-[#E1E3E5] p-2 text-xs text-[#1A1A1A] bg-white focus:outline-none focus:border-[#008060]"
                    >
                      <option value="all">Tous les espaces (Public + Pros)</option>
                      <option value="transporter">Espace Transporteurs (Fournisseurs)</option>
                      <option value="client">Espace Clients Pro (Hôtels & Riads)</option>
                      <option value="driver">Espace Chauffeurs (App mobile)</option>
                      <option value="public">Page de suivi publique (Lien Track)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-[#6D7175] uppercase tracking-wider">Modèle de Facturation</label>
                    <select
                      value={newBannerForm.optimizationType}
                      onChange={(e) => {
                        const val = e.target.value as any;
                        let initialBudget = newBannerForm.budget;
                        if (val === 'weekly') {
                          initialBudget = newBannerForm.weeklyRate * newBannerForm.durationUnits;
                        } else if (val === 'monthly') {
                          initialBudget = newBannerForm.monthlyRate * newBannerForm.durationUnits;
                        } else if (val === 'cpc') {
                          initialBudget = 300;
                        } else if (val === 'cpm') {
                          initialBudget = 300;
                        }
                        setNewBannerForm({...newBannerForm, optimizationType: val, budget: initialBudget});
                      }}
                      className="mt-1 w-full rounded-lg border border-[#E1E3E5] p-2 text-xs text-[#1A1A1A] bg-white focus:outline-none focus:border-[#008060]"
                    >
                      <option value="cpc">CPC (Coût par Clic)</option>
                      <option value="cpm">CPM (Par 1000 Impressions)</option>
                      <option value="weekly">Par Semaine (Forfait hebdo)</option>
                      <option value="monthly">Par Mois (Forfait mensuel)</option>
                    </select>
                  </div>

                  {newBannerForm.optimizationType === 'cpc' && (
                    <div>
                      <label className="block text-[10px] font-bold text-[#6D7175] uppercase tracking-wider">Coût par Clic (DHS/clic)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={newBannerForm.cpcValue}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0.1;
                          setNewBannerForm({...newBannerForm, cpcValue: val});
                        }}
                        className="mt-1 w-full rounded-lg border border-[#E1E3E5] p-2 text-xs text-[#1A1A1A] bg-white focus:outline-none focus:border-[#008060]"
                      />
                    </div>
                  )}

                  {newBannerForm.optimizationType === 'cpm' && (
                    <div>
                      <label className="block text-[10px] font-bold text-[#6D7175] uppercase tracking-wider">Tarif CPM (DHS/1000 imp)</label>
                      <input
                        type="number"
                        step="0.5"
                        min="1"
                        value={newBannerForm.cpmValue}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 1;
                          setNewBannerForm({...newBannerForm, cpmValue: val});
                        }}
                        className="mt-1 w-full rounded-lg border border-[#E1E3E5] p-2 text-xs text-[#1A1A1A] bg-white focus:outline-none focus:border-[#008060]"
                      />
                    </div>
                  )}

                  {newBannerForm.optimizationType === 'weekly' && (
                    <>
                      <div>
                        <label className="block text-[10px] font-bold text-[#6D7175] uppercase tracking-wider">Tarif Hebdo (DHS/semaine)</label>
                        <input
                          type="number"
                          step="10"
                          min="10"
                          value={newBannerForm.weeklyRate}
                          onChange={(e) => {
                            const rate = parseFloat(e.target.value) || 0;
                            setNewBannerForm({
                              ...newBannerForm,
                              weeklyRate: rate,
                              budget: rate * newBannerForm.durationUnits
                            });
                          }}
                          className="mt-1 w-full rounded-lg border border-[#E1E3E5] p-2 text-xs text-[#1A1A1A] bg-white focus:outline-none focus:border-[#008060]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#6D7175] uppercase tracking-wider">Nombre de semaines</label>
                        <input
                          type="number"
                          min="1"
                          value={newBannerForm.durationUnits}
                          onChange={(e) => {
                            const units = parseInt(e.target.value) || 1;
                            setNewBannerForm({
                              ...newBannerForm,
                              durationUnits: units,
                              budget: newBannerForm.weeklyRate * units
                            });
                          }}
                          className="mt-1 w-full rounded-lg border border-[#E1E3E5] p-2 text-xs text-[#1A1A1A] bg-white focus:outline-none focus:border-[#008060]"
                        />
                      </div>
                    </>
                  )}

                  {newBannerForm.optimizationType === 'monthly' && (
                    <>
                      <div>
                        <label className="block text-[10px] font-bold text-[#6D7175] uppercase tracking-wider">Tarif Mensuel (DHS/mois)</label>
                        <input
                          type="number"
                          step="50"
                          min="50"
                          value={newBannerForm.monthlyRate}
                          onChange={(e) => {
                            const rate = parseFloat(e.target.value) || 0;
                            setNewBannerForm({
                              ...newBannerForm,
                              monthlyRate: rate,
                              budget: rate * newBannerForm.durationUnits
                            });
                          }}
                          className="mt-1 w-full rounded-lg border border-[#E1E3E5] p-2 text-xs text-[#1A1A1A] bg-white focus:outline-none focus:border-[#008060]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#6D7175] uppercase tracking-wider">Nombre de mois</label>
                        <input
                          type="number"
                          min="1"
                          value={newBannerForm.durationUnits}
                          onChange={(e) => {
                            const units = parseInt(e.target.value) || 1;
                            setNewBannerForm({
                              ...newBannerForm,
                              durationUnits: units,
                              budget: newBannerForm.monthlyRate * units
                            });
                          }}
                          className="mt-1 w-full rounded-lg border border-[#E1E3E5] p-2 text-xs text-[#1A1A1A] bg-white focus:outline-none focus:border-[#008060]"
                        />
                      </div>
                    </>
                  )}

                  {/* Budget summary */}
                  {(newBannerForm.optimizationType === 'cpc' || newBannerForm.optimizationType === 'cpm') ? (
                    <div>
                      <label className="block text-[10px] font-bold text-[#6D7175] uppercase tracking-wider">Budget Max (DHS)</label>
                      <input
                        type="number"
                        min="10"
                        value={newBannerForm.budget}
                        onChange={(e) => setNewBannerForm({...newBannerForm, budget: parseInt(e.target.value) || 100})}
                        className="mt-1 w-full rounded-lg border border-[#E1E3E5] p-2 text-xs text-[#1A1A1A] bg-white focus:outline-none focus:border-[#008060]"
                      />
                    </div>
                  ) : (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-2 flex flex-col justify-center">
                      <span className="text-[8px] font-bold text-emerald-800 uppercase tracking-wider">Budget Forfaitaire Calculé</span>
                      <span className="text-sm font-extrabold text-[#008060]">{newBannerForm.budget} DHS</span>
                      <span className="text-[8px] text-emerald-600 font-medium">Facturé pour la durée totale</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-[#BBE3D1]/50">
                  <button
                    type="button"
                    onClick={() => setShowAddBannerForm(false)}
                    className="rounded-lg bg-gray-100 hover:bg-gray-200 px-3 py-1.5 text-xs font-semibold text-[#1A1A1A]"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-[#008060] hover:bg-[#006e52] px-4 py-1.5 text-xs font-bold text-white shadow-xs"
                  >
                    Lancer la campagne
                  </button>
                </div>
              </form>
            )}

            {/* Banners performance grid */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E1E3E5] text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="pb-2 font-bold text-[#6D7175]">Bannière / Offre</th>
                    <th className="pb-2 font-bold text-[#6D7175]">Cible</th>
                    <th className="pb-2 font-bold text-[#6D7175]">Optimisation</th>
                    <th className="pb-2 font-bold text-[#6D7175] text-center">Stats (Imp / Clics / CTR)</th>
                    <th className="pb-2 font-bold text-[#6D7175] text-center">Budget Consommé</th>
                    <th className="pb-2 text-right font-bold text-[#6D7175]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E1E3E5]/60">
                  {banners.map((banner) => {
                    const ctr = banner.impressions > 0 ? ((banner.clicks / banner.impressions) * 100).toFixed(1) : '0';
                    const percentSpent = Math.min(100, (banner.spent / banner.budget) * 100).toFixed(0);
                    return (
                      <tr key={banner.id} className="hover:bg-[#F6F6F7]/50 transition">
                        <td className="py-3">
                          <div className="flex items-center gap-2.5">
                            <img src={banner.imageUrl} alt={banner.title} className="h-10 w-16 rounded object-cover border border-[#E1E3E5]" />
                            <div className="max-w-[180px]">
                              <div className="font-bold text-[#1A1A1A] text-xs truncate" title={banner.title}>{banner.title}</div>
                              <div className="text-[10px] text-[#6D7175] line-clamp-1" title={banner.description}>{banner.description}</div>
                              <div className="text-[9px] text-gray-400 font-mono mt-0.5">ID: {banner.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3">
                          <span className="rounded bg-slate-50 border border-slate-200 px-1.5 py-0.5 text-slate-700 uppercase font-bold text-[9px]">
                            {banner.targetRole === 'all' && 'Tous'}
                            {banner.targetRole === 'transporter' && 'Transporteur'}
                            {banner.targetRole === 'client' && 'Client Pro'}
                            {banner.targetRole === 'driver' && 'Chauffeur'}
                            {banner.targetRole === 'public' && 'Suivi Public'}
                          </span>
                        </td>
                        <td className="py-3">
                          <div className="flex flex-col">
                            <span className={`self-start rounded px-1.5 py-0.5 text-[9px] font-bold border uppercase ${
                              banner.optimizationType === 'cpc' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 
                              banner.optimizationType === 'cpm' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              banner.optimizationType === 'weekly' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                              'bg-sky-50 text-sky-700 border-sky-200'
                            }`}>
                              {banner.optimizationType === 'cpc' ? 'CPC' : 
                               banner.optimizationType === 'cpm' ? 'CPM' : 
                               banner.optimizationType === 'weekly' ? 'Forfait Hebdo' : 'Forfait Mensuel'}
                            </span>
                            <span className="text-[9px] text-[#6D7175] font-mono mt-0.5">
                              {banner.optimizationType === 'cpc' ? `${banner.cpcValue} DHS/clic` : 
                               banner.optimizationType === 'cpm' ? `${banner.cpmValue} DHS/k-imp` : 
                               banner.optimizationType === 'weekly' ? `${banner.weeklyRate || 250} DHS/semaine` : 
                               `${banner.monthlyRate || 800} DHS/mois`}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 text-center">
                          <div className="flex flex-col items-center">
                            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-800">
                              <span className="flex items-center gap-0.5 text-gray-600" title="Impressions"><Eye className="h-3 w-3" /> {banner.impressions}</span>
                              <span className="text-gray-300">|</span>
                              <span className="flex items-center gap-0.5 text-indigo-600" title="Clics"><MousePointerClick className="h-3 w-3" /> {banner.clicks}</span>
                            </div>
                            <span className="text-[9px] font-bold text-slate-500 mt-1 flex items-center gap-0.5" title="CTR (Click-Through Rate)">
                              <TrendingUp className="h-2.5 w-2.5 text-[#008060]" /> CTR: {ctr}%
                            </span>
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="flex flex-col gap-1 w-[90px] mx-auto">
                            <div className="flex justify-between text-[10px] font-semibold text-slate-700">
                              <span>{banner.spent.toFixed(1)} DHS</span>
                              <span className="text-gray-400">/ {banner.budget}</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all ${
                                  parseInt(percentSpent) > 90 ? 'bg-red-500' :
                                  parseInt(percentSpent) > 75 ? 'bg-amber-500' : 'bg-[#008060]'
                                }`} 
                                style={{ width: `${percentSpent}%` }}
                              />
                            </div>
                            <span className="text-[8px] text-gray-400 text-right">{percentSpent}% consommé</span>
                          </div>
                        </td>
                        <td className="py-3 text-right space-x-1">
                          <button
                            type="button"
                            onClick={() => onUpdateBanner(banner.id, { isActive: !banner.isActive })}
                            className={`rounded px-1.5 py-1 text-[9px] font-extrabold uppercase transition border ${
                              banner.isActive 
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 cursor-pointer' 
                                : 'bg-gray-50 text-gray-500 border-gray-300 hover:bg-gray-100 cursor-pointer'
                            }`}
                          >
                            {banner.isActive ? 'Actif' : 'Pause'}
                          </button>
                          <button 
                            type="button"
                            onClick={() => onDeleteBanner(banner.id)}
                            className="text-red-500 hover:text-red-700 transition cursor-pointer p-1 rounded hover:bg-red-50 inline-block align-middle"
                            title="Supprimer la campagne"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="rounded-lg bg-slate-50 border border-slate-150 p-3 text-[10px] text-slate-600 flex gap-1.5 items-start">
              <Info className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-800">Fonctionnement de la Simulation CPM & CPC :</p>
                <p className="mt-0.5 leading-relaxed">
                  • <strong>CPM (Cost Per Mille) :</strong> Chaque affichage d'une bannière sur l'espace d'un utilisateur (Transporteur, Client, Chauffeur ou Suivi Public) incrémente l'impression et déduit <span className="font-mono">Tarif CPM / 1000</span> DHS du budget de la campagne.
                </p>
                <p className="mt-0.5 leading-relaxed">
                  • <strong>CPC (Cost Per Click) :</strong> Chaque clic réel d'un utilisateur sur la bannière ouvre l'offre correspondante dans un nouvel onglet, incrémente les clics, et déduit directement le montant de <span className="font-mono">CPC</span> DHS du budget.
                </p>
              </div>
            </div>

            {/* INLINE AD CAMPAIGN TRAFFIC SIMULATOR */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                <div>
                  <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                    ⚡ SIMULATEUR DE TRAFIC ET DE FACTURATION (CPM / CPC)
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Générez instantanément ou automatiquement des clics et impressions pour simuler l'audience, mesurer la performance et tester les règles de déduction budgétaire.
                  </p>
                </div>
                
                {/* Auto simulator toggle */}
                <button
                  type="button"
                  onClick={() => setIsAutoSimRunning(!isAutoSimRunning)}
                  className={`rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                    isAutoSimRunning 
                      ? 'bg-red-600 text-white animate-pulse' 
                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
                >
                  <span className={`inline-block w-2 h-2 rounded-full ${isAutoSimRunning ? 'bg-white animate-ping' : 'bg-white/80'}`} />
                  {isAutoSimRunning ? '🛑 ARRÊTER LE TRAFIC AUTO' : '▶️ TRAFIC ORGANIQUE CONTINU'}
                </button>
              </div>

              {/* Manual Simulation Controls */}
              <div className="grid gap-4 sm:grid-cols-4 items-end">
                <div className="col-span-1">
                  <label className="block text-[10px] font-bold text-[#6D7175] uppercase tracking-wider">Choisir la Campagne</label>
                  <select
                    value={selectedSimBannerId}
                    onChange={(e) => setSelectedSimBannerId(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#E1E3E5] p-2 text-xs text-[#1A1A1A] bg-white focus:outline-none"
                  >
                    <option value="">-- Sélectionner une campagne --</option>
                    {banners.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.title} ({b.optimizationType.toUpperCase()} - Budget: {b.budget} DHS)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#6D7175] uppercase tracking-wider">Simuler Clics (CPC)</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={simClicksCount}
                      onChange={(e) => setSimClicksCount(Math.max(1, parseInt(e.target.value) || 0))}
                      className="w-full rounded-lg border border-[#E1E3E5] p-2 text-xs text-[#1A1A1A] bg-white focus:outline-none"
                    />
                    <button
                      type="button"
                      disabled={!selectedSimBannerId}
                      onClick={() => {
                        const targetB = banners.find(b => b.id === selectedSimBannerId);
                        if (!targetB) return;
                        let addedSpent = 0;
                        if (targetB.optimizationType === 'cpc') {
                          addedSpent = targetB.cpcValue * simClicksCount;
                        }
                        const newSpent = Math.min(targetB.budget, Number((targetB.spent + addedSpent).toFixed(4)));
                        onUpdateBanner(targetB.id, {
                          clicks: targetB.clicks + simClicksCount,
                          spent: newSpent,
                          isActive: (targetB.optimizationType === 'weekly' || targetB.optimizationType === 'monthly')
                            ? targetB.isActive
                            : (newSpent < targetB.budget)
                        });
                      }}
                      className="px-3 py-2 bg-indigo-600 text-white font-extrabold rounded-lg hover:bg-indigo-700 disabled:opacity-40 text-xs shrink-0 cursor-pointer"
                      title="Injecter des clics instantanés"
                    >
                      +Clics
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#6D7175] uppercase tracking-wider">Simuler Impressions (CPM)</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="number"
                      min="10"
                      max="5000"
                      step="50"
                      value={simImpressionsCount}
                      onChange={(e) => setSimImpressionsCount(Math.max(10, parseInt(e.target.value) || 0))}
                      className="w-full rounded-lg border border-[#E1E3E5] p-2 text-xs text-[#1A1A1A] bg-white focus:outline-none"
                    />
                    <button
                      type="button"
                      disabled={!selectedSimBannerId}
                      onClick={() => {
                        const targetB = banners.find(b => b.id === selectedSimBannerId);
                        if (!targetB) return;
                        let addedSpent = 0;
                        if (targetB.optimizationType === 'cpm') {
                          addedSpent = (targetB.cpmValue / 1000) * simImpressionsCount;
                        }
                        const newSpent = Math.min(targetB.budget, Number((targetB.spent + addedSpent).toFixed(4)));
                        onUpdateBanner(targetB.id, {
                          impressions: targetB.impressions + simImpressionsCount,
                          spent: newSpent,
                          isActive: (targetB.optimizationType === 'weekly' || targetB.optimizationType === 'monthly')
                            ? targetB.isActive
                            : (newSpent < targetB.budget)
                        });
                      }}
                      className="px-3 py-2 bg-emerald-600 text-white font-extrabold rounded-lg hover:bg-emerald-700 disabled:opacity-40 text-xs shrink-0 cursor-pointer"
                      title="Injecter des impressions instantanées"
                    >
                      +Imp
                    </button>
                  </div>
                </div>

                <div>
                  <button
                    type="button"
                    disabled={!selectedSimBannerId}
                    onClick={() => {
                      const targetB = banners.find(b => b.id === selectedSimBannerId);
                      if (!targetB) return;
                      onUpdateBanner(targetB.id, {
                        clicks: 0,
                        impressions: 0,
                        spent: 0,
                        isActive: true
                      });
                    }}
                    className="w-full py-2 border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 font-extrabold rounded-lg disabled:opacity-40 text-xs cursor-pointer text-center"
                    title="Remettre à zéro le budget et les statistiques"
                  >
                    🔄 Réinitialiser Stats
                  </button>
                </div>
              </div>

              {/* Status Ticker */}
              {isAutoSimRunning && (
                <div className="bg-emerald-50 text-[#008060] rounded-lg p-2.5 flex items-center justify-between text-[10px] font-mono animate-pulse border border-emerald-200">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#008060] animate-ping" />
                    [ROBOT DE SIMULATION ORGANISÉ ACTIF] Génération de trafic simulé toutes les 2.5 secondes...
                  </span>
                  <span>CTR moyen cible : ~15.0%</span>
                </div>
              )}
            </div>
          </div>

          {/* Support client & Collaborateurs live chat panel */}
          <div className="rounded-xl bg-white p-5 border border-[#E1E3E5] shadow-xs">
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E1E3E5] pb-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-indigo-600 animate-pulse" />
                <h3 className="font-sans text-sm font-bold text-[#1A1A1A]">Centre de Support & Messagerie</h3>
              </div>
              <div className="flex bg-slate-100 p-1 rounded-lg self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setSupportTab('support')}
                  className={`px-3 py-1 text-[11px] font-bold rounded-md transition cursor-pointer ${
                    supportTab === 'support'
                      ? 'bg-white text-indigo-950 shadow-xs'
                      : 'text-gray-500 hover:text-[#1A1A1A]'
                  }`}
                >
                  Support Client ({supportSessions.filter(s => s.status === 'pending_human' || s.status === 'chatting_human').length})
                </button>
                <button
                  type="button"
                  onClick={() => setSupportTab('team')}
                  className={`px-3 py-1 text-[11px] font-bold rounded-md transition cursor-pointer ${
                    supportTab === 'team'
                      ? 'bg-white text-[#1A1A1A] shadow-xs'
                      : 'text-gray-500 hover:text-[#1A1A1A]'
                  }`}
                >
                  Collaborateurs ({teamMembers.length})
                </button>
              </div>
            </div>

            {/* TAB 1: Support client sessions */}
            {supportTab === 'support' && (
              <div className="grid gap-4 md:grid-cols-12 min-h-[300px]">
                {/* Session list - 5 cols */}
                <div className="md:col-span-5 border-r border-[#E1E3E5]/60 pr-2 space-y-2 max-h-[320px] overflow-y-auto">
                  <p className="text-[10px] font-bold text-[#6D7175] uppercase tracking-wider mb-2">Tickets d'Assistance</p>
                  {supportSessions.length === 0 ? (
                    <div className="text-center py-6 text-gray-400 text-xs font-medium">Aucun ticket d'assistance</div>
                  ) : (
                    supportSessions.map(sess => {
                      const isSelected = selectedSessionId === sess.userId;
                      const lastMsg = sess.messages[sess.messages.length - 1];
                      return (
                        <button
                          key={sess.id}
                          type="button"
                          onClick={() => setSelectedSessionId(sess.userId)}
                          className={`w-full text-left p-2.5 rounded-lg border transition text-xs relative cursor-pointer flex flex-col gap-1 ${
                            isSelected
                              ? 'bg-indigo-50/50 border-indigo-200 shadow-2xs'
                              : 'bg-white border-[#E1E3E5] hover:bg-[#F6F6F7]/60'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1.5">
                            <span className="font-bold text-[#1A1A1A] truncate max-w-[130px]">{sess.userName}</span>
                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide shrink-0 ${
                              sess.status === 'pending_human' ? 'bg-red-100 text-red-800' :
                              sess.status === 'chatting_human' ? 'bg-indigo-100 text-indigo-800 animate-pulse' :
                              sess.status === 'ai' ? 'bg-amber-100 text-amber-800' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {sess.status === 'pending_human' ? '⏳ S.O.S' :
                               sess.status === 'chatting_human' ? '💬 Direct' :
                               sess.status === 'ai' ? '🤖 IA' : '✓ Résolu'}
                            </span>
                          </div>
                          <span className="text-[9px] text-[#6D7175] font-mono capitalize">Role : {sess.userRole === 'transporter' ? 'Transporteur' : 'Client Pro'}</span>
                          {lastMsg && (
                            <p className="text-[10px] text-gray-500 truncate mt-0.5 font-medium italic">
                              "{lastMsg.message}"
                            </p>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>

                {/* Chat detail - 7 cols */}
                <div className="md:col-span-7 flex flex-col justify-between h-[320px] bg-gray-50/50 rounded-xl border border-[#E1E3E5] overflow-hidden">
                  {selectedSessionId && supportSessions.find(s => s.userId === selectedSessionId) ? (() => {
                    const activeSess = supportSessions.find(s => s.userId === selectedSessionId)!;
                    return (
                      <>
                        {/* Chat Header */}
                        <div className="bg-[#1A1A1A] text-white px-3 py-2 text-xs flex justify-between items-center shrink-0">
                          <div className="min-w-0 flex-1">
                            <span className="font-bold block truncate">{activeSess.userName}</span>
                            <span className="text-[9px] text-gray-400 block font-medium">Statut : {activeSess.status.toUpperCase()}</span>
                          </div>
                          {activeSess.status !== 'resolved' && (
                            <button
                              type="button"
                              onClick={() => handleResolveSession(activeSess.userId)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[9px] px-2 py-1 rounded uppercase tracking-wider transition cursor-pointer ml-2 shrink-0"
                            >
                              Résoudre ✓
                            </button>
                          )}
                        </div>

                        {/* Message Thread */}
                        <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
                          {activeSess.messages.map((m: any) => {
                            const isSystem = m.senderId === "system";
                            const isMe = m.senderRole === "agent" && m.senderId !== "gemini" && m.senderId !== "system";
                            
                            if (isSystem) {
                              return (
                                <div key={m.id} className="text-center my-1.5">
                                  <span className="bg-amber-50 text-amber-800 border border-amber-100 text-[9px] font-bold px-2 py-0.5 rounded">
                                    {m.message}
                                  </span>
                                </div>
                              );
                            }

                            return (
                              <div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                <span className="text-[9px] text-gray-400 font-mono mb-0.5">{m.senderName}{m.createdAt ? ` • ${new Date(m.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}` : ""}</span>
                                <div className={`max-w-[90%] rounded-lg px-2.5 py-1.5 text-xs leading-relaxed ${
                                  isMe 
                                    ? 'bg-[#1A1A1A] text-white rounded-tr-none' 
                                    : m.senderId === 'gemini'
                                    ? 'bg-amber-50 text-amber-900 border border-amber-200 rounded-tl-none font-medium'
                                    : 'bg-white text-gray-800 border border-[#E1E3E5] rounded-tl-none font-medium'
                                }`}>
                                  {m.message}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Input Area */}
                        <form onSubmit={handleSendAdminReply} className="p-2 bg-white border-t border-[#E1E3E5] flex gap-1.5 shrink-0">
                          <input
                            type="text"
                            value={adminReplyText}
                            onChange={(e) => setAdminReplyText(e.target.value)}
                            placeholder="Tapez votre réponse d'agent..."
                            className="flex-1 rounded-lg border border-[#E1E3E5] px-2.5 py-1.5 text-xs focus:outline-none focus:border-indigo-600 bg-gray-50 focus:bg-white transition"
                          />
                          <button
                            type="submit"
                            disabled={sendingReply || !adminReplyText.trim()}
                            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white p-1.5 rounded-lg transition cursor-pointer"
                          >
                            <Send className="h-3.5 w-3.5" />
                          </button>
                        </form>
                      </>
                    );
                  })() : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-1.5">
                      <MessageSquare className="h-8 w-8 text-gray-300 animate-bounce" />
                      <span className="text-xs font-bold text-gray-400">Sélectionnez une session pour discuter</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: Team / Collaborators Chat */}
            {supportTab === 'team' && (
              <div className="grid gap-4 md:grid-cols-12 min-h-[300px]">
                {/* Team member list - 5 cols */}
                <div className="md:col-span-5 border-r border-[#E1E3E5]/60 pr-2 space-y-2 max-h-[320px] overflow-y-auto">
                  <p className="text-[10px] font-bold text-[#6D7175] uppercase tracking-wider mb-2">Membres de l'Équipe</p>
                  {teamMembers.map(tm => {
                    const isSelected = selectedCollaboratorId === tm.id;
                    return (
                      <button
                        key={tm.id}
                        type="button"
                        onClick={() => setSelectedCollaboratorId(tm.id)}
                        className={`w-full text-left p-2.5 rounded-lg border transition text-xs flex flex-col gap-1 cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-50/50 border-[#BBE3D1] shadow-2xs'
                            : 'bg-white border-[#E1E3E5] hover:bg-[#F6F6F7]/60'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="font-bold text-[#1A1A1A]">{tm.name}</span>
                          <span className="text-[8px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-50 text-[#008060] uppercase border border-[#BBE3D1] shrink-0">
                            {tm.role}
                          </span>
                        </div>
                        <span className="text-[9px] text-[#6D7175] font-medium">{tm.email}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Chat window - 7 cols */}
                <div className="md:col-span-7 flex flex-col justify-between h-[320px] bg-gray-50/50 rounded-xl border border-[#E1E3E5] overflow-hidden">
                  {selectedCollaboratorId && teamMembers.find(tm => tm.id === selectedCollaboratorId) ? (() => {
                    const activeTm = teamMembers.find(tm => tm.id === selectedCollaboratorId)!;
                    const messages = collaboratorChats[activeTm.id] || [];
                    return (
                      <>
                        {/* Chat Header */}
                        <div className="bg-[#1A1A1A] text-white px-3 py-2 text-xs flex justify-between items-center shrink-0">
                          <div>
                            <span className="font-bold">{activeTm.name}</span>
                            <span className="text-[9px] text-emerald-400 block font-bold">Canal sécurisé d'équipe ✓</span>
                          </div>
                        </div>

                        {/* Message Thread */}
                        <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
                          {messages.length === 0 ? (
                            <div className="text-center py-10 text-gray-400 text-xs font-medium">Début de la conversation sécurisée</div>
                          ) : (
                            messages.map((m: any, idx: number) => {
                              const isMe = m.sender === "Moi";
                              return (
                                <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                  <span className="text-[9px] text-gray-400 font-mono mb-0.5">{m.sender} • {m.time}</span>
                                  <div className={`max-w-[90%] rounded-lg px-2.5 py-1.5 text-xs leading-relaxed ${
                                    isMe 
                                      ? 'bg-[#008060] text-white rounded-tr-none shadow-xs' 
                                      : 'bg-white text-gray-800 border border-[#E1E3E5] rounded-tl-none font-medium'
                                  }`}>
                                    {m.text}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>

                        {/* Input Area */}
                        <form onSubmit={handleSendCollabReply} className="p-2 bg-white border-t border-[#E1E3E5] flex gap-1.5 shrink-0">
                          <input
                            type="text"
                            value={collabReplyText}
                            onChange={(e) => setCollabReplyText(e.target.value)}
                            placeholder={`Envoyer un message à ${activeTm.name}...`}
                            className="flex-1 rounded-lg border border-[#E1E3E5] px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#008060] bg-gray-50 focus:bg-white transition"
                          />
                          <button
                            type="submit"
                            disabled={!collabReplyText.trim()}
                            className="bg-[#008060] hover:bg-[#006e52] disabled:opacity-40 text-white p-1.5 rounded-lg transition cursor-pointer"
                          >
                            <Send className="h-3.5 w-3.5" />
                          </button>
                        </form>
                      </>
                    );
                  })() : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-1.5">
                      <Users className="h-8 w-8 text-gray-300 animate-bounce" />
                      <span className="text-xs font-bold text-gray-400">Sélectionnez un collaborateur pour lui écrire</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Gemini Central AI Hub - 5 cols */}
        <div className="lg:col-span-5 space-y-6">
          {/* Audit Report Button */}
          <div className="rounded-xl bg-[#004B36] p-5 text-white shadow-xs border border-[#003828]">
            <div className="flex items-start gap-3">
              <ClipboardList className="h-6 w-6 text-emerald-300 shrink-0 mt-1" />
              <div>
                <h4 className="font-sans text-sm font-bold text-white">Audit Hebdomadaire d'Optimisation</h4>
                <p className="text-[11px] text-emerald-100 mt-1 leading-relaxed">
                  Compilez un rapport complet rédigé par Gemini basé sur l'état de la conversion, l'activité de la marketplace et l'UX.
                </p>
                <button
                  onClick={handleGenerateAudit}
                  disabled={loadingAudit}
                  className="mt-3 flex items-center gap-1.5 rounded-lg bg-[#008060] border border-[#008060] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#006e52] disabled:bg-emerald-800 shadow-xs cursor-pointer"
                >
                  {loadingAudit ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Génération en cours...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
                      Générer l'Audit IA
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Audit Report Result (Rendered dynamically if available) */}
          {auditReport && (
            <div className="rounded-xl bg-white p-5 border border-[#E1E3E5] shadow-xs max-h-[400px] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[#E1E3E5] pb-2 mb-3">
                <span className="text-xs font-bold text-[#008060] uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-[#008060]" />
                  Rapport Compilé avec succès
                </span>
                <button onClick={() => setAuditReport(null)} className="text-gray-400 hover:text-gray-600 text-xs font-semibold cursor-pointer">Fermer</button>
              </div>
              <div className="prose prose-sm max-w-none text-left">
                {renderMarkdown(auditReport)}
              </div>
            </div>
          )}

          {/* Centralized Gemini Chat Assistant */}
          <div className="rounded-xl bg-white border border-[#E1E3E5] shadow-xs flex flex-col h-[400px]">
            <div className="p-4 border-b border-[#E1E3E5] bg-[#F6F6F7] flex items-center justify-between rounded-t-xl">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#008060] animate-spin-slow" />
                <span className="text-xs font-bold text-[#1A1A1A]">Assistant IA Gemini Centralisé</span>
              </div>
              <span className="rounded-full bg-emerald-50 border border-[#BBE3D1] px-2 py-0.5 text-[9px] font-bold text-[#008060]">
                Supervision Connectée
              </span>
            </div>

            {/* Message Thread */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {assistantMessages.map((msg, i) => (
                <div 
                  key={i} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] rounded-lg p-3 text-xs leading-relaxed ${
                    msg.role === 'user' 
                      ? "bg-[#008060] text-white" 
                      : "bg-[#F6F6F7] text-[#1A1A1A] border border-[#E1E3E5]"
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {loadingAssistant && (
                <div className="flex justify-start">
                  <div className="bg-[#F6F6F7] rounded-lg p-3 text-xs text-[#6D7175] flex items-center gap-1.5 border border-[#E1E3E5]">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-[#008060]" />
                    <span>Gemini analyse les flux...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendAssistant} className="p-3 border-t border-[#E1E3E5] flex gap-2">
              <input
                type="text"
                required
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Posez une question sur les transporteurs..."
                className="flex-1 rounded-lg border border-[#E1E3E5] px-3 py-2 text-xs text-[#1A1A1A] placeholder-gray-400 focus:border-[#008060] focus:ring-1 focus:ring-[#008060] focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-lg bg-[#008060] border border-[#008060] p-2 text-white hover:bg-[#006e52] transition shrink-0 cursor-pointer shadow-xs"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>

          {/* Live Compliance & KYC Audit Ledger Timeline */}
          <div className="rounded-xl bg-white border border-[#E1E3E5] p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#E1E3E5] pb-2">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-4.5 w-4.5 text-slate-800 animate-pulse" />
                <h3 className="font-sans text-xs font-bold text-[#1A1A1A] uppercase tracking-wider">Journal d'Audit de Conformité (Live)</h3>
              </div>
              <span className="text-[9px] font-bold text-[#008060] bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded uppercase">Audité</span>
            </div>

            <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
              {complianceLogs.map(log => (
                <div key={log.id} className="flex gap-2.5 text-xs items-start border-l-2 border-slate-200 pl-3 relative py-0.5">
                  <div className={`absolute -left-[5px] top-1.5 w-2 h-2 rounded-full ${
                    log.level === 'success' ? 'bg-[#008060]' :
                    log.level === 'warning' ? 'bg-amber-500' : 'bg-slate-400'
                  }`} />
                  <span className="text-[10px] font-mono text-gray-400 shrink-0">{log.timestamp}</span>
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <p className="text-gray-700 font-semibold leading-snug">{log.action}</p>
                    <p className="text-[9px] text-gray-400 font-medium">
                      Par {log.actor} • <span className="uppercase text-[8px] font-bold px-1 rounded bg-slate-100 text-slate-600 font-mono">{log.category}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* KYC Document Visual Previewer Modal (High Fidelity Simulation) */}
      {selectedDocPreview && (() => {
        const docUser = selectedDocPreview.user;
        const docType = selectedDocPreview.type;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in">
            <div className="w-full max-w-2xl rounded-2xl bg-slate-100 border border-[#E1E3E5] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
              
              {/* Modal Header */}
              <div className="bg-[#1A1A1A] text-white p-4 flex justify-between items-center shrink-0">
                <div>
                  <h4 className="font-sans text-sm font-bold">Visualiseur de Document Officiel KYC</h4>
                  <p className="text-[11px] text-gray-400">
                    Dossier Numérisé : {docUser.companyName || docUser.name} • ICE : {docUser.ice || 'N/A'}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedDocPreview(null)}
                  className="rounded-lg bg-white/10 hover:bg-white/20 px-3 py-1.5 text-xs font-bold text-white transition cursor-pointer"
                >
                  Fermer
                </button>
              </div>

              {/* Simulated Physical Document Content Container */}
              <div className="flex-1 overflow-y-auto p-6 bg-slate-200/50 flex justify-center items-start">
                
                {/* Physical Document Representation */}
                <div className="w-full max-w-lg bg-white border-2 border-slate-300 rounded-lg shadow-lg p-8 relative overflow-hidden select-none font-sans text-slate-800 space-y-6">
                  
                  {/* Subtle watermarks and stamp details */}
                  <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex items-center justify-center">
                    <div className="border-[8px] border-slate-900 rounded-full p-24 text-6xl font-black rotate-45 tracking-widest uppercase">
                      MUMY B2B
                    </div>
                  </div>

                  {/* Document Header */}
                  <div className="text-center border-b border-slate-300 pb-4 space-y-1 relative">
                    {/* Official kingdom stamp */}
                    <p className="text-[9px] font-black tracking-widest uppercase text-slate-500">Royaume du Maroc</p>
                    
                    {docType === 'licence' && (
                      <>
                        <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wide">Ministère du Transport et de la Logistique</p>
                        <h5 className="text-base font-extrabold text-slate-900 uppercase tracking-tight">Licence de Transport Touristique Routier</h5>
                        <p className="text-[9px] font-mono text-slate-400">N° d'Agrément National : L-TT-2026-9844-MAR</p>
                      </>
                    )}

                    {docType === 'rc' && (
                      <>
                        <p className="text-[10px] font-bold text-indigo-800 uppercase tracking-wide">Tribunal de Commerce de Marrakech</p>
                        <h5 className="text-base font-extrabold text-slate-900 uppercase tracking-tight">Registre du Commerce (Extrait Modèle J)</h5>
                        <p className="text-[9px] font-mono text-slate-400">R.C. Registre N° : {docUser.rc || '98455-Marrakech'}</p>
                      </>
                    )}

                    {docType === 'insurance' && (
                      <>
                        <p className="text-[10px] font-bold text-blue-800 uppercase tracking-wide">AXA Assurance Maroc S.A.</p>
                        <h5 className="text-base font-extrabold text-slate-900 uppercase tracking-tight">Attestation de Responsabilité Civile Professionnelle</h5>
                        <p className="text-[9px] font-mono text-slate-400">Police N° : AXA-RCP-2026-9845332</p>
                      </>
                    )}

                    {docType === 'patente' && (
                      <>
                        <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wide">Direction Générale des Impôts</p>
                        <h5 className="text-base font-extrabold text-slate-900 uppercase tracking-tight">Attestation d'Inscription à la Taxe Professionnelle</h5>
                        <p className="text-[9px] font-mono text-slate-400 font-bold">Identifiant Fiscal : {docUser.ifFiscal || '12457896'}</p>
                      </>
                    )}
                  </div>

                  {/* Document Body Fields */}
                  <div className="space-y-4 text-xs">
                    
                    <div className="grid grid-cols-3 border-b border-slate-100 py-1.5 gap-2">
                      <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Titulaire / Société :</span>
                      <span className="col-span-2 font-bold text-slate-900">{docUser.companyName || docUser.name}</span>
                    </div>

                    <div className="grid grid-cols-3 border-b border-slate-100 py-1.5 gap-2">
                      <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Représentant Légal :</span>
                      <span className="col-span-2 font-medium text-slate-800">{docUser.name}</span>
                    </div>

                    <div className="grid grid-cols-3 border-b border-slate-100 py-1.5 gap-2">
                      <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Contact Direct :</span>
                      <span className="col-span-2 font-mono text-slate-700">{docUser.phone} • {docUser.email}</span>
                    </div>

                    {docType === 'licence' && (
                      <>
                        <div className="grid grid-cols-3 border-b border-slate-100 py-1.5 gap-2">
                          <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Catégories de Véhicules :</span>
                          <span className="col-span-2 font-medium text-slate-800">Autocars, Minivans (Classe A/B de Transport Touristique)</span>
                        </div>
                        <div className="grid grid-cols-3 border-b border-slate-100 py-1.5 gap-2">
                          <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Validité Réglementaire :</span>
                          <span className="col-span-2 font-bold text-emerald-700">VALIDE jusqu'au 31 Décembre 2026</span>
                        </div>
                      </>
                    )}

                    {docType === 'rc' && (
                      <>
                        <div className="grid grid-cols-3 border-b border-slate-100 py-1.5 gap-2">
                          <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Numéro d'ICE :</span>
                          <span className="col-span-2 font-mono font-bold text-slate-950">{docUser.ice || 'non déclaré'}</span>
                        </div>
                        <div className="grid grid-cols-3 border-b border-slate-100 py-1.5 gap-2">
                          <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Forme Juridique :</span>
                          <span className="col-span-2 font-medium text-slate-800">S.A.R.L. au Capital de 100,000 DHS</span>
                        </div>
                        <div className="grid grid-cols-3 border-b border-slate-100 py-1.5 gap-2">
                          <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Siège Social :</span>
                          <span className="col-span-2 font-medium text-slate-700">Boulevard Mohamed V, Gueliz, Marrakech</span>
                        </div>
                      </>
                    )}

                    {docType === 'insurance' && (
                      <>
                        <div className="grid grid-cols-3 border-b border-slate-100 py-1.5 gap-2">
                          <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Couverture Passagers :</span>
                          <span className="col-span-2 font-medium text-slate-800">Assurance Responsabilité Civile Professionnelle passagers à titre onéreux (Illimitée)</span>
                        </div>
                        <div className="grid grid-cols-3 border-b border-slate-100 py-1.5 gap-2">
                          <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">État des Primes :</span>
                          <span className="col-span-2 font-bold text-emerald-700">✓ ACQUITTÉ POUR L'ANNÉE EN COURS</span>
                        </div>
                      </>
                    )}

                    {docType === 'patente' && (
                      <>
                        <div className="grid grid-cols-3 border-b border-slate-100 py-1.5 gap-2">
                          <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">N° de Patente :</span>
                          <span className="col-span-2 font-mono font-bold text-slate-900">{docUser.patente || '45879621'}</span>
                        </div>
                        <div className="grid grid-cols-3 border-b border-slate-100 py-1.5 gap-2">
                          <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Activité Imposée :</span>
                          <span className="col-span-2 font-medium text-slate-800">Transport Routier Touristique de Voyageurs (Code Act. 6023)</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Stamp, Bar Code and Signatures Footer */}
                  <div className="pt-6 flex justify-between items-center relative border-t border-slate-200">
                    {/* Bar Code */}
                    <div className="space-y-1">
                      <div className="h-6 w-28 bg-[repeating-linear-gradient(90deg,black,black_2px,transparent_2px,transparent_6px)]" />
                      <p className="text-[7px] font-mono text-slate-400 text-center uppercase">MUMY-SECURE-KYC-VERIFIED</p>
                    </div>

                    {/* Official Stamp Simulation */}
                    <div className="relative text-center w-24 h-24 shrink-0 flex items-center justify-center border-2 border-dashed border-red-500 rounded-full rotate-12 p-1 text-[8px] font-bold text-red-500 uppercase leading-none select-none">
                      <div className="space-y-0.5">
                        <p className="font-black text-[7px]">MUMY TECH</p>
                        <p className="text-[6px]">CONFORME</p>
                        <p className="font-mono text-[6px]">03/07/2026</p>
                      </div>
                    </div>
                  </div>

                </div>

              </div>

              {/* Action bar to validate immediately inside the visualizer */}
              <div className="bg-slate-50 border-t border-[#E1E3E5] p-4 flex justify-between items-center shrink-0">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                  Décision d'audit sur ce document
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const updatedFields: any = {};
                      if (docType === 'licence') updatedFields.kycLicenceStatus = 'verified';
                      if (docType === 'rc') updatedFields.kycRcStatus = 'verified';
                      if (docType === 'insurance') updatedFields.kycInsuranceStatus = 'verified';
                      if (docType === 'patente') updatedFields.kycPatenteStatus = 'verified';

                      onUpdateUser(docUser.id, updatedFields);
                      setSelectedKycUser({ ...docUser, ...updatedFields });
                      addComplianceLog(`${docType.toUpperCase()} de ${docUser.name} validé directement depuis le visualiseur.`, 'kyc', 'success');
                      setSelectedDocPreview(null);
                    }}
                    className="rounded-lg bg-[#008060] hover:bg-[#006e52] px-4 py-1.5 text-xs font-bold text-white shadow-xs cursor-pointer"
                  >
                    Valider ce document
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const updatedFields: any = {};
                      if (docType === 'licence') updatedFields.kycLicenceStatus = 'rejected';
                      if (docType === 'rc') updatedFields.kycRcStatus = 'rejected';
                      if (docType === 'insurance') updatedFields.kycInsuranceStatus = 'rejected';
                      if (docType === 'patente') updatedFields.kycPatenteStatus = 'rejected';

                      onUpdateUser(docUser.id, updatedFields);
                      setSelectedKycUser({ ...docUser, ...updatedFields });
                      addComplianceLog(`${docType.toUpperCase()} de ${docUser.name} rejeté depuis le visualiseur.`, 'kyc', 'warning');
                      setSelectedDocPreview(null);
                    }}
                    className="rounded-lg bg-red-50 border border-red-200 px-3.5 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100 cursor-pointer"
                  >
                    Rejeter
                  </button>
                </div>
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
}
