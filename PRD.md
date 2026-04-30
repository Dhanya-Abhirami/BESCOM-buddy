# Product Requirements Document — BESCOM Voice Agent

**Status:** v2.0
**Last updated:** April 30, 2026
**Owner:** Product

---

## 1. Background

### 1.1 What is BESCOM?

**Bangalore Electricity Supply Company Limited (BESCOM)** is the Karnataka state-owned electricity distribution utility serving Bangalore Urban, Bangalore Rural, Chikkaballapur, Kolar, Davanagere, Tumakuru, Ramanagara, and Chitradurga — over 10 million consumers across roughly 41,000 km². The consumer helpline is **1912**.

- Wikipedia: <https://en.wikipedia.org/wiki/Bangalore_Electricity_Supply_Company>
- Official portal: <https://bescom.karnataka.gov.in>

### 1.2 Why this product exists

Electricity is a non-negotiable utility in 21st-century life. When power is disrupted:

- Work-from-home stops; meetings drop
- Refrigerated food and medicine spoil
- Small businesses lose revenue per minute
- Hospitals, schools, and clinics fall back to limited backup
- Citizens lose hours of productivity and patience

The standard remediation path — calling 1912 — is itself a productivity tax:

1. Look up / remember the number
2. Navigate a long Kannada IVR menu
3. Wait on hold listening to the recorded loop *"ನಿಮ್ಮ ಕರೆ ನಮಗೆ ಬಹಳ ಅಮೂಲ್ಯವಾಗಿದ್ದು, ನಾವು ನಿಮ್ಮ ಕರೆಯನ್ನು ನಮ್ಮ ಗ್ರಾಹಕ ಸೇವಾ ಸಿಬ್ಬಂದಿಗೆ ವರ್ಗಾಯಿಸುವವರೆಗೂ ದಯವಿಟ್ಟು ನಿರೀಕ್ಷಿಸಿರಿ."*
4. Repeat the same identity + address + area + nearest sub-station to a human agent
5. Describe the issue — often in a language the citizen isn't fluent in

This happens every single outage. The data the citizen reads out is **the same data they read out last time**. This product automates that drudgery.

## 2. Problem

Citizens spend 5–15 minutes per BESCOM call repeating boilerplate information. The non-Kannada-speaking population has the additional friction of a language barrier. BESCOM trainees, separately, lack realistic Kannada practice before going live on the floor.

## 3. Goals

| # | Goal | Success metric |
|---|---|---|
| G1 | Automate routine BESCOM calls for citizens | Citizen completes a power-cut report without speaking to BESCOM directly |
| G2 | Skip IVR hold time without paying for AI tokens | ElevenLabs session starts within 2 sec of human pickup; 0 sec spent on hold loop |
| G3 | Provide on-demand Kannada voice practice for BESCOM trainees | Trainee can complete an end-to-end practice call in < 1 minute of setup |
| G4 | Zero-backend, zero-account onboarding | Profile + smart-dial config stored in `localStorage`; only an ElevenLabs Agent ID is required |
| G5 | Surface conversation quality signals | Live duration, agent turns, trainee turns, hold-time saved visible during call |

## 4. Non-goals (v2)

- Recording, scoring, or storing past calls server-side
- User accounts, authentication, or multi-tenant management
- Overriding the agent's prompt/first message/language from the client
- Mobile-native apps (responsive web only)
- Real BESCOM CRM/ticketing integration
- Outbound dialing in production (current build ships a mock telephony provider)

## 5. Users & personas

### 5.1 Citizen (primary, v2)
A Bangalore resident dealing with a power cut. Wants to report it and get back to life. May or may not speak Kannada fluently.
- **Need:** one-tap automated call that handles the IVR, identifies them correctly, and reports the issue accurately.
- **Pain:** repetition, hold time, language friction.

### 5.2 BESCOM trainee (secondary)
A new call-center hire at BESCOM. Needs realistic Kannada practice handling citizen calls.
- **Need:** an AI that role-plays a citizen with believable details and accent.
- **Pain:** trainer scarcity, inconsistent shadowing.

