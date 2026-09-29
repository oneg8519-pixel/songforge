import React, { useState } from 'react';
import {
  Search,
  Heart,
  Play,
  Share2,
  Trash2,
  Edit2,
  Clock,
  Gauge,
  Sparkles,
  Layers,
  Music,
  ExternalLink,
  Check,
  X,
} from 'lucide-react';
import { Track } from '../types';

interface LibraryViewProps {
  tracks: Track[];
  currentTrackId?: string;
  onPlayTrack: (track: Track) => void;
  onToggleFavorite: (trackId: string) => void;
  onRenameTrack: (trackId: string, newTitle: string) => void;
  onDeleteTrack: (trackId: string) => void;
  onShareTrack: (track: Track) => void;
  onGoToCreate: () => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  tracks,
  currentTrackId,
  onPlayTrack,
  onToggleFavorite,
  onRenameTrack,
  onDeleteTrack,
  onShareTrack,
  onGoToCreate,
}) => {
  const [search, setSearch] = useState('');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [editingTrackId, setEditingTrackId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  // Extract unique genres
  const genres = ['All', ...Array.from(new Set(tracks.map(t => t.genre)))];

  // Filtered tracks
  const filtered = tracks.filter(t => {
    if (showOnlyFavorites && !t.isFavorite) return false;
    if (selectedGenre !== 'All' && t.genre.toLowerCase() !== selectedGenre.toLowerCase()) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        t.prompt.toLowerCase().includes(q) ||
        t.genre.toLowerCase().includes(q) ||
        (t.lyrics && t.lyrics.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleStartRename = (track: Track) => {
    setEditingTrackId(track.id);
    setEditingTitle(track.title);
  };

  const handleSaveRename = (trackId: string) => {
    if (editingTitle.trim()) {
      onRenameTrack(trackId, editingTitle.trim());
    }
    setEditingTrackId(null);
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Studio Library</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-mono">
              {tracks.length} {tracks.length === 1 ? 'Track' : 'Tracks'}
            </span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Access your full catalog, version iterations, stems, and public share links.
          </p>
        </div>

        {/* Search & Favorites filter */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by title, lyrics, genre..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500 w-64"
            />
          </div>

          <button
            onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
            className={`p-2 rounded-xl border transition-colors flex items-center gap-1.5 text-xs font-semibold ${
              showOnlyFavorites
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${showOnlyFavorites ? 'fill-rose-500' : ''}`} />
            <span>Favorites</span>
          </button>
        </div>
      </div>

      {/* Genre Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {genres.map(g => (
          <button
            key={g}
            onClick={() => setSelectedGenre(g)}
            className={`text-xs font-medium px-3 py-1.5 rounded-lg shrink-0 transition-all ${
              selectedGenre === g
                ? 'bg-amber-500 text-black font-bold shadow-md shadow-amber-500/10'
                : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      {/* Track List */}
      {filtered.length === 0 ? (
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-12 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 mx-auto">
            <Music className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-zinc-200">No tracks found</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            {search || showOnlyFavorites
              ? 'Try adjusting your search criteria or clearing your filters.'
              : 'You have not forged any tracks yet. Jump into the studio and bring your musical vision to life!'}
          </p>
          <button
            onClick={onGoToCreate}
            className="mt-3 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-md shadow-amber-500/20 inline-flex items-center gap-1.5 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 fill-black" />
            <span>Forge Track</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(track => {
            const isPlayingThis = track.id === currentTrackId;

            return (
              <div
                key={track.id}
                className={`group bg-zinc-900/80 hover:bg-zinc-900 border rounded-2xl p-4 transition-all duration-150 flex flex-col justify-between shadow-lg relative overflow-hidden ${
                  isPlayingThis
                    ? 'border-amber-500/50 shadow-amber-500/5 ring-1 ring-amber-500/30'
                    : 'border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div>
                  {/* Top Bar with Title and Actions */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      {editingTrackId === track.id ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={editingTitle}
                            onChange={e => setEditingTitle(e.target.value)}
                            className="px-2 py-1 text-xs font-bold bg-zinc-950 border border-amber-500 rounded text-white focus:outline-none"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveRename(track.id)}
                            className="p-1 text-emerald-400 hover:text-emerald-300"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingTrackId(null)}
                            className="p-1 text-zinc-400 hover:text-zinc-200"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-white truncate">{track.title}</h4>
                          <button
                            onClick={() => handleStartRename(track)}
                            className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-zinc-200 p-0.5 transition-opacity"
                            title="Rename track"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-0.5 flex-wrap">
                        <span className="text-amber-400 font-semibold">{track.genre}</span>
                        <span>•</span>
                        <span className="text-violet-300">{track.mood}</span>
                        <span>•</span>
                        <span className="font-mono">{formatTime(track.duration)}</span>
                        <span>•</span>
                        <span className="font-mono">{track.bpm} BPM</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => onToggleFavorite(track.id)}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          track.isFavorite
                            ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                            : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                        }`}
                        title="Toggle Favorite"
                      >
                        <Heart className={`w-3.5 h-3.5 ${track.isFavorite ? 'fill-rose-500' : ''}`} />
                      </button>

                      <button
                        onClick={() => onShareTrack(track)}
                        className="p-1.5 rounded-lg bg-zinc-950/60 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
                        title="Share Track"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onDeleteTrack(track.id)}
                        className="p-1.5 rounded-lg bg-zinc-950/60 border border-zinc-800 text-zinc-400 hover:text-rose-400 hover:border-rose-500/30 transition-colors"
                        title="Delete Track"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Prompt snippet */}
                  <p className="text-xs text-zinc-400 line-clamp-2 mt-2 leading-relaxed">
                    {track.prompt}
                  </p>
                </div>

                {/* Bottom Bar: Version tag & Play in studio */}
                <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-950 text-zinc-400 border border-zinc-800 flex items-center gap-1">
                      <Layers className="w-3 h-3 text-amber-400" />
                      v{track.currentVersion || 1}
                      {track.versions?.length > 1 && ` of ${track.versions.length}`}
                    </span>

                    <span className="text-[10px] text-zinc-400">
                      {new Date(track.createdAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>

                  <button
                    onClick={() => onPlayTrack(track)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                      isPlayingThis
                        ? 'bg-amber-500 text-black shadow-md shadow-amber-500/25'
                        : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                    }`}
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>{isPlayingThis ? 'Loaded in Studio' : 'Play in Studio'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
