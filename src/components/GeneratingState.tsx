import React, { useEffect, useState } from 'react';
import { Disc3, Sparkles, Wand2, ShieldCheck, Music2, Cpu } from 'lucide-react';

interface GeneratingStateProps {
  progressStep: string;
  progressPercent: number;
  genre: string;
  mood: string;
}

const STEPS = [
  { id: 'safety', label: 'Safety & Voice Protection', icon: ShieldCheck, threshold: 15 },
  { id: 'lyrics', label: 'Lyric Cadence & Composition', icon: Wand2, threshold: 40 },
  { id: 'stems', label: 'Lyria Neural Stem Synthesis', icon: Cpu, threshold: 75 },
  { id: 'master', label: 'Studio Mastering & Render', icon: Music2, threshold: 95 },
];

export const GeneratingState: React.FC<GeneratingStateProps> = ({
  progressStep,
  progressPercent,
  genre,
  mood,
}) => {
  return (
    <div className="max-w-2xl mx-auto my-8 p-8 rounded-3xl bg-gradient-to-b from-zinc-900 via-zinc-900/90 to-zinc-950 border border-amber-500/30 shadow-2xl shadow-amber-500/10 text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
      {/* Animated Studio Turntable / Disc */}
      <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-500 to-violet-600 blur-xl opacity-30 animate-pulse" />
        <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 via-orange-600 to-violet-600 p-0.5 shadow-xl">
          <div className="w-full h-full rounded-full bg-zinc-950 flex items-center justify-center">
            <Disc3 className="w-10 h-10 text-amber-400 animate-spin [animation-duration:3s]" />
          </div>
        </div>
      </div>

      {/* Main Status Text */}
      <div className="space-y-1.5">
        <h3 className="text-xl font-black text-white tracking-tight">
          Forging {genre} Track
        </h3>
        <p className="text-xs text-amber-300 font-medium">
          {progressStep || 'Synthesizing neural audio with Lyria 3.5...'}
        </p>
        <div className="text-[11px] text-zinc-500">
          Infusing {mood} dynamics into high-fidelity stereo arrangement
        </div>
      </div>

      {/* Progress Bar & Percentage */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-zinc-400">Rendering Master...</span>
          <span className="text-amber-400 font-bold">{progressPercent}%</span>
        </div>
        <div className="h-2 rounded-full bg-zinc-950 border border-zinc-800 overflow-hidden p-0.5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-violet-500 transition-all duration-300 shadow-sm shadow-amber-500/50"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Step Indicators */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-left">
        {STEPS.map((step, idx) => {
          const isDone = progressPercent >= step.threshold;
          const isCurrent =
            progressPercent < step.threshold &&
            (idx === 0 || progressPercent >= STEPS[idx - 1].threshold);
          const Icon = step.icon;

          return (
            <div
              key={step.id}
              className={`p-2.5 rounded-xl border transition-all text-xs ${
                isDone
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                  : isCurrent
                  ? 'bg-zinc-900 border-zinc-700 text-zinc-200 animate-pulse'
                  : 'bg-zinc-950/50 border-zinc-800/80 text-zinc-600'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Icon className={`w-3.5 h-3.5 ${isDone ? 'text-amber-400' : 'text-zinc-500'}`} />
                <span className="font-mono text-[10px]">0{idx + 1}</span>
              </div>
              <div className="font-semibold text-[11px] leading-tight">{step.label}</div>
            </div>
          );
        })}
      </div>

      {/* Audio Visualizer Frequency Bars animation */}
      <div className="flex items-center justify-center gap-1 h-8 pt-2">
        {Array.from({ length: 24 }).map((_, i) => (
          <div
            key={i}
            className="w-1 bg-amber-400/80 rounded-full animate-soundwave"
            style={{
              animationDelay: `${(i * 0.08) % 1.2}s`,
              height: `${20 + ((i * 17) % 80)}%`,
            }}
          />
        ))}
      </div>
    </div>
  );
};
