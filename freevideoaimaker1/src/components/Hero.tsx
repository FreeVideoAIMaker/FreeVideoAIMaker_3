import React from 'react';
import { Play, CheckCircle2, ShieldCheck, Clock, Sparkles } from 'lucide-react';
import { useThemeConfig } from '../context/ThemeConfigContext';

interface HeroProps {
  onStartCreating: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onStartCreating }) => {
  const { config, mode, accentClass } = useThemeConfig();
  const isLight = mode === 'light';

  if (!config || !config.sectionVisibility?.hero) return null;

  return (
    <section id="hero" className={`relative overflow-hidden py-12 sm:py-18 lg:py-22 border-b w-full ${
      isLight ? 'bg-gradient-to-b from-slate-50 via-white to-slate-100 border-slate-200' : 'cyber-grid-dark border-slate-800'
    }`}>
      {/* Background Neon Glow Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[500px] h-[250px] bg-cyan-500/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/3 right-4 w-[200px] sm:w-[350px] h-[250px] bg-purple-500/15 rounded-full blur-[90px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 w-full">
        {/* Release Pill Tag */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold mb-6 border transition-all shadow-sm bg-slate-900/5 dark:bg-slate-900/60 border-slate-300 dark:border-slate-800 text-slate-800 dark:text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>{config.aiEngineName || 'DeepMotion Neural Core v2.4'}</span>
          <span className="text-slate-400">·</span>
          <span className="font-bold text-cyan-600 dark:text-cyan-400">Zero Watermark MP4</span>
        </div>

        {/* Dynamic Main Title */}
        <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.2] max-w-4xl mx-auto text-slate-950 dark:text-white">
          {config.heroTitle}
        </h1>

        {/* Dynamic Subtitle */}
        <p className="mt-4 sm:mt-5 text-sm sm:text-base lg:text-lg text-slate-800 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed font-medium">
          {config.heroSubtitle}
        </p>

        {/* Action Buttons (Flex-wrap and full width on small screens) */}
        <div className="mt-7 sm:mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-md mx-auto">
          <button
            onClick={onStartCreating}
            className={`w-full sm:w-auto px-7 py-3.5 rounded-xl font-bold text-sm sm:text-base transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2.5 text-slate-950 ${accentClass.bg} ${accentClass.glow}`}
          >
            <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-slate-950 text-slate-950" />
            <span>{config.heroCtaText}</span>
          </button>
          
          <a
            href="#showcase"
            className={`w-full sm:w-auto px-6 py-3.5 rounded-xl font-semibold text-xs sm:text-sm border transition-all text-center ${
              isLight 
                ? 'border-slate-300 bg-white hover:bg-slate-100 text-slate-900 shadow-sm' 
                : 'border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-200'
            }`}
          >
            Explore Showcase
          </a>
        </div>

        {/* Feature Highlights Grid */}
        <div className="mt-10 pt-6 border-t border-slate-200 dark:border-slate-800/80 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto text-left">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-slate-950 dark:text-white">Zero Watermarks</p>
              <p className="text-[10px] sm:text-[11px] text-slate-600 dark:text-slate-400">100% clean video files</p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-slate-950 dark:text-white">Multi-Photo Upload</p>
              <p className="text-[10px] sm:text-[11px] text-slate-600 dark:text-slate-400">Sequence up to 5 photos</p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-slate-950 dark:text-white">4 Daily Free Renders</p>
              <p className="text-[10px] sm:text-[11px] text-slate-600 dark:text-slate-400">Free daily allocation</p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Clock className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-slate-950 dark:text-white">24h Auto-Deletion</p>
              <p className="text-[10px] sm:text-[11px] text-slate-600 dark:text-slate-400">Privacy & disk cleanup</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
