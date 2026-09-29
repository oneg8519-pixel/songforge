import React, { useRef, useEffect } from 'react';
import { FileText, Copy, Check, Sparkles, Music } from 'lucide-react';
import { Track, TrackSection } from '../types';

interface SyncedLyricsProps {
  track: Track;
  currentTime: number;
  onSeek: (time: number) => void;
}

interface ParsedLyricBlock {
  sectionName?: string;
  lines: { text: string; approxTime: number }[];
  startTime: number;
  endTime: number;
}

export const SyncedLyrics: React.FC<SyncedLyricsProps> = ({
  track,
  currentTime,
  onSeek,
}) => {
  const [copied, setCopied] = React.useState(false);
  const activeLineRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Parse lyrics into sections matched with track.sections
  const parseLyricsWithSections = (): ParsedLyricBlock[] => {
    if (!track.lyrics) return [];

    const raw = track.lyrics;
    const sections = track.sections || [];
    const blocks: ParsedLyricBlock[] = [];

    // Split on section tags like [Verse 1], [Chorus], etc.
    const parts = raw.split(/(?=\[[^\]]+\])/);

    parts.forEach((part, index) => {
      const match = part.match(/^\[([^\]]+)\]/);
      const sectionName = match ? match[1].trim() : undefined;
      const textBody = match ? part.replace(/^\[[^\]]+\]/, '').trim() : part.trim();

      // Find matched section timing
      const matchedSection = sections.find(
        s => sectionName && s.name.toLowerCase().includes(sectionName.toLowerCase())
      ) || sections[index];

      const startTime = matchedSection ? matchedSection.startTime : 0;
      const endTime = matchedSection ? matchedSection.endTime : track.duration || 60;
      const sectionDuration = Math.max(1, endTime - startTime);

      const rawLines = textBody.split('\n').map(l => l.trim()).filter(Boolean);
      const lineStep = sectionDuration / (rawLines.length || 1);

      const lines = rawLines.map((text, lIdx) => ({
        text,
        approxTime: startTime + lIdx * lineStep,
      }));

      blocks.push({
        sectionName,
        lines,
        startTime,
        endTime,
      });
    });

    return blocks;
  };

  const blocks = parseLyricsWithSections();

  // Auto-scroll to active line
  useEffect(() => {
    if (activeLineRef.current && containerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [currentTime]);

  const handleCopy = () => {
    if (!track.lyrics) return;
    navigator.clipboard.writeText(track.lyrics);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!track.lyrics || track.instrumental) {
    return (
      <div className="h-full min-h-[340px] bg-zinc-950/80 border border-zinc-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 mb-3">
          <Music className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-semibold text-zinc-300">Instrumental Master</h4>
        <p className="text-xs text-zinc-500 mt-1 max-w-xs">
          This track is composed as a pure instrumental without lyrical vocals.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full min-h-[380px] bg-gradient-to-b from-zinc-900/90 to-zinc-950 border border-zinc-800 rounded-2xl p-5 flex flex-col shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800 shrink-0">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-amber-400" />
          <h4 className="text-sm font-bold text-white tracking-tight">Synced Lyrics</h4>
          <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
            Interactive
          </span>
        </div>

        <button
          onClick={handleCopy}
          className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-1.5 py-1 px-2.5 rounded-lg bg-zinc-900 border border-zinc-800"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied!' : 'Copy'}</span>
        </button>
      </div>

      {/* Interactive Lyrics List */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto space-y-5 pr-2 select-none font-sans"
      >
        {blocks.map((block, bIdx) => {
          const isSectionActive = currentTime >= block.startTime && currentTime <= block.endTime;

          return (
            <div key={bIdx} className="space-y-1.5">
              {block.sectionName && (
                <div
                  onClick={() => onSeek(block.startTime)}
                  className={`text-xs font-mono font-bold uppercase tracking-wider py-1 px-2 rounded-md inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                    isSectionActive
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'text-zinc-400 hover:text-zinc-300'
                  }`}
                >
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  [{block.sectionName}]
                </div>
              )}

              <div className="space-y-1 pl-2">
                {block.lines.map((line, lIdx) => {
                  // Determine if this line is currently singing
                  const nextLine = block.lines[lIdx + 1];
                  const lineEnd = nextLine ? nextLine.approxTime : block.endTime;
                  const isCurrent = currentTime >= line.approxTime && currentTime < lineEnd;

                  return (
                    <div
                      key={lIdx}
                      ref={isCurrent ? activeLineRef : null}
                      onClick={() => onSeek(line.approxTime)}
                      className={`py-1 px-2.5 rounded-lg text-sm transition-all duration-150 cursor-pointer ${
                        isCurrent
                          ? 'bg-gradient-to-r from-amber-500/25 to-transparent text-white font-bold text-base scale-[1.02] shadow-sm shadow-amber-500/10 border-l-2 border-amber-400'
                          : isSectionActive
                          ? 'text-zinc-200 hover:text-white hover:bg-zinc-800/40'
                          : 'text-zinc-400 hover:text-zinc-300 hover:bg-zinc-900/40'
                      }`}
                    >
                      {line.text}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-2 text-[10px] text-zinc-400 text-center shrink-0 border-t border-zinc-800/60">
        Click any line or tag to jump playback
      </div>
    </div>
  );
};
