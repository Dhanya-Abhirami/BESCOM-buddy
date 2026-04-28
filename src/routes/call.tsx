import { createFileRoute, Link } from "@tanstack/react-router";
import { VoiceAgent } from "@/components/VoiceAgent";
import { useEffect, useState } from "react";
import { loadProfile, type UserProfile } from "@/lib/userProfile";
import { Settings as SettingsIcon, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/call")({
  head: () => ({
    meta: [
      { title: "Live Call — BESCOM Kannada Voice Agent" },
      {
        name: "description",
        content:
          "Start a live voice call where the AI reports your power cut to BESCOM in Kannada and answers questions sequentially.",
      },
      { property: "og:title", content: "Live Call — BESCOM Kannada Voice Agent" },
      {
        property: "og:description",
        content: "Talk to the AI as the BESCOM agent. It will respond in fluent Kannada.",
      },
    ],
  }),
  component: CallPage,
});

function CallPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  useEffect(() => setProfile(loadProfile()), []);

  if (!profile) return null;

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-8 text-center">
        <div className="font-mono text-xs uppercase tracking-[0.3em] text-accent">Live session</div>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight">BESCOM Voice Call</h1>
        <p className="mt-2 text-base text-muted-foreground">
          You are the BESCOM agent — the AI is the citizen reporting an outage in Kannada.
        </p>
      </div>

      {!profile.agentId && (
        <div className="mb-8 flex items-start gap-3 rounded-xl border border-warning/40 bg-warning/10 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
          <div className="flex-1 text-sm">
            <div className="font-semibold text-foreground">ElevenLabs Agent ID required</div>
            <div className="mt-1 text-muted-foreground">
              Create a Kannada Conversational AI agent on ElevenLabs and paste the Agent ID in Settings.
            </div>
            <Link
              to="/settings"
              className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-warning px-3 py-1.5 text-xs font-semibold text-warning-foreground"
            >
              <SettingsIcon className="h-3.5 w-3.5" />
              Open Settings
            </Link>
          </div>
        </div>
      )}

      <VoiceAgent />

      <div className="mt-10 rounded-xl border border-border bg-card/40 p-5 text-sm text-muted-foreground">
        <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-accent">How it works</div>
        <ol className="list-decimal space-y-1.5 pl-5">
          <li>You play the role of the BESCOM customer-care agent.</li>
          <li>Click <span className="text-foreground">Start Call</span> — the AI greets you in Kannada and reports a power cut.</li>
          <li>Ask questions in Kannada (name, address, station, phone). The AI replies one answer at a time.</li>
          <li>End the call when done.</li>
        </ol>
      </div>
    </div>
  );
}
