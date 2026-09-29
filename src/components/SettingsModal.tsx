import React, { useState } from 'react';
import {
  X,
  Settings,
  ShieldCheck,
  Zap,
  Coins,
  Check,
  Sparkles,
  Cpu,
  Lock,
  Music4,
  AlertTriangle,
} from 'lucide-react';
import { UserAccount } from '../types';

interface SettingsModalProps {
  user: UserAccount | null;
  hasApiKey: boolean;
  isOpen: boolean;
  onClose: () => void;
  onUpgradeTier: (tier: 'free' | 'pro' | 'studio', creditsToAdd?: number) => Promise<void>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  user,
  hasApiKey,
  isOpen,
  onClose,
  onUpgradeTier,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'plans' | 'engine' | 'safety'>('plans');
  const [isUpgrading, setIsUpgrading] = useState(false);

  const handleSelectTier = async (tier: 'free' | 'pro' | 'studio') => {
    setIsUpgrading(true);
    try {
      await onUpgradeTier(tier);
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleAddCredits = async (amount: number) => {
    setIsUpgrading(true);
    try {
      await onUpgradeTier(user?.tier || 'free', amount);
    } finally {
      setIsUpgrading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-700/80 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-zinc-800 text-white border border-zinc-700">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Studio Settings & Tiers</h3>
              <p className="text-xs text-zinc-400">
                Manage your subscription, Lyria audio engine, and safety policies
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-zinc-800 bg-zinc-950/60 px-5 pt-2">
          <button
            onClick={() => setActiveTab('plans')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'plans'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Credits & Plans</span>
          </button>
          <button
            onClick={() => setActiveTab('engine')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'engine'
                ? 'border-violet-400 text-violet-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Lyria Engine Status</span>
          </button>
          <button
            onClick={() => setActiveTab('safety')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'safety'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Safety & Voice Protection</span>
          </button>
        </div>

        {/* Tab 1: Plans & Credits */}
        {activeTab === 'plans' && (
          <div className="p-5 space-y-5">
            {/* Quick Credit Top-Up Bar */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Quick Credit Boost
                </div>
                <div className="text-sm font-semibold text-white mt-0.5">
                  Current Balance: <span className="font-mono text-amber-300 text-base">{user?.tier === 'studio' ? 'Unlimited' : user?.credits ?? 5} Credits</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleAddCredits(10)}
                  disabled={isUpgrading}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-colors"
                >
                  +10 Credits
                </button>
                <button
                  onClick={() => handleAddCredits(50)}
                  disabled={isUpgrading}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-colors shadow-sm"
                >
                  +50 Credits
                </button>
              </div>
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Free Tier */}
              <div
                className={`p-4 rounded-xl border flex flex-col justify-between ${
                  user?.tier === 'free'
                    ? 'bg-zinc-900 border-amber-500/50 ring-1 ring-amber-500/20'
                    : 'bg-zinc-950/60 border-zinc-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-300">Free Tier</span>
                    {user?.tier === 'free' && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                        Current
                      </span>
                    )}
                  </div>
                  <div className="text-xl font-black text-white mt-2">$0</div>
                  <ul className="text-xs text-zinc-400 space-y-1.5 mt-3">
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      5 Initial Credits
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      WAV / MP3 Downloads
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      Section Editing
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => handleSelectTier('free')}
                  disabled={user?.tier === 'free'}
                  className="mt-4 w-full py-1.5 rounded-lg bg-zinc-800 text-xs font-semibold text-zinc-300 disabled:opacity-40"
                >
                  {user?.tier === 'free' ? 'Active' : 'Downgrade'}
                </button>
              </div>

              {/* Pro Tier */}
              <div
                className={`p-4 rounded-xl border flex flex-col justify-between ${
                  user?.tier === 'pro'
                    ? 'bg-zinc-900 border-amber-500/50 ring-1 ring-amber-500/20'
                    : 'bg-zinc-950/60 border-zinc-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400">Pro Creator</span>
                    {user?.tier === 'pro' && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                        Current
                      </span>
                    )}
                  </div>
                  <div className="text-xl font-black text-white mt-2">
                    $19 <span className="text-xs font-normal text-zinc-400">/mo</span>
                  </div>
                  <ul className="text-xs text-zinc-400 space-y-1.5 mt-3">
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      50 Credits / month
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      Image-to-Song Multi-image
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      Priority Queue
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => handleSelectTier('pro')}
                  disabled={user?.tier === 'pro' || isUpgrading}
                  className="mt-4 w-full py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold shadow-md shadow-amber-500/20 disabled:opacity-40 cursor-pointer"
                >
                  {user?.tier === 'pro' ? 'Active' : 'Upgrade to Pro'}
                </button>
              </div>

              {/* Studio Tier */}
              <div
                className={`p-4 rounded-xl border flex flex-col justify-between ${
                  user?.tier === 'studio'
                    ? 'bg-zinc-900 border-violet-500/50 ring-1 ring-violet-500/20'
                    : 'bg-zinc-950/60 border-zinc-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-violet-400">Studio Master</span>
                    {user?.tier === 'studio' && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300">
                        Current
                      </span>
                    )}
                  </div>
                  <div className="text-xl font-black text-white mt-2">
                    $49 <span className="text-xs font-normal text-zinc-400">/mo</span>
                  </div>
                  <ul className="text-xs text-zinc-400 space-y-1.5 mt-3">
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                      Unlimited Generations
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                      Full Stems Separation
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                      Commercial License
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => handleSelectTier('studio')}
                  disabled={user?.tier === 'studio' || isUpgrading}
                  className="mt-4 w-full py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-md shadow-violet-600/20 disabled:opacity-40 cursor-pointer"
                >
                  {user?.tier === 'studio' ? 'Active' : 'Upgrade to Studio'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Lyria Engine Status */}
        {activeTab === 'engine' && (
          <div className="p-5 space-y-4">
            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-300">Active Audio Engine</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  hasApiKey ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}>
                  {hasApiKey ? 'Google Gemini Lyria 3.5' : 'SongForge Procedural Audio Synth (Mock Mode)'}
                </span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {hasApiKey
                  ? 'Your GEMINI_API_KEY environment variable is configured. Requests stream directly through the server-side Lyria models (lyria-3-pro-preview / lyria-3-clip-preview).'
                  : 'Running in developer Mock Mode. The studio generates rich, real, multi-track synthesised WAV audio with genuine rhythm, harmony, and bass lines matching your requested BPM and genre.'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
              <h4 className="text-xs font-bold text-zinc-200">Single Provider Architecture</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Model calls are strictly contained in <code className="text-amber-400 font-mono">server/services/musicGenerator.ts</code>. The client never touches API keys or model endpoints directly, adhering to zero-exposure guidelines.
              </p>
            </div>
          </div>
        )}

        {/* Tab 3: Safety & Voice Protection */}
        {activeTab === 'safety' && (
          <div className="p-5 space-y-4">
            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" />
                <span>Voice Identity Protection</span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                SongForge automatically blocks prompts requesting vocal cloning or exact timbre imitation of specific living or legacy recording artists (e.g., Drake, Taylor Swift, Eminem). Creators are encouraged to describe acoustic qualities (e.g. "airy falsetto", "warm baritone", "80s arena rock belt") instead.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                <Lock className="w-4 h-4" />
                <span>Copyright Lyrics Moderation</span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Custom lyric submissions are checked against known copyrighted songs. The engine exclusively synthesizes original poetry or user-authored lyrics.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
              <div className="flex items-center gap-2 text-violet-400 font-bold text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>AI Attribution & Watermarking</span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                All generated tracks include synthetic origin metadata and are explicitly labeled as AI-generated in the studio player and download headers.
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 bg-zinc-950/60 border-t border-zinc-800 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
