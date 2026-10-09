import React from 'react';
import { ShieldCheck, Video, Sparkles, Image, Zap, Cpu, Award, HardDrive } from 'lucide-react';
import { useThemeConfig } from '../context/ThemeConfigContext';

export const FeaturesSection: React.FC = () => {
  const { config, mode } = useThemeConfig();
  const isLight = mode === 'light';

  if (!config || !config.sectionVisibility?.features) return null;

  const features = [
    {
      icon: <Video className="w-5 h-5 text-cyan-500" />,
      title: 'Zero Watermark Policy',
      description: 'Unlike commercial video platforms that force logos onto your creations, FreeVideoAIMaker exports 100% clean MP4 video streams ready for broadcast or social media.',
    },
    {
      icon: <Image className="w-5 h-5 text-purple-500" />,
      title: 'Multi-Image Keyframing',
      description: 'Upload up to 5 reference photos. The neural pipeline performs optical motion interpolation across your storyboard images to produce natural cinematic movement.',
    },
    {
      icon: <Zap className="w-5 h-5 text-emerald-500" />,
      title: '4 Free Daily Renders',
      description: 'Every verified creator account receives 4 free high-definition video creations every 24 hours, resetting automatically at midnight UTC to protect server resources.',
    },
    {
      icon: <HardDrive className="w-5 h-5 text-rose-500" />,
      title: '24-Hour Ephemeral Privacy',
      description: 'Rendered media is stored temporarily for exactly 24 hours and is then automatically deleted by the host server daemon to safeguard creator privacy and maintain storage speed.',
    },
    {
      icon: <Cpu className="w-5 h-5 text-amber-500" />,
      title: 'Self-Hosted Neural Core',
      description: `Powered by ${config?.aiEngineName || 'DeepMotion Neural Core v2.4'} with 60FPS fluid optical physics, dynamic lens zoom, and multi-axis camera panning.`,
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-blue-500" />,
      title: 'Content Safety System',
      description: 'An automated safety system monitors generation requests against illicit, violent, political manipulation, or harmful prompts before processing.',
    },
  ];

  return (
    <section id="features" className={`py-12 sm:py-18 px-3 sm:px-6 lg:px-8 border-b w-full overflow-hidden ${
      isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#030712] border-slate-800'
    }`}>
      <div className="max-w-6xl mx-auto w-full">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-2.5 border bg-slate-900/5 dark:bg-slate-900/50 border-slate-300 dark:border-slate-800 text-slate-800 dark:text-slate-300">
            <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
            <span>Architecture & Principles</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-950 dark:text-white">
            Engineered for Creators. Uncompromised Quality.
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-700 dark:text-slate-400 max-w-xl mx-auto">
            High performance neural rendering with transparent limits and zero predatory paywalls.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {features.map((item, idx) => (
            <div
              key={idx}
              className={`p-5 sm:p-6 rounded-2xl border transition-all ${
                isLight 
                  ? 'bg-white border-slate-200 hover:border-slate-400 shadow-sm' 
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3.5">
                {item.icon}
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-950 dark:text-white mb-2">
                {item.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-400 leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
