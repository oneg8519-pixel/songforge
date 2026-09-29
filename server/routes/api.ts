import { Router, Request, Response } from 'express';
import path from 'node:path';
import fs from 'node:fs';
import {
  getDefaultUser,
  getUser,
  saveUser,
  deductUserCredits,
  addUserCredits,
  getAllTracks,
  getTrackById,
  saveTrack,
  deleteTrack,
} from '../db.js';
import {
  createFullTrack,
  generateLyricsWithAI,
  analyzeImagesForMusic,
  regenerateSection,
} from '../services/musicGenerator.js';
import { checkSafety } from '../services/safetyModerator.js';
import { GenerationRequest, UserAccount } from '../../src/types.js';

export const apiRouter = Router();

const AUDIO_DIR = path.resolve(process.cwd(), 'storage', 'audio');

// 1. Current User / Profile
apiRouter.get('/me', (req: Request, res: Response) => {
  const user = getDefaultUser();
  res.json({
    user,
    hasApiKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
    mockMode: !process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'MY_GEMINI_API_KEY',
  });
});

// 2. Add / Upgrade Credits
apiRouter.post('/users/upgrade', (req: Request, res: Response) => {
  const { tier, creditsToAdd } = req.body;
  const user = getDefaultUser();

  if (tier) {
    user.tier = tier;
    if (tier === 'pro') user.credits += 30;
    if (tier === 'studio') user.credits += 100;
  }
  if (creditsToAdd && typeof creditsToAdd === 'number') {
    user.credits += creditsToAdd;
  }

  saveUser(user);
  res.json({ success: true, user });
});

