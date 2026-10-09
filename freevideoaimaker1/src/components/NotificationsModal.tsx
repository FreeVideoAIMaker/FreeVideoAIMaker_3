import React from 'react';
import { X, Bell, Sparkles, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useThemeConfig } from '../context/ThemeConfigContext';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { mode } = useThemeConfig();

  if (!isOpen || !user) return null;

  const isLight = mode === 'light';
  const notifications = user.notifications || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm">
      <div className={`relative w-full max-w-lg rounded-2xl border p-5 sm:p-6 shadow-2xl transition-all ${
        isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
      }`}>
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-cyan-500" />
            <h3 className="text-base font-bold text-slate-950 dark:text-white">
              Creator Inbox & Onboarding
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {notifications.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            No notifications at this time.
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`p-4 rounded-xl border text-xs ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    {n.type === 'welcome' && <Sparkles className="w-3.5 h-3.5 text-cyan-500" />}
                    {n.type === 'system' && <Info className="w-3.5 h-3.5 text-purple-500" />}
                    <span>{n.title}</span>
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {n.createdAt.slice(0, 10)}
                  </span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  {n.message}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
