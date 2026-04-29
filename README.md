# BESCOM Voice Agent Trainer

A web app that lets BESCOM (Bangalore Electricity Supply Company) staff practice handling citizen calls in **Kannada**, powered by an ElevenLabs conversational AI agent. The AI plays the role of a citizen calling about an electricity issue; you respond as the BESCOM agent.

> Built with TanStack Start, React 19, Tailwind CSS v4, and the ElevenLabs React SDK.

---

## Features

- **Realistic voice calls** — full-duplex WebRTC conversation with an ElevenLabs agent
- **Live Kannada transcript** — see both sides of the conversation as it happens
- **Conversation metrics** — live duration, agent turns, and your turns
- **Microphone permission flow** — clear status banner and one-click request
- **Personal context passthrough** — your name, phone, address, location, and nearest BESCOM station are sent to the agent as dynamic variables
- **Settings persistence** — profile saved to `localStorage` (no account needed)
- **Themed UI** — dark, energy-grid aesthetic with semantic design tokens

---

## Quick start

```bash
bun install
bun run dev
```

Open http://localhost:3000 and:

1. Go to **Settings**, enter your details and your **ElevenLabs Agent ID**
2. Go to **Call**, allow microphone access, and press **Start Call**

### Build

```bash
bun run build
bun run preview
```

---

## ElevenLabs setup

You need an ElevenLabs Conversational AI **Agent ID**.

1. Create an agent at https://elevenlabs.io/app/conversational-ai
2. In the agent's **Security** settings, allow these dynamic variables:
   - `name`
   - `phone_number`
   - `address`
   - `location`
   - `nearest_bescom_station`
3. Copy the Agent ID into the app's **Settings** page

> The app does not override the agent's prompt, first message, or language — those are controlled in the ElevenLabs dashboard. Configure the agent there to speak Kannada and play the citizen role.

---

## Project structure

```
src/
├── routes/
│   ├── __root.tsx          # Root layout (html shell)
│   ├── index.tsx           # Landing page
│   ├── call.tsx            # Live call screen
│   └── settings.tsx        # Profile & Agent ID
├── components/
│   ├── VoiceAgent.tsx      # Core call UI + ElevenLabs SDK wiring
│   └── SiteHeader.tsx
├── lib/
│   └── userProfile.ts      # localStorage profile helpers
├── assets/                 # Hero & illustration images
└── styles.css              # Design tokens (oklch) + Tailwind v4
```

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | TanStack Start v1 (Vite 7) |
| UI | React 19, Tailwind CSS v4, shadcn/ui, Framer Motion |
| Voice | `@elevenlabs/react` (WebRTC) |
| Storage | Browser `localStorage` |
| Deploy | Cloudflare Workers (`wrangler.jsonc`) |

---

## Privacy

All profile data lives in your browser's `localStorage`. Nothing is sent to a backend except the dynamic variables passed to your ElevenLabs agent at the start of a call.

---

## License

Internal training tool. See `PRD.md` for product requirements.
