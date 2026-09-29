# SongForge - AI Music Production Studio

SongForge is an AI music studio web application inspired by Google's Lyria 3.5. Users describe a song or upload visual mood references and receive full-length mastered tracks with rich instrumentation, vocals, and lyrics.

---

## Key Features

1. **Prompt to Song**
   - Detailed musical controls: Genre, Mood, Instruments, Vocal Style, and Story / Theme.
   - BPM tempo slider (60 – 180 BPM) and duration selector (30s, 60s, 90s, 2m, 3m).
   - Optional custom lyrics editor with `[Verse]`, `[Chorus]`, `[Bridge]`, and `[Outro]` tags.
   - "Auto-Write Lyrics" mode with Gemini-powered rhyme, meter, and section cadence drafting.
   - Instrumental-only mode toggle and language selector.

2. **Image to Song**
   - Upload up to 10 mood board or concept art images.
   - AI extracts color palette, atmosphere, narrative story, genre, and instruments to compose the music.

3. **Audio Master Player & Synced Karaoke Lyrics**
   - Interactive audio visualizer waveform with scrub and clickable seekhead.
   - Color-coded song sections (Intro, Verse, Chorus, Bridge, Outro) directly on the timeline.
   - Side-by-side karaoke lyrics display highlighting the current singing line with auto-scroll. Click any line to jump audio playback directly.
   - Lossless WAV and 320 kbps MP3 downloads.

4. **Section Editing & Version History**
   - Split tracks into logical sections.
   - Select any section (e.g., Chorus 1 or Bridge) and regenerate only that segment with custom instructions (e.g., *"heavy 808 drop with distorted electric guitar solo"*).
   - Version history manager (v1, v2, v3...) to audition, compare, and restore prior arrangements.

5. **Studio Library**
   - Save every track with metadata, prompt, tags, and date.
   - Search across title, lyrics, genre, and prompt.
   - Filter by Favorites or Genre.
   - Rename, delete, and generate public share links and embed player code.

6. **Accounts & Credit System**
   - Producer accounts (Email or simulated Google Sign-in).
   - Free Tier (5 starter credits), Pro Tier (50 credits/month), and Studio Master (Unlimited).
   - Deducts 1 credit per full generation or section regeneration.

7. **Voice Identity Protection & Safety Moderation**
   - Ethical Voice Protection: Blocks prompts attempting to clone or imitate specific living or legacy artists (e.g., Drake, Taylor Swift, Eminem).
   - Copyright lyrics moderation to protect original creators.
   - AI Attribution: All generated tracks are labeled with synthetic origin metadata.

8. **Mock Mode Fallback**
   - If no `GEMINI_API_KEY` is provided, SongForge automatically runs in Mock Studio Mode, using a procedural 16-bit stereo synthesis engine producing actual musical harmony, drums, basslines, and timed sections so the application can be thoroughly tested offline.

---

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, Motion.
- **Backend**: Node.js 22, Express, `node:sqlite` database storage.
- **AI Models**:
  - Google Gemini Lyria (`lyria-3-pro-preview` / `lyria-3-clip-preview` or `lyria-3.5`) called **strictly server-side** via `@google/genai`.
  - Gemini Flash (`gemini-3.8-flash`) for lyrics composition and multimodal image aesthetics analysis.
- **Audio Storage**: Local disk in `storage/audio/` served via HTTP Range streaming.

---

## Setup & Running Locally

1. Clone or extract the repository:
   ```bash
   npm install
   ```

2. Configure environment variables in `.env`:
   ```bash
   cp .env.example .env
   # Add your GEMINI_API_KEY from Google AI Studio
   ```

3. Start the full-stack development server on port 3000:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   npm start
   ```

---

## Architectural Guidelines

All Gemini API calls are strictly wrapped in `server/services/musicGenerator.ts` to allow seamless swapping of audio synthesis providers in the future. The client never handles API keys or calls AI endpoints directly.
