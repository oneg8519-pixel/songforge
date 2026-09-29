import React, { useRef, useState, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Repeat,
  Download,
  Share2,
  Heart,
  SlidersHorizontal,
  Layers,
  Sparkles,
  Music2,
  Clock,
  Gauge,
  Check,
  ChevronDown,
} from 'lucide-react';
import { Track, TrackSection, TrackVersion } from '../types';

interface AudioPlayerProps {
  track: Track;
  onEditSection: (section: TrackSection) => void;
  onShare: (track: Track) => void;
  onToggleFavorite: (trackId: string) => void;
  onSwitchVersion: (trackId: string, versionNumber: number) => void;
  currentTime: number;
  setCurrentTime: (time: number) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  track,
  onEditSection,
  onShare,
  onToggleFavorite,
  onSwitchVersion,
  currentTime,
  setCurrentTime,
  isPlaying,
  setIsPlaying,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [duration, setDuration] = useState<number>(track.duration || 60);
  const [isLooping, setIsLooping] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [showVersionMenu, setShowVersionMenu] = useState<boolean>(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState<boolean>(false);

  // Sync audio source when track audioUrl or version changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.src = track.audioUrl;
      audioRef.current.load();
      if (isPlaying) {
        audioRef.current.play().catch(e => console.log('Autoplay deferred:', e));
      }
    }
  }, [track.audioUrl]);

  // Handle play/pause
  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
    }
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    setCurrentTime(audioRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    if (audioRef.current.duration && !isNaN(audioRef.current.duration)) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (newTime: number) => {
    if (!audioRef.current) return;
    const clamped = Math.max(0, Math.min(newTime, duration));
    audioRef.current.currentTime = clamped;
    setCurrentTime(clamped);
  };

  const handleSkip = (seconds: number) => {
    if (!audioRef.current) return;
    handleSeek(audioRef.current.currentTime + seconds);
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    if (audioRef.current) {
      audioRef.current.volume = newVol;
      audioRef.current.muted = newVol === 0;
      setIsMuted(newVol === 0);
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    const nextMuted = !isMuted;
    audioRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  const toggleLoop = () => {
    const next = !isLooping;
    setIsLooping(next);
    if (audioRef.current) {
      audioRef.current.loop = next;
    }
  };

  // Find currently playing section
  const currentSection = track.sections?.find(
    s => currentTime >= s.startTime && currentTime <= s.endTime
  );

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Download handler
  const triggerDownload = (format: 'wav' | 'mp3') => {
    const downloadUrl = `${track.audioUrl}?download=1&title=${encodeURIComponent(track.title)}`;
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `${track.title.replace(/\s+/g, '_')}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setShowDownloadMenu(false);
  };

  return (
    <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        loop={isLooping}
      />

      {/* Top Meta Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800/80">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-violet-600 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/10">
            <Music2 className="w-6 h-6 text-white" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-white tracking-tight">{track.title}</h3>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                AI Generated
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                {track.modelUsed || 'Lyria Engine'}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1 flex-wrap">
              <span className="text-amber-400 font-medium">{track.genre}</span>
              <span>•</span>
              <span className="text-violet-300">{track.mood}</span>
              <span>•</span>
              <span className="font-mono flex items-center gap-1">
                <Gauge className="w-3 h-3 text-zinc-400" />
                {track.bpm} BPM
              </span>
              <span>•</span>
              <span className="font-mono flex items-center gap-1">
                <Clock className="w-3 h-3 text-zinc-400" />
                {formatTime(duration)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons: Favorite, Version Switcher, Share, Download */}
        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          {/* Favorite */}
          <button
            onClick={() => onToggleFavorite(track.id)}
            className={`p-2 rounded-xl border transition-colors ${
              track.isFavorite
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
            title="Save to favorites"
          >
            <Heart className={`w-4 h-4 ${track.isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
          </button>

          {/* Version Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowVersionMenu(!showVersionMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-zinc-200 transition-colors"
            >
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>v{track.currentVersion || 1}</span>
              {track.versions?.length > 1 && (
                <span className="text-[10px] text-zinc-400">({track.versions.length})</span>
              )}
              <ChevronDown className="w-3 h-3 text-zinc-400" />
            </button>

            {showVersionMenu && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl bg-zinc-900 border border-zinc-700 shadow-2xl p-2 z-30 space-y-1">
                <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  Version History
                </div>
                {track.versions?.map(v => (
                  <button
                    key={v.id}
                    onClick={() => {
                      onSwitchVersion(track.id, v.versionNumber);
                      setShowVersionMenu(false);
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                      v.versionNumber === track.currentVersion
                        ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30'
                        : 'text-zinc-300 hover:bg-zinc-800'
                    }`}
                  >
                    <div>
                      <div className="font-semibold">Version {v.versionNumber}</div>
                      <div className="text-[10px] text-zinc-400 truncate max-w-[180px]">{v.note}</div>
                    </div>
                    {v.versionNumber === track.currentVersion && (
                      <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Share */}
          <button
            onClick={() => onShare(track)}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-colors"
            title="Share Track"
          >
            <Share2 className="w-4 h-4" />
          </button>

          {/* Download Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDownloadMenu(!showDownloadMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold shadow-md shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {showDownloadMenu && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl bg-zinc-900 border border-zinc-700 shadow-2xl p-1.5 z-30 space-y-1">
                <button
                  onClick={() => triggerDownload('wav')}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs text-zinc-200 hover:bg-zinc-800 flex items-center justify-between"
                >
                  <span className="font-semibold">Lossless Audio (.WAV)</span>
                  <span className="text-[10px] text-amber-400 font-mono">44.1 kHz</span>
                </button>
                <button
                  onClick={() => triggerDownload('mp3')}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs text-zinc-200 hover:bg-zinc-800 flex items-center justify-between"
                >
                  <span className="font-semibold">Compressed (.MP3)</span>
                  <span className="text-[10px] text-zinc-400 font-mono">320 kbps</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* WAVEFORM VISUALIZER & TIMELINE */}
      <div className="my-5 space-y-2">
        {/* Interactive Waveform Container */}
        <div
          className="relative h-20 bg-zinc-950 rounded-xl border border-zinc-800/80 p-2 overflow-hidden cursor-pointer group select-none"
          onClick={e => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const ratio = clickX / rect.width;
            handleSeek(ratio * duration);
          }}
          onMouseMove={e => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const ratio = clickX / rect.width;
            setHoverTime(ratio * duration);
          }}
          onMouseLeave={() => setHoverTime(null)}
        >
          {/* Simulated Waveform Bars */}
          <div className="absolute inset-0 flex items-center justify-between px-3 gap-0.5">
            {Array.from({ length: 64 }).map((_, i) => {
              const progress = currentTime / (duration || 1);
              const barProgress = i / 64;
              const isPast = barProgress <= progress;

              // Pseudo-random pseudo-frequency wave pattern
              const heightMultiplier = Math.sin(i * 0.4) * 0.35 + Math.cos(i * 0.8) * 0.25 + 0.4;
              const heightPercent = Math.max(12, Math.min(95, heightMultiplier * 100));

              return (
                <div
                  key={i}
                  style={{ height: `${heightPercent}%` }}
                  className={`w-1 rounded-full transition-all duration-75 ${
                    isPast
                      ? isPlaying
                        ? 'bg-gradient-to-t from-amber-500 to-orange-400 shadow-sm shadow-amber-500/50'
                        : 'bg-amber-500'
                      : 'bg-zinc-800 group-hover:bg-zinc-700'
                  }`}
                />
              );
            })}
          </div>

          {/* Current Playhead Line */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg pointer-events-none transition-all duration-75"
            style={{ left: `${(currentTime / (duration || 1)) * 100}%` }}
          >
            <div className="w-2.5 h-2.5 rounded-full bg-white -ml-1 -mt-0.5 shadow-md" />
          </div>

          {/* Hover Scrub tooltip */}
          {hoverTime !== null && (
            <div
              className="absolute top-1 text-[10px] font-mono font-bold bg-zinc-800 text-amber-300 px-1.5 py-0.5 rounded shadow pointer-events-none -translate-x-1/2"
              style={{ left: `${(hoverTime / (duration || 1)) * 100}%` }}
            >
              {formatTime(hoverTime)}
            </div>
          )}
        </div>

        {/* SECTION TIMELINE BLOCKS (Intro, Verse, Chorus, Bridge, Outro) */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] text-zinc-400">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Track Sections (Click to Jump or Edit)</span>
            <span className="font-mono text-amber-400">
              Active: {currentSection?.name || 'Intro'}
            </span>
          </div>

          <div className="flex h-7 rounded-lg overflow-hidden border border-zinc-800 bg-zinc-950 p-0.5 gap-0.5">
            {track.sections?.map(section => {
              const secWidth = ((section.endTime - section.startTime) / duration) * 100;
              const isActive = currentTime >= section.startTime && currentTime <= section.endTime;

              return (
                <div
                  key={section.id}
                  style={{ width: `${secWidth}%` }}
                  onClick={() => handleSeek(section.startTime)}
                  title={`${section.name} (${formatTime(section.startTime)} - ${formatTime(section.endTime)})`}
                  className={`group relative h-full rounded flex items-center justify-between px-2 cursor-pointer transition-all ${
                    isActive
                      ? 'bg-amber-500/25 border border-amber-500/50 text-amber-300 font-bold'
                      : 'bg-zinc-900/90 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <span className="text-[10px] truncate select-none">{section.name}</span>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      onEditSection(section);
                    }}
                    title={`Regenerate ${section.name}`}
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded bg-zinc-800 hover:bg-amber-500 hover:text-black transition-all"
                  >
                    <SlidersHorizontal className="w-2.5 h-2.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* BOTTOM PLAYBACK CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-zinc-800/80">
        {/* Play/Pause & Scrub Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleSkip(-10)}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
            title="Rewind 10s"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={togglePlay}
            className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black flex items-center justify-center shadow-lg shadow-amber-500/25 transition-all transform active:scale-95"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-black" />
            ) : (
              <Play className="w-5 h-5 fill-black ml-0.5" />
            )}
          </button>

          <button
            onClick={toggleLoop}
            className={`p-2 rounded-xl border transition-colors ${
              isLooping
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
            title="Toggle Loop"
          >
            <Repeat className="w-4 h-4" />
          </button>

          {/* Time display */}
          <div className="font-mono text-xs text-zinc-400 pl-2">
            <span className="text-zinc-100 font-bold">{formatTime(currentTime)}</span>
            <span className="mx-1 text-zinc-600">/</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Section Regenerate Quick Button */}
        {currentSection && (
          <button
            onClick={() => onEditSection(currentSection)}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-violet-600/20 text-violet-300 hover:bg-violet-600/30 border border-violet-500/30 flex items-center gap-1.5 transition-all self-start sm:self-center"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-violet-400" />
            <span>Regenerate {currentSection.name}</span>
          </button>
        )}

        {/* Volume Slider */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleMute}
            className="text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={isMuted ? 0 : volume}
            onChange={e => handleVolumeChange(Number(e.target.value))}
            className="w-20 accent-amber-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
