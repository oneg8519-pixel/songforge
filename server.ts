import express from 'express';
import dotenv from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';
import { apiRouter } from './server/routes/api.js';
import { initDb, getAllTracks, saveTrack, getDefaultUser } from './server/db.js';
import { synthesizeTrackAudio } from './server/services/audioSynth.js';
import { buildTrackSections } from './server/services/musicGenerator.js';
import { Track } from './src/types.js';

dotenv.config();

const app = express();
const PORT = 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Support base64 image uploads and JSON payloads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize SQLite & storage
initDb();

// Seed initial tracks if library is empty
function seedDemoTracksIfEmpty() {
  const existingTracks = getAllTracks();
  if (existingTracks.length > 0) return;

  const audioDir = path.resolve(process.cwd(), 'storage', 'audio');
  if (!fs.existsSync(audioDir)) {
    fs.mkdirSync(audioDir, { recursive: true });
  }

  const defaultUser = getDefaultUser();

  const demoSeeds = [
    {
      id: 'sf_demo_synthwave_01',
      title: 'Midnight Grid Runner',
      genre: 'Synthwave',
      mood: 'Euphoric',
      bpm: 124,
      duration: 60,
      vocalStyle: 'Warm 80s Studio Vocal',
      prompt: 'Retro-futuristic analog synthesizer anthemic drive with pulsing basslines, gated drums, and neon highway vibes.',
      lyrics: `[Intro]
(Analog arpeggios flicker as neon signs reflect in the rain)
Ignition sequence starting...

[Verse 1]
Speeding down the chrome-lit highway lane
Wash away the static and the midnight rain
Digital horizon calling out my name
Nothing in the rear view will remain the same

[Chorus]
We are the runners of the midnight grid
Chasing every dream that the daylight hid
Turn the resonance up till the speakers ignite
We are alive in the ultraviolet night!

[Verse 2]
Synths in the dashboard humming in key
Breaking through the firewall of memory
Zeroes and ones in a perfect flow
Down to the city where the circuits glow

[Bridge]
Cut the frequency, feel the bass drop low
Let the modular oscillators blow!
Three, two, one — lightspeed!

[Chorus]
We are the runners of the midnight grid
Chasing every dream that the daylight hid
Turn the resonance up till the speakers ignite
We are alive in the ultraviolet night!

[Outro]
Ultraviolet night...
Fading into the neon dawn...
Runners of the grid...`,
    },
    {
      id: 'sf_demo_lofi_02',
      title: 'Rain on Copper Rooftops',
      genre: 'Lo-Fi Chill',
      mood: 'Chill & Peaceful',
      bpm: 84,
      duration: 60,
      vocalStyle: 'Airy Breathy Soul',
      prompt: 'Vinyl crackle, dusty Rhodes piano chords, mellow jazz bass, and soft nocturnal vocals sipping warm tea.',
      lyrics: `[Intro]
(Vinyl needle drops with warm gentle rain outside)
Mmm, yeah... cozy afternoon...

[Verse 1]
Steaming mug of tea resting on the sill
Watching time pause, letting thoughts go still
Pages turning soft to the gentle beat
Miles away from the crowded street

[Chorus]
Raindrops fall on copper rooftop tiles
Washing over every sleepy mile
Just the Rhodes and the kick and the cassette tape
In this quiet little sweet escape

[Verse 2]
Amber light dancing on the wooden floor
Left the stormy world outside the door
Pen to paper tracing out a lullaby
Underneath a charcoal velvet sky

[Bridge]
Soft sigh in the headphone wire...
Warm glow from the ember fire...

[Chorus]
Raindrops fall on copper rooftop tiles
Washing over every sleepy mile
Just the Rhodes and the kick and the cassette tape
In this quiet little sweet escape

[Outro]
Sweet escape...
Keep spinning...
Goodnight world...`,
    }
  ];

  for (const seed of demoSeeds) {
    const audioFilename = `${seed.id}_v1.wav`;
    const audioPath = path.join(audioDir, audioFilename);
    const audioBuffer = synthesizeTrackAudio({
      genre: seed.genre,
      mood: seed.mood,
      bpm: seed.bpm,
      durationSeconds: seed.duration,
      isInstrumental: false,
    });
    fs.writeFileSync(audioPath, audioBuffer);

    const sections = buildTrackSections(seed.duration, seed.lyrics);
    const track: Track = {
      id: seed.id,
      userId: defaultUser.id,
      title: seed.title,
      prompt: seed.prompt,
      genre: seed.genre,
      mood: seed.mood,
      instruments: ['Analog Synth', 'Bass', 'Drums', 'Keyboards'],
      vocalStyle: seed.vocalStyle,
      bpm: seed.bpm,
      duration: seed.duration,
      instrumental: false,
      language: 'English',
      lyrics: seed.lyrics,
      audioUrl: `/api/audio/${audioFilename}`,
      format: 'wav',
      sections,
      versions: [
        {
          id: `ver_1_${seed.id}`,
          versionNumber: 1,
          createdAt: new Date().toISOString(),
          note: 'Studio Master Release',
          audioUrl: `/api/audio/${audioFilename}`,
          duration: seed.duration,
          lyrics: seed.lyrics,
        }
      ],
      currentVersion: 1,
      isFavorite: true,
      tags: [seed.genre, seed.mood, `${seed.bpm} BPM`, 'Featured'],
      aiGenerated: true,
      modelUsed: 'SongForge Lyria Engine v3.5',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveTrack(track);
  }
  console.log('[Server] Seeded initial demo tracks successfully.');
}

seedDemoTracksIfEmpty();

// Mount API routes
app.use('/api', apiRouter);

// Frontend Vite integration
async function setupVite() {
  if (!isProduction) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('[Server] Vite middleware mounted in dev mode.');
  } else {
    const distPath = path.resolve(import.meta.dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
    console.log('[Server] Serving production static assets from dist.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SongForge Server] Running on http://0.0.0.0:${PORT}`);
  });
}

setupVite().catch(err => {
  console.error('[Server] Failed to start:', err);
});
