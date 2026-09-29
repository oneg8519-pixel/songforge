import React, { useState } from 'react';
import {
  X,
  SlidersHorizontal,
  Sparkles,
  Clock,
  Layers,
  Check,
  RotateCcw,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { Track, TrackSection } from '../types';

interface SectionEditorModalProps {
  track: Track;
  initialSection?: TrackSection | null;
  isOpen: boolean;
  onClose: () => void;
  onRegenerate: (sectionId: string, instruction: string) => Promise<void>;
  onSwitchVersion: (versionNumber: number) => void;
  credits: number;
}

const SECTION_IDEAS = [
  'Add heavy distorted electric guitar riffs with punchy 808s',
  'Drop all drums, keep soft acoustic piano and intimate whisper vocals',
  'Introduce a soaring gospel choir with harmonic counter-melodies',
  'Double the tempo feel with four-on-the-floor kick and bright brass stabs',
  'Lush cinematic strings crescendo with timpani rolls',
];

export const SectionEditorModal: React.FC<SectionEditorModalProps> = ({
  track,
  initialSection,
  isOpen,
  onClose,
  onRegenerate,
  onSwitchVersion,
  credits,
}) => {
  if (!isOpen) return null;

  const [selectedSectionId, setSelectedSectionId] = useState<string>(
    initialSection?.id || track.sections?.[0]?.id || 'sec-verse1'
  );
  const [instruction, setInstruction] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'editor' | 'history'>('editor');

  const selectedSection = track.sections?.find(s => s.id === selectedSectionId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instruction.trim()) return;
    if (credits < 1) {
      setError('Insufficient credits to regenerate section. Please top up.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    try {
      await onRegenerate(selectedSectionId, instruction.trim());
      setInstruction('');
      setActiveTab('history');
    } catch (err: any) {
      setError(err.message || 'Failed to regenerate section.');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-700/80 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-violet-600/20 text-violet-400 border border-violet-500/30">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Studio Section Editor</h3>
              <p className="text-xs text-zinc-400">
                Regenerate specific sections while preserving the master track foundation
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

        {/* Tab switcher: Edit Section vs Version History */}
        <div className="flex border-b border-zinc-800 bg-zinc-950/60 px-5 pt-2">
          <button
            onClick={() => setActiveTab('editor')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'editor'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Regenerate Section
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'border-violet-400 text-violet-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Version History ({track.versions?.length || 1})</span>
          </button>
        </div>

        {/* Tab 1: Section Editor */}
        {activeTab === 'editor' && (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Select which section to modify */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block mb-2">
                Select Section to Regenerate
              </label>
              <div className="grid grid-cols-3 gap-2">
                {track.sections?.map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedSectionId(s.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      selectedSectionId === s.id
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold shadow-md'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                    }`}
                  >
                    <div className="text-xs font-bold truncate">{s.name}</div>
                    <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                      {formatTime(s.startTime)} - {formatTime(s.endTime)}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Instruction input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Variation Instruction for {selectedSection?.name || 'Section'}
                </label>
                <span className="text-[10px] text-zinc-400">What should change in this section?</span>
              </div>
              <textarea
                value={instruction}
                onChange={e => setInstruction(e.target.value)}
                rows={3}
                placeholder="e.g. Make the chorus explode with double-kick drums, heavy stereo synths, and euphoric vocal belts..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder-zinc-600 text-xs focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 resize-none"
                required
              />

              {/* Idea chips */}
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="text-[10px] text-zinc-400 font-medium self-center">Ideas:</span>
                {SECTION_IDEAS.map((idea, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setInstruction(idea)}
                    className="text-[10px] px-2 py-0.5 rounded bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition-colors"
                  >
                    {idea.slice(0, 32)}...
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Bar */}
            <div className="pt-2 flex items-center justify-between">
              <div className="text-xs text-zinc-400">
                Cost: <span className="text-amber-400 font-bold font-mono">1 Credit</span> • Saves as a new version
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing || !instruction.trim()}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold text-xs shadow-md shadow-amber-500/20 flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 fill-black" />
                  <span>{isProcessing ? 'Synthesizing...' : `Regenerate ${selectedSection?.name || 'Section'}`}</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Tab 2: Version History & Comparison */}
        {activeTab === 'history' && (
          <div className="p-5 space-y-3 max-h-96 overflow-y-auto">
            <p className="text-xs text-zinc-400">
              SongForge keeps complete audio snapshots of every section variation. You can switch back or compare versions anytime.
            </p>

            <div className="space-y-2">
              {track.versions?.map(v => {
                const isCurrent = v.versionNumber === track.currentVersion;

                return (
                  <div
                    key={v.id}
                    className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                      isCurrent
                        ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                        : 'bg-zinc-950/70 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">Version {v.versionNumber}</span>
                        {isCurrent && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold uppercase tracking-wider">
                            Active Player
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400">{v.note}</p>
                      <div className="text-[10px] text-zinc-400 font-mono">
                        {new Date(v.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {formatTime(v.duration)}
                      </div>
                    </div>

                    {!isCurrent && (
                      <button
                        onClick={() => onSwitchVersion(v.versionNumber)}
                        className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 flex items-center gap-1 transition-colors"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Restore</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
