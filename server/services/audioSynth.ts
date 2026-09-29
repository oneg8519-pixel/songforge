import fs from 'node:fs';
import path from 'node:path';

// Helper to write a valid 16-bit PCM RIFF WAV file from float samples [-1.0, 1.0]
export function createWavBuffer(samples: Float32Array, sampleRate: number = 44100): Buffer {
  const numChannels = 2; // Stereo
  const bytesPerSample = 2; // 16-bit
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = samples.length * bytesPerSample;
  const headerSize = 44;
  const totalSize = headerSize + dataSize;

  const buffer = Buffer.alloc(totalSize);

  // RIFF chunk descriptor
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(totalSize - 8, 4);
  buffer.write('WAVE', 8);

  // fmt sub-chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  buffer.writeUInt16LE(1, 20); // AudioFormat (1 for PCM)
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(16, 34); // BitsPerSample

  // data sub-chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  // Write samples with soft clipping
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    // Soft clip
    let s = samples[i];
    s = Math.max(-1, Math.min(1, s));
    // Tanh-like soft saturation
    s = Math.tanh(s);
    const intSample = s < 0 ? s * 0x8000 : s * 0x7fff;
    buffer.writeInt16LE(Math.floor(intSample), offset);
    offset += 2;
  }

  return buffer;
}

