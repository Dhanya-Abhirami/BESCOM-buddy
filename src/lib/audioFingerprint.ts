// Pure-JS landmark (Shazam-style) audio fingerprinter.
// Zero deps. Runs in browser AudioContext + plain JS arrays.
//
// Pipeline:
//   audio (Float32 mono @ TARGET_SR) -> framed STFT -> log magnitude
//   -> peak picking on a (time, freq) grid -> hash pairs of peaks
//   -> compact 32-bit hashes (Uint32Array, stored base64).
//
// Matching:
//   Compare two fingerprint sets by hash intersection (Jaccard-ish ratio).
//   For live detection we fingerprint a rolling 3s window and compare
//   against the reference fingerprint hash set.

export const TARGET_SR = 8000;        // 8 kHz is enough for speech IVR
const FFT_SIZE = 512;                 // 64 ms windows @ 8kHz
const HOP_SIZE = 256;                 // 50% overlap -> ~31 frames/sec
const PEAK_NEIGH_T = 3;               // local-max neighborhood (frames)
const PEAK_NEIGH_F = 6;               // local-max neighborhood (bins)
const PEAKS_PER_FRAME_MAX = 3;        // cap to keep hashes sparse
const FANOUT = 4;                     // pair each peak with N nearest future peaks
const TARGET_DT_MAX = 30;             // max time delta for pairs (frames)

// ---------------- Resampling + decode helpers ----------------

export async function decodeFileToMono8k(file: File | Blob): Promise<Float32Array> {
  const arr = await file.arrayBuffer();
  const Ctx = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
  const ctx = new Ctx();
  try {
    const buf = await ctx.decodeAudioData(arr.slice(0));
    return resampleMono(buf, TARGET_SR);
  } finally {
    void ctx.close();
  }
}

export function resampleMono(buf: AudioBuffer, targetSr: number): Float32Array {
  // Downmix
  const ch = buf.numberOfChannels;
  const len = buf.length;
  const mono = new Float32Array(len);
  for (let c = 0; c < ch; c++) {
    const data = buf.getChannelData(c);
    for (let i = 0; i < len; i++) mono[i] += data[i] / ch;
  }
  // Linear resample
  const ratio = targetSr / buf.sampleRate;
  const outLen = Math.floor(len * ratio);
  const out = new Float32Array(outLen);
  for (let i = 0; i < outLen; i++) {
    const srcF = i / ratio;
    const i0 = Math.floor(srcF);
    const i1 = Math.min(i0 + 1, len - 1);
    const t = srcF - i0;
    out[i] = mono[i0] * (1 - t) + mono[i1] * t;
  }
  return out;
}

// ---------------- FFT (radix-2, in-place Cooley–Tukey) ----------------

function fftRadix2(re: Float32Array, im: Float32Array) {
  const n = re.length;
  // Bit reversal
  let j = 0;
  for (let i = 1; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const half = len >> 1;
    const ang = (-2 * Math.PI) / len;
    const wRe = Math.cos(ang), wIm = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let curRe = 1, curIm = 0;
      for (let k = 0; k < half; k++) {
        const aRe = re[i + k], aIm = im[i + k];
        const bRe = re[i + k + half] * curRe - im[i + k + half] * curIm;
        const bIm = re[i + k + half] * curIm + im[i + k + half] * curRe;
        re[i + k] = aRe + bRe; im[i + k] = aIm + bIm;
        re[i + k + half] = aRe - bRe; im[i + k + half] = aIm - bIm;
        const nRe = curRe * wRe - curIm * wIm;
        const nIm = curRe * wIm + curIm * wRe;
        curRe = nRe; curIm = nIm;
      }
    }
  }
}

const HANN = (() => {
  const w = new Float32Array(FFT_SIZE);
  for (let i = 0; i < FFT_SIZE; i++) w[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (FFT_SIZE - 1)));
  return w;
})();

// ---------------- Spectrogram ----------------