// 3. Switch User Account / Demo Login
apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { email, name } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  let user = getUser(email);
  if (!user) {
    user = {
      id: `user_${Date.now()}`,
      email,
      name: name || email.split('@')[0],
      tier: 'free',
      credits: 5,
      avatarUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(email)}`,
    };
    saveUser(user);
  }

  res.json({ success: true, user });
});

// 4. Auto-write Lyrics
apiRouter.post('/lyrics/generate', async (req: Request, res: Response) => {
  try {
    const { genre, mood, prompt, vocalStyle, language } = req.body;
    const safety = checkSafety(prompt);
    if (!safety.passed) {
      return res.status(400).json({ error: safety.reason });
    }

    const lyrics = await generateLyricsWithAI({
      genre: genre || 'Pop',
      mood: mood || 'Energetic',
      prompt: prompt || 'An inspiring journey across city lights',
      vocalStyle,
      language,
    });

    res.json({ lyrics });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Image to Music Analysis (up to 10 images)
apiRouter.post('/images/analyze', async (req: Request, res: Response) => {
  try {
    const { images } = req.body;
    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: 'At least one image is required.' });
    }

    if (images.length > 10) {
      return res.status(400).json({ error: 'Maximum 10 reference images allowed.' });
    }

    const result = await analyzeImagesForMusic(images);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Generate Track
apiRouter.post('/tracks/generate', async (req: Request, res: Response) => {
  try {
    const user = getDefaultUser();

    // Check credits
    if (user.tier !== 'studio' && user.credits < 1) {
      return res.status(403).json({
        error: 'Insufficient credits. Upgrade your plan or top up to forge more tracks.',
        code: 'OUT_OF_CREDITS',
      });
    }

    const genRequest: GenerationRequest = req.body;
    if (!genRequest.genre || !genRequest.prompt) {
      return res.status(400).json({ error: 'Genre and prompt description are required.' });
    }

    // Safety validation
    const safety = checkSafety(genRequest.prompt, genRequest.customLyrics);
    if (!safety.passed) {
      return res.status(400).json({ error: safety.reason, safetyNotice: true });
    }

    // Generate track
    const track = await createFullTrack(user.id, genRequest);

    // Deduct credit
    deductUserCredits(user.id, 1);

    // Save to DB
    saveTrack(track);

    const updatedUser = getDefaultUser();

    res.json({
      success: true,
      track,
      user: updatedUser,
    });
  } catch (err: any) {
    console.error('[API] Track generation error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 7. Regenerate Section
apiRouter.post('/tracks/:id/regenerate-section', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { sectionId, instruction } = req.body;

    if (!sectionId || !instruction) {
      return res.status(400).json({ error: 'sectionId and instruction are required.' });
    }

    const user = getDefaultUser();
    if (user.tier !== 'studio' && user.credits < 1) {
      return res.status(403).json({
        error: 'Insufficient credits to regenerate this section. Please top up.',
        code: 'OUT_OF_CREDITS',
      });
    }

    const track = getTrackById(id);
    if (!track) {
      return res.status(404).json({ error: 'Track not found.' });
    }

    const updatedTrack = await regenerateSection(track, sectionId, instruction);

    // Deduct 1 credit for section edit
    deductUserCredits(user.id, 1);
    saveTrack(updatedTrack);

    res.json({
      success: true,
      track: updatedTrack,
      user: getDefaultUser(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 8. List Tracks
apiRouter.get('/tracks', (req: Request, res: Response) => {
  const { search, favorite, genre } = req.query;
  let tracks = getAllTracks();

  if (favorite === 'true') {
    tracks = tracks.filter(t => t.isFavorite);
  }

  if (genre && typeof genre === 'string') {
    tracks = tracks.filter(t => t.genre.toLowerCase() === genre.toLowerCase());
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    tracks = tracks.filter(
      t =>
        t.title.toLowerCase().includes(q) ||
        t.prompt.toLowerCase().includes(q) ||
        t.lyrics.toLowerCase().includes(q) ||
        t.genre.toLowerCase().includes(q)
    );
  }

  res.json({ tracks });
});

// 9. Get Single Track
apiRouter.get('/tracks/:id', (req: Request, res: Response) => {
  const track = getTrackById(req.params.id);
  if (!track) {
    return res.status(404).json({ error: 'Track not found' });
  }
  res.json({ track });
});

// 10. Update Track (title, favorite, version switch)
apiRouter.patch('/tracks/:id', (req: Request, res: Response) => {
  const track = getTrackById(req.params.id);
  if (!track) {
    return res.status(404).json({ error: 'Track not found' });
  }

  const { title, isFavorite, switchVersion } = req.body;
  if (typeof title === 'string' && title.trim()) {
    track.title = title.trim();
  }
  if (typeof isFavorite === 'boolean') {
    track.isFavorite = isFavorite;
  }
  if (typeof switchVersion === 'number') {
    const ver = track.versions.find(v => v.versionNumber === switchVersion);
    if (ver) {
      track.currentVersion = ver.versionNumber;
      track.audioUrl = ver.audioUrl;
      track.lyrics = ver.lyrics;
    }
  }

  track.updatedAt = new Date().toISOString();
  saveTrack(track);
  res.json({ success: true, track });
});

// 11. Delete Track
apiRouter.delete('/tracks/:id', (req: Request, res: Response) => {
  const success = deleteTrack(req.params.id);
  if (!success) {
    return res.status(404).json({ error: 'Track not found' });
  }
  res.json({ success: true });
});

// 12. Audio Streaming & Download Endpoint
apiRouter.get('/audio/:filename', (req: Request, res: Response) => {
  const filename = req.params.filename;
  // Security check to prevent directory traversal
  const safeFilename = path.basename(filename);
  const filePath = path.join(AUDIO_DIR, safeFilename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Audio file not found' });
  }

  const stat = fs.statSync(filePath);
  const totalSize = stat.size;

  // If download parameter is set, trigger file attachment download
  if (req.query.download === '1') {
    const ext = path.extname(safeFilename) || '.wav';
    const downloadName = (req.query.title as string)
      ? `${(req.query.title as string).replace(/[^a-zA-Z0-9_-]/g, '_')}${ext}`
      : safeFilename;
    res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
  }

  // Handle Range headers for smooth audio scrubbing/seeking
  const range = req.headers.range;
  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;
    const chunkSize = end - start + 1;

    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${totalSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': 'audio/wav',
    });

    const fileStream = fs.createReadStream(filePath, { start, end });
    fileStream.pipe(res);
  } else {
    res.writeHead(200, {
      'Content-Length': totalSize,
      'Content-Type': 'audio/wav',
      'Accept-Ranges': 'bytes',
    });
    fs.createReadStream(filePath).pipe(res);
  }
});
