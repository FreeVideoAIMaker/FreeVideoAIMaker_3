import React from 'react';
import { useThemeConfig } from '../context/ThemeConfigContext';
import { BrandLogo } from './BrandLogo';

interface FooterProps {
  onNavigateSection: (id: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigateSection }) => {
  const { config, mode } = useThemeConfig();
  const isLight = mode === 'light';

  return (
    <footer className={`py-10 border-t text-xs w-full overflow-hidden ${
      isLight ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-[#030712] border-slate-900 text-slate-400'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Col 1: Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5 mb-3">
              <BrandLogo size={32} />
              <span className="font-extrabold text-base text-slate-900 dark:text-white">
                {config?.siteName || 'FreeVideoAIMaker'}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm leading-relaxed mb-3">
              High-definition AI video creator producing watermark-free MP4 videos from multiple photos and creative text prompts.
            </p>
            <div className="flex flex-wrap gap-2 text-[10px] text-slate-500 font-semibold">
              <span>#AIVideo</span>
              <span>·</span>
              <span>#ImageToVideo</span>
              <span>·</span>
              <span>#ZeroWatermark</span>
              <span>·</span>
              <span>#24hPrivacy</span>
            </div>
          </div>

          {/* Col 2: Navigation */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white mb-3">
              Explore
            </h4>
            <ul className="space-y-2">
              <li>
                <button onClick={() => onNavigateSection('studio')} className="hover:text-cyan-500 transition-colors">
                  AI Video Studio
                </button>
              </li>
              <li>
                <button onClick={() => onNavigateSection('showcase')} className="hover:text-cyan-500 transition-colors">
                  Community Showcase
                </button>
              </li>
              <li>
                <button onClick={() => onNavigateSection('features')} className="hover:text-cyan-500 transition-colors">
                  Engine Features
                </button>
              </li>
              <li>
                <button onClick={() => onNavigateSection('faq')} className="hover:text-cyan-500 transition-colors">
                  FAQ & Policies
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Compliance & Privacy Policy (NO ADMIN BUTTONS) */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white mb-3">
              Creator Privacy & Terms
            </h4>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mb-2 leading-relaxed">
              All generated files are stored for 24 hours only and then automatically deleted by the host server.
            </p>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Disinformation, political manipulation, and non-consensual content are strictly prohibited by our automated moderation system.
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-slate-200 dark:border-slate-850 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
          <p className="text-slate-600 dark:text-slate-500 text-center sm:text-left">
            © {new Date().getFullYear()} {config?.siteName || 'FreeVideoAIMaker'}. All rights reserved.
          </p>
          <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
            <span>4 Free Renders / Day</span>
            <span>·</span>
            <span>Zero Watermarks</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
