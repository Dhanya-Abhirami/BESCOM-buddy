# Product Requirements Document — BESCOM Voice Agent Trainer

**Status:** v1.0
**Last updated:** April 29, 2026
**Owner:** BESCOM Training

---

## 1. Overview

The BESCOM Voice Agent Trainer is a browser-based simulator that helps BESCOM (Bangalore Electricity Supply Company) customer-care staff practice live, Kannada-language phone conversations with citizens. An ElevenLabs Conversational AI agent plays the role of a citizen reporting an electricity issue (outage, billing, transformer fault, etc.); the trainee responds as the BESCOM agent.

## 2. Problem

New BESCOM call-center staff need realistic, repeatable practice in Kannada before taking real citizen calls. Live shadowing is expensive, inconsistent, and limited by trainer availability. Generic call-center training tools do not speak Kannada or understand BESCOM-specific context (sub-stations, complaint codes, area names).

## 3. Goals

| # | Goal | Success metric |
|---|---|---|
| G1 | Provide on-demand Kannada voice practice | Trainee can complete an end-to-end call in < 1 minute of setup |
| G2 | Surface conversation quality signals | Live duration, agent turns, and trainee turns visible during call |
| G3 | Pass realistic citizen context to the AI | Name, phone, address, location, nearest sub-station sent as dynamic variables |
| G4 | Zero-backend, zero-account onboarding | Profile stored in `localStorage`; only an ElevenLabs Agent ID is required |

## 4. Non-goals

- Recording, scoring, or storing past calls server-side
- User accounts, authentication, or multi-tenant management
- Overriding the agent's prompt/first message/language from the client
- Mobile-native apps (responsive web only)
- Real BESCOM CRM/ticketing integration

## 5. Users & personas

- **Trainee BESCOM agent** — primary user; needs fluent Kannada practice, immediate feedback signals, no friction
- **Training supervisor** — configures the ElevenLabs agent's persona/scenarios in the ElevenLabs dashboard, distributes the Agent ID to trainees

## 6. User stories

1. As a trainee, I open the app, enter my details once, and start a call within seconds.
2. As a trainee, I see my microphone permission state clearly and can fix it without leaving the page.
3. As a trainee, I see live Kannada transcript bubbles for both sides so I can self-correct.
4. As a trainee, I see live metrics (duration, turn counts) so I can pace myself.
5. As a supervisor, I configure prompts/voices in ElevenLabs and just hand out an Agent ID.

## 7. Functional requirements

### 7.1 Settings page (`/settings`)
- Inputs: name, phone, home address, location (area / landmark), nearest BESCOM sub-station, ElevenLabs Agent ID
- All fields start **empty** — no pre-filled defaults
- Browser autofill is disabled to prevent overwrites while typing
- Persisted to `localStorage`; "Save" confirms via toast

### 7.2 Call page (`/call`)
- Microphone permission banner with three states: unknown, granted, denied
- Large central call orb with idle / connecting / listening / speaking states
- **Start Call** / **End Call** primary action
- Live conversation metrics: duration (mm:ss), agent turns, your turns
- Live transcript pane with role-tagged bubbles (Kannada font)
- Inline error surface for mic and connection failures

### 7.3 ElevenLabs integration
- Uses `@elevenlabs/react` `useConversation` over WebRTC
- Sends dynamic variables only: `name`, `phone_number`, `address`, `location`, `nearest_bescom_station`
- Does **not** override `first_message`, `prompt`, or `language` (the agent must allow these or the call is rejected)

### 7.4 Landing page (`/`)
- Explains the tool, links to Settings and Call
- Includes electricity / power-grid imagery for context
- App copy is in **English**; only the AI conversation itself is in Kannada

## 8. Non-functional requirements

- **Performance:** Time-to-first-audio < 3s on a typical broadband connection
- **Accessibility:** Keyboard-operable controls, visible focus rings, ARIA labels on icon buttons
- **Responsive:** Works at 360px width and up
- **Privacy:** No PII leaves the browser except the dynamic variables passed to ElevenLabs
- **Browser support:** Latest Chrome, Edge, Safari, Firefox with WebRTC + `getUserMedia`

## 9. Technical design

| Concern | Choice |
|---|---|
| Framework | TanStack Start v1 (Vite 7, React 19, file-based routing) |
| Styling | Tailwind CSS v4 + semantic tokens in `src/styles.css` (oklch) |
| Voice SDK | `@elevenlabs/react` WebRTC |
| State | Local component state + `localStorage` (`src/lib/userProfile.ts`) |
| Hosting | Cloudflare Workers (edge) via `@cloudflare/vite-plugin` |

Routes:
- `/` — landing
- `/call` — call UI (`VoiceAgent` component)
- `/settings` — profile form

## 10. Out of scope (for v1)

- Server-side call recording, transcripts, or analytics
- Scenario library / branching prompts inside the app (handled in ElevenLabs dashboard)
- Supervisor dashboards or progress tracking
- Multi-language UI (UI stays English; only the call is Kannada)

## 11. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Agent rejects dynamic variables | Document required variable allowlist in README |
| Mic permission blocked at OS level | Clear banner + retry button + error guidance |
| Trainees forget Agent ID | Settings field is required before call can start |
| Browser autofill overwrites address | `autoComplete="off"` on form and inputs |

## 12. Open questions

- Should we add a post-call self-rating prompt (1–5) saved locally for personal tracking?
- Should we ship a curated list of standard BESCOM scenarios (outage, billing, new connection) as Agent ID presets?
- Do we need a supervisor-shared link that pre-fills the Agent ID via query string?

## 13. Release checklist

- [ ] All Settings fields validated as empty by default
- [ ] Mic banner reflects real `Permissions` API state
- [ ] Call metrics reset on each new call
- [ ] No Kannada strings in UI chrome (only inside transcript bubbles)
- [ ] README updated with ElevenLabs setup steps
- [ ] Deployed preview tested on Chrome, Safari, Firefox
