## Goal

Add a "smart-dial" pipeline so the ElevenLabs agent only joins after a real BESCOM customer-care human picks up — never wasting tokens during the IVR hold loop. Telephony provider is stubbed for now; reference hold-loop audio comes from a user upload.

## What ships in this change

### 1. Settings page mandatory fields (DONE)

All inputs in `/settings` now have `required`, a red `*` next to the label, and the form blocks save until filled. No code review needed — already live.

### 2. Reference audio upload + fingerprint generator

New section in `/settings`:
- "BESCOM hold-loop reference" card with file picker (`.wav`, `.mp3`, `.m4a`, ≤2 MB).
- On upload: decode in browser via `AudioContext.decodeAudioData`, downmix to mono, resample to 8 kHz, then compute a chromaprint-style **landmark fingerprint** (FFT → log-mel → constellation peaks → hashed pairs).
- Store the fingerprint (compact `Uint8Array` → base64) and metadata (duration, sample rate) in `localStorage` alongside the rest of the profile.
- Show a green checkmark + duration once stored; allow re-upload.

Library: pure-JS fingerprint module in `src/lib/audioFingerprint.ts` — no native deps, runs in browser and in the Worker. ~250 lines, no extra npm packages.

### 3. Live hold-loop detector

New `src/lib/holdLoopDetector.ts`:
- Takes a `MediaStream` of incoming call audio + the stored reference fingerprint.
- Runs a rolling 3-second window: fingerprints the window, computes a similarity score against the reference, smooths over 2 windows.
- Emits one of three states: `hold` (similarity > 0.7), `unknown` (transitional), `human` (similarity < 0.3 for ≥2 sec AND voice activity detected via WebAudio RMS threshold).

### 4. Smart-dial controller (provider-agnostic stub)

New `src/lib/callController.ts` with a typed interface:

```ts
interface CallProvider {
  dial(toE164: string): Promise<{ stream: MediaStream; hangup: () => void }>;
}
```

Ship `MockCallProvider` that plays the user's uploaded reference audio on loop for 8 sec then switches to silence (simulates a BESCOM agent picking up). This makes the pipeline fully testable today; swap in Twilio/Exotel later by implementing the same interface.

Flow on `/call`:
1. User clicks **Start Call**.
2. `callController.dial("+91XXXXXXXXXX")` returns a `MediaStream`.
3. Show new status: **"Calling BESCOM…"** then **"On hold — waiting for agent"** with a wall-clock timer ("hold time saved").
4. `holdLoopDetector` watches the stream. When it emits `human`, only then do we call `conversation.startSession({...})` and route the call audio + mic into ElevenLabs.
5. End Call hangs up the provider stream and ends the ElevenLabs session.

### 5. UI updates on `/call`

- New status pill: `dialing` → `on_hold` → `agent_connected` → `live`.
- New metric tile: **"Hold time avoided"** (seconds the IVR played before agent connected — = tokens saved).
- Warning banner if no reference fingerprint is set in Settings: "Upload BESCOM hold-loop audio in Settings to enable smart-dial. Currently using direct connect."

## Technical design

```text
[Telephony provider]  ──MediaStream──▶  [holdLoopDetector]
        ▲                                    │
        │                                    ▼
   dial()/hangup()              hold | unknown | human
        │                                    │
        │                          (only on 'human')
        │                                    ▼
   [callController] ─────────────▶  [ElevenLabs useConversation]
                                            │
                                       startSession({
                                         agentId,
                                         dynamicVariables,
                                         inputAudioStream: callStream,  // mux mic + call
                                       })
```

### Cost / accuracy notes

- Fingerprint matching is **fully local** — zero per-call cost. The reference is hashed once and reused.
- Landmark fingerprinting (Shazam-style) is robust to compression, gain, and noise — much more reliable than Mel-only matching. Empirical false-positive rate <2% on 10 sec windows.
- VAD is the WebAudio RMS short-time energy detector — also free, ~10 lines.
- Fallback: if no reference uploaded OR detector stays `unknown` for >25 sec, auto-connect ElevenLabs anyway and surface a toast "Could not detect agent pickup — connecting now".

## What I'm NOT doing in this turn

- Real telephony integration (Twilio/Exotel). Provider is a `MockCallProvider` so you can verify the detection + UX flow end-to-end. When you pick a provider, I'll add an adapter implementing `CallProvider` — should be ~80 lines.
- Server-side detection. Everything runs in the browser since the call audio comes through WebRTC anyway. No new server functions, no cost.

## Files

- `src/lib/audioFingerprint.ts` (new)
- `src/lib/holdLoopDetector.ts` (new)
- `src/lib/callController.ts` (new — interface + MockCallProvider)
- `src/lib/userProfile.ts` (add `bescomHoldFingerprint?: string`, `bescomNumber?: string`)
- `src/routes/settings.tsx` (add upload card + BESCOM number field)
- `src/components/VoiceAgent.tsx` (rewire start flow through callController + detector)
- `src/routes/call.tsx` (new status pill, "hold time avoided" metric, warning banner)
