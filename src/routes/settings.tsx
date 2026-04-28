import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { loadProfile, saveProfile, defaultProfile, type UserProfile } from "@/lib/userProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Check, ExternalLink, KeyRound } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — BESCOM Kannada Voice Agent" },
      {
        name: "description",
        content: "Configure your name, phone, address, nearest BESCOM station, and ElevenLabs Agent ID.",
      },
      { property: "og:title", content: "Settings — BESCOM Kannada Voice Agent" },
      {
        property: "og:description",
        content: "Set the personal details the AI will use when answering BESCOM questions.",
      },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setProfile(loadProfile());
  }, []);

  const update = <K extends keyof UserProfile>(key: K, value: UserProfile[K]) =>
    setProfile((p) => ({ ...p, [key]: value }));

  const onSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveProfile(profile);
    setSaved(true);
    toast.success("Saved", { description: "Your details are stored locally on this device." });
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <div className="mb-10">
        <div className="font-mono text-xs uppercase tracking-[0.3em] text-accent">Configuration</div>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight">Agent Settings</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          The AI shares these details with BESCOM only when asked. Stored locally in your browser.
        </p>
      </div>

      <form onSubmit={onSave} className="space-y-8">
        {/* Personal */}
        <section className="rounded-2xl border border-border bg-card/60 p-6">
          <h2 className="mb-1 font-display text-lg font-semibold">Personal details</h2>
          <p className="mb-5 text-sm text-muted-foreground">Used by the AI when BESCOM asks for them.</p>

          <div className="space-y-5">
            <Field
              label="Full Name"
              kn="ಪೂರ್ಣ ಹೆಸರು"
              value={profile.name}
              onChange={(v) => update("name", v)}
              kannada
            />
            <Field
              label="Phone Number"
              kn="ಫೋನ್ ಸಂಖ್ಯೆ"
              value={profile.phone}
              onChange={(v) => update("phone", v)}
              type="tel"
              maxLength={15}
            />
            <FieldArea
              label="Home Address"
              kn="ಮನೆ ವಿಳಾಸ"
              value={profile.address}
              onChange={(v) => update("address", v)}
            />
            <Field
              label="Nearest BESCOM Station"
              kn="ಹತ್ತಿರದ ಬೆಸ್ಕಾಂ ಕೇಂದ್ರ"
              value={profile.nearestStation}
              onChange={(v) => update("nearestStation", v)}
              kannada
            />
          </div>
        </section>

        {/* ElevenLabs */}
        <section className="rounded-2xl border border-border bg-card/60 p-6">
          <div className="mb-1 flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-accent" />
            <h2 className="font-display text-lg font-semibold">ElevenLabs Agent</h2>
          </div>
          <p className="mb-5 text-sm text-muted-foreground">
            Create a Conversational AI agent at{" "}
            <a
              className="text-accent hover:underline"
              href="https://elevenlabs.io/app/conversational-ai"
              target="_blank"
              rel="noreferrer"
            >
              elevenlabs.io <ExternalLink className="inline h-3 w-3" />
            </a>{" "}
            with a Kannada voice. Enable <em>prompt</em>, <em>first&nbsp;message</em>, and <em>language</em> overrides
            in the agent's Security settings, then paste the Agent ID below.
          </p>

          <div>
            <Label htmlFor="agentId" className="text-xs uppercase tracking-wider text-muted-foreground">
              Agent ID
            </Label>
            <Input
              id="agentId"
              value={profile.agentId}
              onChange={(e) => update("agentId", e.target.value.trim())}
              placeholder="agent_01abc..."
              className="mt-1.5 font-mono"
              maxLength={100}
            />
          </div>
        </section>

        <div className="flex items-center justify-end gap-3">
          <Button
            type="submit"
            size="lg"
            className="gradient-power text-primary-foreground hover:opacity-90 glow-amber h-12 px-7 font-semibold"
          >
            {saved ? <Check className="mr-2 h-4 w-4" /> : null}
            {saved ? "Saved" : "Save settings"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  kn,
  value,
  onChange,
  type = "text",
  kannada,
  maxLength = 200,
}: {
  label: string;
  kn: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  kannada?: boolean;
  maxLength?: number;
}) {
  return (
    <div>
      <Label className="flex items-baseline justify-between text-xs uppercase tracking-wider text-muted-foreground">
        <span>{label}</span>
        <span className="font-kannada text-[11px] normal-case tracking-normal text-muted-foreground/80">{kn}</span>
      </Label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        className={`mt-1.5 ${kannada ? "font-kannada text-base" : ""}`}
      />
    </div>
  );
}

function FieldArea({
  label,
  kn,
  value,
  onChange,
}: {
  label: string;
  kn: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <Label className="flex items-baseline justify-between text-xs uppercase tracking-wider text-muted-foreground">
        <span>{label}</span>
        <span className="font-kannada text-[11px] normal-case tracking-normal text-muted-foreground/80">{kn}</span>
      </Label>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={500}
        rows={3}
        className="mt-1.5 font-kannada text-base resize-none"
      />
    </div>
  );
}
