import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  Sparkles, 
  Play, 
  Trash2, 
  Image as ImageIcon, 
  Film, 
  Download, 
  AlertCircle, 
  Lock, 
  Layers, 
  Clock, 
  Eye, 
  EyeOff, 
  ChevronDown, 
  ChevronUp, 
  RotateCcw, 
  AlertTriangle, 
  Cpu, 
  Loader2, 
  CheckCircle2,
  Zap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useThemeConfig } from '../context/ThemeConfigContext';
import { generateVideo } from '../lib/api';
import { GeneratedVideo, VideoStylePreset, AspectRatio, CameraMotion } from '../types';
import { AdBanner } from './AdBanner';

interface VideoStudioProps {
  initialPrompt?: string;
  onVideoCreated?: (video: GeneratedVideo) => void;
}

const STYLE_PRESETS: { id: VideoStylePreset; label: string; icon: string }[] = [
  { id: 'cinematic', label: 'Cinematic Movie', icon: '🎬' },
  { id: 'cyberpunk-neon', label: 'Cyberpunk Neon', icon: '⚡' },
  { id: 'anime', label: 'Anime Studio', icon: '🌸' },
  { id: 'photorealistic', label: 'Photorealistic 8K', icon: '📸' },
  { id: '3d-render', label: '3D CGI Unreal 5', icon: '🔮' },
  { id: 'dark-fantasy', label: 'Dark Fantasy', icon: '⚔️' },
  { id: 'drone-fpv', label: 'Drone FPV 4K', icon: '🚁' },
];

const MOTION_PRESETS: { id: CameraMotion; label: string }[] = [
  { id: 'cinematic-pan', label: 'Smooth Pan Right' },
  { id: 'zoom-in', label: 'Dynamic Zoom In' },
  { id: 'zoom-out', label: 'Slow Reveal Zoom Out' },
  { id: 'orbit-3d', label: '3D Spiral Orbit' },
  { id: 'tilt-up', label: 'Dramatic Tilt Up' },
  { id: 'static-subtle', label: 'Subtle Parallax Drift' },
];