### 5.3 Training supervisor
Configures the ElevenLabs agent's persona/scenarios in the ElevenLabs dashboard, distributes the Agent ID.

## 6. User stories

1. **Citizen** — Power just went out. I open the app, press one button, and an AI calls 1912 in Kannada and reports the cut with my address.
2. **Citizen** — I configure my home details once and never re-enter them.
3. **Citizen** — I see the AI was on hold for 90 seconds before a human answered, and that 90 seconds didn't cost me anything.
4. **Trainee** — I open the app, enter my details once, and start a practice call within seconds.
5. **Trainee** — I see live Kannada transcript bubbles for both sides so I can self-correct.
6. **Supervisor** — I configure prompts/voices in ElevenLabs and just hand out an Agent ID.

## 7. Functional requirements

### 7.1 Settings page (`/settings`)
All fields are **mandatory**. Form cannot be saved with any field empty.

- **Personal:** Full name, phone, home address, location (area / landmark), nearest BESCOM sub-station
- **ElevenLabs:** Agent ID
- **Smart-dial:**
  - BESCOM helpline number (default `1912`)
  - Reference audio upload (10–30 sec of the BESCOM hold loop) → fingerprinted locally and stored as base64 in `localStorage`
- All inputs start **empty** — no pre-filled defaults
- Browser autofill is disabled (`autoComplete="off"`) to prevent overwrites while typing
- Save persists to `localStorage` and confirms via toast

### 7.2 Call page (`/call`)
- Microphone permission banner with three states: unknown, granted, denied
- Configuration warnings if Agent ID or hold-loop fingerprint is missing
- Large central call orb with phase-aware states: `idle`, `dialing`, `on_hold`, `agent_picked`, `live`
- **Start Call** / **End Call** primary action
- Live conversation metrics:
  - Call duration (mm:ss)
  - Agent turns
  - Your turns
  - **Hold-time saved** (sec spent on hold before AI session started)
- Live transcript pane with role-tagged bubbles (Kannada font)
- Inline error surface for mic and connection failures

### 7.3 Smart-dial pipeline
- Provider-agnostic `CallProvider` interface returning `{ stream: MediaStream, hangup: () => void }`
- Default implementation: `MockCallProvider` — loops the user's reference audio for ~8 sec, then transitions to silence to simulate human pickup
- `HoldLoopDetector` analyzes the live stream:
  - Computes fingerprints in sliding windows
  - Compares against reference (similarity > 0.18 = hold; < 0.05 + voice activity = human)
  - RMS-based VAD confirms a human greeting pattern
- Transitions through phases: `dialing` → `on_hold` → `agent_picked` → `live`
- ElevenLabs `conversation.startSession()` only fires on `agent_picked`
- 25-second safety fallback connects the agent if detection never resolves

### 7.4 ElevenLabs integration
- Uses `@elevenlabs/react` `useConversation` over WebRTC
- Sends dynamic variables only: `name`, `phone_number`, `address`, `location`, `nearest_bescom_station`
- Does **not** override `first_message`, `prompt`, or `language` (the agent must allow these or the call is rejected)

### 7.5 Audio fingerprinting (`src/lib/audioFingerprint.ts`)
- Pure JS, runs in the browser
- Decode → mono 8 kHz → STFT → constellation peak landmarks → hash pairs
- Reference fingerprint stored as base64 in `localStorage`
- No cloud ML, no per-minute cost

### 7.6 Landing page (`/`)
- Explains the tool for both citizens and trainees
- Links to Settings and Call
- Includes electricity / power-grid imagery for context
- App copy is in **English**; only the AI conversation itself is in Kannada

## 8. Non-functional requirements

- **Performance:** Time-to-first-audio < 3s after human pickup detection
- **Detection latency:** Hold → human transition detected within 2 sec
- **Accessibility:** Keyboard-operable controls, visible focus rings, ARIA labels on icon buttons
- **Responsive:** Works at 360px width and up
- **Privacy:** No PII or audio leaves the browser except the dynamic variables passed to ElevenLabs
- **Browser support:** Latest Chrome, Edge, Safari, Firefox with WebRTC + `getUserMedia` + `AudioContext`

