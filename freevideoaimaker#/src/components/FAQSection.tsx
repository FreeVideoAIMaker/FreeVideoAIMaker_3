import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useThemeConfig } from '../context/ThemeConfigContext';

export const FAQSection: React.FC = () => {
  const { config, mode } = useThemeConfig();
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const isLight = mode === 'light';

  if (!config || !config.sectionVisibility?.faq) return null;

  const faqs = [
    {
      q: 'How many videos can I generate per day?',
      a: 'Each verified creator account receives 4 free video generations every 24 hours. The daily quota resets automatically at midnight (00:00 UTC). This limit guarantees server speed and prevents queue clogging.',
    },
    {
      q: 'Are the generated videos truly watermark-free?',
      a: 'Yes. FreeVideoAIMaker never embeds logos, brand text, or corner stamps onto your videos. You receive clean, professional MP4 video files ready to use immediately.',
    },
    {
      q: 'Can I upload multiple photos instead of just one?',
      a: 'Yes! Our studio supports uploading up to 5 photos simultaneously. You can sequence them as keyframes, and the neural engine interpolates natural camera movement between your images.',
    },
    {
      q: 'Why are videos stored on the server for only 24 hours?',
      a: 'To guarantee creator privacy and maintain lightning-fast host storage, generated videos are kept temporarily for 24 hours and are then automatically purged from the server. Please download your MP4 files within 24 hours of generation.',
    },
    {
      q: 'What neural engine powers FreeVideoAIMaker?',
      a: `Video rendering is powered by our proprietary ${config?.aiEngineName || 'DeepMotion Neural Core v2.4'}, engineered for cinematic camera pans, optical physics, and rich illumination without requiring expensive third-party subscriptions.`,
    },
    {
      q: 'Can I keep my videos private so nobody else sees them?',
      a: 'Yes. In the studio settings panel before generating, you can switch between "Public Showcase" and "Private Creation". Private creations will never be displayed in the public community gallery.',
    },
  ];

  return (
    <section id="faq" className={`py-12 sm:py-18 px-3 sm:px-6 lg:px-8 border-b w-full overflow-hidden ${
      isLight ? 'bg-white border-slate-200' : 'bg-[#030712] border-slate-800'
    }`}>
      <div className="max-w-4xl mx-auto w-full">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-2.5 border bg-slate-900/5 dark:bg-slate-900/50 border-slate-300 dark:border-slate-800 text-slate-800 dark:text-slate-300">
            <HelpCircle className="w-3.5 h-3.5 text-cyan-500" />
            <span>Questions & Answers</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-950 dark:text-white">
            Frequently Asked Questions
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-700 dark:text-slate-400">
            Everything you need to know about our free AI video generator.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className={`rounded-xl border transition-all ${
                  isLight 
                    ? 'bg-slate-50 border-slate-200' 
                    : 'bg-slate-900/50 border-slate-800'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full py-3.5 px-4 sm:px-5 text-left flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-slate-950 dark:text-white"
                >
                  <span>{item.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-cyan-500 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-4 sm:px-5 pb-4 pt-1 text-xs text-slate-700 dark:text-slate-300 leading-relaxed border-t border-slate-200 dark:border-slate-800/80">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
