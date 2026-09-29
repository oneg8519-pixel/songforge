import { SafetyCheckResult } from '../../src/types.js';

// List of prominent real-world artists protected under voice identity ethics
const PROTECTED_ARTISTS = [
  'taylor swift',
  'drake',
  'the weeknd',
  'beyonce',
  'eminem',
  'billie eilish',
  'ed sheeran',
  'ariana grande',
  'justin bieber',
  'kanye west',
  'rihanna',
  'bad bunny',
  'adele',
  'bruno mars',
  'dua lipa',
  'kendrick lamar',
  'post malone',
  'freddie mercury',
  'michael jackson',
  'elvis presley',
  'frank sinatra',
  'whitney houston',
  'bob dylan',
  'the beatles',
  'john lennon',
  'paul mccartney',
  'travis scott',
  'olivia rodrigo',
  'lady gaga',
  'lana del rey',
  'harry styles',
  'shakira',
  'coldplay',
  'metallica',
  'nirvana',
  'kurt cobain',
  'chester bennington',
  'linkin park',
  'queen',
  'david bowie',
  'prince',
  'tupac',
  'notorious big',
  'biggie'
];

// Patterns indicating explicit voice or vocal identity imitation
const IMITATION_PATTERNS = [
  /voice of\s+([a-zA-Z\s]+)/i,
  /vocals? like\s+([a-zA-Z\s]+)/i,
  /sound like\s+([a-zA-Z\s]+)/i,
  /sing like\s+([a-zA-Z\s]+)/i,
  /singing like\s+([a-zA-Z\s]+)/i,
  /imitate\s+([a-zA-Z\s]+)/i,
  /cloning\s+([a-zA-Z\s]+)/i,
  /clone of\s+([a-zA-Z\s]+)/i,
  /in the style of\s+([a-zA-Z\s]+)/i,
  /as sung by\s+([a-zA-Z\s]+)/i
];

// Famous verbatim copyrighted lyrics snippets to prevent reproduction
const COPYRIGHTED_LYRICS_SNIPPETS = [
  'is this the real life is this just fantasy caught in a landslide',
  'welcome to the hotel california such a lovely place',
  'just a small town girl living in a lonely world',
  'cause baby you\'re a firework come on show \'em what you\'re worth',
  'sweet home alabama where the skies are so blue',
  'hello from the other side i must have called a thousand times',
  'i want it that way tell me why ain\'t nothin\' but a heartache',
  'never gonna give you up never gonna let you down'
];

// Unsafe or prohibited themes (harassment, violent extremist content)
const PROHIBITED_CONTENT = [
  'kill all',
  'bomb threat',
  'terrorist anthem',
  'hate speech',
  'white supremacy',
  'nazi anthem'
];

export function checkSafety(promptText: string, lyricsText?: string): SafetyCheckResult {
  const combinedText = `${promptText} ${lyricsText || ''}`.toLowerCase();

  // 1. Check for real artist voice imitation
  for (const artist of PROTECTED_ARTISTS) {
    if (combinedText.includes(artist)) {
      // Check if it's used in an imitation context or directly named
      for (const pattern of IMITATION_PATTERNS) {
        if (pattern.test(combinedText)) {
          return {
            passed: false,
            detectedArtist: artist.toUpperCase(),
            reason: `SongForge Voice Safety Protection: Prompts requesting the imitation of real artists' voices (${artist.toUpperCase()}) are prohibited to protect vocal identity rights. Try describing the musical timbre instead (e.g., 'warm baritone', 'airy soprano', 'reverberant 80s rock vocal').`
          };
        }
      }

      // If directly mentioned in vocalStyle or prompt strongly requesting the artist
      if (
        combinedText.includes(`${artist} voice`) ||
        combinedText.includes(`${artist} vocal`) ||
        combinedText.includes(`${artist} style`) ||
        combinedText.includes(`${artist} song`) ||
        combinedText.includes(`by ${artist}`)
      ) {
        return {
          passed: false,
          detectedArtist: artist.toUpperCase(),
          reason: `SongForge Voice Safety Protection: Prompts referencing specific living or legacy artists (${artist.toUpperCase()}) for voice imitation are blocked. Please specify acoustic characteristics instead.`
        };
      }
    }
  }

  // 2. Check for copyrighted lyrics reproduction
  if (lyricsText) {
    const normalizedLyrics = lyricsText.toLowerCase().replace(/[^a-z0-9\s]/g, '');
    for (const snippet of COPYRIGHTED_LYRICS_SNIPPETS) {
      const normalizedSnippet = snippet.replace(/[^a-z0-9\s]/g, '');
      if (normalizedLyrics.includes(normalizedSnippet)) {
        return {
          passed: false,
          flaggedPhrase: snippet,
          reason: `Copyright Moderation Notice: Detected reproduction of copyrighted song lyrics. SongForge only synthesizes original lyrics or royalty-free poetry.`
        };
      }
    }
  }

  // 3. Prohibited content
  for (const phrase of PROHIBITED_CONTENT) {
    if (combinedText.includes(phrase)) {
      return {
        passed: false,
        flaggedPhrase: phrase,
        reason: `Content Moderation Notice: Prompt or lyrics contain prohibited content violating studio community standards.`
      };
    }
  }

  return { passed: true };
}
