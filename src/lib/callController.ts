// Provider-agnostic outbound-call abstraction.
// Real Twilio/Exotel adapters can implement CallProvider later.

export interface ActiveCall {
  stream: MediaStream;
  hangup: () => void;
}

export interface CallProvider {
  dial(toE164: string): Promise<ActiveCall>;
}

/**
 * MockCallProvider: synthesizes an outbound-call audio stream by
 * playing a user-uploaded reference (the BESCOM hold loop) on repeat
 * for `holdDurationMs`, then switching to silence to simulate a human
 * agent picking up. Lets us exercise the full smart-dial pipeline
 * end-to-end without a telephony account.
 */
export class MockCallProvider implements CallProvider {
  constructor(private opts: { referenceFile?: Blob | null; holdDurationMs?: number } = {}) {}

  async dial(_toE164: string): Promise<ActiveCall> {
    const Ctx = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
    const ctx = new Ctx();
    const dest = ctx.createMediaStreamDestination();
    const holdMs = this.opts.holdDurationMs ?? 8000;

    let buffer: AudioBuffer | null = null;
    if (this.opts.referenceFile) {
      try {
        const arr = await this.opts.referenceFile.arrayBuffer();
        buffer = await ctx.decodeAudioData(arr.slice(0));
      } catch (e) {
        console.warn("Mock dial: failed to decode reference", e);
      }
    }
    if (!buffer) {
      // 0.5 sec of low-amplitude noise as placeholder loop
      buffer = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() - 0.5) * 0.05;
    }

    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    const gain = ctx.createGain();
    gain.gain.value = 0.9;
    src.connect(gain).connect(dest);
    src.start();

    // Schedule "human pickup": fade hold loop to silence after holdMs
    const stopAt = ctx.currentTime + holdMs / 1000;
    gain.gain.setValueAtTime(0.9, stopAt);
    gain.gain.linearRampToValueAtTime(0.0001, stopAt + 0.4);

    const hangup = () => {
      try { src.stop(); } catch { /* noop */ }
      try { void ctx.close(); } catch { /* noop */ }
    };
    return { stream: dest.stream, hangup };
  }
}
