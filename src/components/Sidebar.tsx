import React from 'react';
import {
  Disc3,
  Music4,
  Library,
  Settings,
  Sparkles,
  Zap,
  ShieldCheck,
  Plus,
  Coins,
  Radio,
  User,
} from 'lucide-react';
import { UserAccount } from '../types';

interface SidebarProps {
  currentTab: 'create' | 'library' | 'settings';
  setCurrentTab: (tab: 'create' | 'library' | 'settings') => void;
  user: UserAccount | null;
  onOpenUpgrade: () => void;
  onOpenLogin: () => void;
  hasApiKey: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  user,
  onOpenUpgrade,
  onOpenLogin,
  hasApiKey,
}) => {
  return (
    <aside className="w-64 bg-zinc-950 border-r border-zinc-800/80 flex flex-col justify-between h-full shrink-0 select-none z-20">
      {/* Brand Header */}
      <div className="p-4 border-b border-zinc-800/80">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-600 to-violet-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Disc3 className="w-6 h-6 text-white animate-spin [animation-duration:8s]" />
            <div className="absolute inset-0 rounded-xl border border-white/20" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-lg font-bold tracking-tight text-white">SongForge</h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                Lyria
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-medium">AI Music Production Studio</p>
          </div>
        </div>

        {/* Engine status pill */}
        <div className="mt-3 px-2.5 py-1.5 rounded-lg bg-zinc-900/90 border border-zinc-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${hasApiKey ? 'bg-emerald-400 shadow-sm shadow-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
            <span className="text-zinc-300 font-medium">
              {hasApiKey ? 'Lyria 3.5 Engine' : 'Mock Studio Mode'}
            </span>
          </div>
          <span className="text-[11px] text-zinc-400 font-mono">v3.5</span>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="px-3 py-4 flex-1 space-y-1">
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
          Studio Tools
        </div>

        <button
          onClick={() => setCurrentTab('create')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
            currentTab === 'create'
              ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/10 text-amber-300 border border-amber-500/30 font-semibold'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
          }`}
        >
          <Sparkles className={`w-4 h-4 ${currentTab === 'create' ? 'text-amber-400' : 'text-zinc-400'}`} />
          <span>Forge Track</span>
          <span className="ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
            Ctrl+N
          </span>
        </button>

        <button
          onClick={() => setCurrentTab('library')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
            currentTab === 'library'
              ? 'bg-gradient-to-r from-violet-500/20 to-indigo-500/10 text-violet-300 border border-violet-500/30 font-semibold'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
          }`}
        >
          <Library className={`w-4 h-4 ${currentTab === 'library' ? 'text-violet-400' : 'text-zinc-400'}`} />
          <span>My Library</span>
        </button>

        <button
          onClick={() => setCurrentTab('settings')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
            currentTab === 'settings'
              ? 'bg-gradient-to-r from-zinc-800 to-zinc-800/80 text-white border border-zinc-700 font-semibold'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
          }`}
        >
          <Settings className={`w-4 h-4 ${currentTab === 'settings' ? 'text-white' : 'text-zinc-400'}`} />
          <span>Studio Settings</span>
        </button>
      </div>

      {/* Credits Card & Account Info */}
      <div className="p-3 border-t border-zinc-800/80 space-y-3 bg-zinc-950/60">
        {/* Credits banner */}
        <div className="p-3 rounded-xl bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Credits Remaining</span>
            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-zinc-800 text-amber-400">
              {user?.tier || 'Free'} Tier
            </span>
          </div>

          <div className="mt-2 flex items-baseline justify-between">
            <div className="flex items-center gap-1.5">
              <Coins className="w-5 h-5 text-amber-400" />
              <span className="text-2xl font-black text-white font-mono">
                {user?.tier === 'studio' ? '∞' : user?.credits ?? 5}
              </span>
            </div>
            <button
              onClick={onOpenUpgrade}
              className="text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1 py-1 px-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20"
            >
              <Zap className="w-3 h-3" />
              Top Up
            </button>
          </div>
        </div>

        {/* User Account / Profile */}
        <div
          onClick={onOpenLogin}
          className="flex items-center gap-3 p-2 rounded-xl hover:bg-zinc-900/80 cursor-pointer transition-colors border border-transparent hover:border-zinc-800"
          title="Click to switch account"
        >
          <img
            src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
            alt="User avatar"
            className="w-8 h-8 rounded-full border border-zinc-700 object-cover"
          />
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-zinc-200 truncate">{user?.name || 'Producer'}</div>
            <div className="text-[11px] text-zinc-400 truncate">{user?.email || 'user@songforge.studio'}</div>
          </div>
          <User className="w-3.5 h-3.5 text-zinc-400" />
        </div>
      </div>
    </aside>
  );
};
