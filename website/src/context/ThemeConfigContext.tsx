import React, { createContext, useContext, useState, useEffect } from 'react';
import { SiteConfig } from '../types';
import { fetchSiteConfig, recordVisit } from '../lib/api';

type ThemeMode = 'dark' | 'light';

interface ThemeConfigContextType {
  mode: ThemeMode;
  toggleTheme: () => void;
  config: SiteConfig | null;
  refreshConfig: () => Promise<void>;
  accentClass: {
    text: string;
    bg: string;
    border: string;
    glow: string;
    gradient: string;
  };
}

const defaultFallbackConfig: SiteConfig = {
  siteName: 'FreeVideoAIMaker',
  heroTitle: 'Transform Multiple Photos & Prompts into Cinematic AI Videos',
  heroSubtitle: 'Next-generation neural video synthesis with multi-image keyframing, dynamic camera movement, and zero watermarks. 100% free with daily creation quotas.',
  heroCtaText: 'Launch AI Video Studio',
  noticeBannerText: '✨ Version 2.4 Live: Multi-image sequence interpolation & 60FPS motion blur enabled!',
  isNoticeBannerVisible: true,
  aiEngineName: 'FreeVideoAIMaker DeepMotion Core v2.4',
  dailyUserLimit: 4,
  videoRetentionHours: 24,
  smtpConfigured: false,
  theme: {
    accentColor: 'cyan',
    neonIntensity: 'high',
    lightModeFontDarkness: 'maximum',
  },
  sectionVisibility: {
    hero: true,
    studio: true,
    showcase: true,
    features: true,
    faq: true,
    sponsorBanner: true,
  },
  ads: {
    headerAdEnabled: true,
    sidebarAdEnabled: true,
    showcaseAdEnabled: true,
    completionAdEnabled: true,
    googleAdSenseCode: '',
    cryptoAdNetwork: 'a-ads',
    cryptoAdUnitId: 'a-ads-freevideoaimaker',
    customAdSnippet: '',
  },
};

const ThemeConfigContext = createContext<ThemeConfigContextType | undefined>(undefined);

export const ThemeConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>(() => {
    return (localStorage.getItem('fva_theme_mode') as ThemeMode) || 'dark';
  });
  const [config, setConfig] = useState<SiteConfig>(defaultFallbackConfig);

  const refreshConfig = async () => {
    try {
      const remote = await fetchSiteConfig();
      setConfig(remote);
    } catch {
      // Keep existing
    }
  };

  useEffect(() => {
    refreshConfig();
    recordVisit();

    // Auto-sync interval: syncs admin edits to visitors every 6 seconds seamlessly
    const interval = setInterval(refreshConfig, 6000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    localStorage.setItem('fva_theme_mode', mode);
    if (mode === 'light') {
      document.body.classList.remove('dark-mode');
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
      document.body.classList.add('dark-mode');
    }
  }, [mode]);

  const toggleTheme = () => {
    setMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const accent = config?.theme?.accentColor || 'cyan';

  const accentStyles = {
    cyan: {
      text: 'text-cyan-400',
      bg: 'bg-cyan-500',
      border: 'border-cyan-500/40 hover:border-cyan-400',
      glow: 'neon-glow-cyan',
      gradient: 'from-cyan-500 to-blue-600',
    },
    purple: {
      text: 'text-purple-400',
      bg: 'bg-purple-600',
      border: 'border-purple-500/40 hover:border-purple-400',
      glow: 'neon-glow-purple',
      gradient: 'from-purple-500 to-indigo-600',
    },
    emerald: {
      text: 'text-emerald-400',
      bg: 'bg-emerald-500',
      border: 'border-emerald-500/40 hover:border-emerald-400',
      glow: 'neon-glow-emerald',
      gradient: 'from-emerald-500 to-teal-600',
    },
    rose: {
      text: 'text-rose-400',
      bg: 'bg-rose-500',
      border: 'border-rose-500/40 hover:border-rose-400',
      glow: 'neon-glow-rose',
      gradient: 'from-rose-500 to-pink-600',
    },
    amber: {
      text: 'text-amber-400',
      bg: 'bg-amber-500',
      border: 'border-amber-500/40 hover:border-amber-400',
      glow: 'neon-glow-amber',
      gradient: 'from-amber-500 to-orange-600',
    },
  }[accent] || {
    text: 'text-cyan-400',
    bg: 'bg-cyan-500',
    border: 'border-cyan-500/40 hover:border-cyan-400',
    glow: 'neon-glow-cyan',
    gradient: 'from-cyan-500 to-blue-600',
  };

  return (
    <ThemeConfigContext.Provider
      value={{
        mode,
        toggleTheme,
        config,
        refreshConfig,
        accentClass: accentStyles,
      }}
    >
      {children}
    </ThemeConfigContext.Provider>
  );
};

export function useThemeConfig() {
  const context = useContext(ThemeConfigContext);
  if (!context) throw new Error('useThemeConfig must be used within ThemeConfigProvider');
  return context;
}
