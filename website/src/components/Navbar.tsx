import React, { useState } from 'react';
import { 
  Sun, 
  Moon, 
  User, 
  LogOut, 
  Menu, 
  X, 
  Zap,
  Bell
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useThemeConfig } from '../context/ThemeConfigContext';
import { BrandLogo } from './BrandLogo';

interface NavbarProps {
  onNavigateSection: (sectionId: string) => void;
  onOpenNotifications?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigateSection, onOpenNotifications }) => {
  const { user, signOut, openAuthModal } = useAuth();
  const { mode, toggleTheme, config, accentClass } = useThemeConfig();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const remainingQuota = user ? Math.max(0, (user.maxDailyGenerations || 4) - (user.generationsToday || 0)) : 4;
  const isLight = mode === 'light';

  const unreadCount = user?.notifications?.filter((n) => !n.read).length || 0;

  const handleNavClick = (id: string) => {
    onNavigateSection(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className={`sticky top-0 z-40 backdrop-blur-md border-b transition-colors w-full ${
      isLight 
        ? 'bg-white/95 border-slate-200 text-slate-900 shadow-sm' 
        : 'bg-[#030712]/90 border-slate-800 text-slate-100'
    }`}>
      {/* Optional Admin Notice Ribbon */}
      {config?.isNoticeBannerVisible && config.noticeBannerText && (
        <div className={`py-1 px-4 text-center text-xs font-semibold tracking-wide border-b w-full truncate ${
          isLight ? 'bg-cyan-100 text-cyan-950 border-cyan-200' : 'bg-cyan-950/50 text-cyan-300 border-cyan-900/60'
        }`}>
          <span>{config.noticeBannerText}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
        {/* Brand / Logo with Custom Emblem */}
        <button 
          onClick={() => handleNavClick('hero')}
          className="flex items-center gap-2.5 text-left group focus:outline-none shrink-0"
        >
          <BrandLogo size={38} />
          <div>
            <span className="text-base sm:text-lg font-black tracking-tight block">
              <span className="text-inherit">{config?.siteName?.slice(0, 9) || 'FreeVideo'}</span>
              <span className={accentClass.text}>{config?.siteName?.slice(9) || 'AIMaker'}</span>
            </span>
            <span className="text-[9px] sm:text-[10px] tracking-wider uppercase font-bold text-slate-600 dark:text-slate-400 block -mt-1">
              Zero Watermarks
            </span>
          </div>
        </button>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-semibold">
          <button 
            onClick={() => handleNavClick('studio')}
            className="hover:text-cyan-500 transition-colors cursor-pointer"
          >
            Studio
          </button>
          <button 
            onClick={() => handleNavClick('showcase')}
            className="hover:text-cyan-500 transition-colors cursor-pointer"
          >
            Showcase
          </button>
          <button 
            onClick={() => handleNavClick('features')}
            className="hover:text-cyan-500 transition-colors cursor-pointer"
          >
            Features
          </button>
          <button 
            onClick={() => handleNavClick('faq')}
            className="hover:text-cyan-500 transition-colors cursor-pointer"
          >
            FAQ
          </button>
        </nav>

        {/* Right Action Tools (NO ADMIN BUTTONS/LINKS HERE) */}
        <div className="hidden md:flex items-center gap-3">
          {/* Light / Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme mode"
            className={`p-2 rounded-lg border transition-all ${
              isLight 
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800' 
                : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-yellow-400'
            }`}
            title={isLight ? 'Switch to Dark Mode (Neon)' : 'Switch to High-Contrast Light Mode'}
          >
            {isLight ? <Moon className="w-4 h-4 text-slate-800" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </button>

          {/* User Authentication Status */}
          {user ? (
            <div className="flex items-center gap-2.5">
              {/* Daily Quota Chip */}
              <div className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 border ${
                isLight 
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900' 
                  : 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300'
              }`}>
                <Zap className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500" />
                <span>{remainingQuota} of {user.maxDailyGenerations || 4} Today</span>
              </div>

              {/* Notification Center Trigger */}
              {onOpenNotifications && (
                <button
                  onClick={onOpenNotifications}
                  title="View Welcome & System Messages"
                  className="relative p-2 rounded-lg border border-slate-300 dark:border-slate-800 hover:border-cyan-500 transition-colors"
                >
                  <Bell className="w-4 h-4 text-slate-400" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-500 animate-pulse" />
                  )}
                </button>
              )}

              {/* User Dropdown / Sign Out */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 max-w-[110px] truncate">
                  {user.username}
                </span>
                <button
                  onClick={signOut}
                  title="Sign Out"
                  className="p-1.5 rounded-lg border border-transparent hover:border-slate-300 dark:hover:border-slate-700 text-slate-500 hover:text-red-500 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => openAuthModal('signin')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  isLight 
                    ? 'text-slate-800 hover:bg-slate-100' 
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => openAuthModal('signup')}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${accentClass.bg} text-slate-950 hover:brightness-110 shadow-sm`}
              >
                Free Account
              </button>
            </div>
          )}
        </div>

        {/* Mobile Controls (NO ADMIN BUTTONS) */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme mode"
            className="p-2 rounded-lg border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300"
          >
            {isLight ? <Moon className="w-4 h-4 text-slate-800" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Open menu"
            className="p-2 rounded-lg border border-slate-300 dark:border-slate-800 text-slate-800 dark:text-slate-200"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer (Strictly no admin hints) */}
      {mobileMenuOpen && (
        <div className={`md:hidden border-b px-4 py-4 flex flex-col gap-3 w-full ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#030712] border-slate-800'
        }`}>
          <button
            onClick={() => handleNavClick('studio')}
            className="text-left py-2 font-semibold text-sm text-slate-800 dark:text-slate-200"
          >
            AI Video Studio
          </button>
          <button
            onClick={() => handleNavClick('showcase')}
            className="text-left py-2 font-semibold text-sm text-slate-800 dark:text-slate-200"
          >
            Showcase Gallery
          </button>
          <button
            onClick={() => handleNavClick('features')}
            className="text-left py-2 font-semibold text-sm text-slate-800 dark:text-slate-200"
          >
            Features & Architecture
          </button>
          <button
            onClick={() => handleNavClick('faq')}
            className="text-left py-2 font-semibold text-sm text-slate-800 dark:text-slate-200"
          >
            FAQ & Policies
          </button>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2">
            {user ? (
              <div className="flex items-center justify-between py-1">
                <div className="text-xs">
                  <p className="font-bold text-slate-900 dark:text-white">{user.username}</p>
                  <p className="text-emerald-600 dark:text-emerald-400 font-semibold">{remainingQuota} generations left today</p>
                </div>
                <button
                  onClick={signOut}
                  className="px-3 py-1 text-xs border rounded-lg text-red-500 border-red-300 dark:border-red-900"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => { openAuthModal('signin'); setMobileMenuOpen(false); }}
                  className="w-full py-2.5 text-xs font-semibold border rounded-lg text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 text-center"
                >
                  Sign In
                </button>
                <button
                  onClick={() => { openAuthModal('signup'); setMobileMenuOpen(false); }}
                  className={`w-full py-2.5 text-xs font-bold rounded-lg ${accentClass.bg} text-slate-950 text-center`}
                >
                  Free Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
