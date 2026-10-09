import React, { useState } from 'react';
import { X, Lock, Mail, User, Sparkles, CheckCircle2, KeyRound, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useThemeConfig } from '../context/ThemeConfigContext';
import { requestPasswordReset, submitPasswordReset } from '../lib/api';
import { BrandLogo } from './BrandLogo';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, authModalMode, closeAuthModal, signIn, signUp } = useAuth();
  const { mode, accentClass } = useThemeConfig();
  
  const [view, setView] = useState<'signin' | 'signup' | 'forgot' | 'reset'>(authModalMode);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Password Reset Specific
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [successInfo, setSuccessInfo] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    setView(authModalMode);
    setError(null);
    setSuccessInfo(null);
  }, [authModalMode, isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const isLight = mode === 'light';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessInfo(null);
    setIsSubmitting(true);

    try {
      if (view === 'signin') {
        await signIn(email, password);
      } else if (view === 'signup') {
        if (!username.trim()) {
          setError('Please provide a display name.');
          setIsSubmitting(false);
          return;
        }
        await signUp(username, email, password);
      } else if (view === 'forgot') {
        const res = await requestPasswordReset(email);
        setSuccessInfo(res.message);
        if (res.debugCode) {
          setSuccessInfo(`Reset Code: ${res.debugCode}. Enter it below with your new password.`);
        }
        setView('reset');
      } else if (view === 'reset') {
        const res = await submitPasswordReset(email, resetCode, newPassword);
        setSuccessInfo(res.message);
        setTimeout(() => {
          setView('signin');
        }, 1800);
      }
    } catch (err: any) {
      setError(err.message || 'Operation failed. Please check details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className={`relative w-full max-w-md rounded-2xl border p-5 sm:p-7 shadow-2xl transition-all my-auto ${
        isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#090d16] border-slate-800 text-white'
      }`}>
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          aria-label="Close modal"
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Kicker with custom BrandLogo */}
        <div className="text-center mb-5">
          <div className="flex justify-center mb-2">
            <BrandLogo size={44} />
          </div>
          <h3 className="text-lg sm:text-xl font-black tracking-tight text-slate-950 dark:text-white">
            {view === 'signin' && 'Sign In to Your Studio'}
            {view === 'signup' && 'Create Your Creator Account'}
            {view === 'forgot' && 'Reset Account Password'}
            {view === 'reset' && 'Set New Password'}
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            {view === 'signup' && 'Get 4 free daily AI video renders with zero watermarks.'}
            {view === 'signin' && 'Access your daily generations and personal video queue.'}
            {view === 'forgot' && 'Enter your email to receive a password reset code.'}
            {view === 'reset' && 'Enter the reset code sent to your email.'}
          </p>
        </div>

        {/* Tab Switcher (Visible in signin / signup) */}
        {(view === 'signin' || view === 'signup') && (
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-slate-850 rounded-xl mb-5">
            <button
              type="button"
              onClick={() => { setView('signin'); setError(null); }}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                view === 'signin'
                  ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setView('signup'); setError(null); }}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                view === 'signup'
                  ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Notification alerts */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 text-xs">
            {error}
          </div>
        )}
        {successInfo && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs">
            {successInfo}
          </div>
        )}

        {/* Form Fields */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {view === 'signup' && (
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Display Name / Creator Alias
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. CinemaMaker"
                  className={`w-full pl-9 pr-3 py-2.5 rounded-lg border text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                    isLight 
                      ? 'bg-slate-50 border-slate-300 text-slate-900' 
                      : 'bg-slate-950 border-slate-800 text-white'
                  }`}
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="creator@example.com"
                className={`w-full pl-9 pr-3 py-2.5 rounded-lg border text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                  isLight 
                    ? 'bg-slate-50 border-slate-300 text-slate-900' 
                    : 'bg-slate-950 border-slate-800 text-white'
                }`}
              />
            </div>
          </div>

          {(view === 'signin' || view === 'signup') && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Password
                </label>
                {view === 'signin' && (
                  <button
                    type="button"
                    onClick={() => { setView('forgot'); setError(null); }}
                    className="text-[11px] font-semibold text-cyan-500 hover:underline"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full pl-9 pr-3 py-2.5 rounded-lg border text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                    isLight 
                      ? 'bg-slate-50 border-slate-300 text-slate-900' 
                      : 'bg-slate-950 border-slate-800 text-white'
                  }`}
                />
              </div>
            </div>
          )}

          {view === 'reset' && (
            <>
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  6-Digit Reset Code
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    placeholder="123456"
                    className={`w-full pl-9 pr-3 py-2.5 rounded-lg border text-xs font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                      isLight 
                        ? 'bg-slate-50 border-slate-300 text-slate-900' 
                        : 'bg-slate-950 border-slate-800 text-white'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full pl-9 pr-3 py-2.5 rounded-lg border text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                      isLight 
                        ? 'bg-slate-50 border-slate-300 text-slate-900' 
                        : 'bg-slate-950 border-slate-800 text-white'
                    }`}
                  />
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all mt-2 ${
              isSubmitting 
                ? 'opacity-60 bg-slate-700 text-slate-400' 
                : `${accentClass.bg} text-slate-950 hover:brightness-110 shadow-md`
            }`}
          >
            {isSubmitting
              ? 'Processing...'
              : view === 'signin'
                ? 'Sign In to Studio'
                : view === 'signup'
                  ? 'Create Free Account'
                  : view === 'forgot'
                    ? 'Send Reset Code'
                    : 'Confirm New Password'}
          </button>
        </form>

        {(view === 'forgot' || view === 'reset') && (
          <button
            type="button"
            onClick={() => { setView('signin'); setError(null); }}
            className="w-full text-center mt-3 text-xs text-slate-400 hover:text-white flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Sign In</span>
          </button>
        )}

        {/* Feature bullets */}
        {view === 'signup' && (
          <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Welcome onboarding email sent directly to your address</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
              <span>4 free daily high-definition AI video generations</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-purple-500 shrink-0" />
              <span>100% clean, watermark-free MP4 exports</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
