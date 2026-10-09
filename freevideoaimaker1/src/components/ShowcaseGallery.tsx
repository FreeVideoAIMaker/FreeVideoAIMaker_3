import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Download, 
  Sparkles, 
  RotateCcw, 
  X, 
  Film,
  Plus
} from 'lucide-react';
import { GeneratedVideo } from '../types';
import { fetchShowcaseVideos } from '../lib/api';
import { useThemeConfig } from '../context/ThemeConfigContext';
import { AdBanner } from './AdBanner';

interface ShowcaseGalleryProps {
  onRemixPrompt: (prompt: string, style: string) => void;
  newlyCreatedVideo?: GeneratedVideo | null;
}

export const ShowcaseGallery: React.FC<ShowcaseGalleryProps> = ({ 
  onRemixPrompt, 
  newlyCreatedVideo 
}) => {
  const { config, mode, accentClass } = useThemeConfig();
  const [videos, setVideos] = useState<GeneratedVideo[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedVideo, setSelectedVideo] = useState<GeneratedVideo | null>(null);
  const [loading, setLoading] = useState(true);

  const isLight = mode === 'light';

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchShowcaseVideos();
        setVideos(data);
      } catch {
        // Handled
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (newlyCreatedVideo && newlyCreatedVideo.isPublic) {
      setVideos((prev) => [newlyCreatedVideo, ...prev.filter((v) => v.id !== newlyCreatedVideo.id)]);
    }
  }, [newlyCreatedVideo]);

  if (!config || !config.sectionVisibility?.showcase) return null;

  const filteredVideos = videos.filter((v) => {
    if (activeCategory === 'all') return true;
    if (activeCategory === 'cyberpunk') return v.style === 'cyberpunk-neon';
    if (activeCategory === 'cinematic') return v.style === 'cinematic' || v.style === 'drone-fpv';
    if (activeCategory === 'anime') return v.style === 'anime';
    if (activeCategory === 'photo') return v.style === 'photorealistic';
    return true;
  });

  return (
    <section id="showcase" className={`py-12 sm:py-18 px-3 sm:px-6 lg:px-8 border-b w-full overflow-hidden ${
      isLight ? 'bg-white border-slate-200' : 'bg-[#030712] border-slate-800'
    }`}>
      <div className="max-w-7xl mx-auto w-full">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-2.5 border bg-purple-500/10 border-purple-500/20 text-purple-600 dark:text-purple-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Public Video Stream</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-950 dark:text-white">
              Community AI Creations
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-700 dark:text-slate-400">
              Watch videos generated in real-time by creators using FreeVideoAIMaker.
            </p>
          </div>

          {/* Category Filter Tabs */}
          {videos.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {[
                { id: 'all', label: 'All' },
                { id: 'cyberpunk', label: 'Cyberpunk' },
                { id: 'cinematic', label: 'Cinematics' },
                { id: 'anime', label: 'Anime' },
                { id: 'photo', label: 'Photoreal' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
                    activeCategory === cat.id
                      ? `${accentClass.bg} text-slate-950 font-bold shadow-sm`
                      : isLight
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Video Grid or Clean Zero State */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-60 rounded-2xl bg-slate-200 dark:bg-slate-900 animate-pulse" />
            ))}
          </div>
        ) : filteredVideos.length === 0 ? (
          /* Real Clean Zero State (No fake invented videos) */
          <div className="py-12 sm:py-16 px-4 text-center border border-dashed rounded-2xl border-slate-300 dark:border-slate-800 max-w-xl mx-auto my-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center mx-auto mb-3">
              <Film className="w-6 h-6" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-950 dark:text-white">
              No Community Videos Yet
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 mb-5 max-w-md mx-auto">
              Your server was just deployed and the database is fresh! Be the first creator to upload photos and generate a video.
            </p>
            <a
              href="#studio"
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold ${accentClass.bg} text-slate-950 shadow-md hover:brightness-110 transition-all`}
            >
              <Plus className="w-4 h-4" />
              <span>Generate First Video Now</span>
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredVideos.map((vid, idx) => (
              <React.Fragment key={vid.id}>
                {idx === 2 && <AdBanner type="showcase" />}

                <div className={`group rounded-2xl border overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                  isLight 
                    ? 'bg-white border-slate-200 hover:border-slate-400' 
                    : 'bg-slate-900/60 border-slate-800 hover:border-cyan-500/40'
                }`}>
                  <div 
                    onClick={() => setSelectedVideo(vid)}
                    className="relative aspect-video bg-black cursor-pointer overflow-hidden"
                  >
                    <img
                      src={vid.thumbnailUrl}
                      alt={vid.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-cyan-500/90 text-slate-950 flex items-center justify-center transform scale-90 group-hover:scale-100 transition-transform shadow-lg">
                        <Play className="w-5 h-5 fill-slate-950 ml-0.5" />
                      </div>
                    </div>

                    <div className="absolute top-2 left-2 bg-black/75 backdrop-blur-sm text-[10px] font-bold text-white px-2 py-0.5 rounded">
                      {vid.duration}s HD
                    </div>
                    <div className="absolute top-2 right-2 bg-cyan-500/95 text-[10px] font-bold text-slate-950 px-2 py-0.5 rounded">
                      Clean MP4
                    </div>
                  </div>

                  <div className="p-3.5">
                    <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1 mb-1">
                      {vid.title}
                    </p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 mb-2.5">
                      "{vid.prompt}"
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[100px]">
                        @{vid.userName || 'Creator'}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onRemixPrompt(vid.prompt, vid.style)}
                          title="Remix prompt in Studio"
                          className="p-1 rounded hover:bg-cyan-500/10 text-cyan-500 transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                        <a
                          href={vid.videoUrl}
                          download={`FreeVideoAIMaker-${vid.id}.mp4`}
                          target="_blank"
                          rel="noreferrer"
                          title="Download Clean MP4"
                          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Video Player Modal */}
        {selectedVideo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm">
            <div className={`relative w-full max-w-3xl rounded-2xl border p-4 sm:p-5 shadow-2xl ${
              isLight ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-700'
            }`}>
              <button
                onClick={() => setSelectedVideo(null)}
                aria-label="Close modal"
                className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800 text-white hover:bg-slate-700 transition-colors z-10"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="rounded-xl overflow-hidden bg-black aspect-video mb-4">
                <video
                  src={selectedVideo.videoUrl}
                  controls
                  autoPlay
                  loop
                  playsInline
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    {selectedVideo.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-xl">
                    "{selectedVideo.prompt}"
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                  <button
                    onClick={() => {
                      onRemixPrompt(selectedVideo.prompt, selectedVideo.style);
                      setSelectedVideo(null);
                    }}
                    className={`flex-1 sm:flex-none px-3 py-2 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 ${
                      isLight 
                        ? 'border-slate-300 bg-white hover:bg-slate-100 text-slate-900' 
                        : 'border-slate-700 bg-slate-800 hover:bg-slate-750 text-white'
                    }`}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Remix</span>
                  </button>

                  <a
                    href={selectedVideo.videoUrl}
                    download={`FreeVideoAIMaker-${selectedVideo.id}.mp4`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center justify-center gap-1.5 shadow-sm text-center"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download MP4</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