## 9. Technical design

| Concern | Choice |
|---|---|
| Framework | TanStack Start v1 (Vite 7, React 19, file-based routing) |
| Styling | Tailwind CSS v4 + semantic tokens in `src/styles.css` (oklch) |
| Voice SDK | `@elevenlabs/react` WebRTC |
| Telephony | Pluggable `CallProvider`; `MockCallProvider` ships by default |
| Audio detection | Pure-JS STFT + landmark fingerprint + RMS VAD |
| State | Local component state + `localStorage` (`src/lib/userProfile.ts`) |
| Hosting | Cloudflare Workers (edge) via `@cloudflare/vite-plugin` |

Routes:
- `/` — landing
- `/call` — call UI (`VoiceAgent` component)
- `/settings` — profile, Agent ID, smart-dial config

Key modules:
- `src/lib/audioFingerprint.ts` — STFT + landmark hashing
- `src/lib/holdLoopDetector.ts` — live stream monitoring + VAD
- `src/lib/callController.ts` — `CallProvider` interface + mock implementation
- `src/components/VoiceAgent.tsx` — phase-based call lifecycle

## 10. Out of scope (for v2)

- Real PSTN dialing in production (requires Twilio/Exotel/Plivo adapter)
- Server-side call recording, transcripts, or analytics
- Scenario library / branching prompts inside the app (handled in ElevenLabs dashboard)
- Supervisor dashboards or progress tracking
- Multi-language UI (UI stays English; only the call is Kannada)
- Multi-utility support (KPTCL, MESCOM, HESCOM, GESCOM, CESC) — BESCOM only for now

## 11. Risks & mitigations

| Risk | Mitigation |
|---|---|
| BESCOM IVR hold loop changes | User can re-upload a fresh reference clip in Settings |
| Fingerprint false negative (never detects human) | 25-sec safety fallback connects agent regardless |
| Fingerprint false positive (connects on hold loop) | VAD cross-check requires speech-pattern, not just low similarity |
| Agent rejects dynamic variables | Document required variable allowlist in README |
| Mic permission blocked at OS level | Clear banner + retry button + error guidance |
| User uploads silence / wrong file | Settings rejects fingerprints with < 50 landmarks |
| Browser autofill overwrites address | `autoComplete="off"` on form and inputs |
| No telephony provider in v2 | Ship mock provider; document `CallProvider` contract for adapters |

## 12. Roadmap

### v2.1
- Twilio outbound adapter (first real telephony integration)
- Post-call summary saved locally (which complaint code, which sub-station, time of day)

### v2.2
- Exotel / Plivo India adapters
- Citizen mode vs. Trainee mode toggle with separate Agent IDs
- Pre-built BESCOM scenario presets (outage, billing, transformer, new connection)

### v3
- Multi-utility support (other Karnataka ESCOMs and beyond)
- Supervisor-shared link that pre-fills Agent ID via query string
- Optional cloud sync for profile across devices

## 13. Open questions

- Should we add a post-call self-rating prompt (1–5) saved locally for personal tracking?
- Should we let the AI proactively call 1912 on a schedule when the user reports recurring outages?
- Is there a public BESCOM API for complaint registration we can supplement the voice call with?

## 14. Release checklist

- [ ] All Settings fields enforced as required
- [ ] Mic banner reflects real `Permissions` API state
- [ ] Call metrics reset on each new call
- [ ] Smart-dial detection verified against a real BESCOM hold-loop recording
- [ ] Hold-time-saved metric increments correctly
- [ ] Safety fallback fires within 25 sec when detection fails
- [ ] No Kannada strings in UI chrome (only inside transcript bubbles)
- [ ] README updated with citizen + trainee setup steps
- [ ] Deployed preview tested on Chrome, Safari, Firefox
