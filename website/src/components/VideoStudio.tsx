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
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useThemeConfig } from '../context/ThemeConfigContext';
import { generateVideo, checkVideoStatus } from '../lib/api';
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
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Studio Form State
  const [images, setImages] = useState<string[]>([]);
  const [prompt, setPrompt] = useState(initialPrompt);
  const [negativePrompt, setNegativePrompt] = useState('');
  const [showNegative, setShowNegative] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<VideoStylePreset>('cyberpunk-neon');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [motion, setMotion] = useState<CameraMotion>('cinematic-pan');
  const [duration, setDuration] = useState<number>(5);
  const [isPublic, setIsPublic] = useState(true);

  // Asynchronous Queue & Monitor State
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [queueStatus, setQueueStatus] = useState<'pending' | 'processing' | 'completed' | 'failed' | null>(null);
  const [pollCount, setPollCount] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [generatedVideo, setGeneratedVideo] = useState<GeneratedVideo | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const isLight = mode === 'light';
  const remainingQuota = user ? Math.max(0, (user.maxDailyGenerations || 4) - (user.generationsToday || 0)) : 4;

  // Cleanup polling interval on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Sync initialPrompt prop if changed
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

  // 1. Submit Order to Asynchronous Queue
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

    // Clear any previous running polling
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    setIsGenerating(true);
    setGeneratedVideo(null);
    setPollCount(0);

    try {
      // Send fast request to server - returns immediately with orderId
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

      const orderId = response.orderId;
      setActiveOrderId(orderId);
      setQueueStatus('pending');

      if (response.quota) {
        updateUserQuota(response.quota.generationsToday, response.quota.maxDailyGenerations);
      }

      // Start asynchronous polling loop every 5 seconds
      pollingIntervalRef.current = setInterval(async () => {
        try {
          setPollCount((prev) => prev + 1);
          const statusResult = await checkVideoStatus(orderId);

          if (statusResult.status === 'processing') {
            setQueueStatus('processing');
          } else if (statusResult.status === 'completed' && statusResult.videoUrl) {
            // Processing complete
            if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
            setQueueStatus('completed');
            setIsGenerating(false);
            setGeneratedVideo(statusResult);
            if (onVideoCreated) {
              onVideoCreated(statusResult);
            }
          } else if (statusResult.status === 'failed') {
            if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
            setQueueStatus('failed');
            setIsGenerating(false);
            setErrorMsg(statusResult.error || 'Video rendering failed on neural worker.');
          }
        } catch {
          // Keep polling softly
        }
      }, 5000);

    } catch (err: any) {
      setIsGenerating(false);
      setQueueStatus(null);
      setErrorMsg(err.message || 'An error occurred while queueing your video.');
    }
  };

  // 2. High-Contrast Direct Blob Force-Download
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
      }, 1200);
    } catch {
      // Direct browser fallback
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
        {/* 24-Hour Ephemeral Retention Warning Banner */}
        <div className="mb-8 p-3.5 sm:p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 shrink-0 text-amber-500" />
            <span className="font-semibold leading-relaxed">
              <strong>Notice to All Creators:</strong> Generated videos are stored temporarily on the server for <strong>24 hours only</strong> from production, after which they are permanently auto-deleted to preserve privacy. Please download your MP4 files immediately!
            </span>
          </div>
          <span className="text-[11px] font-bold px-2.5 py-1 rounded bg-amber-500/20 text-amber-500 shrink-0 uppercase tracking-wider">
            24h Auto-Purge
          </span>
        </div>

        {/* Section Heading */}
        <div className="text-center mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-2.5 border bg-slate-900/5 dark:bg-slate-900/50 border-slate-300 dark:border-slate-800 text-slate-800 dark:text-slate-300">
            <Film className="w-3.5 h-3.5 text-cyan-500" />
            <span>Asynchronous Video Queue Studio</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-950 dark:text-white">
            Create Your Watermark-Free AI Video
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-700 dark:text-slate-400 max-w-xl mx-auto">
            Upload up to 5 photos, describe your action in text, and queue your order for neural GPU synthesis.
          </p>
        </div>

        {/* Studio Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start w-full">
          {/* LEFT COLUMN: Controls (7 Cols) */}
          <div className={`lg:col-span-7 rounded-2xl border p-4 sm:p-6 shadow-lg transition-all w-full overflow-hidden ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'
          }`}>
            {/* Step 1: Multi-Image Upload */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-cyan-500" />
                  <span>1. Reference Photos (Up to 5)</span>
                  <span className="text-xs font-normal text-slate-600 dark:text-slate-400">
                    ({images.length}/5)
                  </span>
                </label>
                {images.length > 0 && (
                  <button
                    onClick={() => setImages([])}
                    className="text-xs text-red-500 hover:text-red-600 transition-colors"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Image Preview Strip */}
              {images.length > 0 && (
                <div className="grid grid-cols-5 gap-2 mb-3">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative group rounded-lg overflow-hidden border border-slate-300 dark:border-slate-750 aspect-square bg-slate-900">
                      <img src={img} alt={`Keyframe ${idx + 1}`} className="w-full h-full object-cover" />
                      <div className="absolute top-1 left-1 bg-black/75 text-[9px] font-bold text-white px-1.5 py-0.5 rounded">
                        #{idx + 1}
                      </div>
                      <button
                        onClick={() => removeImage(idx)}
                        title="Remove image"
                        className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Drop Area */}
              {images.length < 5 && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-4 sm:p-5 text-center cursor-pointer transition-all ${
                    isLight 
                      ? 'border-slate-300 hover:border-cyan-500 hover:bg-cyan-50/50' 
                      : 'border-slate-800 hover:border-cyan-500/80 hover:bg-slate-850/60'
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    multiple
                    className="hidden"
                  />
                  <Upload className="w-6 h-6 mx-auto text-cyan-500 mb-1.5" />
                  <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-200">
                    Click to browse or drop images (PNG, JPG, WebP)
                  </p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                    Upload 1 to 5 images to guide keyframe motion transitions
                  </p>
                </div>
              )}
            </div>

            {/* Step 2: Prompt Bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  <span>2. Cinematic Prompt</span>
                </label>
                <button
                  type="button"
                  onClick={handleEnhancePrompt}
                  className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Enhance with AI</span>
                </button>
              </div>

              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe lighting, action, and camera movement (e.g. Glowing neon sports car speeding on rainy highway, 4k cinematic drone follow)..."
                rows={3}
                className={`w-full rounded-xl border p-3 text-xs sm:text-sm transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500/50 ${
                  isLight 
                    ? 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-500' 
                    : 'bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-500'
                }`}
              />

              {/* Negative Prompt */}
              <div className="mt-2">
                <button
                  type="button"
                  onClick={() => setShowNegative(!showNegative)}
                  className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200"
                >
                  {showNegative ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  <span>{showNegative ? 'Hide Negative Prompt' : 'Add Negative Prompt (Optional)'}</span>
                </button>
                {showNegative && (
                  <input
                    type="text"
                    value={negativePrompt}
                    onChange={(e) => setNegativePrompt(e.target.value)}
                    placeholder="blurry, jitter, artifacts, deformed, watermark, low resolution"
                    className={`mt-2 w-full rounded-lg border p-2.5 text-xs focus:outline-none ${
                      isLight 
                        ? 'bg-slate-100 border-slate-300 text-slate-900' 
                        : 'bg-slate-950 border-slate-800 text-slate-100'
                    }`}
                  />
                )}
              </div>
            </div>

            {/* Step 3: Visual Style */}
            <div className="mb-6">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400 block mb-2">
                Visual Style Preset
              </label>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {STYLE_PRESETS.map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setSelectedStyle(st.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      selectedStyle === st.id
                        ? `${accentClass.bg} text-slate-950 font-bold shadow-sm`
                        : isLight
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300'
                          : 'bg-slate-950 hover:bg-slate-855 text-slate-300 border border-slate-800'
                    }`}
                  >
                    <span>{st.icon}</span>
                    <span>{st.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 4: Motion, Aspect Ratio & Duration */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-400 block mb-1.5">
                  Aspect Ratio
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {[
                    { id: '16:9', label: '16:9' },
                    { id: '9:16', label: '9:16' },
                    { id: '1:1', label: '1:1' },
                  ].map((ar) => (
                    <button
                      key={ar.id}
                      type="button"
                      onClick={() => setAspectRatio(ar.id as AspectRatio)}
                      className={`py-1.5 text-xs font-bold rounded-lg border text-center transition-all ${
                        aspectRatio === ar.id
                          ? 'border-cyan-500 bg-cyan-500/10 text-cyan-500'
                          : isLight
                            ? 'border-slate-300 bg-white text-slate-800'
                            : 'border-slate-800 bg-slate-950 text-slate-300'
                      }`}
                    >
                      {ar.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-400 block mb-1.5">
                  Camera Motion
                </label>
                <select
                  value={motion}
                  onChange={(e) => setMotion(e.target.value as CameraMotion)}
                  className={`w-full py-2 px-2 rounded-lg border text-xs focus:outline-none ${
                    isLight 
                      ? 'bg-white border-slate-300 text-slate-900' 
                      : 'bg-slate-950 border-slate-800 text-slate-200'
                  }`}
                >
                  {MOTION_PRESETS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-400 block mb-1.5">
                  Duration
                </label>
                <div className="grid grid-cols-2 gap-1">
                  {[
                    { val: 3, label: '3 Sec' },
                    { val: 5, label: '5 Sec' },
                  ].map((dur) => (
                    <button
                      key={dur.val}
                      type="button"
                      onClick={() => setDuration(dur.val)}
                      className={`py-1.5 text-xs font-bold rounded-lg border text-center transition-all ${
                        duration === dur.val
                          ? 'border-cyan-500 bg-cyan-500/10 text-cyan-500'
                          : isLight
                            ? 'border-slate-300 bg-white text-slate-800'
                            : 'border-slate-800 bg-slate-950 text-slate-300'
                      }`}
                    >
                      {dur.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Privacy Setting & Quota Indicator */}
            <div className={`p-3.5 rounded-xl border mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
              isLight ? 'bg-slate-100 border-slate-300' : 'bg-slate-950/60 border-slate-800'
            }`}>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPublic(!isPublic)}
                  className={`p-1.5 rounded-lg border transition-colors ${
                    isPublic 
                      ? 'border-cyan-500 text-cyan-500 bg-cyan-500/10' 
                      : 'border-slate-400 text-slate-400 bg-slate-800/40'
                  }`}
                >
                  {isPublic ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <div className="text-left">
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    {isPublic ? 'Public Showcase' : 'Private Creation'}
                  </p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    {isPublic ? 'List in community gallery' : 'Only visible in your account'}
                  </p>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  Daily Quota: <strong className="text-emerald-500">{remainingQuota} / {user?.maxDailyGenerations || 4} remaining</strong>
                </span>
                <span className="text-[10px] text-slate-500 block">
                  Resets every 24 hours · Zero watermarks
                </span>
              </div>
            </div>

            {/* Error Notification */}
            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Primary Action Button */}
            {!user ? (
              <button
                type="button"
                onClick={() => openAuthModal('signin')}
                className={`w-full py-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${accentClass.bg} text-slate-950 hover:brightness-110 shadow-lg`}
              >
                <Lock className="w-4 h-4" />
                <span>Sign In to Generate Free AI Video (4 Renders / Day)</span>
              </button>
            ) : (
              <button
                type="button"
                disabled={isGenerating || remainingQuota <= 0}
                onClick={handleGenerate}
                className={`w-full py-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
                  isGenerating || remainingQuota <= 0
                    ? 'opacity-60 cursor-not-allowed bg-slate-700 text-slate-400'
                    : `${accentClass.bg} text-slate-950 hover:brightness-110 ${accentClass.glow}`
                }`}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>
                      {queueStatus === 'processing'
                        ? 'Worker Processing Frames...'
                        : 'Order Queued in Line...'}
                    </span>
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
            <AdBanner type="sidebar" className="mt-5" />
          </div>

          {/* RIGHT COLUMN: Redesigned Render Monitor & Asynchronous Player (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col gap-4 w-full">
            <div className={`rounded-2xl border p-4 sm:p-5 shadow-lg ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Film className="w-4 h-4 text-cyan-500" />
                  <span>Render Monitor & Player</span>
                </h3>
                <span className="text-[11px] font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  Clean MP4
                </span>
              </div>

              {/* 1. QUEUE STATUS INDICATORS (Pending / Processing) */}
              {isGenerating && !generatedVideo && (
                <div className="p-5 rounded-xl border border-cyan-500/30 bg-cyan-950/20 text-center mb-4">
                  {queueStatus === 'pending' ? (
                    <>
                      <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/40 text-cyan-400 flex items-center justify-center mx-auto mb-3 animate-pulse">
                        <Clock className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                        Order Queued ({activeOrderId ? `#${activeOrderId.slice(-6)}` : 'In Queue'})
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xs mx-auto mb-3">
                        Your generation task is saved in the queue. Polling neural workers every 5s...
                      </p>
                      <div className="flex items-center justify-center gap-1.5 text-[11px] font-mono text-cyan-500 bg-cyan-950/40 py-1.5 px-3 rounded-lg w-max mx-auto border border-cyan-800/40">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Status Check #{pollCount} (Waiting for Worker)</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-full bg-purple-500/10 border border-purple-500/40 text-purple-400 flex items-center justify-center mx-auto mb-3">
                        <Cpu className="w-6 h-6 animate-pulse" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                        Worker Active: Synthesizing Video
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xs mx-auto mb-3">
                        GPU worker claimed your task. Generating optical flow transitions and rendering 60FPS video frames...
                      </p>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden my-2">
                        <div className="bg-gradient-to-r from-cyan-500 to-purple-500 h-full w-3/4 animate-pulse" />
                      </div>
                      <span className="text-[10px] text-slate-500">
                        Order #{activeOrderId ? activeOrderId.slice(-6) : ''} · Processing
                      </span>
                    </>
                  )}
                </div>
              )}

              {/* 2. COMPLETED VIDEO PLAYER WITH DIRECT BLOB FORCE-DOWNLOAD */}
              {generatedVideo && generatedVideo.videoUrl ? (
                <div className="space-y-4">
                  {/* Interactive HTML5 Video Player */}
                  <div className="relative rounded-xl overflow-hidden bg-black aspect-video border border-slate-700 shadow-md">
                    <video
                      key={generatedVideo.videoUrl}
                      src={generatedVideo.videoUrl}
                      controls
                      preload="auto"
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

                  {/* High-Contrast Smart Blob Force-Download Button */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={isDownloading}
                      onClick={() => handleForceDownload(generatedVideo.videoUrl, generatedVideo.id)}
                      className="w-full py-3 px-4 rounded-xl text-xs font-extrabold bg-cyan-400 hover:bg-cyan-300 text-black flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
                    >
                      {isDownloading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Downloading to Device...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 stroke-[2.5]" />
                          <span>Direct Save MP4 (Blob)</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setPrompt(generatedVideo.prompt);
                        window.scrollTo({ top: 300, behavior: 'smooth' });
                      }}
                      className={`w-full py-3 px-4 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-colors ${
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
                      Fill in your prompt and click Generate to queue a 60FPS watermark-free MP4.
                    </p>
                  </div>
                )
              )}
            </div>

            {/* Queue & Worker Specs Architecture Card */}
            <div className={`rounded-xl border p-3.5 text-xs ${
              isLight ? 'bg-white border-slate-200 text-slate-700' : 'bg-slate-900/50 border-slate-800 text-slate-400'
            }`}>
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-200 mb-1">
                <Layers className="w-3.5 h-3.5 text-cyan-500" />
                <span>Asynchronous Queue Architecture</span>
              </div>
              <p className="leading-relaxed text-[11px]">
                Orders are queued in local host memory and dispatched to worker nodes via <code>/api/videos/next-pending</code>. Polling client checks status without network timeout.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