export const VideoStudio: React.FC<VideoStudioProps> = ({ initialPrompt = '', onVideoCreated }) => {
  const { user, openAuthModal, updateUserQuota } = useAuth();
  const { config, mode, accentClass } = useThemeConfig();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Studio Form State (Up to 5 images)
  const [images, setImages] = useState<string[]>([]);
  const [prompt, setPrompt] = useState(initialPrompt);
  const [negativePrompt, setNegativePrompt] = useState('');
  const [showNegative, setShowNegative] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<VideoStylePreset>('cyberpunk-neon');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [motion, setMotion] = useState<CameraMotion>('cinematic-pan');
  const [duration, setDuration] = useState<number>(5);
  const [isPublic, setIsPublic] = useState(true);

  // Direct Serverless GPU State
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [generatedVideo, setGeneratedVideo] = useState<GeneratedVideo | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const isLight = mode === 'light';
  const remainingQuota = user ? Math.max(0, (user.maxDailyGenerations || 4) - (user.generationsToday || 0)) : 4;

  useEffect(() => {
    if (initialPrompt) {
      setPrompt(initialPrompt);
    }
  }, [initialPrompt]);

  // Handle Multi-Image Upload (Up to 5 images)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    if (images.length + files.length > 5) {
      setErrorMsg('You can upload a maximum of 5 images for keyframe sequencing.');
      return;
    }
    setErrorMsg(null);

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) {
        setErrorMsg('Only standard image formats (PNG, JPG, WebP) are supported.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImages((prev) => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // AI Prompt Enhancer
  const handleEnhancePrompt = () => {
    if (!prompt.trim()) {
      setPrompt('Futuristic cyber vehicle accelerating through rainy neon metropolis, volumetric optical lighting, 8k cinematic slow motion, award-winning cinematography');
      return;
    }
    const enhancements = [
      ', 35mm anamorphic lens, raytraced volumetric lighting, highly detailed fluid motion, award-winning cinematography',
      ', photorealistic octane render, 60fps slow-motion camera glide, vibrant neon luminescence',
      ', cinematic depth of field, dramatic atmospheric haze, 8K ultra-resolution, masterpiece video direction',
    ];
    const picked = enhancements[Math.floor(Math.random() * enhancements.length)];
    setPrompt((prev) => prev.trim() + picked);
  };

  // Direct Serverless GPU Video Synthesis Call
  const handleGenerate = async () => {
    setErrorMsg(null);

    if (!user) {
      openAuthModal('signin');
      return;
    }

    if (remainingQuota <= 0) {
      setErrorMsg(`Daily limit reached (${user.maxDailyGenerations || 4}/4 used). Your free generations reset at midnight UTC.`);
      return;
    }

    if (!prompt.trim()) {
      setErrorMsg('Please enter a descriptive prompt for your AI video.');
      return;
    }

    setIsGenerating(true);
    setGeneratedVideo(null);

    try {
      // Dispatches direct request to Replicate Serverless GPU pipeline and awaits completed video
      const response = await generateVideo({
        images,
        prompt: prompt.trim(),
        negativePrompt: negativePrompt.trim(),
        style: selectedStyle,
        aspectRatio,
        motion,
        duration,
        isPublic,
      });

      if (response.success && response.video) {
        setGeneratedVideo(response.video);
        if (onVideoCreated) {
          onVideoCreated(response.video);
        }
      }

      if (response.quota) {
        updateUserQuota(response.quota.generationsToday, response.quota.maxDailyGenerations);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during GPU video synthesis.');
    } finally {
      setIsGenerating(false);
    }
  };

  // High-Contrast Green Direct Blob Force-Download (Forces device download)
  const handleForceDownload = async (url: string, id: string) => {
    setIsDownloading(true);
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.style.display = 'none';
      link.href = blobUrl;
      link.download = `FreeVideoAIMaker-${id}.mp4`;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
        document.body.removeChild(link);
      }, 1500);
    } catch {
      const link = document.createElement('a');
      link.href = url;
      link.download = `FreeVideoAIMaker-${id}.mp4`;
      link.target = '_blank';
      link.click();
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <section id="studio" className={`py-10 sm:py-16 px-3 sm:px-6 lg:px-8 border-b w-full overflow-hidden ${
      isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#030712] border-slate-800'
    }`}>
      <div className="max-w-6xl mx-auto w-full">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Serverless Cloud GPU Studio · Zero Watermarks</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              AI Video Synthesis Studio
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-xl">
              Turn multiple images and descriptive prompts into cinematic high-definition motion videos.
            </p>
          </div>

          {/* Daily Quota Counter Badge */}
          <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-500">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Daily Free Quota
              </div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                {user ? `${remainingQuota} of ${user.maxDailyGenerations || 4} renders remaining` : '4 free daily renders'}
              </div>
            </div>
          </div>
        </div>

        {/* 2-Column Responsive Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full">
          {/* LEFT COLUMN: Controls & Input Parameters (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col gap-6 w-full">
            {/* 1. Multi-Image Keyframe Sequencing (Up to 5 images) */}
            <div className={`rounded-2xl border p-4 sm:p-5 shadow-lg ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-cyan-500" />
                  <span>Reference Photos & Keyframes ({images.length}/5)</span>
                </label>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Multiple Images Supported
                </span>
              </div>

              {/* Upload Drop Zone & Thumbnails */}
              <div className="space-y-3">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                    images.length >= 5 
                      ? 'opacity-50 cursor-not-allowed border-slate-300 dark:border-slate-700' 
                      : 'border-cyan-500/40 hover:border-cyan-400 bg-cyan-500/5 hover:bg-cyan-500/10'
                  }`}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    multiple 
                    accept="image/*" 
                    className="hidden" 
                    disabled={images.length >= 5}
                  />
                  <Upload className="w-6 h-6 text-cyan-500 mx-auto mb-1.5" />
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Click to upload up to 5 photos
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    PNG, JPG, WebP supported for neural morphing and keyframing
                  </p>
                </div>

                {/* Thumbnails Strip */}
                {images.length > 0 && (
                  <div className="flex flex-wrap gap-2.5 pt-1">
                    {images.map((img, idx) => (
                      <div key={idx} className="relative group w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700">
                        <img src={img} alt={`Keyframe ${idx + 1}`} className="w-full h-full object-cover" />
                        <span className="absolute bottom-1 left-1 bg-black/70 text-[9px] text-white px-1 rounded font-mono">
                          #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute top-1 right-1 p-1 bg-rose-600/90 text-white rounded-full opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 2. Prompt Input & AI Enhancement */}
            <div className={`rounded-2xl border p-4 sm:p-5 shadow-lg ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Film className="w-4 h-4 text-cyan-500" />
                  <span>Cinematic Motion Prompt</span>
                </label>
                <button
                  type="button"
                  onClick={handleEnhancePrompt}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-500 hover:text-cyan-400 cursor-pointer bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/30 transition-all hover:scale-105"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Enhance with AI</span>
                </button>
              </div>

              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                placeholder="Describe camera motion, actions, and atmosphere (e.g. 'Cyberpunk hovercar speeding through rainy neon city at night, 8k cinematic slow motion, award-winning lighting')..."
                className={`w-full rounded-xl p-3 text-xs sm:text-sm border transition-all resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                  isLight 
                    ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400' 
                    : 'bg-slate-950 border-slate-800 text-white placeholder-slate-500'
                }`}
              />

              {/* Negative Prompt Accordion */}
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => setShowNegative(!showNegative)}
                  className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-cyan-500 flex items-center gap-1 cursor-pointer"
                >
                  {showNegative ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  <span>{showNegative ? 'Hide Negative Prompt' : 'Add Negative Prompt (Elements to Avoid)'}</span>
                </button>
                {showNegative && (
                  <div className="mt-2">
                    <input
                      type="text"
                      value={negativePrompt}
                      onChange={(e) => setNegativePrompt(e.target.value)}
                      placeholder="e.g. blurry, low quality, distorted, extra limbs, watermark..."
                      className={`w-full rounded-xl p-2.5 text-xs border transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                        isLight 
                          ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400' 
                          : 'bg-slate-950 border-slate-800 text-white placeholder-slate-500'
                      }`}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* 3. Style Presets Selection */}
            <div className={`rounded-2xl border p-4 sm:p-5 shadow-lg ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'
            }`}>
              <label className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
                <Layers className="w-4 h-4 text-cyan-500" />
                <span>Visual Art Style</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {STYLE_PRESETS.map((style) => (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => setSelectedStyle(style.id)}
                    className={`p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                      selectedStyle === style.id
                        ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400 shadow-sm'
                        : isLight
                          ? 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                          : 'border-slate-800 bg-slate-950 hover:bg-slate-800/60 text-slate-300'
                    }`}
                  >
                    <span className="text-base">{style.icon}</span>
                    <span className="truncate">{style.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Camera Motion & Aspect Ratio Controls */}
            <div className={`rounded-2xl border p-4 sm:p-5 shadow-lg ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'
            }`}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Camera Motion */}
                <div>
                  <label className="text-xs font-bold text-slate-900 dark:text-white block mb-2">
                    Camera Motion Path
                  </label>
                  <select
                    value={motion}
                    onChange={(e) => setMotion(e.target.value as CameraMotion)}
                    className={`w-full rounded-xl p-2.5 text-xs font-semibold border transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                      isLight 
                        ? 'bg-slate-50 border-slate-300 text-slate-900' 
                        : 'bg-slate-950 border-slate-800 text-white'
                    }`}
                  >
                    {MOTION_PRESETS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Aspect Ratio */}
                <div>
                  <label className="text-xs font-bold text-slate-900 dark:text-white block mb-2">
                    Aspect Ratio
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['16:9', '9:16', '1:1'] as AspectRatio[]).map((ar) => (
                      <button
                        key={ar}
                        type="button"
                        onClick={() => setAspectRatio(ar)}
                        className={`py-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                          aspectRatio === ar
                            ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400'
                            : isLight
                              ? 'border-slate-200 bg-slate-50 text-slate-700'
                              : 'border-slate-800 bg-slate-950 text-slate-400'
                        }`}
                      >
                        {ar}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Duration & Privacy Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                <div>
                  <label className="text-xs font-bold text-slate-900 dark:text-white block mb-2">
                    Duration
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[5, 10].map((dur) => (
                      <button
                        key={dur}
                        type="button"
                        onClick={() => setDuration(dur)}
                        className={`py-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                          duration === dur
                            ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400'
                            : isLight
                              ? 'border-slate-200 bg-slate-50 text-slate-700'
                              : 'border-slate-800 bg-slate-950 text-slate-400'
                        }`}
                      >
                        {dur} Seconds
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-900 dark:text-white block mb-2">
                    Community Showcase
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsPublic(!isPublic)}
                    className={`w-full py-2 px-3 rounded-lg text-xs font-semibold border flex items-center justify-between transition-all cursor-pointer ${
                      isPublic
                        ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-400'
                        : isLight
                          ? 'border-slate-300 bg-slate-50 text-slate-600'
                          : 'border-slate-800 bg-slate-950 text-slate-400'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      {isPublic ? <Eye className="w-3.5 h-3.5 text-cyan-500" /> : <EyeOff className="w-3.5 h-3.5" />}
                      <span>{isPublic ? 'Public in Showcase' : 'Private (My Vault Only)'}</span>
                    </span>
                    <span className="text-[10px] font-mono uppercase bg-slate-800 px-1.5 py-0.5 rounded text-white">
                      {isPublic ? 'Public' : 'Private'}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Error Message Feedback */}
            {errorMsg && (
              <div className="p-3.5 rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="font-semibold">{errorMsg}</span>
              </div>
            )}

            {/* GENERATE ACTION BUTTON */}
            {!user ? (
              <button
                type="button"
                onClick={() => openAuthModal('signin')}
                className={`w-full py-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${accentClass.bg} text-slate-950 hover:brightness-110 shadow-lg cursor-pointer`}
              >
                <Lock className="w-4 h-4" />
                <span>Sign In to Generate Free AI Video (4 Renders / Day)</span>
              </button>
            ) : (
              <button
                type="button"
                disabled={isGenerating || remainingQuota <= 0}
                onClick={handleGenerate}
                className={`w-full py-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer ${
                  isGenerating || remainingQuota <= 0
                    ? 'opacity-60 cursor-not-allowed bg-slate-700 text-slate-400'
                    : `${accentClass.bg} text-slate-950 hover:brightness-110 ${accentClass.glow}`
                }`}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>⚙️ جاري التوليد السحابي السريع عبر الـ GPU...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-slate-950" />
                    <span>Generate AI Video (100% Free · No Watermark)</span>
                  </>
                )}
              </button>
            )}

            {/* In-Studio Sidebar Ad */}
            <AdBanner type="sidebar" className="mt-2" />
          </div>

          {/* RIGHT COLUMN: Output Monitor & Real-Time Player (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col gap-4 w-full">
            <div className={`rounded-2xl border p-4 sm:p-5 shadow-lg ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Film className="w-4 h-4 text-cyan-500" />
                  <span>Output Monitor & Player</span>
                </h3>
                <span className="text-[11px] font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  Clean MP4
                </span>
              </div>

              {/* 1. SERVERLESS GPU PROCESSING LOADER */}
              {isGenerating && !generatedVideo && (
                <div className="p-6 rounded-xl border border-cyan-500/40 bg-gradient-to-b from-cyan-950/40 to-slate-950/80 text-center mb-4 shadow-xl">
                  <div className="w-14 h-14 rounded-full bg-cyan-500/10 border border-cyan-500/50 text-cyan-400 flex items-center justify-center mx-auto mb-3.5 shadow-lg animate-pulse">
                    <Cpu className="w-7 h-7 text-cyan-400" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5 flex items-center justify-center gap-2">
                    <span>⚙️ جاري التوليد السحابي السريع عبر الـ GPU...</span>
                  </h4>
                  <p className="text-xs text-cyan-300 font-medium mb-3">
                    High-Speed Serverless GPU Neural Video Synthesis
                  </p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 max-w-xs mx-auto mb-3">
                    Synthesizing optical motion flows, neural camera trajectory, and rendering 60FPS frames directly in the cloud...
                  </p>
                  <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden my-3 border border-cyan-500/20">
                    <div className="bg-gradient-to-r from-cyan-500 via-purple-500 to-emerald-400 h-full w-full animate-pulse" />
                  </div>
                  <div className="flex items-center justify-center gap-1.5 text-[11px] font-mono text-cyan-400 bg-cyan-950/60 py-1.5 px-3 rounded-lg w-max mx-auto border border-cyan-800/50">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                    <span>Replicate Serverless GPU Engine Active</span>
                  </div>
                </div>
              )}

              {/* 2. COMPLETED VIDEO PLAYER WITH HIGH-CONTRAST GREEN BLOB DOWNLOAD */}
              {generatedVideo && generatedVideo.videoUrl ? (
                <div className="space-y-4">
                  {/* Interactive HTML5 Video Player */}
                  <div className="relative rounded-xl overflow-hidden bg-black aspect-video border border-slate-700 shadow-md">
                    <video
                      key={generatedVideo.videoUrl}
                      src={generatedVideo.videoUrl}
                      controls
                      autoPlay
                      playsInline
                      className="w-full h-full object-contain"
                    />
                  </div>

                  {/* Video Metadata Chip */}
                  <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 text-emerald-500 text-xs font-bold mb-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Neural Video Synthesis Completed</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-white line-clamp-2 mb-1">
                      "{generatedVideo.prompt}"
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                      <span>{generatedVideo.duration}s HD</span>
                      <span>·</span>
                      <span>{generatedVideo.aspectRatio}</span>
                      <span>·</span>
                      <span className="capitalize">{generatedVideo.style}</span>
                    </div>
                  </div>

                  {/* High-Contrast Green Direct Save Button (Download Anchor via Blob) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={isDownloading}
                      onClick={() => handleForceDownload(generatedVideo.videoUrl, generatedVideo.id)}
                      className="w-full py-3.5 px-4 rounded-xl text-xs font-extrabold bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
                    >
                      {isDownloading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Saving to Device...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 stroke-[2.5]" />
                          <span>Download MP4 (Blob)</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setPrompt(generatedVideo.prompt);
                        window.scrollTo({ top: 300, behavior: 'smooth' });
                      }}
                      className={`w-full py-3.5 px-4 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                        isLight 
                          ? 'border-slate-300 bg-white hover:bg-slate-100 text-slate-800' 
                          : 'border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200'
                      }`}
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Remix Prompt</span>
                    </button>
                  </div>

                  {/* 24-Hour Expiration Warning */}
                  <div className="p-2.5 rounded-lg border border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[11px] flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      24-Hour Retention Alert: Please download your MP4 file now. Videos auto-delete after 24 hours.
                    </span>
                  </div>

                  <AdBanner type="completion" />
                </div>
              ) : (
                /* Empty Standby State */
                !isGenerating && (
                  <div className="text-center py-10 px-4 border border-dashed rounded-xl border-slate-300 dark:border-slate-800">
                    <div className="w-10 h-10 rounded-full bg-cyan-500/10 text-cyan-500 flex items-center justify-center mx-auto mb-2.5">
                      <Play className="w-4 h-4 fill-cyan-500" />
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      Your Rendered Video Appears Here
                    </p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                      Fill in your prompt and click Generate to synthesize a 60FPS watermark-free MP4.
                    </p>
                  </div>
                )
              )}
            </div>

            {/* Architecture Card */}
            <div className={`rounded-xl border p-3.5 text-xs ${
              isLight ? 'bg-white border-slate-200 text-slate-700' : 'bg-slate-900/50 border-slate-800 text-slate-400'
            }`}>
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-200 mb-1">
                <Layers className="w-3.5 h-3.5 text-cyan-500" />
                <span>Replicate Serverless GPU Architecture</span>
              </div>
              <p className="leading-relaxed text-[11px]">
                Persistent host deployed on <strong>Render</strong> with anti-sleep keep-alive daemon. Neural video synthesis executed on-demand via <strong>Replicate Serverless GPU</strong> with automated 24-hour cleanup.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
