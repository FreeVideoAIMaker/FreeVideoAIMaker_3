export type AspectRatio = '16:9' | '9:16' | '1:1';

export type CameraMotion = 
  | 'cinematic-pan' 
  | 'zoom-in' 
  | 'zoom-out' 
  | 'orbit-3d' 
  | 'tilt-up' 
  | 'static-subtle';

export type VideoStylePreset = 
  | 'cinematic' 
  | 'cyberpunk-neon' 
  | 'anime' 
  | 'photorealistic' 
  | '3d-render' 
  | 'dark-fantasy' 
  | 'drone-fpv';

export interface UserNotification {
  id: string;
  title: string;
  message: string;
  type: 'welcome' | 'system' | 'quota';
  createdAt: string;
  read: boolean;
}

export interface GeneratedVideo {
  id: string;
  userId?: string;
  userName?: string;
  title: string;
  prompt: string;
  negativePrompt?: string;
  style: VideoStylePreset;
  aspectRatio: AspectRatio;
  motion: CameraMotion;
  duration: number; // in seconds
  videoUrl: string;
  thumbnailUrl: string;
  imageCount: number;
  inputImages?: string[];
  isPublic: boolean;
  createdAt: string;
  expiresAt: string; // 24 hours retention
  watermarked: boolean; // always false
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  views?: number;
  likes?: number;
  storageType?: 'tablet-local';
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  generationsToday: number;
  maxDailyGenerations: number;
  totalGenerations: number;
  createdAt: string;
  isBanned?: boolean;
  notifications?: UserNotification[];
}

export interface AdminUserView {
  id: string;
  username: string;
  maskedEmail: string;
  passwordHashPreview: string;
  generationsToday: number;
  totalGenerations: number;
  createdAt: string;
  isBanned: boolean;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId?: string;
  username?: string;
  prompt: string;
  safetyStatus: 'approved' | 'flagged' | 'blocked';
  flagReason?: string;
  ipHash: string;
  modelUsed: string;
}

export interface VisitorMetric {
  date: string;
  visitors: number;
  pageviews: number;
  generations: number;
}

export interface AdminStats {
  totalVisitors: number;
  todayVisitors: number;
  botRequestsFiltered: number;
  totalUsers: number;
  totalGenerations: number;
  todayGenerations: number;
  activeVideosOnServer: number;
  flaggedSafetyAttempts: number;
  timeSeries: VisitorMetric[];
  deviceBreakdown: { mobile: number; desktop: number; tablet: number };
  serverStorage: {
    storagePath: string;
    totalFiles: number;
    retentionHours: number;
    mode: 'tablet-host';
  };
}

export interface SiteConfig {
  siteName: string;
  heroTitle: string;
  heroSubtitle: string;
  heroCtaText: string;
  noticeBannerText: string;
  isNoticeBannerVisible: boolean;
  aiEngineName: string;
  dailyUserLimit: number;
  videoRetentionHours: number;
  smtpConfigured: boolean;
  smtp?: {
    host: string;
    port: number;
    user: string;
    pass: string;
    from: string;
  };
  theme: {
    accentColor: 'cyan' | 'purple' | 'emerald' | 'rose' | 'amber';
    neonIntensity: 'high' | 'medium' | 'subtle';
    lightModeFontDarkness: 'maximum' | 'high' | 'medium';
  };
  sectionVisibility: {
    hero: boolean;
    studio: boolean;
    showcase: boolean;
    features: boolean;
    faq: boolean;
    sponsorBanner: boolean;
  };
  ads: {
    headerAdEnabled: boolean;
    sidebarAdEnabled: boolean;
    showcaseAdEnabled: boolean;
    completionAdEnabled: boolean;
    googleAdSenseCode: string;
    cryptoAdNetwork: 'none' | 'a-ads' | 'coinzilla' | 'bitmedia';
    cryptoAdUnitId: string;
    customAdSnippet: string;
  };
}