function spectrogram(samples: Float32Array): Float32Array[] {
  const frames: Float32Array[] = [];
  const re = new Float32Array(FFT_SIZE);
  const im = new Float32Array(FFT_SIZE);
  const halfBins = FFT_SIZE / 2;
  for (let start = 0; start + FFT_SIZE <= samples.length; start += HOP_SIZE) {
    for (let i = 0; i < FFT_SIZE; i++) {
      re[i] = samples[start + i] * HANN[i];
      im[i] = 0;
    }
    fftRadix2(re, im);
    const mag = new Float32Array(halfBins);
    for (let k = 0; k < halfBins; k++) {
      mag[k] = Math.log1p(Math.sqrt(re[k] * re[k] + im[k] * im[k]));
    }
    frames.push(mag);
  }
  return frames;
}

// ---------------- Peak picking ----------------

interface Peak { t: number; f: number; }

function pickPeaks(spec: Float32Array[]): Peak[] {
  const T = spec.length;
  if (T === 0) return [];
  const F = spec[0].length;
  const peaks: Peak[] = [];
  // Per-frame mean to threshold weak frames
  for (let t = 0; t < T; t++) {
    let mean = 0;
    for (let f = 0; f < F; f++) mean += spec[t][f];
    mean /= F;
    const candidates: Peak[] = [];
    for (let f = 2; f < F - 2; f++) {
      const v = spec[t][f];
      if (v < mean * 1.2) continue;
      let isMax = true;
      for (let dt = -PEAK_NEIGH_T; dt <= PEAK_NEIGH_T && isMax; dt++) {
        const tt = t + dt; if (tt < 0 || tt >= T) continue;
        for (let df = -PEAK_NEIGH_F; df <= PEAK_NEIGH_F; df++) {
          const ff = f + df; if (ff < 0 || ff >= F) continue;
          if (spec[tt][ff] > v) { isMax = false; break; }
        }
      }
      if (isMax) candidates.push({ t, f });
    }
    // keep top-N candidates per frame by magnitude
    candidates.sort((a, b) => spec[b.t][b.f] - spec[a.t][a.f]);
    for (let i = 0; i < Math.min(PEAKS_PER_FRAME_MAX, candidates.length); i++) peaks.push(candidates[i]);
  }
  return peaks;
}

// ---------------- Hashing ----------------

function hashPair(f1: number, f2: number, dt: number): number {
  // 9 bits f1, 9 bits f2, 14 bits dt -> fits in 32 bits unsigned
  return (((f1 & 0x1ff) << 23) | ((f2 & 0x1ff) << 14) | (dt & 0x3fff)) >>> 0;
}

export function fingerprint(samples: Float32Array): Uint32Array {
  if (samples.length < FFT_SIZE * 4) return new Uint32Array(0);
  const spec = spectrogram(samples);
  const peaks = pickPeaks(spec);
  const out: number[] = [];
  for (let i = 0; i < peaks.length; i++) {
    const a = peaks[i];
    let paired = 0;
    for (let j = i + 1; j < peaks.length && paired < FANOUT; j++) {
      const b = peaks[j];
      const dt = b.t - a.t;
      if (dt <= 0) continue;
      if (dt > TARGET_DT_MAX) break;
      out.push(hashPair(a.f, b.f, dt));
      paired++;
    }
  }
  // Dedup
  const set = new Set(out);
  return Uint32Array.from(set);
}

// ---------------- Compare ----------------

export function similarity(a: Uint32Array, b: Set<number>): number {
  if (a.length === 0 || b.size === 0) return 0;
  let hits = 0;
  for (let i = 0; i < a.length; i++) if (b.has(a[i])) hits++;
  // Jaccard against the smaller set
  const denom = Math.min(a.length, b.size);
  return hits / denom;
}

export function toRefSet(fp: Uint32Array): Set<number> {
  const s = new Set<number>();
  for (let i = 0; i < fp.length; i++) s.add(fp[i]);
  return s;
}

// ---------------- Base64 encoding for storage ----------------

export function fpToBase64(fp: Uint32Array): string {
  const bytes = new Uint8Array(fp.buffer, fp.byteOffset, fp.byteLength);
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}

export function fpFromBase64(b64: string): Uint32Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Uint32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4);
}
