import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { ThemeConfigProvider, useThemeConfig } from './context/ThemeConfigContext';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { VideoStudio } from './components/VideoStudio';
import { ShowcaseGallery } from './components/ShowcaseGallery';
import { FeaturesSection } from './components/FeaturesSection';
import { FAQSection } from './components/FAQSection';
import { Footer } from './components/Footer';
import { AuthModal } from './components/AuthModal';
import { AdminConsole } from './components/AdminConsole';
import { NotificationsModal } from './components/NotificationsModal';
import { AdBanner } from './components/AdBanner';
import { GeneratedVideo } from './types';

function MainApp() {
  const { mode } = useThemeConfig();
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [studioPrompt, setStudioPrompt] = useState('');
  const [newlyCreatedVideo, setNewlyCreatedVideo] = useState<GeneratedVideo | null>(null);

  // Navigate smoothly to page sections
  const handleNavigateSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleRemixPrompt = (promptText: string, _style: string) => {
    setStudioPrompt(promptText);
    handleNavigateSection('studio');
  };

  // Secret URL-only trigger for Admin Console:
  // Strictly requires secret hash "#admin-console-secret" or query "?admin_key=master_access_2026"
  useEffect(() => {
    const checkSecretAdminRoute = () => {
      const isSecretHash = window.location.hash === '#admin-console-secret';
      const isSecretQuery = new URLSearchParams(window.location.search).get('admin_key') === 'master_access_2026';
      if (isSecretHash || isSecretQuery) {
        setIsAdminOpen(true);
      }
    };

    checkSecretAdminRoute();
    window.addEventListener('hashchange', checkSecretAdminRoute);
    return () => window.removeEventListener('hashchange', checkSecretAdminRoute);
  }, []);

  return (
    <div className={`min-h-screen w-full flex flex-col overflow-x-hidden transition-colors duration-200 ${
      mode === 'light' ? 'bg-slate-50 text-slate-900' : 'bg-[#030712] text-slate-100'
    }`}>
      {/* Navigation Bar (ZERO admin links visible) */}
      <Navbar
        onNavigateSection={handleNavigateSection}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
      />

      {/* Top Leaderboard Ad */}
      <AdBanner type="leaderboard" />

      {/* Main Page Flow */}
      <main className="flex-1 w-full overflow-x-hidden">
        {/* 1. Hero Section */}
        <Hero onStartCreating={() => handleNavigateSection('studio')} />

        {/* 2. Interactive Video Studio (Multi-Photo + Prompt + Controls) */}
        <VideoStudio
          initialPrompt={studioPrompt}
          onVideoCreated={(video) => setNewlyCreatedVideo(video)}
        />

        {/* 3. Community Showcase Gallery (Starts clean from 0) */}
        <ShowcaseGallery
          onRemixPrompt={handleRemixPrompt}
          newlyCreatedVideo={newlyCreatedVideo}
        />

        {/* 4. Neural Engine Features & Quality Architecture */}
        <FeaturesSection />

        {/* 5. Frequently Asked Questions */}
        <FAQSection />
      </main>

      {/* Footer (ZERO admin links visible) */}
      <Footer onNavigateSection={handleNavigateSection} />

      {/* Authentication & Reset Password Modal */}
      <AuthModal />

      {/* User Onboarding & Inbox Notification Modal */}
      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />

      {/* Secret Admin Console (Opened ONLY via secret URL) */}
      <AdminConsole
        isOpen={isAdminOpen}
        onClose={() => {
          setIsAdminOpen(false);
          // Clear hash for secrecy
          if (window.location.hash === '#admin-console-secret') {
            history.replaceState(null, '', window.location.pathname + window.location.search);
          }
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeConfigProvider>
        <MainApp />
      </ThemeConfigProvider>
    </AuthProvider>
  );
}
