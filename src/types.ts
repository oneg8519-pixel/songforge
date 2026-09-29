export type SongGenre =
  | 'Synthwave'
  | 'Lo-Fi Chill'
  | 'Cinematic Orchestral'
  | 'Indie Pop'
  | 'Cyberpunk Electro'
  | 'Acoustic Folk'
  | 'Deep House'
  | 'Neo-Soul / R&B'
  | 'Hard Rock'
  | 'Ambient Meditation';

export type SongMood =
  | 'Euphoric'
  | 'Melancholic'
  | 'Dark & Gritty'
  | 'Dreamy'
  | 'Energetic'
  | 'Chill & Peaceful'
  | 'Romantic'
  | 'Epic & Heroic';

export interface TrackSection {
  id: string;
  name: string; // 'Intro' | 'Verse 1' | 'Chorus' | 'Verse 2' | 'Bridge' | 'Chorus 2' | 'Outro'
  startTime: number; // in seconds
  endTime: number; // in seconds
  lyricsSnippet?: string;
  color?: string;
}

export interface TrackVersion {
  id: string;
  versionNumber: number;
  createdAt: string;
  note: string;
  modifiedSectionId?: string;
  audioUrl: string;
  duration: number;
  lyrics: string;
}

export interface Track {
  id: string;
  userId: string;
  title: string;
  prompt: string;
  genre: string;
  mood: string;
  instruments: string[];
  vocalStyle: string;
  bpm: number;
  duration: number; // in seconds
  instrumental: boolean;
  language: string;
  lyrics: string;
  audioUrl: string;
  format: 'wav' | 'mp3';
  sections: TrackSection[];
  versions: TrackVersion[];
  currentVersion: number;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  referenceImages?: string[]; // base64 or urls
  aiGenerated: boolean;
  modelUsed: string;
}

export interface GenerationRequest {
  title?: string;
  prompt: string;
  genre: string;
  mood: string;
  instruments?: string[];
  vocalStyle?: string;
  bpm: number;
  duration: number;
  instrumental: boolean;
  language: string;
  customLyrics?: string;
  autoWriteLyrics: boolean;
  referenceImages?: string[]; // base64 strings
}

export interface SectionRegenerateRequest {
  sectionId: string;
  instruction: string;
  bpm?: number;
}

export interface UserAccount {
  id: string;
  email: string;
  name: string;
  tier: 'free' | 'pro' | 'studio';
  credits: number;
  avatarUrl: string;
}

export interface SafetyCheckResult {
  passed: boolean;
  reason?: string;
  detectedArtist?: string;
  flaggedPhrase?: string;
}