// Procedural musical synthesis based on genre, tempo, duration, and section variation
export function synthesizeTrackAudio(options: {
  genre: string;
  mood: string;
  bpm: number;
  durationSeconds: number;
  isInstrumental?: boolean;
  sectionVariation?: { sectionName: string; instruction: string };
}): Buffer {
  const sampleRate = 44100;
  const duration = Math.min(Math.max(options.durationSeconds, 15), 180);
  const totalFrames = Math.floor(sampleRate * duration);
  // Stereo interleaved: left, right, left, right...
  const stereoSamples = new Float32Array(totalFrames * 2);

  const bpm = options.bpm || 120;
  const beatDuration = 60 / bpm; // seconds per beat

  // Scale frequencies based on genre
  // Default: Synthwave/Lo-Fi chords in key of C minor / F minor / A minor
  let rootFreq = 220; // A3
  if (options.genre.toLowerCase().includes('lo-fi')) rootFreq = 196; // G3
  if (options.genre.toLowerCase().includes('cyber') || options.genre.toLowerCase().includes('dark')) rootFreq = 164.81; // E3
  if (options.genre.toLowerCase().includes('cinematic')) rootFreq = 146.83; // D3
  if (options.genre.toLowerCase().includes('pop')) rootFreq = 261.63; // C4

  // Chord progression intervals (semitones): i - VI - III - VII (minor progression)
  const progressions = [
    [0, 3, 7, 10], // minor 7th
    [8, 12, 15, 19], // VI major 7th
    [3, 7, 10, 14], // III major 7th
    [10, 14, 17, 21], // VII dominant 7th
  ];

  // Generate samples
  for (let i = 0; i < totalFrames; i++) {
    const t = i / sampleRate;
    const currentBeat = t / beatDuration;
    const bar = Math.floor(currentBeat / 4);
    const beatInBar = currentBeat % 4;

    const chordIndex = bar % progressions.length;
    const currentChord = progressions[chordIndex];

    // Master envelope: fade in at start, fade out at end
    let masterEnv = 1.0;
    if (t < 1.5) masterEnv = t / 1.5;
    if (t > duration - 2.5) masterEnv = Math.max(0, (duration - t) / 2.5);

    // Section intensity modification
    let sectionGain = 1.0;
    if (options.sectionVariation) {
      const lower = options.sectionVariation.instruction.toLowerCase();
      if (lower.includes('heavy') || lower.includes('distortion') || lower.includes('energetic')) {
        sectionGain = 1.35;
      } else if (lower.includes('acoustic') || lower.includes('chill') || lower.includes('drop')) {
        sectionGain = 0.85;
      }
    }

    // 1. Kick Drum (on beat 0 and beat 2 in 4/4)
    let kick = 0;
    const kickTime = beatInBar % 2;
    if (kickTime < 0.25) {
      const kt = kickTime;
      const kickFreq = 130 * Math.exp(-kt * 28) + 40;
      const kickEnv = Math.exp(-kt * 18);
      kick = Math.sin(2 * Math.PI * kickFreq * kt) * kickEnv * 0.45;
    }

    // 2. Snare / Clap (on beat 1 and beat 3)
    let snare = 0;
    const snareOffset = (currentBeat - 1) % 2;
    if (snareOffset >= 0 && snareOffset < 0.28) {
      const st = snareOffset;
      const tone = Math.sin(2 * Math.PI * 185 * st) * Math.exp(-st * 24);
      // Noise
      const noise = (Math.random() * 2 - 1) * Math.exp(-st * 16);
      snare = (tone * 0.3 + noise * 0.7) * 0.35;
    }

    // 3. Hi-Hat (8th notes or 16th notes)
    let hihat = 0;
    const hatTime = (currentBeat * 2) % 1;
    if (hatTime < 0.08) {
      const ht = hatTime;
      const hatNoise = (Math.random() * 2 - 1) * Math.exp(-ht * 45);
      hihat = hatNoise * 0.12;
    }

    // 4. Bass synth (Root note of current chord)
    const bassNote = currentChord[0] - 12; // 1 octave down
    const bassFreq = rootFreq * Math.pow(2, bassNote / 12) * 0.5;
    // Sawtooth-like + Sub
    const bassPhase = (t * bassFreq) % 1;
    const bassSaw = (bassPhase * 2 - 1) * 0.5;
    const bassSine = Math.sin(2 * Math.PI * bassFreq * t);
    const bassEnv = 0.8 + 0.2 * Math.sin(currentBeat * Math.PI * 2);
    const bass = (bassSaw * 0.4 + bassSine * 0.6) * bassEnv * 0.28;

    // 5. Chord Pads (warm polyphonic synth)
    let pad = 0;
    for (let c = 0; c < currentChord.length; c++) {
      const semitone = currentChord[c];
      const freq = rootFreq * Math.pow(2, semitone / 12);
      // Detuned dual oscillators for lush stereo chorus
      const o1 = Math.sin(2 * Math.PI * freq * t);
      const o2 = Math.sin(2 * Math.PI * (freq * 1.003) * t);
      pad += (o1 + o2) * 0.05;
    }

    // 6. Arpeggiator Melody
    const arpStep = Math.floor(currentBeat * 4) % currentChord.length;
    const arpFreq = rootFreq * 2 * Math.pow(2, currentChord[arpStep] / 12);
    const arpT = (currentBeat * 4) % 1;
    const arpEnv = Math.exp(-arpT * 6);
    const arpeggio = Math.sin(2 * Math.PI * arpFreq * t) * arpEnv * 0.14;

    // 7. Vocal Formant Texture (simulated vocal chops if not instrumental)
    let vocalTexture = 0;
    if (!options.isInstrumental) {
      // Formant synthesis around vowel A / O (700Hz, 1200Hz, 2500Hz)
      const vocalPitch = rootFreq * Math.pow(2, currentChord[1] / 12);
      const formant1 = Math.sin(2 * Math.PI * vocalPitch * t);
      const formant2 = Math.sin(2 * Math.PI * (vocalPitch * 1.5) * t) * 0.5;
      const vocalVibrato = 1 + 0.015 * Math.sin(2 * Math.PI * 5.5 * t);
      const vocalGate = Math.sin(currentBeat * Math.PI) > 0.1 ? 1 : 0.2;
      vocalTexture = (formant1 + formant2) * vocalVibrato * vocalGate * 0.12;
    }

    // Mixdown to Stereo with subtle panning
    const leftMix = (kick + snare * 0.9 + hihat * 0.7 + bass * 0.95 + pad * 1.1 + arpeggio * 0.8 + vocalTexture * 1.05) * masterEnv * sectionGain;
    const rightMix = (kick + snare * 1.1 + hihat * 1.2 + bass * 0.95 + pad * 0.9 + arpeggio * 1.2 + vocalTexture * 0.95) * masterEnv * sectionGain;

    stereoSamples[i * 2] = leftMix;
    stereoSamples[i * 2 + 1] = rightMix;
  }

  return createWavBuffer(stereoSamples, sampleRate);
}
