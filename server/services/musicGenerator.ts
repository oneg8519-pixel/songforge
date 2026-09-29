import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { GoogleGenAI } from '@google/genai';
import {
  GenerationRequest,
  Track,
  TrackSection,
  TrackVersion,
  SongGenre,
  SongMood
} from '../../src/types.js';
import { synthesizeTrackAudio } from './audioSynth.js';
import { checkSafety } from './safetyModerator.js';

const AUDIO_DIR = path.resolve(process.cwd(), 'storage', 'audio');
if (!fs.existsSync(AUDIO_DIR)) {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
}

// Helper to get GoogleGenAI client
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

/**
 * Generate timed sections for a track based on total duration
 */
export function buildTrackSections(durationSeconds: number, lyricsText?: string): TrackSection[] {
  const d = durationSeconds;
  // Standard song structure layout
  // Intro (10%), Verse 1 (22%), Chorus 1 (20%), Verse 2 (20%), Bridge (15%), Outro (13%)
  const introEnd = Math.round(d * 0.12);
  const v1End = Math.round(d * 0.32);
  const c1End = Math.round(d * 0.52);
  const v2End = Math.round(d * 0.72);
  const bridgeEnd = Math.round(d * 0.88);
  const outroEnd = d;

  const sections: TrackSection[] = [
    {
      id: 'sec-intro',
      name: 'Intro',
      startTime: 0,
      endTime: introEnd,
      lyricsSnippet: 'Instrumental build & atmospheric prelude',
      color: '#6366f1', // Indigo
    },
    {
      id: 'sec-verse1',
      name: 'Verse 1',
      startTime: introEnd,
      endTime: v1End,
      lyricsSnippet: extractSectionLyrics(lyricsText, 'Verse 1') || 'Setting the scene...',
      color: '#06b6d4', // Cyan
    },
    {
      id: 'sec-chorus1',
      name: 'Chorus',
      startTime: v1End,
      endTime: c1End,
      lyricsSnippet: extractSectionLyrics(lyricsText, 'Chorus') || 'Main vocal hook & anthemic release',
      color: '#f59e0b', // Amber
    },
    {
      id: 'sec-verse2',
      name: 'Verse 2',
      startTime: c1End,
      endTime: v2End,
      lyricsSnippet: extractSectionLyrics(lyricsText, 'Verse 2') || 'Deepening the narrative rhythm...',
      color: '#10b981', // Emerald
    },
    {
      id: 'sec-bridge',
      name: 'Bridge',
      startTime: v2End,
      endTime: bridgeEnd,
      lyricsSnippet: extractSectionLyrics(lyricsText, 'Bridge') || 'Harmonic shift & vocal peak',
      color: '#ec4899', // Pink
    },
    {
      id: 'sec-outro',
      name: 'Outro',
      startTime: bridgeEnd,
      endTime: outroEnd,
      lyricsSnippet: extractSectionLyrics(lyricsText, 'Outro') || 'Resonant fade & echoing chords',
      color: '#8b5cf6', // Violet
    },
  ];

  return sections;
}

function extractSectionLyrics(lyrics: string | undefined, sectionName: string): string {
  if (!lyrics) return '';
  const regex = new RegExp(`\\[${sectionName}[^\\]]*\\]([^\\[]+)`, 'i');
  const match = lyrics.match(regex);
  if (match && match[1]) {
    return match[1].trim().split('\n').slice(0, 2).join(' / ');
  }
  return '';
}

/**
 * Auto-generate full structured song lyrics using Gemini
 */
