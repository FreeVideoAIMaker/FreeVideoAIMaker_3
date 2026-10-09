import { 
  GeneratedVideo, 
  UserProfile, 
  AdminStats, 
  AdminUserView, 
  AuditLog, 
  SiteConfig 
} from '../types';

const getAuthToken = () => localStorage.getItem('fva_user_token') || '';
const getAdminToken = () => localStorage.getItem('fva_admin_token') || '';

// 1. Analytics Visitor Record (Excludes Bots and Admin)
export async function recordVisit(): Promise<void> {
  try {
    const adminToken = getAdminToken();
    await fetch('/api/analytics/visit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(adminToken ? { 'x-admin-token': adminToken } : {}),
      },
    });
  } catch {
    // Non-blocking
  }
}

// 2. Fetch Public Site Config
export async function fetchSiteConfig(): Promise<SiteConfig> {
  const res = await fetch('/api/config/public');
  if (!res.ok) throw new Error('Failed to load configuration');
  return res.json();
}

// 3. User Authentication & Password Reset
export async function registerUser(username: string, email: string, password: string): Promise<{ token: string; user: UserProfile }> {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Registration failed');
  return data;
}

export async function loginUser(email: string, password: string): Promise<{ token: string; user: UserProfile }> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Login failed');
  return data;
}

export async function requestPasswordReset(email: string): Promise<{ success: boolean; message: string; debugCode?: string }> {
  const res = await fetch('/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export async function submitPasswordReset(email: string, code: string, newPassword: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch('/api/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code, newPassword }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Reset failed');
  return data;
}

export async function fetchCurrentUser(): Promise<UserProfile> {
  const token = getAuthToken();
  if (!token) throw new Error('No token found');
  const res = await fetch('/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Session expired');
  return data;
}

// 4. Video Showcase & Personal Creations
export async function fetchShowcaseVideos(): Promise<GeneratedVideo[]> {
  const res = await fetch('/api/videos/showcase');
  if (!res.ok) throw new Error('Failed to load showcase');
  return res.json();
}

export async function fetchMyVideos(): Promise<GeneratedVideo[]> {
  const token = getAuthToken();
  const res = await fetch('/api/videos/my', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to load your videos');
  return res.json();
}

// 5. Generate AI Video (Asynchronous Queue Request)
export async function generateVideo(payload: {
  images: string[];
  prompt: string;
  negativePrompt?: string;
  style: string;
  aspectRatio: string;
  motion: string;
  duration: number;
  isPublic: boolean;
}): Promise<{ success: boolean; orderId: string; status: string; video?: GeneratedVideo; quota?: { generationsToday: number; maxDailyGenerations: number; remaining: number } }> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Please sign in or create an account to start generating videos.');
  }

  const res = await fetch('/api/videos/request', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Video request failed.');
  }
  return data;
}

export async function checkVideoStatus(orderId: string): Promise<GeneratedVideo & { error?: string }> {
  const res = await fetch(`/api/videos/status/${orderId}`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to check order status');
  }
  return data;
}


// 6. Hidden Admin API Endpoints
export async function adminLogin(password: string): Promise<{ token: string; role: string }> {
  const res = await fetch('/api/admin/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Unauthorized');
  return data;
}

export async function fetchAdminStats(): Promise<AdminStats> {
  const res = await fetch('/api/admin/stats', {
    headers: { 'x-admin-token': getAdminToken() },
  });
  if (!res.ok) throw new Error('Unauthorized');
  return res.json();
}

export async function fetchAdminUsers(): Promise<AdminUserView[]> {
  const res = await fetch('/api/admin/users', {
    headers: { 'x-admin-token': getAdminToken() },
  });
  if (!res.ok) throw new Error('Unauthorized');
  return res.json();
}

export async function toggleBanUser(userId: string): Promise<{ success: boolean; isBanned: boolean }> {
  const res = await fetch(`/api/admin/users/${userId}/toggle-ban`, {
    method: 'POST',
    headers: { 'x-admin-token': getAdminToken() },
  });
  return res.json();
}

export async function fetchAdminAuditLogs(): Promise<AuditLog[]> {
  const res = await fetch('/api/admin/audit-logs', {
    headers: { 'x-admin-token': getAdminToken() },
  });
  if (!res.ok) throw new Error('Unauthorized');
  return res.json();
}

export async function fetchAdminSettings(): Promise<{
  config: SiteConfig;
  tokenMasked: string;
  tabletStorage: { dataDir: string; videosDir: string; videoCount: number };
}> {
  const res = await fetch('/api/admin/settings', {
    headers: { 'x-admin-token': getAdminToken() },
  });
  if (!res.ok) throw new Error('Unauthorized');
  return res.json();
}

export async function updateAdminSettings(settings: any): Promise<{ success: boolean; config: SiteConfig }> {
  const res = await fetch('/api/admin/settings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-token': getAdminToken(),
    },
    body: JSON.stringify(settings),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update settings');
  return data;
}
