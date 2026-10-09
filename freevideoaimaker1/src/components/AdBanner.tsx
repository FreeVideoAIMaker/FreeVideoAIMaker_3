import React from 'react';
import { useThemeConfig } from '../context/ThemeConfigContext';
import { Coins, Sparkles } from 'lucide-react';

interface AdBannerProps {
  type: 'leaderboard' | 'sidebar' | 'showcase' | 'completion';
  className?: string;
}

export const AdBanner: React.FC<AdBannerProps> = ({ type, className = '' }) => {
  const { config, mode } = useThemeConfig();

  if (!config) return null;

  // Check if this specific ad type is enabled in admin settings
  const isEnabled = (() => {
    switch (type) {
      case 'leaderboard':
        return config.ads?.headerAdEnabled ?? true;
      case 'sidebar':
        return config.ads?.sidebarAdEnabled ?? true;
      case 'showcase':
        return config.ads?.showcaseAdEnabled ?? true;
      case 'completion':
        return config.ads?.completionAdEnabled ?? true;
      default:
        return false;
    }
  })();

  if (!isEnabled) return null;

  // Priority 1: Custom Ad HTML / Google AdSense snippet set by admin
  if (config.ads?.customAdSnippet && config.ads.customAdSnippet.trim().length > 0) {
    return (
      <div 
        className={`ad-container overflow-hidden text-center my-3 max-w-full ${className}`}
        dangerouslySetInnerHTML={{ __html: config.ads.customAdSnippet }}
      />
    );
  }

  // Priority 2: Google AdSense script integration
  if (config.ads?.googleAdSenseCode && config.ads.googleAdSenseCode.trim().length > 0) {
    return (
      <div 
        className={`adsense-wrapper overflow-hidden text-center my-3 max-w-full ${className}`}
        dangerouslySetInnerHTML={{ __html: config.ads.googleAdSenseCode }}
      />
    );
  }

  const isLight = mode === 'light';
  const cryptoNet = config.ads?.cryptoAdNetwork || 'a-ads';

  // Responsive Crypto Monetization Banner
  if (type === 'leaderboard') {
    return (
      <div className={`w-full max-w-5xl mx-auto my-4 px-3 sm:px-4 ${className}`}>
        <div className={`border rounded-xl p-3 sm:p-4 text-center transition-all ${
          isLight 
            ? 'bg-slate-100/90 border-slate-300 text-slate-800' 
            : 'bg-slate-900/60 border-slate-800 text-slate-300'
        }`}>
          <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1 px-1">
            <span className="flex items-center gap-1 font-bold text-amber-500">
              <Coins className="w-3 h-3" />
              <span>Verified Crypto & Tech Sponsor</span>
            </span>
            <span className="text-[9px] bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-400">
              728×90 / 320×50
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-1">
            <div className="text-left">
              <p className="text-xs sm:text-sm font-bold text-slate-950 dark:text-white">
                Ultra-Fast Dedicated GPU Cloud for AI Creators
              </p>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Deploy 60FPS AI models with crypto payments (BTC, ETH, USDT) - No KYC required.
              </p>
            </div>
            <a
              href="#studio"
              className="w-full sm:w-auto px-4 py-1.5 text-xs font-bold rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors shrink-0 text-center shadow-sm"
            >
              Explore Node
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'sidebar') {
    return (
      <div className={`w-full rounded-xl border p-4 text-center ${
        isLight 
          ? 'bg-slate-100 border-slate-300 text-slate-800' 
          : 'bg-slate-900/60 border-slate-800 text-slate-300'
      } ${className}`}>
        <div className="flex justify-between items-center text-[10px] uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
          <span className="font-bold flex items-center gap-1 text-amber-500">
            <Coins className="w-3 h-3" />
            <span>Crypto Ad Network</span>
          </span>
          <span>300×250</span>
        </div>
        <div className="h-32 sm:h-36 rounded-lg bg-gradient-to-br from-cyan-950/40 to-purple-950/40 border border-cyan-500/20 flex flex-col items-center justify-center p-3 text-center">
          <p className="text-xs font-bold text-slate-950 dark:text-white mb-1">
            Anonymous Instant Crypto Exchange
          </p>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 mb-2">
            Low fees · Zero limits · BTC & USDT
          </p>
          <span className="text-[10px] font-bold text-cyan-500 underline">
            Visit Partner
          </span>
        </div>
      </div>
    );
  }

  if (type === 'showcase') {
    return (
      <div className={`col-span-full my-4 p-4 rounded-2xl border text-center ${
        isLight
          ? 'bg-slate-100/95 border-slate-300 text-slate-800'
          : 'bg-slate-900/50 border-slate-800 text-slate-300'
      } ${className}`}>
        <div className="flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
          <Coins className="w-3 h-3 text-amber-500" />
          <span>Decentralized Sponsor Stream</span>
        </div>
        <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 py-1">
          <div className="text-left">
            <h4 className="text-sm font-bold text-slate-950 dark:text-white">
              Hardware Wallets & Cold Storage for Creators
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Secure your crypto video royalties and digital assets with tamper-proof security.
            </p>
          </div>
          <button className="w-full sm:w-auto px-4 py-2 text-xs font-bold rounded-lg bg-purple-600 hover:bg-purple-500 text-white transition-colors shrink-0">
            Claim Offer
          </button>
        </div>
      </div>
    );
  }

  // Completion / Download Card Sponsor
  return (
    <div className={`mt-3 p-3 rounded-xl border text-center ${
      isLight ? 'bg-slate-100 border-slate-300' : 'bg-slate-900/80 border-slate-800'
    } ${className}`}>
      <span className="text-[10px] uppercase tracking-widest text-slate-600 dark:text-slate-400 block mb-1">
        Sponsored Recommendation
      </span>
      <p className="text-xs font-semibold text-slate-900 dark:text-slate-200">
        Earn crypto rewards by sharing your AI-generated videos on Web3 creator platforms.
      </p>
    </div>
  );
};
