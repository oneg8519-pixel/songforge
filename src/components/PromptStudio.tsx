import React, { useState, useRef } from 'react';
import {
  Sparkles,
  Image as ImageIcon,
  Sliders,
  Music,
  Mic2,
  FileText,
  Clock,
  Gauge,
  Globe,
  Upload,
  X,
  AlertCircle,
  Wand2,
  Check,
  ChevronDown,
  ChevronUp,
  Tag,
  Volume2,
} from 'lucide-react';
import { SongGenre, SongMood, GenerationRequest } from '../types';

const GENRES: SongGenre[] = [
  'Synthwave',
  'Lo-Fi Chill',
  'Cinematic Orchestral',
  'Indie Pop',
  'Cyberpunk Electro',
  'Acoustic Folk',
  'Deep House',
  'Neo-Soul / R&B',
  'Hard Rock',
  'Ambient Meditation',
];

const MOODS: SongMood[] = [
  'Euphoric',
  'Melancholic',
  'Dark & Gritty',
  'Dreamy',
  'Energetic',
  'Chill & Peaceful',
  'Romantic',
  'Epic & Heroic',
];

const VOCAL_STYLES = [
  'Warm & Emotive Studio Vocal',
  'Airy & Breathy Falsetto',
  'Soaring Anthemic Belt',
  'Autotune Trap Flow',
  'Raspy Vintage Rock',
  'Lush Gospel Choir',
  'Cinematic Operatic Soprano',
  'Intimate Acoustic Whispers',
];

const LANGUAGES = [
  'English',
  'Spanish',
  'Japanese',
  'French',
  'Korean',
  'German',
  'Italian',
  'Portuguese',
];

const PROMPT_SUGGESTIONS = [
  'A late-night rainy drive with distant city sirens and warm Rhodes chords',
  'An uplifting space launch anthem bursting with brass and heavy drums',
  'Cyberpunk chase through an underground market with distorted 808 bass',
  'Acoustic sunrise melody on a mountain porch with fingerpicked guitar',
  'Euphoric festival drop with shimmering supersaw synths and vocal chops',
];

interface PromptStudioProps {
  onGenerate: (req: GenerationRequest) => void;
  isGenerating: boolean;
  credits: number;
  onOpenUpgrade: () => void;
}

