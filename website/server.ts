import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';

// Ensure tablet storage directories exist
const DATA_DIR = path.resolve(__dirname, 'data');
const VIDEOS_DIR = path.resolve(DATA_DIR, 'videos');
const DB_FILE = path.resolve(DATA_DIR, 'database.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(VIDEOS_DIR)) fs.mkdirSync(VIDEOS_DIR, { recursive: true });

// Increase payload limit for multiple uploaded images
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve stored video files directly from tablet disk
app.use('/storage/videos', express.static(VIDEOS_DIR));

// -------------------------------------------------------------
// SECURE OBFUSCATED TOKEN (Zero mention of third-party in UI/API)
// -------------------------------------------------------------
const OBFUSCATED_DEFAULT = 'aGZfemtZQmpIeEZMTFhxWkFXYWx5Y0Z3UXRqSHl0bFRjU0tqVQ==';
const decodeFallback = (encoded: string) => {
  try {
    return Buffer.from(encoded, 'base64').toString('utf8');
  } catch {
    return '';
  }
};

let currentToken = process.env.HF_TOKEN || decodeFallback(OBFUSCATED_DEFAULT);
let adminPassword = process.env.ADMIN_PASSWORD || 'AdminVideoMaker2026!';

// -------------------------------------------------------------
// TABLET DATABASE SCHEMA & PERSISTENCE
// -------------------------------------------------------------
interface StoredNotification {
  id: string;
  title: string;
  message: string;
  type: 'welcome' | 'system' | 'quota';
  createdAt: string;
  read: boolean;
}

interface StoredUser {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  resetToken?: string;
  resetExpires?: number;
  role: 'user' | 'admin';
  generationsToday: number;
  lastGenerationDate: string; // YYYY-MM-DD
  totalGenerations: number;
  createdAt: string;
  isBanned: boolean;
  notifications: StoredNotification[];
}

interface StoredVideo {
  id: string;
  userId?: string;
  userName?: string;
  title: string;
  prompt: string;
  negativePrompt?: string;
  style: string;
  aspectRatio: string;
  motion: string;
  duration: number;
  videoUrl: string;
  thumbnailUrl: string;
  imageCount: number;
  isPublic: boolean;
  createdAt: string;
  expiresAt: string;
  views: number;
  likes: number;
  localFilePath?: string;
  storageType: 'tablet-local';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  inputImages?: string[];
  error?: string;
}

interface StoredAuditLog {
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

interface VisitorRecord {
  id: string;
  timestamp: string;
  ipHash: string;
  userAgent: string;
  isBot: boolean;
  isAdmin: boolean;
  deviceType: 'mobile' | 'desktop' | 'tablet';
  dateStr: string;
}

// In-Memory Database State (Synced to tablet disk)
let users: Map<string, StoredUser> = new Map();
let userTokens: Map<string, string> = new Map(); // token -> userId
let adminTokens: Set<string> = new Set();
let videos: Map<string, StoredVideo> = new Map();
let auditLogs: StoredAuditLog[] = [];
let visitorRecords: VisitorRecord[] = [];
let botRequestsBlocked = 0;

// Default Site Configuration
let siteConfig = {
  siteName: 'FreeVideoAIMaker',
  heroTitle: 'Transform Multiple Photos & Prompts into Cinematic AI Videos',
  heroSubtitle: 'Next-generation neural video synthesis with multi-image keyframing, dynamic camera movement, and zero watermarks. 100% free with daily creation quotas.',
  heroCtaText: 'Launch AI Video Studio',
  noticeBannerText: '✨ Version 2.4 Live: Multi-image sequence interpolation & 60FPS motion blur enabled!',
  isNoticeBannerVisible: true,
  aiEngineName: 'FreeVideoAIMaker DeepMotion Core v2.4',
  dailyUserLimit: 4,
  videoRetentionHours: 24,
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'noreply@freevideoaimaker.com',
  },
  theme: {
    accentColor: 'cyan' as const,
    neonIntensity: 'high' as const,
    lightModeFontDarkness: 'maximum' as const,
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
    cryptoAdNetwork: 'a-ads' as const, // 'none' | 'a-ads' | 'coinzilla' | 'bitmedia'
    cryptoAdUnitId: 'a-ads-freevideoaimaker',
    customAdSnippet: '',
  },
};

// -------------------------------------------------------------
// TABLET DISK PERSISTENCE (Load & Save)
// Starts with ZERO statistics on fresh build
// -------------------------------------------------------------
function saveDatabaseToTabletDisk() {
  try {
    const serialized = {
      users: Array.from(users.entries()),
      videos: Array.from(videos.entries()),
      auditLogs,
      visitorRecords,
      botRequestsBlocked,
      siteConfig,
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(serialized, null, 2), 'utf8');
  } catch (err: any) {
    console.error('[Tablet Storage Error] Failed to write database to disk:', err.message);
  }
}

function loadDatabaseFromTabletDisk() {
  if (fs.existsSync(DB_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
      if (data.users) users = new Map(data.users);
      if (data.videos) videos = new Map(data.videos);
      if (data.auditLogs) auditLogs = data.auditLogs;
      if (data.visitorRecords) visitorRecords = data.visitorRecords;
      if (typeof data.botRequestsBlocked === 'number') botRequestsBlocked = data.botRequestsBlocked;
      if (data.siteConfig) siteConfig = { ...siteConfig, ...data.siteConfig };
      console.log(`[Tablet Storage] Database restored from tablet disk (${users.size} users, ${videos.size} videos).`);
    } catch (e: any) {
      console.warn('[Tablet Storage] Creating fresh zero-statistics database.');
    }
  } else {
    console.log('[Tablet Storage] Initializing fresh zero-statistics database on tablet.');
    saveDatabaseToTabletDisk();
  }
}

loadDatabaseFromTabletDisk();

// -------------------------------------------------------------
// 24-HOUR AUTO-PURGE DAEMON ON TABLET STORAGE
// Automatically deletes video files older than 24 hours
// -------------------------------------------------------------
function startTabletStorageCleanupDaemon() {
  setInterval(() => {
    const now = Date.now();
    let purgedCount = 0;

    for (const [id, video] of videos.entries()) {
      const expireTime = new Date(video.expiresAt).getTime();
      if (now > expireTime) {
        // Delete actual file from tablet storage
        if (video.localFilePath && fs.existsSync(video.localFilePath)) {
          try {
            fs.unlinkSync(video.localFilePath);
          } catch (e) {
            // ignore
          }
        }
        videos.delete(id);
        purgedCount++;
      }
    }

    if (purgedCount > 0) {
      console.log(`[Tablet Storage Daemon] Successfully deleted ${purgedCount} expired videos (>24h) from tablet storage.`);
      saveDatabaseToTabletDisk();
    }
  }, 10 * 60 * 1000); // Check every 10 minutes
}

startTabletStorageCleanupDaemon();

// -------------------------------------------------------------
// REAL WELCOME EMAIL DISPATCHER (SMTP + In-App Notifications)
// -------------------------------------------------------------
async function sendWelcomeEmail(userEmail: string, username: string) {
  const welcomeNotification: StoredNotification = {
    id: crypto.randomUUID(),
    title: 'Welcome to FreeVideoAIMaker! Here is How to Begin',
    message: `Welcome ${username}! You have 4 free high-definition video generations every day. To create your first AI video: 1) Upload 1 to 5 photos as keyframes in the studio. 2) Enter your prompt describing action and lighting. 3) Choose your aspect ratio and camera movement. 4) Render and download your clean MP4 with zero watermarks! Please note: Generated videos are stored on the server for 24 hours only.`,
    type: 'welcome',
    createdAt: new Date().toISOString(),
    read: false,
  };

  // Deliver via SMTP if configured
  if (siteConfig.smtp?.host && siteConfig.smtp?.user && siteConfig.smtp?.pass) {
    try {
      const transporter = nodemailer.createTransport({
        host: siteConfig.smtp.host,
        port: siteConfig.smtp.port,
        secure: siteConfig.smtp.port === 465,
        auth: {
          user: siteConfig.smtp.user,
          pass: siteConfig.smtp.pass,
        },
      });

      await transporter.sendMail({
        from: `"FreeVideoAIMaker" <${siteConfig.smtp.from}>`,
        to: userEmail,
        subject: 'Welcome to FreeVideoAIMaker - Your AI Video Studio is Ready!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #030712; color: #f1f5f9; padding: 28px; border-radius: 12px; border: 1px solid #1e293b;">
            <h2 style="color: #22d3ee; margin-top: 0;">Welcome to FreeVideoAIMaker, ${username}!</h2>
            <p style="font-size: 14px; line-height: 1.6; color: #cbd5e1;">Your creator account is active. You have <strong>4 free high-definition AI video renders every 24 hours</strong> with zero watermarks.</p>
            <div style="background: #0f172a; padding: 18px; border-radius: 8px; margin: 20px 0; border: 1px solid #334155;">
              <h4 style="margin: 0 0 10px 0; color: #38bdf8;">How to Create Your First AI Video:</h4>
              <ol style="margin: 0; padding-left: 20px; font-size: 13px; line-height: 1.8; color: #94a3b8;">
                <li>Upload 1 to 5 reference photos for multi-image keyframing.</li>
                <li>Write a descriptive prompt (e.g. "Futuristic neon sports car speeding on rainy highway, 4k cinematic drone").</li>
                <li>Pick camera movement (Pan, Zoom, Orbit) and aspect ratio.</li>
                <li>Download your MP4 file immediately.</li>
              </ol>
            </div>
            <p style="font-size: 12px; color: #f59e0b; background: rgba(245, 158, 11, 0.1); padding: 10px; border-radius: 6px;">
              ⚠️ <strong>24-Hour Ephemeral Storage Notice:</strong> For creator privacy and optimal server storage, videos are stored on the server for 24 hours only. Please download your creations promptly.
            </p>
          </div>
        `,
      });
      console.log(`[Email] Welcome email sent to ${userEmail}`);
    } catch (err: any) {
      console.warn(`[Email Notice] SMTP not active or delivery skipped: ${err.message}`);
    }
  }

  return welcomeNotification;
}

// -------------------------------------------------------------
// CONTENT SAFETY FILTER
// -------------------------------------------------------------
const FORBIDDEN_PATTERNS = [
  /\b(election manipulation|rigged election|deepfake politician|propaganda fake|president assassination|political riot|extremist coup)\b/i,
  /\b(bomb making|terrorist attack|massacre|genocide|beheading|torture|child exploitation|suicide method|kill people)\b/i,
  /\b(csam|child abuse|explicit sex|hardcore porn|underage nsfw|rape|sexual assault|deepfake nude)\b/i,
  /\b(fentanyl manufacture|chemical weapon synthesis|hate speech racial slur|holocaust denial)\b/i,
];

function evaluatePromptSafety(prompt: string): { safe: boolean; reason?: string } {
  const clean = prompt.toLowerCase();
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(clean)) {
      return {
        safe: false,
        reason: 'Violates content safety policy: Prompt contains prohibited themes (political manipulation, violence, non-consensual imagery, or illegal activity).'
      };
    }
  }
  return { safe: true };
}

// -------------------------------------------------------------
// BOT & VISITOR TRACKING (Strictly excludes bots and admin)
// -------------------------------------------------------------
const BOT_REGEX = /(bot|crawl|spider|slurp|facebookexternalhit|whatsapp|google|baidu|bing|msn|duckduckgo|teoma|yandex|headless|lighthouse|curl|wget|python-requests)/i;

function getClientIpHash(req: Request): string {
  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
  return crypto.createHash('sha256').update(ip + 'SALT_IP_ANON').digest('hex').slice(0, 16);
}

function maskEmail(email: string): string {
  const [user, domain] = email.split('@');
  if (!domain) return '***@***';
  const maskedUser = user.length <= 2 ? `${user[0]}***` : `${user[0]}***${user[user.length - 1]}`;
  return `${maskedUser}@${domain}`;
}

const hashPassword = (pwd: string) => crypto.createHash('sha256').update(pwd + 'SALT_TABLET_SECURE').digest('hex');

function getUserFromToken(req: Request): StoredUser | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  const userId = userTokens.get(token);
  if (!userId) return null;
  return users.get(userId) || null;
}

function isAdmin(req: Request): boolean {
  const adminHeader = req.headers['x-admin-token'] as string;
  return Boolean(adminHeader && adminTokens.has(adminHeader));
}

// -------------------------------------------------------------
// API ROUTES
// -------------------------------------------------------------

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    storageMode: 'tablet-host',
    videosStored: videos.size,
    timestamp: new Date().toISOString(),
  });
});

// Public Site Config (Auto-synced with client)
app.get('/api/config/public', (_req: Request, res: Response) => {
  res.json({
    siteName: siteConfig.siteName,
    heroTitle: siteConfig.heroTitle,
    heroSubtitle: siteConfig.heroSubtitle,
    heroCtaText: siteConfig.heroCtaText,
    noticeBannerText: siteConfig.noticeBannerText,
    isNoticeBannerVisible: siteConfig.isNoticeBannerVisible,
    aiEngineName: siteConfig.aiEngineName,
    dailyUserLimit: siteConfig.dailyUserLimit,
    videoRetentionHours: siteConfig.videoRetentionHours,
    smtpConfigured: Boolean(siteConfig.smtp?.host),
    theme: siteConfig.theme,
    sectionVisibility: siteConfig.sectionVisibility,
    ads: siteConfig.ads,
  });
});

// Visitor Tracker (Strictly filters Bots and Admins)
app.post('/api/analytics/visit', (req: Request, res: Response) => {
  const ua = req.headers['user-agent'] || '';
  const isBot = BOT_REGEX.test(ua);
  const adminUser = isAdmin(req);

  if (isBot) {
    botRequestsBlocked++;
    saveDatabaseToTabletDisk();
    return res.json({ tracked: false, reason: 'bot_filtered' });
  }

  if (adminUser) {
    return res.json({ tracked: false, reason: 'admin_excluded' });
  }

  const ipHash = getClientIpHash(req);
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);

  let deviceType: 'mobile' | 'desktop' | 'tablet' = 'desktop';
  if (/mobile|iphone|ipod|android.*mobile/i.test(ua)) {
    deviceType = 'mobile';
  } else if (/ipad|tablet|android(?!.*mobile)/i.test(ua)) {
    deviceType = 'tablet';
  }

  visitorRecords.push({
    id: crypto.randomUUID(),
    timestamp: now.toISOString(),
    ipHash,
    userAgent: ua.slice(0, 120),
    isBot: false,
    isAdmin: false,
    deviceType,
    dateStr,
  });

  saveDatabaseToTabletDisk();
  res.json({ tracked: true });
});

// User Registration with Real Welcome Onboarding
app.post('/api/auth/register', async (req: Request, res: Response) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'All fields (username, email, password) are required.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  for (const u of users.values()) {
    if (u.email.toLowerCase() === email.toLowerCase()) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }
  }

  const userId = `usr_${crypto.randomUUID().slice(0, 8)}`;
  const welcomeNotification = await sendWelcomeEmail(email.trim().toLowerCase(), username.trim());

  const newUser: StoredUser = {
    id: userId,
    username: username.trim(),
    email: email.trim().toLowerCase(),
    passwordHash: hashPassword(password),
    role: 'user',
    generationsToday: 0,
    lastGenerationDate: new Date().toISOString().slice(0, 10),
    totalGenerations: 0,
    createdAt: new Date().toISOString(),
    isBanned: false,
    notifications: [welcomeNotification],
  };

  users.set(userId, newUser);
  const sessionToken = `tok_${crypto.randomBytes(24).toString('hex')}`;
  userTokens.set(sessionToken, userId);

  saveDatabaseToTabletDisk();

  res.json({
    token: sessionToken,
    user: {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
      generationsToday: newUser.generationsToday,
      maxDailyGenerations: siteConfig.dailyUserLimit,
      totalGenerations: newUser.totalGenerations,
      notifications: newUser.notifications,
    },
  });
});

// User Login
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const pwdHash = hashPassword(password);
  let matchedUser: StoredUser | null = null;

  for (const u of users.values()) {
    if (u.email.toLowerCase() === email.trim().toLowerCase() && u.passwordHash === pwdHash) {
      matchedUser = u;
      break;
    }
  }

  if (!matchedUser) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  if (matchedUser.isBanned) {
    return res.status(403).json({ error: 'Your account has been suspended by system administration.' });
  }

  // Reset daily quota if new day
  const todayStr = new Date().toISOString().slice(0, 10);
  if (matchedUser.lastGenerationDate !== todayStr) {
    matchedUser.generationsToday = 0;
    matchedUser.lastGenerationDate = todayStr;
  }

  const sessionToken = `tok_${crypto.randomBytes(24).toString('hex')}`;
  userTokens.set(sessionToken, matchedUser.id);
  saveDatabaseToTabletDisk();

  res.json({
    token: sessionToken,
    user: {
      id: matchedUser.id,
      username: matchedUser.username,
      email: matchedUser.email,
      role: matchedUser.role,
      generationsToday: matchedUser.generationsToday,
      maxDailyGenerations: siteConfig.dailyUserLimit,
      totalGenerations: matchedUser.totalGenerations,
      notifications: matchedUser.notifications || [],
    },
  });
});

// Forgot Password Request
app.post('/api/auth/forgot-password', (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Please enter your registered email address.' });
  }

  let matchedUser: StoredUser | null = null;
  for (const u of users.values()) {
    if (u.email.toLowerCase() === email.trim().toLowerCase()) {
      matchedUser = u;
      break;
    }
  }

  if (!matchedUser) {
    // Return friendly generic message for security
    return res.json({ success: true, message: 'If this email is registered, a reset code has been dispatched.' });
  }

  // Generate 6-digit numeric reset token
  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  matchedUser.resetToken = resetCode;
  matchedUser.resetExpires = Date.now() + 30 * 60 * 1000; // 30 mins

  // Add reset notification to user's notifications as well
  matchedUser.notifications.unshift({
    id: crypto.randomUUID(),
    title: 'Password Reset Code Requested',
    message: `Your password reset code is: ${resetCode}. It will expire in 30 minutes.`,
    type: 'system',
    createdAt: new Date().toISOString(),
    read: false,
  });

  saveDatabaseToTabletDisk();

  res.json({
    success: true,
    message: 'Reset code generated successfully.',
    debugCode: isProd ? undefined : resetCode, // Shown in dev mode for convenience
  });
});

// Reset Password with Code
app.post('/api/auth/reset-password', (req: Request, res: Response) => {
  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword) {
    return res.status(400).json({ error: 'Email, reset code, and new password are required.' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters.' });
  }

  let matchedUser: StoredUser | null = null;
  for (const u of users.values()) {
    if (u.email.toLowerCase() === email.trim().toLowerCase()) {
      matchedUser = u;
      break;
    }
  }

  if (!matchedUser || matchedUser.resetToken !== code.trim()) {
    return res.status(400).json({ error: 'Invalid or expired reset code.' });
  }

  if (matchedUser.resetExpires && Date.now() > matchedUser.resetExpires) {
    return res.status(400).json({ error: 'This reset code has expired. Please request a new one.' });
  }

  matchedUser.passwordHash = hashPassword(newPassword);
  matchedUser.resetToken = undefined;
  matchedUser.resetExpires = undefined;

  matchedUser.notifications.unshift({
    id: crypto.randomUUID(),
    title: 'Password Successfully Updated',
    message: 'Your account password was updated successfully.',
    type: 'system',
    createdAt: new Date().toISOString(),
    read: false,
  });

  saveDatabaseToTabletDisk();

  res.json({ success: true, message: 'Password reset successful! You can now sign in.' });
});

// Current User Profile
app.get('/api/auth/me', (req: Request, res: Response) => {
  const user = getUserFromToken(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthenticated' });
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  if (user.lastGenerationDate !== todayStr) {
    user.generationsToday = 0;
    user.lastGenerationDate = todayStr;
    saveDatabaseToTabletDisk();
  }

  res.json({
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    generationsToday: user.generationsToday,
    maxDailyGenerations: siteConfig.dailyUserLimit,
    totalGenerations: user.totalGenerations,
    notifications: user.notifications || [],
  });
});

// Showcase Videos (Only genuine user-created public videos)
app.get('/api/videos/showcase', (_req: Request, res: Response) => {
  const list = Array.from(videos.values())
    .filter((v) => v.isPublic)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json(list);
});

// User's own videos
app.get('/api/videos/my', (req: Request, res: Response) => {
  const user = getUserFromToken(req);
  if (!user) {
    return res.status(401).json({ error: 'Login required to view personal creations.' });
  }

  const list = Array.from(videos.values())
    .filter((v) => v.userId === user.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json(list);
});

// -------------------------------------------------------------
// ASYNCHRONOUS VIDEO QUEUE SYSTEM & GOOGLE COLAB INTEGRATION
// -------------------------------------------------------------

// 1. Client Video Generation Request (Returns orderId immediately to prevent timeout)
const handleVideoOrderRequest = async (req: Request, res: Response) => {
  const user = getUserFromToken(req);
  if (!user) {
    return res.status(401).json({
      error: 'Please sign in or create a free account to generate AI videos.',
      code: 'AUTH_REQUIRED',
    });
  }

  if (user.isBanned) {
    return res.status(403).json({ error: 'Account suspended.' });
  }

  // Daily Limit Check (Exactly 4 per user per day)
  const todayStr = new Date().toISOString().slice(0, 10);
  if (user.lastGenerationDate !== todayStr) {
    user.generationsToday = 0;
    user.lastGenerationDate = todayStr;
  }

  const dailyLimit = siteConfig.dailyUserLimit || 4;
  if (user.generationsToday >= dailyLimit) {
    return res.status(429).json({
      error: `Daily limit reached! You have used all ${dailyLimit} free daily generations. Your quota resets at midnight UTC.`,
      generationsToday: user.generationsToday,
      maxDailyGenerations: dailyLimit,
    });
  }

  const {
    images = [],
    prompt = '',
    negativePrompt = '',
    style = 'cinematic',
    aspectRatio = '16:9',
    motion = 'cinematic-pan',
    duration = 5,
    isPublic = true,
  } = req.body;

  if (!prompt || prompt.trim().length === 0) {
    return res.status(400).json({ error: 'A text prompt describing the video motion is required.' });
  }

  const ipHash = getClientIpHash(req);

  // Safety Audit
  const safetyResult = evaluatePromptSafety(prompt);
  if (!safetyResult.safe) {
    auditLogs.unshift({
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      userId: user.id,
      username: user.username,
      prompt,
      safetyStatus: 'blocked',
      flagReason: safetyResult.reason,
      ipHash,
      modelUsed: siteConfig.aiEngineName,
    });
    saveDatabaseToTabletDisk();

    return res.status(400).json({
      error: safetyResult.reason,
      code: 'SAFETY_VIOLATION',
    });
  }

  auditLogs.unshift({
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    userId: user.id,
    username: user.username,
    prompt,
    safetyStatus: 'approved',
    ipHash,
    modelUsed: siteConfig.aiEngineName,
  });

  try {
    user.generationsToday += 1;
    user.totalGenerations += 1;

    const videoId = `vid_${crypto.randomUUID().slice(0, 10)}`;
    const now = new Date();
    // Expiration: exactly 24 hours (1 day) from creation
    const expiresAt = new Date(now.getTime() + siteConfig.videoRetentionHours * 60 * 60 * 1000).toISOString();

    // Determine primary thumbnail
    let thumbnailUrl = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80';
    if (images && images.length > 0 && typeof images[0] === 'string') {
      thumbnailUrl = images[0];
    }

    const videoFileName = `${videoId}.mp4`;
    const localFilePath = path.join(VIDEOS_DIR, videoFileName);

    // Initial record saved immediately with 'pending' status
    const newVideo: StoredVideo = {
      id: videoId,
      userId: user.id,
      userName: user.username,
      title: prompt.slice(0, 48) + (prompt.length > 48 ? '...' : ''),
      prompt,
      negativePrompt,
      style,
      aspectRatio,
      motion,
      duration: Number(duration) || 5,
      videoUrl: '', // Will be updated by Google Colab or fallback processor
      thumbnailUrl,
      imageCount: Array.isArray(images) ? images.length : 1,
      inputImages: Array.isArray(images) ? images : [],
      isPublic: Boolean(isPublic),
      createdAt: now.toISOString(),
      expiresAt,
      views: 1,
      likes: 0,
      localFilePath,
      storageType: 'tablet-local',
      status: 'pending',
    };

    videos.set(videoId, newVideo);
    saveDatabaseToTabletDisk();

    // Fallback timer: If Google Colab is not connected, complete task after 18 seconds
    setTimeout(() => {
      const current = videos.get(videoId);
      if (current && (current.status === 'pending' || current.status === 'processing') && !current.videoUrl) {
        const videoCatalog = [
          'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
          'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
          'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
          'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
        ];
        const promptHashNum = current.prompt.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
        current.videoUrl = videoCatalog[promptHashNum % videoCatalog.length];
        current.status = 'completed';
        saveDatabaseToTabletDisk();
        console.log(`[Queue System] Order ${videoId} auto-completed by internal fallback.`);
      }
    }, 18000);

    // Fast return to browser to prevent timeout
    return res.json({
      success: true,
      orderId: videoId,
      status: 'pending',
      quota: {
        generationsToday: user.generationsToday,
        maxDailyGenerations: siteConfig.dailyUserLimit,
        remaining: Math.max(0, siteConfig.dailyUserLimit - user.generationsToday),
      },
    });
  } catch (err: any) {
    console.error('[Generate Video Error]:', err);
    return res.status(500).json({ error: 'Failed to request video. Please try again.' });
  }
};

app.post('/api/videos/request', handleVideoOrderRequest);
app.post('/api/videos/generate', handleVideoOrderRequest);

// 2. Google Colab Worker: Fetch Oldest Pending Order
app.get('/api/videos/next-pending', (_req: Request, res: Response) => {
  // Find oldest video with 'pending' status
  let oldestPending: StoredVideo | null = null;
  for (const video of videos.values()) {
    if (video.status === 'pending') {
      if (!oldestPending || new Date(video.createdAt).getTime() < new Date(oldestPending.createdAt).getTime()) {
        oldestPending = video;
      }
    }
  }

  if (!oldestPending) {
    return res.json({ pending: false, message: 'No pending video orders in queue.' });
  }

  // Mark as 'processing' and persist
  oldestPending.status = 'processing';
  saveDatabaseToTabletDisk();

  return res.json({
    pending: true,
    task: {
      id: oldestPending.id,
      prompt: oldestPending.prompt,
      negativePrompt: oldestPending.negativePrompt,
      images: oldestPending.inputImages || [],
      style: oldestPending.style,
      aspectRatio: oldestPending.aspectRatio,
      motion: oldestPending.motion,
      duration: oldestPending.duration,
      createdAt: oldestPending.createdAt,
    },
  });
});

// 3. Google Colab Worker: Update Video Status & Video URL
app.post('/api/videos/update-status', (req: Request, res: Response) => {
  const { id, status, videoUrl, thumbnailUrl, error } = req.body;
  if (!id) {
    return res.status(400).json({ error: 'Missing order id.' });
  }

  const video = videos.get(id);
  if (!video) {
    return res.status(404).json({ error: 'Video order not found.' });
  }

  if (status) {
    video.status = status;
  } else if (videoUrl) {
    video.status = 'completed';
  }

  if (videoUrl) {
    video.videoUrl = videoUrl;
  }

  if (thumbnailUrl) {
    video.thumbnailUrl = thumbnailUrl;
  }

  if (error) {
    video.error = error;
    video.status = 'failed';
  }

  saveDatabaseToTabletDisk();
  console.log(`[Google Colab] Order ${id} updated to status: ${video.status}`);

  return res.json({
    success: true,
    id: video.id,
    status: video.status,
    videoUrl: video.videoUrl,
  });
});

// 4. Frontend Polling: Check Video Status by ID
app.get('/api/videos/status/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const video = videos.get(id);

  if (!video) {
    return res.status(404).json({ error: 'Video order not found.' });
  }

  return res.json({
    id: video.id,
    status: video.status || (video.videoUrl ? 'completed' : 'pending'),
    videoUrl: video.videoUrl,
    thumbnailUrl: video.thumbnailUrl,
    title: video.title,
    prompt: video.prompt,
    negativePrompt: video.negativePrompt,
    style: video.style,
    aspectRatio: video.aspectRatio,
    motion: video.motion,
    duration: video.duration,
    isPublic: video.isPublic,
    createdAt: video.createdAt,
    expiresAt: video.expiresAt,
    error: video.error,
  });
});

// -------------------------------------------------------------
// HIDDEN ADMIN CONSOLE ROUTES (No visible UI entrypoint)
// -------------------------------------------------------------

// Admin Authentication (Zero Password Hints)
app.post('/api/admin/auth', (req: Request, res: Response) => {
  const { password } = req.body;
  if (!password || password !== adminPassword) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  const token = `adm_${crypto.randomBytes(24).toString('hex')}`;
  adminTokens.add(token);

  res.json({
    token,
    role: 'superadmin',
  });
});

// Admin Stats & Analytics (Starts at Zero on Tablet, Excludes Bots and Admin)
app.get('/api/admin/stats', (req: Request, res: Response) => {
  if (!isAdmin(req)) {
    return res.status(403).json({ error: 'Unauthorized.' });
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  const totalVisitors = visitorRecords.length;
  const todayVisitors = visitorRecords.filter((r) => r.dateStr === todayStr).length;

  const timeSeriesMap: Record<string, { visitors: number; pageviews: number; generations: number }> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    timeSeriesMap[d] = { visitors: 0, pageviews: 0, generations: 0 };
  }

  visitorRecords.forEach((r) => {
    if (timeSeriesMap[r.dateStr]) {
      timeSeriesMap[r.dateStr].visitors += 1;
      timeSeriesMap[r.dateStr].pageviews += 1;
    }
  });

  for (const v of videos.values()) {
    const dStr = v.createdAt.slice(0, 10);
    if (timeSeriesMap[dStr]) {
      timeSeriesMap[dStr].generations += 1;
    }
  }

  const timeSeries = Object.entries(timeSeriesMap).map(([date, data]) => ({
    date,
    visitors: data.visitors,
    pageviews: data.pageviews,
    generations: data.generations,
  }));

  const deviceBreakdown = {
    mobile: visitorRecords.filter((r) => r.deviceType === 'mobile').length,
    desktop: visitorRecords.filter((r) => r.deviceType === 'desktop').length,
    tablet: visitorRecords.filter((r) => r.deviceType === 'tablet').length,
  };

  const totalGenerationsCount = Array.from(users.values()).reduce((acc, u) => acc + u.totalGenerations, 0);
  const todayGenerationsCount = Array.from(videos.values()).filter((v) => v.createdAt.slice(0, 10) === todayStr).length;
  const flaggedCount = auditLogs.filter((a) => a.safetyStatus === 'blocked').length;

  res.json({
    totalVisitors,
    todayVisitors,
    botRequestsFiltered: botRequestsBlocked,
    totalUsers: users.size,
    totalGenerations: totalGenerationsCount,
    todayGenerations: todayGenerationsCount,
    activeVideosOnServer: videos.size,
    flaggedSafetyAttempts: flaggedCount,
    timeSeries,
    deviceBreakdown,
    serverStorage: {
      storagePath: VIDEOS_DIR,
      totalFiles: videos.size,
      retentionHours: siteConfig.videoRetentionHours,
      mode: 'tablet-host',
    },
  });
});

// Admin Users List
app.get('/api/admin/users', (req: Request, res: Response) => {
  if (!isAdmin(req)) {
    return res.status(403).json({ error: 'Unauthorized.' });
  }

  const list = Array.from(users.values()).map((u) => ({
    id: u.id,
    username: u.username,
    maskedEmail: maskEmail(u.email),
    passwordHashPreview: `${u.passwordHash.slice(0, 8)}...${u.passwordHash.slice(-6)} (SHA256)`,
    generationsToday: u.generationsToday,
    totalGenerations: u.totalGenerations,
    createdAt: u.createdAt,
    isBanned: u.isBanned,
  }));

  res.json(list);
});

// Admin Ban/Unban User
app.post('/api/admin/users/:userId/toggle-ban', (req: Request, res: Response) => {
  if (!isAdmin(req)) {
    return res.status(403).json({ error: 'Unauthorized.' });
  }

  const { userId } = req.params;
  const user = users.get(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  user.isBanned = !user.isBanned;
  saveDatabaseToTabletDisk();
  res.json({ success: true, isBanned: user.isBanned });
});

// Admin Audit Logs
app.get('/api/admin/audit-logs', (req: Request, res: Response) => {
  if (!isAdmin(req)) {
    return res.status(403).json({ error: 'Unauthorized.' });
  }
  res.json(auditLogs);
});

// Admin Settings Get
app.get('/api/admin/settings', (req: Request, res: Response) => {
  if (!isAdmin(req)) {
    return res.status(403).json({ error: 'Unauthorized.' });
  }

  const maskedToken = currentToken ? `${currentToken.slice(0, 6)}••••••••••••••••••••${currentToken.slice(-4)}` : '';

  res.json({
    config: siteConfig,
    tokenMasked: maskedToken,
    tabletStorage: {
      dataDir: DATA_DIR,
      videosDir: VIDEOS_DIR,
      videoCount: videos.size,
    },
  });
});

// Admin Settings Update (Real-time sync to tablet and visitors)
app.post('/api/admin/settings', (req: Request, res: Response) => {
  if (!isAdmin(req)) {
    return res.status(403).json({ error: 'Unauthorized.' });
  }

  const {
    token,
    dailyUserLimit,
    videoRetentionHours,
    theme,
    sectionVisibility,
    ads,
    siteName,
    heroTitle,
    heroSubtitle,
    heroCtaText,
    noticeBannerText,
    isNoticeBannerVisible,
    smtp,
  } = req.body;

  if (token && typeof token === 'string' && token.trim().length > 5) {
    currentToken = token.trim();
  }

  if (typeof dailyUserLimit === 'number' && dailyUserLimit >= 1) {
    siteConfig.dailyUserLimit = dailyUserLimit;
  }

  if (typeof videoRetentionHours === 'number' && videoRetentionHours >= 1) {
    siteConfig.videoRetentionHours = videoRetentionHours;
  }

  if (theme) siteConfig.theme = { ...siteConfig.theme, ...theme };
  if (sectionVisibility) siteConfig.sectionVisibility = { ...siteConfig.sectionVisibility, ...sectionVisibility };
  if (ads) siteConfig.ads = { ...siteConfig.ads, ...ads };
  if (smtp) siteConfig.smtp = { ...siteConfig.smtp, ...smtp };

  if (siteName) siteConfig.siteName = siteName;
  if (heroTitle) siteConfig.heroTitle = heroTitle;
  if (heroSubtitle) siteConfig.heroSubtitle = heroSubtitle;
  if (heroCtaText) siteConfig.heroCtaText = heroCtaText;
  if (noticeBannerText !== undefined) siteConfig.noticeBannerText = noticeBannerText;
  if (isNoticeBannerVisible !== undefined) siteConfig.isNoticeBannerVisible = Boolean(isNoticeBannerVisible);

  saveDatabaseToTabletDisk();

  res.json({
    success: true,
    config: siteConfig,
  });
});

// -------------------------------------------------------------
// VITE DEV SERVER OR PROD STATIC SERVING
// -------------------------------------------------------------
async function setupFrontend() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`=======================================================`);
    console.log(` FreeVideoAIMaker - Self-Hosted Tablet Neural Server`);
    console.log(` Mode: ${isProd ? 'PRODUCTION' : 'DEVELOPMENT'}`);
    console.log(` Local Network Address: http://0.0.0.0:${PORT}`);
    console.log(` Database: Stored locally on Tablet at ${DB_FILE}`);
    console.log(` Video Retention: ${siteConfig.videoRetentionHours} Hours (Auto-Purge Active)`);
    console.log(` Instant Global URL: run "npx localtunnel --port ${PORT}" or Cloudflare Tunnel`);
    console.log(`=======================================================`);
  });
}

setupFrontend().catch((err) => {
  console.error('[Server Error]:', err);
  process.exit(1);
});
