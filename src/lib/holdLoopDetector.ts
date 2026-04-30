// Live BESCOM hold-loop detector.
// Consumes a MediaStream, emits state transitions.

import { TARGET_SR, fingerprint, similarity } from "./audioFingerprint";

export type DetectorState = "listening" | "hold" | "human";

export interface DetectorOptions {
  refHashes: Set<number>;
  windowSec?: number;          // default 3
  holdThreshold?: number;      // similarity above => hold
  humanThreshold?: number;     // similarity below for sustainSec => human
  humanSustainSec?: number;    // default 2
  vadRmsThreshold?: number;    // RMS energy required for "human" claim
  onState: (state: DetectorState, score: number) => void;
}

export class HoldLoopDetector {
  private ctx: AudioContext | null = null;
  private node: ScriptProcessorNode | null = null;
  private src: MediaStreamAudioSourceNode | null = null;
  private buf: number[] = [];
  private srcSr = 48000;
  private lastTickMs = 0;
  private state: DetectorState = "listening";
  private lowSimSinceMs = 0;
  private opts: Required<DetectorOptions>;

  constructor(opts: DetectorOptions) {
    this.opts = {
      windowSec: 3,
      holdThreshold: 0.18,    // landmark match > 18% of smaller set is a strong loop match
      humanThreshold: 0.05,   // < 5% match
      humanSustainSec: 2,
      vadRmsThreshold: 0.005,
      ...opts,
    } as Required<DetectorOptions>;
  }

  attach(stream: MediaStream) {
    const Ctx = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
    this.ctx = new Ctx();
    this.srcSr = this.ctx.sampleRate;
    this.src = this.ctx.createMediaStreamSource(stream);
    // ScriptProcessor is deprecated but the simplest cross-browser pull API
    this.node = this.ctx.createScriptProcessor(4096, 1, 1);
    this.node.onaudioprocess = (e) => this.onAudio(e.inputBuffer.getChannelData(0));
    this.src.connect(this.node);
    this.node.connect(this.ctx.destination); // required to keep the graph alive (muted via gain trick if needed)
  }

  private onAudio(input: Float32Array) {
    // Resample input to TARGET_SR with a cheap linear pass and append
    const ratio = TARGET_SR / this.srcSr;
    const outLen = Math.floor(input.length * ratio);
    for (let i = 0; i < outLen; i++) {
      const srcF = i / ratio;
      const i0 = Math.floor(srcF);
      const i1 = Math.min(i0 + 1, input.length - 1);
      const t = srcF - i0;
      this.buf.push(input[i0] * (1 - t) + input[i1] * t);
    }
    const windowSamples = this.opts.windowSec * TARGET_SR;
    if (this.buf.length < windowSamples) return;
    // Throttle: evaluate at most every 750 ms
    const now = performance.now();
    if (now - this.lastTickMs < 750) {
      // trim to keep memory bounded
      if (this.buf.length > windowSamples * 2) this.buf = this.buf.slice(this.buf.length - windowSamples);
      return;
    }
    this.lastTickMs = now;
    const samples = new Float32Array(this.buf.slice(this.buf.length - windowSamples));
    // VAD
    let sum = 0;
    for (let i = 0; i < samples.length; i++) sum += samples[i] * samples[i];
    const rms = Math.sqrt(sum / samples.length);
    const fp = fingerprint(samples);
    const score = similarity(fp, this.opts.refHashes);

    let next: DetectorState = this.state;
    if (score >= this.opts.holdThreshold) {
      next = "hold";
      this.lowSimSinceMs = 0;
    } else if (score <= this.opts.humanThreshold && rms >= this.opts.vadRmsThreshold) {
      if (this.lowSimSinceMs === 0) this.lowSimSinceMs = now;
      if (now - this.lowSimSinceMs >= this.opts.humanSustainSec * 1000) next = "human";
    } else {
      // unknown / quiet — stay
      this.lowSimSinceMs = 0;
    }
    if (next !== this.state) {
      this.state = next;
      this.opts.onState(next, score);
    }
    // Trim
    this.buf = this.buf.slice(this.buf.length - windowSamples);
  }

  detach() {
    try { this.node?.disconnect(); } catch { /* noop */ }
    try { this.src?.disconnect(); } catch { /* noop */ }
    try { void this.ctx?.close(); } catch { /* noop */ }
    this.node = null; this.src = null; this.ctx = null; this.buf = [];
  }
}