export async function generateLyricsWithAI(params: {
  genre: string;
  mood: string;
  prompt: string;
  vocalStyle?: string;
  language?: string;
}): Promise<string> {
  const ai = getGeminiClient();
  const lang = params.language || 'English';

  if (!ai) {
    // High-quality procedural lyric fallback when no API key
    return `[Intro]
(Atmospheric synths swell as the bassline locks into the pulse)
Yeah, we're forging sounds in the dark tonight...

[Verse 1]
Neon reflections on the wet asphalt streets
Heartbeat syncing with the low-end beats
Chasing the horizon where the signal turns clear
Leaving the echoes of every old fear

[Chorus]
Take me higher through the frequency haze
Burning alive in the neon daze
Every note we forge is a flame we keep
Waking the dreamers out of their sleep!

[Verse 2]
Fingers on the fader as the melody climbs
Writing tomorrow in the rhythm of the times
Static in the wire, but the voltage is strong
This is where the forgotten belong

[Bridge]
Break it down to the kick and the wire
Let the harmony lift like a holy fire
Can you feel the crescendo rising high?
Watch the soundwaves fracture the sky!

[Chorus]
Take me higher through the frequency haze
Burning alive in the neon daze
Every note we forge is a flame we keep
Waking the dreamers out of their sleep!

[Outro]
Fade into the starlight...
Reverb in the night...
Forged forever...`;
  }

  try {
    const prompt = `You are an elite multi-platinum songwriter. Write complete, poetic, rhyming lyrics for a song with the following specifications:
Genre: ${params.genre}
Mood: ${params.mood}
Theme/Story: ${params.prompt}
Vocal Style: ${params.vocalStyle || 'Dynamic and emotive'}
Language: ${lang}

Structure the lyrics strictly with clear tags:
[Intro]
[Verse 1]
[Chorus]
[Verse 2]
[Bridge]
[Chorus]
[Outro]

Include parenthetical performance cues (e.g. "(harmonizing)", "(soaring falsetto)", "(heavy 808 drop)"). Output ONLY the song lyrics with tags.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    return response.text?.trim() || 'Could not generate lyrics.';
  } catch (error: any) {
    console.warn('[MusicService] Gemini lyrics generation error:', error.message);
    return `[Intro]\n(Intro synth)\n\n[Verse 1]\nWalking down the neon road\nCarrying this heavy load\n\n[Chorus]\nListen to the sound tonight\nEverything will be alright\n\n[Outro]\n(Fade out)`;
  }
}

/**
 * Image-to-Song analyzer: Analyze up to 10 images and extract musical concept
 */
export async function analyzeImagesForMusic(imagesBase64: string[]): Promise<{
  suggestedTitle: string;
  genre: SongGenre;
  mood: SongMood;
  prompt: string;
  bpm: number;
  instruments: string[];
}> {
  const ai = getGeminiClient();

  if (!ai || imagesBase64.length === 0) {
    return {
      suggestedTitle: 'Chromatics of Light',
      genre: 'Synthwave',
      mood: 'Dreamy',
      prompt: 'Inspired by visual textures of dusk, glowing highlights, and reflective stillness.',
      bpm: 118,
      instruments: ['Analog Synth', 'Reverb Electric Guitar', 'Lush Pads', 'Sub Bass'],
    };
  }

  try {
    const contents: any[] = [
      {
        text: `You are an avant-garde music producer and synesthete. Analyze the attached reference images (${imagesBase64.length} image(s)) and convert their visual aesthetics, color palette, lighting, mood, and implied narratives into a musical song blueprint.
Respond with JSON matching this structure:
{
  "suggestedTitle": "Title of the song",
  "genre": "Synthwave" | "Lo-Fi Chill" | "Cinematic Orchestral" | "Indie Pop" | "Cyberpunk Electro" | "Acoustic Folk" | "Deep House" | "Neo-Soul / R&B" | "Hard Rock" | "Ambient Meditation",
  "mood": "Euphoric" | "Melancholic" | "Dark & Gritty" | "Dreamy" | "Energetic" | "Chill & Peaceful" | "Romantic" | "Epic & Heroic",
  "prompt": "Detailed description of the song vibe, emotional arc, and sonic texture",
  "bpm": 115,
  "instruments": ["instrument1", "instrument2", "instrument3", "instrument4"]
}
Output strictly valid JSON.`,
      },
    ];

    for (const img of imagesBase64.slice(0, 10)) {
      // Clean base64 string
      const match = img.match(/^data:([^;]+);base64,(.+)$/);
      const mimeType = match ? match[1] : 'image/jpeg';
      const data = match ? match[2] : img;
      contents.push({
        inlineData: {
          mimeType,
          data,
        },
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
    });

    const text = response.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (err: any) {
    console.warn('[MusicService] Image analysis failed:', err.message);
  }

  return {
    suggestedTitle: 'Visual Resonance',
    genre: 'Cinematic Orchestral',
    mood: 'Epic & Heroic',
    prompt: 'Atmospheric strings and brass building from soft visual tones into an expansive sonic landscape.',
    bpm: 124,
    instruments: ['Cello Section', 'French Horn', 'Timpani', 'Grand Piano'],
  };
}

/**
 * Core Track Generation Service
 * Calls Lyria music model if available, or procedural audio engine in mock mode.
 */
export async function createFullTrack(
  userId: string,
  req: GenerationRequest,
  onProgress?: (step: string, percent: number) => void
): Promise<Track> {
  // Step 1: Safety & Moderation Check
  onProgress?.('Verifying safety guidelines and vocal identity rights...', 10);
  const safety = checkSafety(req.prompt, req.customLyrics);
  if (!safety.passed) {
    throw new Error(safety.reason || 'Safety validation failed.');
  }

  const trackId = `sf_trk_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const duration = Math.min(Math.max(req.duration || 60, 30), 180);
  const bpm = Math.min(Math.max(req.bpm || 120, 60), 180);

  // Step 2: Handle lyrics
  let finalLyrics = req.customLyrics || '';
  if (req.autoWriteLyrics || (!finalLyrics && !req.instrumental)) {
    onProgress?.('Generating lyrical verses and harmonic structure...', 25);
    finalLyrics = await generateLyricsWithAI({
      genre: req.genre,
      mood: req.mood,
      prompt: req.prompt,
      vocalStyle: req.vocalStyle,
      language: req.language,
    });
  }

  // Step 3: Prepare track sections
  onProgress?.('Arranging section timestamps and composition arc...', 45);
  const sections = buildTrackSections(duration, finalLyrics);

  // Step 4: Music Generation (Lyria or High-Fidelity Synthesizer)
  onProgress?.('Synthesizing studio master audio stems...', 65);
  const ai = getGeminiClient();
  let audioBuffer: Buffer | null = null;
  let modelUsed = 'SongForge Audio Synth v3.5 (Mock Engine)';

  if (ai) {
    try {
      onProgress?.('Calling Gemini Lyria music stream...', 75);
      // Attempt Lyria generation
      // Based on Gemini interactions API guidelines:
      // lyria-3-pro-preview or lyria-3-clip-preview
      const lyriaModel = duration <= 30 ? 'lyria-3-clip-preview' : 'lyria-3-pro-preview';
      
      const promptText = `Generate a ${duration}-second ${req.genre} music track.
Mood: ${req.mood}.
BPM: ${bpm}.
Instruments: ${(req.instruments || []).join(', ')}.
Vocal Style: ${req.instrumental ? 'Instrumental only, no vocals' : req.vocalStyle || 'Modern Studio Vocal'}.
Prompt Description: ${req.prompt}.
${finalLyrics ? `Lyrics:\n${finalLyrics}` : ''}`;

      const contents: any = req.referenceImages && req.referenceImages.length > 0
        ? {
            parts: [
              { text: promptText },
              ...req.referenceImages.slice(0, 3).map(img => {
                const match = img.match(/^data:([^;]+);base64,(.+)$/);
                return {
                  inlineData: {
                    mimeType: match ? match[1] : 'image/jpeg',
                    data: match ? match[2] : img,
                  }
                };
              })
            ]
          }
        : promptText;

      const responseStream = await ai.models.generateContentStream({
        model: lyriaModel,
        contents,
      });

      let audioBase64 = '';
      for await (const chunk of responseStream) {
        const parts = chunk.candidates?.[0]?.content?.parts;
        if (!parts) continue;
        for (const part of parts) {
          if (part.inlineData?.data) {
            audioBase64 += part.inlineData.data;
          }
        }
      }

      if (audioBase64.length > 0) {
        audioBuffer = Buffer.from(audioBase64, 'base64');
        modelUsed = `Gemini ${lyriaModel}`;
        console.log(`[MusicService] Successfully generated audio using ${modelUsed}`);
      }
    } catch (lyriaErr: any) {
      console.warn('[MusicService] Lyria API call failed or quota restricted. Using procedural synth fallback:', lyriaErr.message);
    }
  }

  // Fallback to high-quality procedural WAV synth if no Lyria stream was received
  if (!audioBuffer) {
    onProgress?.('Mastering audio with SongForge high-fidelity engine...', 85);
    audioBuffer = synthesizeTrackAudio({
      genre: req.genre,
      mood: req.mood,
      bpm,
      durationSeconds: duration,
      isInstrumental: req.instrumental,
    });
  }

  // Step 5: Save audio file to storage/audio/
  onProgress?.('Finalizing track metadata and stereo master...', 95);
  const audioFilename = `${trackId}_v1.wav`;
  const audioFilePath = path.join(AUDIO_DIR, audioFilename);
  fs.writeFileSync(audioFilePath, audioBuffer);
  const audioUrl = `/api/audio/${audioFilename}`;

  const defaultTitle = req.title || `${req.genre} in ${req.mood}`;

  const initialVersion: TrackVersion = {
    id: `ver_1_${Date.now()}`,
    versionNumber: 1,
    createdAt: new Date().toISOString(),
    note: 'Initial Full Track Generation',
    audioUrl,
    duration,
    lyrics: finalLyrics,
  };

  const track: Track = {
    id: trackId,
    userId,
    title: defaultTitle,
    prompt: req.prompt,
    genre: req.genre,
    mood: req.mood,
    instruments: req.instruments || ['Synth', 'Bass', 'Drums', 'Keyboards'],
    vocalStyle: req.vocalStyle || (req.instrumental ? 'None (Instrumental)' : 'Modern Studio Vocal'),
    bpm,
    duration,
    instrumental: req.instrumental,
    language: req.language || 'English',
    lyrics: finalLyrics,
    audioUrl,
    format: 'wav',
    sections,
    versions: [initialVersion],
    currentVersion: 1,
    isFavorite: false,
    tags: [req.genre, req.mood, `${bpm} BPM`],
    referenceImages: req.referenceImages,
    aiGenerated: true,
    modelUsed,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  onProgress?.('Track Complete!', 100);
  return track;
}

/**
 * Regenerate a specific section (e.g. Chorus, Bridge) with custom user instruction
 */
export async function regenerateSection(
  track: Track,
  sectionId: string,
  instruction: string
): Promise<Track> {
  const section = track.sections.find(s => s.id === sectionId);
  if (!section) {
    throw new Error(`Section ${sectionId} not found in track.`);
  }

  // Check safety of instruction
  const safety = checkSafety(instruction);
  if (!safety.passed) {
    throw new Error(safety.reason || 'Safety check failed for section instruction.');
  }

  const newVersionNumber = track.versions.length + 1;
  const audioFilename = `${track.id}_v${newVersionNumber}.wav`;
  const audioFilePath = path.join(AUDIO_DIR, audioFilename);

  // Generate modified audio buffer
  const audioBuffer = synthesizeTrackAudio({
    genre: track.genre,
    mood: track.mood,
    bpm: track.bpm,
    durationSeconds: track.duration,
    isInstrumental: track.instrumental,
    sectionVariation: {
      sectionName: section.name,
      instruction,
    },
  });

  fs.writeFileSync(audioFilePath, audioBuffer);
  const newAudioUrl = `/api/audio/${audioFilename}`;

  // Update section description
  section.lyricsSnippet = `[Regenerated: ${instruction.slice(0, 45)}...]`;

  const newVersion: TrackVersion = {
    id: `ver_${newVersionNumber}_${Date.now()}`,
    versionNumber: newVersionNumber,
    createdAt: new Date().toISOString(),
    note: `Regenerated ${section.name}: "${instruction}"`,
    modifiedSectionId: sectionId,
    audioUrl: newAudioUrl,
    duration: track.duration,
    lyrics: track.lyrics,
  };

  track.versions.push(newVersion);
  track.currentVersion = newVersionNumber;
  track.audioUrl = newAudioUrl;
  track.updatedAt = new Date().toISOString();

  return track;
}
