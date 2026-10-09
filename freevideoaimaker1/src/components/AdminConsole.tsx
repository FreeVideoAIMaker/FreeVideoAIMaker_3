import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  BarChart3, 
  Users, 
  Key, 
  Palette, 
  HardDrive, 
  DollarSign, 
  FileText, 
  Lock, 
  LogOut, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Save, 
  Bot, 
  UserCheck, 
  TrendingUp, 
  Cpu, 
  Coins,
  Mail
} from 'lucide-react';
import { 
  adminLogin, 
  fetchAdminStats, 
  fetchAdminUsers, 
  toggleBanUser, 
  fetchAdminAuditLogs, 
  fetchAdminSettings, 
  updateAdminSettings 
} from '../lib/api';
import { AdminStats, AdminUserView, AuditLog } from '../types';
import { useThemeConfig } from '../context/ThemeConfigContext';

interface AdminConsoleProps {
  isOpen: boolean;
  onClose: () => void;
}

type AdminTab = 'overview' | 'users' | 'audit' | 'ai-engine' | 'theme-content' | 'ads' | 'storage' | 'email';

export const AdminConsole: React.FC<AdminConsoleProps> = ({ isOpen, onClose }) => {
  const { refreshConfig } = useThemeConfig();

  // Authentication State (Zero hints in UI)
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Active Tab
  const [currentTab, setCurrentTab] = useState<AdminTab>('overview');

  // Admin Data
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [usersList, setUsersList] = useState<AdminUserView[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [adminSettings, setAdminSettings] = useState<any>(null);

  // Form Fields
  const [newToken, setNewToken] = useState('');
  const [dailyLimit, setDailyLimit] = useState(4);
  const [retentionHours, setRetentionHours] = useState(24);
  
  // SMTP Config
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [smtpFrom, setSmtpFrom] = useState('');

  // Theme & Text Customization State
  const [accentColor, setAccentColor] = useState<'cyan' | 'purple' | 'emerald' | 'rose' | 'amber'>('cyan');
  const [siteName, setSiteName] = useState('');
  const [heroTitle, setHeroTitle] = useState('');
  const [heroSubtitle, setHeroSubtitle] = useState('');
  const [heroCtaText, setHeroCtaText] = useState('');
  const [noticeBannerText, setNoticeBannerText] = useState('');
  const [isNoticeVisible, setIsNoticeVisible] = useState(true);

  // Section Visibilities
  const [visibility, setVisibility] = useState({
    hero: true,
    studio: true,
    showcase: true,
    features: true,
    faq: true,
    sponsorBanner: true,
  });

  // Ads & Crypto Monetization
  const [adsConfig, setAdsConfig] = useState<{
    headerAdEnabled: boolean;
    sidebarAdEnabled: boolean;
    showcaseAdEnabled: boolean;
    completionAdEnabled: boolean;
    googleAdSenseCode: string;
    cryptoAdNetwork: 'none' | 'a-ads' | 'coinzilla' | 'bitmedia';
    cryptoAdUnitId: string;
    customAdSnippet: string;
  }>({
    headerAdEnabled: true,
    sidebarAdEnabled: true,
    showcaseAdEnabled: true,
    completionAdEnabled: true,
    googleAdSenseCode: '',
    cryptoAdNetwork: 'a-ads',
    cryptoAdUnitId: 'a-ads-freevideoaimaker',
    customAdSnippet: '',
  });

  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('fva_admin_token');
    if (token) {
      setIsAdminAuthenticated(true);
      loadAllAdminData();
    }
  }, [isOpen]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsLoggingIn(true);

    try {
      const res = await adminLogin(adminPasswordInput);
      localStorage.setItem('fva_admin_token', res.token);
      setIsAdminAuthenticated(true);
      setAdminPasswordInput('');
      await loadAllAdminData();
    } catch {
      setAuthError('Access Denied: Invalid credentials.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('fva_admin_token');
    setIsAdminAuthenticated(false);
  };

  const loadAllAdminData = async () => {
    try {
      const [s, u, a, settings] = await Promise.all([
        fetchAdminStats(),
        fetchAdminUsers(),
        fetchAdminAuditLogs(),
        fetchAdminSettings(),
      ]);

      setStats(s);
      setUsersList(u);
      setAuditLogs(a);
      setAdminSettings(settings);

      if (settings?.config) {
        setDailyLimit(settings.config.dailyUserLimit || 4);
        setRetentionHours(settings.config.videoRetentionHours || 24);
        setAccentColor(settings.config.theme?.accentColor || 'cyan');
        setSiteName(settings.config.siteName || '');
        setHeroTitle(settings.config.heroTitle || '');
        setHeroSubtitle(settings.config.heroSubtitle || '');
        setHeroCtaText(settings.config.heroCtaText || '');
        setNoticeBannerText(settings.config.noticeBannerText || '');
        setIsNoticeVisible(Boolean(settings.config.isNoticeBannerVisible));
        if (settings.config.sectionVisibility) setVisibility(settings.config.sectionVisibility);
        if (settings.config.ads) setAdsConfig(settings.config.ads);
        if (settings.config.smtp) {
          setSmtpHost(settings.config.smtp.host || '');
          setSmtpPort(settings.config.smtp.port || 587);
          setSmtpUser(settings.config.smtp.user || '');
          setSmtpPass(settings.config.smtp.pass || '');
          setSmtpFrom(settings.config.smtp.from || '');
        }
      }
    } catch (err: any) {
      if (err.message?.includes('Unauthorized')) {
        handleAdminLogout();
      }
    }
  };

  const handleSaveAllSettings = async () => {
    setIsSaving(true);
    setSaveSuccessMsg(null);
    setSaveErrorMsg(null);

    try {
      const payload: any = {
        dailyUserLimit: Number(dailyLimit),
        videoRetentionHours: Number(retentionHours),
        theme: { accentColor },
        siteName,
        heroTitle,
        heroSubtitle,
        heroCtaText,
        noticeBannerText,
        isNoticeBannerVisible: isNoticeVisible,
        sectionVisibility: visibility,
        ads: adsConfig,
        smtp: {
          host: smtpHost,
          port: Number(smtpPort),
          user: smtpUser,
          pass: smtpPass,
          from: smtpFrom,
        },
      };

      if (newToken.trim()) {
        payload.token = newToken.trim();
      }

      await updateAdminSettings(payload);
      setSaveSuccessMsg('Configuration synced live to tablet storage and customer site!');
      setNewToken('');
      await refreshConfig();
      await loadAllAdminData();
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } catch (err: any) {
      setSaveErrorMsg(err.message || 'Failed to update settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBanToggle = async (userId: string) => {
    try {
      const res = await toggleBanUser(userId);
      setUsersList((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isBanned: res.isBanned } : u))
      );
    } catch {
      // Ignored
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-6xl max-h-[92vh] rounded-2xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl flex flex-col overflow-hidden my-auto">
        {/* Top Header Bar */}
        <div className="px-6 py-4 border-b border-slate-800 bg-[#060a12] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>FreeVideoAIMaker Control Center</span>
                <span className="text-[10px] bg-cyan-950 border border-cyan-800 text-cyan-300 px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold">
                  Self-Hosted Host
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Tablet Storage, Real-Time Synchronizer & Direct Ad Monetization
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isAdminAuthenticated && (
              <button
                onClick={handleAdminLogout}
                className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-900/50 hover:bg-red-950/40 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Exit</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        {!isAdminAuthenticated ? (
          /* Authentication Screen (STRICT ZERO PASSWORD HINTS) */
          <div className="p-8 sm:p-14 flex flex-col items-center justify-center text-center max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mb-4">
              <Lock className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              Management Portal
            </h3>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              Restricted to system owner. Enter administrative credentials.
            </p>

            {authError && (
              <div className="w-full mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs text-left flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="w-full space-y-3">
              <input
                type="password"
                required
                value={adminPasswordInput}
                onChange={(e) => setAdminPasswordInput(e.target.value)}
                placeholder="Access Key..."
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors shadow-lg"
              >
                {isLoggingIn ? 'Authenticating...' : 'Access Portal'}
              </button>
            </form>
          </div>
        ) : (
          /* Authenticated Dashboard Interface */
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Sidebar Navigation */}
            <aside className="w-full md:w-56 border-r border-slate-800 bg-[#060a12]/80 p-3 flex md:flex-col gap-1 overflow-x-auto md:overflow-y-auto shrink-0 scrollbar-none">
              {[
                { id: 'overview', label: 'Analytics (From 0)', icon: <BarChart3 className="w-4 h-4" /> },
                { id: 'storage', label: 'Tablet Local Disk', icon: <HardDrive className="w-4 h-4" /> },
                { id: 'ai-engine', label: 'AI Key & Quotas', icon: <Cpu className="w-4 h-4" /> },
                { id: 'users', label: 'Registered Accounts', icon: <Users className="w-4 h-4" /> },
                { id: 'audit', label: 'Safety & Prompts', icon: <FileText className="w-4 h-4" /> },
                { id: 'theme-content', label: 'Theme & Text Overrides', icon: <Palette className="w-4 h-4" /> },
                { id: 'ads', label: 'AdSense & Crypto Ads', icon: <DollarSign className="w-4 h-4" /> },
                { id: 'email', label: 'Welcome Email SMTP', icon: <Mail className="w-4 h-4" /> },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setCurrentTab(tab.id as AdminTab)}
                  className={`w-full px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition-all text-left whitespace-nowrap ${
                    currentTab === tab.id
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-850'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </aside>

            {/* Main Tab Panel */}
            <main className="flex-1 p-5 sm:p-7 overflow-y-auto max-h-[calc(92vh-70px)]">
              {saveSuccessMsg && (
                <div className="mb-5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{saveSuccessMsg}</span>
                </div>
              )}
              {saveErrorMsg && (
                <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{saveErrorMsg}</span>
                </div>
              )}

              {/* 1. OVERVIEW & ANALYTICS (ZERO INITIAL STATS) */}
              {currentTab === 'overview' && stats && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/70">
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                        <span>Genuine Visitors</span>
                        <UserCheck className="w-4 h-4 text-cyan-400" />
                      </div>
                      <p className="text-2xl font-black text-white">{stats.totalVisitors}</p>
                      <p className="text-[11px] text-emerald-400 mt-1">
                        Excludes all bots & admin
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/70">
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                        <span>Bots Blocked</span>
                        <Bot className="w-4 h-4 text-purple-400" />
                      </div>
                      <p className="text-2xl font-black text-white">{stats.botRequestsFiltered}</p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Crawlers & scrapers stopped
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/70">
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                        <span>Videos Generated</span>
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                      </div>
                      <p className="text-2xl font-black text-white">{stats.totalGenerations}</p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        {stats.todayGenerations} today on tablet
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/70">
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                        <span>Safety Blocks</span>
                        <AlertCircle className="w-4 h-4 text-rose-400" />
                      </div>
                      <p className="text-2xl font-black text-white">{stats.flaggedSafetyAttempts}</p>
                      <p className="text-[11px] text-rose-400 mt-1">
                        Violations caught
                      </p>
                    </div>
                  </div>

                  {/* 7-Day Visual Timeline */}
                  <div className="p-5 rounded-xl border border-slate-800 bg-slate-950/60">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                      Host Visitor & Generation Timeline (Starts from Zero)
                    </h4>
                    <div className="grid grid-cols-7 gap-2 h-44 items-end pt-4 border-b border-slate-800 pb-2">
                      {stats.timeSeries.map((item, idx) => {
                        const maxVal = Math.max(10, ...stats.timeSeries.map((t) => Math.max(t.visitors, t.generations)));
                        const visitorHeight = Math.min(100, (item.visitors / maxVal) * 100);
                        const genHeight = Math.min(100, (item.generations / maxVal) * 100);

                        return (
                          <div key={idx} className="flex flex-col items-center h-full justify-end group">
                            <div className="flex items-end gap-1.5 w-full justify-center h-full">
                              <div
                                style={{ height: `${Math.max(6, visitorHeight)}%` }}
                                className="w-4 rounded-t bg-cyan-500 hover:bg-cyan-400 transition-all relative"
                              />
                              <div
                                style={{ height: `${Math.max(6, genHeight)}%` }}
                                className="w-4 rounded-t bg-purple-500 hover:bg-purple-400 transition-all relative"
                              />
                            </div>
                            <span className="text-[10px] text-slate-500 mt-2 truncate w-full text-center">
                              {item.date.slice(5)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* 2. TABLET LOCAL DISK STORAGE */}
              {currentTab === 'storage' && (
                <div className="space-y-5">
                  <div className="p-5 rounded-xl border border-slate-800 bg-slate-950/60">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-2">
                      <HardDrive className="w-4 h-4 text-emerald-400" />
                      <span>Tablet Local File Storage & Daemon</span>
                    </h4>
                    <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                      All videos, databases, and user metadata are stored <strong>directly on this device</strong>. No external third-party cloud database required.
                    </p>

                    <div className="p-3 rounded-xl border border-slate-800 bg-slate-900 mb-4 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Database Storage File:</span>
                        <span className="font-mono text-cyan-400">./data/database.json</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Video Storage Directory:</span>
                        <span className="font-mono text-cyan-400">./data/videos/</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Current Videos on Disk:</span>
                        <span className="font-bold text-white">{adminSettings?.tabletStorage?.videoCount || 0} Files</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-white block mb-1">
                        Auto-Purge Expiration Window (Hours)
                      </label>
                      <p className="text-[11px] text-slate-400 mb-2">
                        Videos older than this duration are automatically unlinked and permanently deleted from the tablet disk.
                      </p>
                      <input
                        type="number"
                        min={1}
                        max={72}
                        value={retentionHours}
                        onChange={(e) => setRetentionHours(Number(e.target.value))}
                        className="w-full sm:w-48 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm font-bold text-cyan-400"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleSaveAllSettings}
                    disabled={isSaving}
                    className="px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center gap-2 transition-all shadow-md"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Storage Settings</span>
                  </button>
                </div>
              )}

              {/* 3. AI ENGINE & QUOTAS */}
              {currentTab === 'ai-engine' && (
                <div className="space-y-5">
                  <div className="p-5 rounded-xl border border-slate-800 bg-slate-950/60">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-2">
                      <Key className="w-4 h-4 text-cyan-400" />
                      <span>Neural Engine Token</span>
                    </h4>
                    <p className="text-xs text-slate-400 mb-4">
                      Masked server token. Can be replaced at any time.
                    </p>

                    <div className="mb-4">
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Current Active Token Preview
                      </label>
                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-cyan-400">
                        {adminSettings?.tokenMasked || '••••••••••••••••••••'}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Set New Token
                      </label>
                      <input
                        type="password"
                        value={newToken}
                        onChange={(e) => setNewToken(e.target.value)}
                        placeholder="Paste new token..."
                        className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="p-5 rounded-xl border border-slate-800 bg-slate-950/60">
                    <label className="text-xs font-bold text-white block mb-1">
                      Free Daily Generations Per Account
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={dailyLimit}
                      onChange={(e) => setDailyLimit(Number(e.target.value))}
                      className="w-full sm:w-48 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm font-bold text-emerald-400"
                    />
                  </div>

                  <button
                    onClick={handleSaveAllSettings}
                    disabled={isSaving}
                    className="px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center gap-2 transition-all shadow-md"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Parameters</span>
                  </button>
                </div>
              )}

              {/* 4. REGISTERED ACCOUNTS */}
              {currentTab === 'users' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="text-sm font-bold text-white">Registered Users Directory</h4>
                      <p className="text-xs text-slate-400">
                        Emails and hashes are salted on tablet storage.
                      </p>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300">
                      Total: {usersList.length}
                    </span>
                  </div>

                  <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900 border-b border-slate-800 text-slate-400">
                        <tr>
                          <th className="p-3">Username</th>
                          <th className="p-3">Masked Email</th>
                          <th className="p-3 text-center">Generations</th>
                          <th className="p-3">Status</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850">
                        {usersList.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-6 text-center text-slate-500">
                              No registered users yet. Starts at zero.
                            </td>
                          </tr>
                        ) : (
                          usersList.map((u) => (
                            <tr key={u.id} className="hover:bg-slate-900/50">
                              <td className="p-3 font-semibold text-white">{u.username}</td>
                              <td className="p-3 text-slate-400 font-mono">{u.maskedEmail}</td>
                              <td className="p-3 text-center">
                                <span className="font-bold text-cyan-400">{u.generationsToday}</span>
                                <span className="text-slate-500"> / {u.totalGenerations}</span>
                              </td>
                              <td className="p-3">
                                {u.isBanned ? (
                                  <span className="text-red-400 font-semibold bg-red-950/40 px-2 py-0.5 rounded text-[10px]">
                                    Suspended
                                  </span>
                                ) : (
                                  <span className="text-emerald-400 font-semibold bg-emerald-950/40 px-2 py-0.5 rounded text-[10px]">
                                    Active
                                  </span>
                                )}
                              </td>
                              <td className="p-3 text-right">
                                <button
                                  onClick={() => handleBanToggle(u.id)}
                                  className={`px-2.5 py-1 rounded text-[11px] font-semibold border ${
                                    u.isBanned ? 'border-emerald-700 text-emerald-400' : 'border-red-850 text-red-400'
                                  }`}
                                >
                                  {u.isBanned ? 'Reinstate' : 'Ban'}
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 5. AUDIT & PROMPTS */}
              {currentTab === 'audit' && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-bold text-white">Safety Moderation Logs</h4>
                    <p className="text-xs text-slate-400">
                      Prompts requested by users and real-time moderation status.
                    </p>
                  </div>

                  <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900 border-b border-slate-800 text-slate-400">
                        <tr>
                          <th className="p-3">Time</th>
                          <th className="p-3">User</th>
                          <th className="p-3">Prompt</th>
                          <th className="p-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850">
                        {auditLogs.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="p-6 text-center text-slate-500">
                              No prompts logged yet.
                            </td>
                          </tr>
                        ) : (
                          auditLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-slate-900/50">
                              <td className="p-3 text-slate-400 whitespace-nowrap">{log.timestamp.slice(11, 19)}</td>
                              <td className="p-3 font-semibold text-slate-200">{log.username || 'Anonymous'}</td>
                              <td className="p-3 text-slate-300 max-w-xs break-words">"{log.prompt}"</td>
                              <td className="p-3 whitespace-nowrap">
                                {log.safetyStatus === 'approved' ? (
                                  <span className="bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-bold">
                                    Approved
                                  </span>
                                ) : (
                                  <span className="bg-red-950 text-red-400 px-2 py-0.5 rounded text-[10px] font-bold">
                                    Blocked
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 6. THEME & TEXT OVERRIDES */}
              {currentTab === 'theme-content' && (
                <div className="space-y-5">
                  <div className="p-5 rounded-xl border border-slate-800 bg-slate-950/60">
                    <h4 className="text-sm font-bold text-white mb-2">Neon Accent Theme</h4>
                    <div className="flex flex-wrap gap-2.5">
                      {[
                        { id: 'cyan', label: 'Cyber Cyan', color: '#06b6d4' },
                        { id: 'purple', label: 'Electric Violet', color: '#a855f7' },
                        { id: 'emerald', label: 'Matrix Emerald', color: '#10b981' },
                        { id: 'rose', label: 'Neon Rose', color: '#f43f5e' },
                        { id: 'amber', label: 'Cyber Amber', color: '#f59e0b' },
                      ].map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setAccentColor(c.id as any)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 border ${
                            accentColor === c.id ? 'border-white text-white' : 'border-slate-800 text-slate-400'
                          }`}
                        >
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                          <span>{c.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-3">
                    <h4 className="text-sm font-bold text-white mb-1">Live Text Customizer</h4>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Site Brand Name</label>
                      <input
                        type="text"
                        value={siteName}
                        onChange={(e) => setSiteName(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Hero Title</label>
                      <input
                        type="text"
                        value={heroTitle}
                        onChange={(e) => setHeroTitle(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Hero Subtitle</label>
                      <textarea
                        rows={2}
                        value={heroSubtitle}
                        onChange={(e) => setHeroSubtitle(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="p-5 rounded-xl border border-slate-800 bg-slate-950/60">
                    <h4 className="text-sm font-bold text-white mb-2">Section Visibility Toggles</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {Object.entries(visibility).map(([key, val]) => (
                        <label key={key} className="flex items-center gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                          <input
                            type="checkbox"
                            checked={val}
                            onChange={(e) => setVisibility({ ...visibility, [key]: e.target.checked })}
                          />
                          <span className="capitalize">{key}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleSaveAllSettings}
                    disabled={isSaving}
                    className="px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center gap-2 shadow-md"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Theme & Content</span>
                  </button>
                </div>
              )}

              {/* 7. ADSENSE & CRYPTO MONETIZATION */}
              {currentTab === 'ads' && (
                <div className="space-y-5">
                  <div className="p-5 rounded-xl border border-slate-800 bg-slate-950/60">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-2">
                      <Coins className="w-4 h-4 text-amber-400" />
                      <span>Crypto Ad Networks (Direct BTC / USDT Earnings)</span>
                    </h4>
                    <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                      Crypto ad networks pay directly to your cryptocurrency wallet without requiring strict approval or KYC rules.
                    </p>

                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-300 block mb-1">
                          Select Crypto Ad Provider
                        </label>
                        <select
                          value={adsConfig.cryptoAdNetwork}
                          onChange={(e) => setAdsConfig({ ...adsConfig, cryptoAdNetwork: e.target.value as any })}
                          className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
                        >
                          <option value="a-ads">A-Ads (Anonymous Ads - Instant Bitcoin / USDT Payouts)</option>
                          <option value="coinzilla">CoinZilla (High CPM Web3 Ads)</option>
                          <option value="bitmedia">Bitmedia (Crypto Display Network)</option>
                          <option value="none">Disabled</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-300 block mb-1">
                          Google AdSense Code Snippet (Optional)
                        </label>
                        <textarea
                          rows={3}
                          value={adsConfig.googleAdSenseCode}
                          onChange={(e) => setAdsConfig({ ...adsConfig, googleAdSenseCode: e.target.value })}
                          placeholder='<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-..." crossorigin="anonymous"></script>'
                          className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-300"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleSaveAllSettings}
                    disabled={isSaving}
                    className="px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center gap-2 shadow-md"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Monetization Settings</span>
                  </button>
                </div>
              )}

              {/* 8. WELCOME EMAIL SMTP */}
              {currentTab === 'email' && (
                <div className="space-y-5">
                  <div className="p-5 rounded-xl border border-slate-800 bg-slate-950/60">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-2">
                      <Mail className="w-4 h-4 text-cyan-400" />
                      <span>SMTP Welcome Email Delivery</span>
                    </h4>
                    <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                      Configure your SMTP server (Gmail, SendGrid, Mailgun, or custom host) to automatically send the welcome onboarding email to users upon registration.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">SMTP Host</label>
                        <input
                          type="text"
                          value={smtpHost}
                          onChange={(e) => setSmtpHost(e.target.value)}
                          placeholder="smtp.gmail.com"
                          className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">SMTP Port</label>
                        <input
                          type="number"
                          value={smtpPort}
                          onChange={(e) => setSmtpPort(Number(e.target.value))}
                          placeholder="587"
                          className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">SMTP Username / Email</label>
                        <input
                          type="text"
                          value={smtpUser}
                          onChange={(e) => setSmtpUser(e.target.value)}
                          placeholder="user@example.com"
                          className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">SMTP Password</label>
                        <input
                          type="password"
                          value={smtpPass}
                          onChange={(e) => setSmtpPass(e.target.value)}
                          placeholder="••••••••"
                          className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleSaveAllSettings}
                    disabled={isSaving}
                    className="px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center gap-2 shadow-md"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save SMTP Settings</span>
                  </button>
                </div>
              )}
            </main>
          </div>
        )}
      </div>
    </div>
  );
};
