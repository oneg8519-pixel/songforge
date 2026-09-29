/**
 * SongForge - AI Music Studio
 * Powered by Google Gemini Lyria 3.5
 */

import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { PromptStudio } from './components/PromptStudio';
import { AudioPlayer } from './components/AudioPlayer';
import { SyncedLyrics } from './components/SyncedLyrics';
import { SectionEditorModal } from './components/SectionEditorModal';
import { LibraryView } from './components/LibraryView';
import { ShareModal } from './components/ShareModal';
import { SettingsModal } from './components/SettingsModal';
import { LoginModal } from './components/LoginModal';
import { GeneratingState } from './components/GeneratingState';
import {
  Track,
  TrackSection,
  UserAccount,
  GenerationRequest,
} from './types';
import { AlertCircle, CheckCircle2, Music2, Sparkles, X, Menu } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'create' | 'library' | 'settings'>('create');
  const [user, setUser] = useState<UserAccount | null>(null);
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [activeTrack, setActiveTrack] = useState<Track | null>(null);

  // Audio Playback state
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Generation state
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [progressStep, setProgressStep] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [generatingGenre, setGeneratingGenre] = useState<string>('Synthwave');
  const [generatingMood, setGeneratingMood] = useState<string>('Euphoric');

  // Modals
  const [editingSection, setEditingSection] = useState<TrackSection | null>(null);
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [sharingTrack, setSharingTrack] = useState<Track | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Toast notifications
  const [toast, setToast] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  const showToast = (message: string, type: 'error' | 'success' = 'success') => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4500);
  };

  // Load initial user & tracks
  useEffect(() => {
    fetchProfile();
    fetchTracks();
  }, []);

  // Handle URL share hash (#share=<trackId>)
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#share=')) {
        const trackId = hash.replace('#share=', '');
        fetch(`/api/tracks/${trackId}`)
          .then(res => res.json())
          .then(data => {
            if (data.track) {
              setActiveTrack(data.track);
              setCurrentTab('create');
              showToast(`Loaded shared track: "${data.track.title}"`, 'success');
            }
          })
          .catch(err => console.error('Share hash load error:', err));
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Keyboard shortcut listener (Space = play/pause, Ctrl+N = Create)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }
      if (e.code === 'Space' && activeTrack) {
        e.preventDefault();
        setIsPlaying(prev => !prev);
      }
      if (e.ctrlKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setCurrentTab('create');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTrack]);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/me');
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        setHasApiKey(Boolean(data.hasApiKey));
      }
    } catch (e) {
      console.error('Failed to fetch user profile:', e);
    }
  };

  const fetchTracks = async () => {
    try {
      const res = await fetch('/api/tracks');
      const data = await res.json();
      if (data.tracks && Array.isArray(data.tracks)) {
        setTracks(data.tracks);
        // Set first track as active if none set
        if (!activeTrack && data.tracks.length > 0) {
          setActiveTrack(data.tracks[0]);
        }
      }
    } catch (e) {
      console.error('Failed to fetch tracks:', e);
    }
  };

  // Generate Song handler
  const handleGenerate = async (req: GenerationRequest) => {
    setIsGenerating(true);
    setProgressPercent(10);
    setProgressStep('Verifying safety guidelines and vocal identity rights...');
    setGeneratingGenre(req.genre);
    setGeneratingMood(req.mood);

    // Simulated progress steps for engaging feedback
    const progressTimer = setInterval(() => {
      setProgressPercent(prev => {
        if (prev < 30) {
          setProgressStep('Drafting lyrical cadence and melodic arrangements...');
          return prev + 6;
        } else if (prev < 70) {
          setProgressStep('Calling Lyria 3.5 multi-stem neural synthesizer...');
          return prev + 5;
        } else if (prev < 90) {
          setProgressStep('Mastering stereo mix and generating waveform...');
          return prev + 3;
        }
        return prev;
      });
    }, 450);

    try {
      const res = await fetch('/api/tracks/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      });

      const data = await res.json();
      clearInterval(progressTimer);

      if (!res.ok) {
        showToast(data.error || 'Failed to generate track', 'error');
        return;
      }

      setProgressPercent(100);
      setProgressStep('Complete! Loading studio player...');

      setTimeout(() => {
        if (data.track) {
          setActiveTrack(data.track);
          setTracks(prev => [data.track, ...prev.filter(t => t.id !== data.track.id)]);
          if (data.user) setUser(data.user);
          setIsPlaying(true);
          showToast(`Mastered "${data.track.title}" successfully!`, 'success');
        }
        setIsGenerating(false);
      }, 600);
    } catch (err: any) {
      clearInterval(progressTimer);
      setIsGenerating(false);
      showToast(err.message || 'Network error during track generation', 'error');
    }
  };

  // Regenerate section handler
  const handleRegenerateSection = async (sectionId: string, instruction: string) => {
    if (!activeTrack) return;

    try {
      const res = await fetch(`/api/tracks/${activeTrack.id}/regenerate-section`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectionId, instruction }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to regenerate section');
      }

      setActiveTrack(data.track);
      setTracks(prev => prev.map(t => (t.id === data.track.id ? data.track : t)));
      if (data.user) setUser(data.user);
      setIsPlaying(true);
      showToast(`Regenerated section saved as Version ${data.track.currentVersion}!`, 'success');
    } catch (err: any) {
      throw err;
    }
  };

  // Switch track version
  const handleSwitchVersion = async (trackId: string, versionNumber: number) => {
    try {
      const res = await fetch(`/api/tracks/${trackId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ switchVersion: versionNumber }),
      });
      const data = await res.json();
      if (data.track) {
        setActiveTrack(data.track);
        setTracks(prev => prev.map(t => (t.id === data.track.id ? data.track : t)));
        setIsPlaying(true);
        showToast(`Switched to Version ${versionNumber}`, 'success');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle favorite
  const handleToggleFavorite = async (trackId: string) => {
    const target = tracks.find(t => t.id === trackId);
    if (!target) return;
    const nextVal = !target.isFavorite;

    // Optimistic update
    setTracks(prev => prev.map(t => (t.id === trackId ? { ...t, isFavorite: nextVal } : t)));
    if (activeTrack?.id === trackId) {
      setActiveTrack(prev => (prev ? { ...prev, isFavorite: nextVal } : null));
    }

    try {
      await fetch(`/api/tracks/${trackId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFavorite: nextVal }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Rename track
  const handleRenameTrack = async (trackId: string, newTitle: string) => {
    try {
      const res = await fetch(`/api/tracks/${trackId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle }),
      });
      const data = await res.json();
      if (data.track) {
        setTracks(prev => prev.map(t => (t.id === trackId ? data.track : t)));
        if (activeTrack?.id === trackId) setActiveTrack(data.track);
        showToast('Track renamed successfully');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete track
  const handleDeleteTrack = async (trackId: string) => {
    if (!confirm('Are you sure you want to delete this track? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch(`/api/tracks/${trackId}`, { method: 'DELETE' });
      if (res.ok) {
        setTracks(prev => prev.filter(t => t.id !== trackId));
        if (activeTrack?.id === trackId) {
          const remaining = tracks.filter(t => t.id !== trackId);
          setActiveTrack(remaining[0] || null);
        }
        showToast('Track deleted from library');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Upgrade or add credits
  const handleUpgradeTier = async (tier: 'free' | 'pro' | 'studio', creditsToAdd?: number) => {
    try {
      const res = await fetch('/api/users/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier, creditsToAdd }),
      });
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        showToast('Credits and plan updated successfully!', 'success');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Login / Switch account
  const handleLogin = async (email: string, name?: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      });
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        fetchTracks();
        showToast(`Welcome back, ${data.user.name}!`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 overflow-hidden select-none">
      {/* Toast Notification Banner */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs font-semibold animate-in slide-in-from-top-4 duration-200 border ${
            toast.type === 'error'
              ? 'bg-rose-950/95 text-rose-200 border-rose-500/40 shadow-rose-950/50'
              : 'bg-emerald-950/95 text-emerald-200 border-emerald-500/40 shadow-emerald-950/50'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 opacity-70 hover:opacity-100">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar
          currentTab={currentTab}
          setCurrentTab={tab => {
            if (tab === 'settings') setIsSettingsOpen(true);
            else setCurrentTab(tab);
          }}
          user={user}
          onOpenUpgrade={() => setIsSettingsOpen(true)}
          onOpenLogin={() => setIsLoginOpen(true)}
          hasApiKey={hasApiKey}
        />
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-50 w-64">
            <Sidebar
              currentTab={currentTab}
              setCurrentTab={tab => {
                if (tab === 'settings') setIsSettingsOpen(true);
                else setCurrentTab(tab);
                setMobileMenuOpen(false);
              }}
              user={user}
              onOpenUpgrade={() => {
                setIsSettingsOpen(true);
                setMobileMenuOpen(false);
              }}
              onOpenLogin={() => {
                setIsLoginOpen(true);
                setMobileMenuOpen(false);
              }}
              hasApiKey={hasApiKey}
            />
          </div>
        </div>
      )}

      {/* Main Studio Viewport */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-zinc-950 relative">
        {/* Mobile Header Bar */}
        <div className="md:hidden flex items-center justify-between p-3.5 bg-zinc-950 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="font-bold text-sm tracking-tight text-white">SongForge</span>
            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Lyria
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono text-amber-400 font-bold"
            >
              {user?.tier === 'studio' ? '∞' : user?.credits ?? 5} Cr
            </button>
          </div>
        </div>

        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {/* TAB 1: CREATE (Prompt Studio + Generating State + Player & Synced Lyrics) */}
          {currentTab === 'create' && (
            <div className="space-y-6">
              {/* Prompt to Song / Image to Song Studio Panel */}
              <PromptStudio
                onGenerate={handleGenerate}
                isGenerating={isGenerating}
                credits={user?.tier === 'studio' ? 999 : user?.credits ?? 5}
                onOpenUpgrade={() => setIsSettingsOpen(true)}
              />

              {/* Generating Loader */}
              {isGenerating && (
                <GeneratingState
                  progressStep={progressStep}
                  progressPercent={progressPercent}
                  genre={generatingGenre}
                  mood={generatingMood}
                />
              )}

              {/* Master Audio Player & Synced Lyrics */}
              {activeTrack && !isGenerating && (
                <div className="space-y-6">
                  {/* Waveform Player */}
                  <AudioPlayer
                    track={activeTrack}
                    currentTime={currentTime}
                    setCurrentTime={setCurrentTime}
                    isPlaying={isPlaying}
                    setIsPlaying={setIsPlaying}
                    onEditSection={sec => {
                      setEditingSection(sec);
                      setIsSectionModalOpen(true);
                    }}
                    onShare={trk => setSharingTrack(trk)}
                    onToggleFavorite={handleToggleFavorite}
                    onSwitchVersion={handleSwitchVersion}
                  />

                  {/* Synced Lyrics Karaoke */}
                  <SyncedLyrics
                    track={activeTrack}
                    currentTime={currentTime}
                    onSeek={time => {
                      setCurrentTime(time);
                      const el = document.querySelector('audio');
                      if (el) el.currentTime = time;
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {/* TAB 2: LIBRARY (Track Catalog & Version Management) */}
          {currentTab === 'library' && (
            <LibraryView
              tracks={tracks}
              currentTrackId={activeTrack?.id}
              onPlayTrack={trk => {
                setActiveTrack(trk);
                setCurrentTab('create');
                setIsPlaying(true);
              }}
              onToggleFavorite={handleToggleFavorite}
              onRenameTrack={handleRenameTrack}
              onDeleteTrack={handleDeleteTrack}
              onShareTrack={trk => setSharingTrack(trk)}
              onGoToCreate={() => setCurrentTab('create')}
            />
          )}
        </div>
      </main>

      {/* Section Regenerate Modal */}
      {activeTrack && (
        <SectionEditorModal
          track={activeTrack}
          initialSection={editingSection}
          isOpen={isSectionModalOpen}
          onClose={() => {
            setIsSectionModalOpen(false);
            setEditingSection(null);
          }}
          onRegenerate={async (sectionId, instruction) => {
            await handleRegenerateSection(sectionId, instruction);
          }}
          onSwitchVersion={ver => handleSwitchVersion(activeTrack.id, ver)}
          credits={user?.tier === 'studio' ? 999 : user?.credits ?? 5}
        />
      )}

      {/* Share Modal */}
      <ShareModal
        track={sharingTrack}
        isOpen={Boolean(sharingTrack)}
        onClose={() => setSharingTrack(null)}
      />

      {/* Studio Settings & Plans Modal */}
      <SettingsModal
        user={user}
        hasApiKey={hasApiKey}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onUpgradeTier={handleUpgradeTier}
      />

      {/* Account / Login Modal */}
      <LoginModal
        currentUser={user}
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLogin={handleLogin}
      />
    </div>
  );
}
