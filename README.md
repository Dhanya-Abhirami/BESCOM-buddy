# BESCOM Voice Agent

An AI-powered voice agent that calls **BESCOM** (Bangalore Electricity Supply Company) on your behalf — in **Kannada** — so you don't have to. Report power cuts, billing issues, transformer faults, and new connection requests without sitting through IVR menus or repeating the same details every single time the lights go out.

> Built with TanStack Start, React 19, Tailwind CSS v4, and the ElevenLabs Conversational AI SDK.

---

## What is BESCOM?

**BESCOM** (Bangalore Electricity Supply Company Limited) is the state-owned utility that distributes electricity to Bangalore and seven surrounding districts in Karnataka, India — serving over 10 million consumers. The official helpline is **1912**.

- Wikipedia: <https://en.wikipedia.org/wiki/Bangalore_Electricity_Supply_Company>
- Official site: <https://bescom.karnataka.gov.in>

---

## Why this exists

Electricity is a basic necessity in the 21st century. Power disruptions cost productivity, spoil food, interrupt work-from-home, halt hospitals and small businesses, and — in Bangalore's summer — make life genuinely miserable.

When a cut happens, the typical citizen has to:

1. Find the BESCOM number
2. Dial and wait through a long Kannada IVR
3. Sit on hold listening to *"ನಿಮ್ಮ ಕರೆ ನಮಗೆ ಬಹಳ ಅಮೂಲ್ಯವಾಗಿದ್ದು…"* on loop
4. Repeat name, phone, address, area, and nearest sub-station to a human agent
5. Describe the issue — often in a language they're not fluent in

This is **boring, repetitive, and slow** — and it has to be redone every single outage. This app automates that drudgery: configure your details once, press one button, and an AI agent makes the call in fluent Kannada while you get on with your day.

### Two audiences

- **Citizens** — Automate the call. Skip the IVR. Stop repeating yourself.
- **BESCOM trainees** — Use the same engine in reverse: practice handling citizen calls in Kannada with a realistic AI caller before going live on the floor.

---

## Features

- **One-tap BESCOM calls** in Kannada with full-duplex WebRTC audio
- **Smart-dial** — dials the helpline, listens locally for the IVR hold loop using audio fingerprinting, and only spends ElevenLabs tokens once a human agent picks up
- **Hold-time saved metric** — see how many seconds of paid agent time you avoided
- **Live Kannada transcript** for both sides of the conversation
- **Conversation metrics** — duration, agent turns, your turns
- **Personal context passthrough** — name, phone, address, area, nearest sub-station sent as dynamic variables to the AI
- **Mandatory profile fields** — no half-configured calls
- **Local-only storage** — profile and hold-loop fingerprint stay in your browser
- **Provider-agnostic call layer** — pluggable adapter for Twilio / Exotel / Plivo (mock provider ships by default)
- **Themed UI** — dark, energy-grid aesthetic with semantic design tokens

---

## Quick start

```bash
bun install
bun run dev
```

Open <http://localhost:3000> and:

1. Open **Settings** and fill in **every field** (all are required):
   - Name, phone, home address, area/landmark, nearest BESCOM sub-station
   - ElevenLabs **Agent ID**
   - BESCOM helpline number (default: `1912`)
   - Upload a 10–30 sec recording of the BESCOM IVR hold loop (used for local fingerprinting)
2. Open **Call**, allow microphone access, and press **Start Call**
3. The app dials, waits silently through the hold loop, and connects the AI only when a human picks up

### Build

```bash
bun run build
bun run preview
```

---

## ElevenLabs setup

1. Create a Conversational AI agent at <https://elevenlabs.io/app/conversational-ai>
2. Configure it with a Kannada voice and a prompt that plays either:
   - the **citizen** role (for trainee mode), or
   - the **caller on behalf of the user** role (for citizen automation mode)
3. In the agent's **Security** settings, allow these dynamic variables:
   - `name`
   - `phone_number`
   - `address`
   - `location`
   - `nearest_bescom_station`
4. Paste the Agent ID into the app's **Settings** page

---

## How smart-dial works

```
[ Dial BESCOM ] → [ Audio stream ] → [ Local fingerprint match ]
                                          │
                          hold loop ──────┤── keep waiting (no AI tokens spent)
                                          │
                          human voice ────┴── connect ElevenLabs agent
```

The hold-loop reference you upload is converted to a compact landmark fingerprint (FFT + constellation peaks) and stored as base64 in `localStorage`. During a call, incoming audio is fingerprinted in short windows and compared against the reference. When similarity drops and voice activity matches a human greeting pattern, the ElevenLabs session starts. A 25-second safety fallback connects the agent if detection ever fails.

All matching runs **in the browser** — no cloud ML, no per-minute fees.

---

## Project structure

```
src/
├── routes/
│   ├── __root.tsx          # Root layout
│   ├── index.tsx           # Landing page
│   ├── call.tsx            # Live call screen
│   └── settings.tsx        # Profile, Agent ID, smart-dial config
├── components/
│   ├── VoiceAgent.tsx      # Call lifecycle + ElevenLabs SDK
│   └── SiteHeader.tsx
├── lib/
│   ├── userProfile.ts      # localStorage profile helpers
│   ├── audioFingerprint.ts # FFT + landmark hashing
│   ├── holdLoopDetector.ts # Live stream monitoring + VAD
│   └── callController.ts   # Provider-agnostic dialer (mock included)
├── assets/
└── styles.css              # Design tokens (oklch) + Tailwind v4
```

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | TanStack Start v1 (Vite 7) |
| UI | React 19, Tailwind CSS v4, shadcn/ui, Framer Motion |
| Voice AI | `@elevenlabs/react` (WebRTC) |
| Telephony | Pluggable `CallProvider` interface (mock by default; Twilio/Exotel/Plivo adapters can be added) |
| Audio detection | Pure-JS STFT fingerprinting + RMS-based VAD |
| Storage | Browser `localStorage` |
| Deploy | Cloudflare Workers (`wrangler.jsonc`) |

---

## Privacy

Everything — profile, helpline number, and hold-loop fingerprint — lives in your browser's `localStorage`. The only data that leaves your device is the dynamic-variable payload sent to your ElevenLabs agent at the start of an answered call.

---

## Status

The default build ships with a **mock telephony provider** that simulates the BESCOM hold loop transitioning to a human, so you can exercise the full pipeline end-to-end without a PSTN account. To make real outbound calls, implement a `CallProvider` adapter (Twilio, Exotel, Plivo, etc.) and swap it in.

---

## License

See `PRD.md` for product requirements and roadmap.