export const PromptStudio: React.FC<PromptStudioProps> = ({
  onGenerate,
  isGenerating,
  credits,
  onOpenUpgrade,
}) => {
  // Form state
  const [mode, setMode] = useState<'text' | 'image'>('text');
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState<SongGenre>('Synthwave');
  const [mood, setMood] = useState<SongMood>('Euphoric');
  const [prompt, setPrompt] = useState('Pulsing analog synthesizers racing across a neon skyline at midnight');
  const [instruments, setInstruments] = useState<string>('Analog Synths, Sub Bass, Gated Snare, Arpeggiator');
  const [vocalStyle, setVocalStyle] = useState(VOCAL_STYLES[0]);
  const [bpm, setBpm] = useState(124);
  const [duration, setDuration] = useState(60); // 60 seconds default
  const [instrumental, setInstrumental] = useState(false);
  const [language, setLanguage] = useState('English');
  const [autoWriteLyrics, setAutoWriteLyrics] = useState(true);
  const [customLyrics, setCustomLyrics] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showLyricsEditor, setShowLyricsEditor] = useState(false);

  // Image references (up to 10)
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [isAnalyzingImages, setIsAnalyzingImages] = useState(false);
  const [imageAnalysisSummary, setImageAnalysisSummary] = useState<string | null>(null);

  // Safety inline check
  const [safetyWarning, setSafetyWarning] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fast client-side warning check for user feedback
  const handlePromptChange = (val: string) => {
    setPrompt(val);
    const lower = val.toLowerCase();
    const artists = ['drake', 'taylor swift', 'eminem', 'billie eilish', 'the weeknd', 'beyonce', 'ariana grande'];
    const matched = artists.find(a => lower.includes(a));
    if (matched) {
      setSafetyWarning(`Notice: Requesting vocal imitation of real artists (${matched.toUpperCase()}) is restricted by voice identity protection. Timbre descriptors (e.g. 'airy falsetto', 'deep baritone') will be used instead.`);
    } else {
      setSafetyWarning(null);
    }
  };

  // Insert lyric section tag helper
  const insertLyricTag = (tag: string) => {
    setCustomLyrics(prev => {
      const spacing = prev.length > 0 && !prev.endsWith('\n\n') ? '\n\n' : '';
      return `${prev}${spacing}[${tag}]\n`;
    });
    setShowLyricsEditor(true);
  };

  // Image Upload handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const remainingSlots = 10 - referenceImages.length;
    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    filesToProcess.forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => {
        if (ev.target?.result) {
          setReferenceImages(prev => {
            if (prev.length >= 10) return prev;
            return [...prev, ev.target!.result as string];
          });
        }
      };
      reader.readAsDataURL(file);
    });

    if (e.target) e.target.value = '';
  };

  const removeImage = (index: number) => {
    setReferenceImages(prev => prev.filter((_, i) => i !== index));
  };

  // Analyze uploaded images with backend Gemini
  const handleAnalyzeImages = async () => {
    if (referenceImages.length === 0) return;
    setIsAnalyzingImages(true);
    setImageAnalysisSummary(null);

    try {
      const res = await fetch('/api/images/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: referenceImages }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.genre && GENRES.includes(data.genre)) setGenre(data.genre);
        if (data.mood && MOODS.includes(data.mood)) setMood(data.mood);
        if (data.bpm) setBpm(data.bpm);
        if (data.suggestedTitle) setTitle(data.suggestedTitle);
        if (data.prompt) setPrompt(data.prompt);
        if (data.instruments && Array.isArray(data.instruments)) {
          setInstruments(data.instruments.join(', '));
        }
        setImageAnalysisSummary(`Extracted visual atmosphere: ${data.genre} • ${data.mood} • ${data.bpm} BPM`);
      }
    } catch (err) {
      console.error('Failed to analyze images:', err);
    } finally {
      setIsAnalyzingImages(false);
    }
  };

  // Auto-write lyrics preview trigger
  const [isGeneratingLyrics, setIsGeneratingLyrics] = useState(false);
  const handleAutoGenerateLyrics = async () => {
    setIsGeneratingLyrics(true);
    try {
      const res = await fetch('/api/lyrics/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          genre,
          mood,
          prompt,
          vocalStyle,
          language,
        }),
      });
      const data = await res.json();
      if (res.ok && data.lyrics) {
        setCustomLyrics(data.lyrics);
        setShowLyricsEditor(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingLyrics(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (credits < 1) {
      onOpenUpgrade();
      return;
    }

    const instList = instruments
      .split(',')
      .map(i => i.trim())
      .filter(Boolean);

    onGenerate({
      title: title.trim() || undefined,
      prompt,
      genre,
      mood,
      instruments: instList,
      vocalStyle,
      bpm,
      duration,
      instrumental,
      language,
      customLyrics: showLyricsEditor && customLyrics ? customLyrics : undefined,
      autoWriteLyrics: autoWriteLyrics && !instrumental,
      referenceImages: referenceImages.length > 0 ? referenceImages : undefined,
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Studio Header Card */}
      <div className="bg-gradient-to-b from-zinc-900 via-zinc-900/90 to-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400" />
              <h2 className="text-xl font-bold text-white tracking-tight">Song Studio</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium">
                Prompt to Master Track
              </span>
            </div>
            <p className="text-sm text-zinc-400 mt-1">
              Describe your musical vision or upload images. SongForge orchestrates full-length compositions with lyrics & vocal performance.
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center p-1 bg-zinc-950 rounded-xl border border-zinc-800 shrink-0">
            <button
              type="button"
              onClick={() => setMode('text')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mode === 'text'
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Prompt to Song
            </button>
            <button
              type="button"
              onClick={() => setMode('image')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mode === 'image'
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              Image to Song
              {referenceImages.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-white/20 text-[10px] flex items-center justify-center">
                  {referenceImages.length}
                </span>
              )}
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* IMAGE UPLOAD PANEL (If in Image Mode or Images Attached) */}
          {mode === 'image' && (
            <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-violet-400" />
                    Reference Images (Mood & Palette)
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Upload up to 10 mood board photos, cover art references, or landscapes.
                  </p>
                </div>
                <div className="text-xs text-zinc-400 font-mono">
                  {referenceImages.length} / 10 images
                </div>
              </div>

              {/* Thumbnails grid */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {referenceImages.map((img, idx) => (
                  <div key={idx} className="group relative aspect-video rounded-lg overflow-hidden border border-zinc-700 bg-zinc-900">
                    <img src={img} alt={`Reference ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-zinc-300 hover:text-white hover:bg-rose-600 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <span className="absolute bottom-1 left-1 text-[9px] px-1 rounded bg-black/60 text-zinc-300">
                      #{idx + 1}
                    </span>
                  </div>
                ))}

                {referenceImages.length < 10 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-video rounded-lg border-2 border-dashed border-zinc-700 hover:border-violet-500/80 hover:bg-violet-500/5 transition-all flex flex-col items-center justify-center gap-1.5 text-zinc-400 hover:text-violet-300 p-2"
                  >
                    <Upload className="w-5 h-5" />
                    <span className="text-[11px] font-medium">Add Image</span>
                  </button>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />

              {referenceImages.length > 0 && (
                <div className="flex items-center justify-between pt-2">
                  {imageAnalysisSummary ? (
                    <div className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5" />
                      {imageAnalysisSummary}
                    </div>
                  ) : (
                    <div className="text-xs text-zinc-400">
                      Images loaded. Analyze will auto-tune genre, mood & instruments.
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleAnalyzeImages}
                    disabled={isAnalyzingImages}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-violet-600/30 text-violet-300 hover:bg-violet-600/50 border border-violet-500/40 flex items-center gap-1.5 transition-all"
                  >
                    <Wand2 className={`w-3.5 h-3.5 ${isAnalyzingImages ? 'animate-spin' : ''}`} />
                    {isAnalyzingImages ? 'Analyzing Aesthetics...' : 'Auto-Match Music to Visuals'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* GENRE SELECTOR */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-amber-400" />
                Primary Genre
              </label>
              <span className="text-xs text-amber-400 font-medium">{genre}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {GENRES.map(g => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGenre(g)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    genre === g
                      ? 'bg-amber-500 text-black font-bold shadow-md shadow-amber-500/20'
                      : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white border border-zinc-800'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* MOOD SELECTOR */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-violet-400" />
                Emotional Mood & Energy
              </label>
              <span className="text-xs text-violet-400 font-medium">{mood}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {MOODS.map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMood(m)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    mood === m
                      ? 'bg-violet-600 text-white font-bold shadow-md shadow-violet-600/20'
                      : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white border border-zinc-800'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* STORY & PROMPT INPUT */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Song Story, Atmosphere & Sonic Vibe
              </label>
              <span className="text-[11px] text-zinc-400">Describe theme, narrative, or instruments</span>
            </div>
            <textarea
              value={prompt}
              onChange={e => handlePromptChange(e.target.value)}
              rows={3}
              placeholder="e.g. A reflective cyberpunk journey driving through neon rain, warm Rhodes piano, deep sub bass, and soaring synth leads..."
              className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder-zinc-600 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all resize-none"
              required
            />

            {/* Quick Inspiration Chips */}
            <div className="mt-2 flex items-center gap-2 overflow-x-auto pb-1">
              <span className="text-[10px] text-zinc-400 font-medium shrink-0">Try idea:</span>
              {PROMPT_SUGGESTIONS.map((sug, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handlePromptChange(sug)}
                  className="shrink-0 text-[11px] px-2.5 py-1 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition-colors"
                >
                  {sug.slice(0, 36)}...
                </button>
              ))}
            </div>

            {/* Safety Warning notice if artist name is typed */}
            {safetyWarning && (
              <div className="mt-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-amber-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                <span>{safetyWarning}</span>
              </div>
            )}
          </div>

          {/* LYRICS CONFIGURATION & AUTO-WRITE */}
          <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800">
                  <FileText className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-zinc-200">Lyrics & Vocal Arrangement</h4>
                  <p className="text-xs text-zinc-400">
                    {instrumental
                      ? 'Instrumental track (no vocals or lyrics will be synthesized)'
                      : autoWriteLyrics
                      ? 'SongForge AI will auto-write rhyming poetic lyrics formatted in sections'
                      : 'Provide your own custom lyrics'}
                  </p>
                </div>
              </div>

              {!instrumental && (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setAutoWriteLyrics(!autoWriteLyrics)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                      autoWriteLyrics
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                    }`}
                  >
                    Auto-Write: {autoWriteLyrics ? 'ON' : 'OFF'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowLyricsEditor(!showLyricsEditor)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-colors flex items-center gap-1"
                  >
                    {showLyricsEditor ? 'Hide Lyrics Box' : 'Custom Lyrics'}
                    {showLyricsEditor ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}
            </div>

            {/* Custom Lyrics Editor Area */}
            {showLyricsEditor && !instrumental && (
              <div className="pt-3 border-t border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-400">Tag sections for dynamic arrangement:</span>
                  <div className="flex items-center gap-1.5">
                    {['Verse 1', 'Chorus', 'Verse 2', 'Bridge', 'Outro'].map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => insertLyricTag(tag)}
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 text-amber-400 border border-zinc-800"
                      >
                        +[{tag}]
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={handleAutoGenerateLyrics}
                      disabled={isGeneratingLyrics}
                      className="text-[11px] font-semibold px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 flex items-center gap-1"
                    >
                      <Wand2 className={`w-3 h-3 ${isGeneratingLyrics ? 'animate-spin' : ''}`} />
                      Generate Draft
                    </button>
                  </div>
                </div>

                <textarea
                  value={customLyrics}
                  onChange={e => setCustomLyrics(e.target.value)}
                  rows={6}
                  placeholder={`[Verse 1]\nNeon reflections on the wet asphalt streets\nHeartbeat syncing with the low-end beats...\n\n[Chorus]\nTake me higher through the frequency haze...`}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder-zinc-700 text-xs font-mono focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 resize-y"
                />
              </div>
            )}
          </div>

          {/* ADVANCED STUDIO CONTROLS (Collapsible) */}
          <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950/40">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full p-3.5 flex items-center justify-between text-xs font-semibold text-zinc-300 hover:bg-zinc-900/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                <span>Advanced Studio Controls (BPM, Duration, Vocals, Instruments)</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-zinc-400 font-mono">
                  {bpm} BPM • {duration}s • {instrumental ? 'Instrumental' : language}
                </span>
                {showAdvanced ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
              </div>
            </button>

            {showAdvanced && (
              <div className="p-4 border-t border-zinc-800 space-y-4 bg-zinc-950/80">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* TEMPO / BPM SLIDER */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400 font-medium flex items-center gap-1.5">
                        <Gauge className="w-3.5 h-3.5 text-amber-400" />
                        Tempo (BPM)
                      </span>
                      <span className="font-mono font-bold text-amber-400 text-sm">{bpm} BPM</span>
                    </div>
                    <input
                      type="range"
                      min={60}
                      max={180}
                      step={1}
                      value={bpm}
                      onChange={e => setBpm(Number(e.target.value))}
                      className="w-full accent-amber-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
                      <span>60 (Ballad)</span>
                      <span>120 (House)</span>
                      <span>140 (Dubstep)</span>
                      <span>180 (DnB)</span>
                    </div>
                  </div>

                  {/* DURATION SELECTOR */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400 font-medium flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-cyan-400" />
                        Track Duration
                      </span>
                      <span className="font-mono font-bold text-cyan-400 text-sm">
                        {duration >= 60 ? `${duration / 60}m` : `${duration}s`}
                      </span>
                    </div>
                    <div className="grid grid-cols-5 gap-1.5">
                      {[30, 60, 90, 120, 180].map(d => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setDuration(d)}
                          className={`py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                            duration === d
                              ? 'bg-cyan-500 text-black border-cyan-400 shadow-sm font-bold'
                              : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                          }`}
                        >
                          {d >= 60 ? `${d / 60}m` : `${d}s`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  {/* VOCAL STYLE */}
                  <div className="space-y-1.5">
                    <label className="text-xs text-zinc-400 font-medium flex items-center gap-1.5">
                      <Mic2 className="w-3.5 h-3.5 text-emerald-400" />
                      Vocal Timbre Style
                    </label>
                    <select
                      value={vocalStyle}
                      onChange={e => setVocalStyle(e.target.value)}
                      disabled={instrumental}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-amber-500 disabled:opacity-50"
                    >
                      {VOCAL_STYLES.map(v => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* LANGUAGE */}
                  <div className="space-y-1.5">
                    <label className="text-xs text-zinc-400 font-medium flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-blue-400" />
                      Lyrics Language
                    </label>
                    <select
                      value={language}
                      onChange={e => setLanguage(e.target.value)}
                      disabled={instrumental}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-amber-500 disabled:opacity-50"
                    >
                      {LANGUAGES.map(l => (
                        <option key={l} value={l}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* INSTRUMENTAL ONLY TOGGLE */}
                  <div className="space-y-1.5 flex flex-col justify-end">
                    <button
                      type="button"
                      onClick={() => setInstrumental(!instrumental)}
                      className={`w-full py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                        instrumental
                          ? 'bg-amber-500 text-black border-amber-400 font-bold'
                          : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                      }`}
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      {instrumental ? 'Instrumental Only: ON' : 'Vocals Enabled'}
                    </button>
                  </div>
                </div>

                {/* INSTRUMENTS SPECIFICATION */}
                <div className="pt-2">
                  <label className="text-xs text-zinc-400 font-medium">Instruments & Stems</label>
                  <input
                    type="text"
                    value={instruments}
                    onChange={e => setInstruments(e.target.value)}
                    placeholder="Analog Synths, Sub Bass, 808 Drums, Acoustic Piano..."
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* SUBMIT BUTTON & CREDIT INDICATOR */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>Generation uses 1 credit. All outputs are labelled as AI-generated.</span>
            </div>

            <button
              type="submit"
              disabled={isGenerating}
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-black font-bold text-sm shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all transform active:scale-98 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              <Sparkles className="w-4 h-4 fill-black" />
              <span>Forge Full Track</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-black/20 text-black font-mono">
                1 Credit
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
