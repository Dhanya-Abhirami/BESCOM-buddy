import { useConversation, ConversationProvider } from "@elevenlabs/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Phone, PhoneOff, Loader2, AlertCircle, ShieldCheck, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { loadProfile, buildKannadaSystemPrompt, FIRST_MESSAGE } from "@/lib/userProfile";

type Transcript = { id: string; role: "agent" | "user"; text: string };
type MicPermission = "unknown" | "checking" | "granted" | "denied";

export function VoiceAgent() {
  return (
    <ConversationProvider>
      <VoiceAgentInner />
    </ConversationProvider>
  );
}

function VoiceAgentInner() {
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [micPermission, setMicPermission] = useState<MicPermission>("unknown");

  // Metrics
  const [elapsed, setElapsed] = useState(0);
  const startedAtRef = useRef<number | null>(null);
  const agentTurnsRef = useRef(0);
  const userTurnsRef = useRef(0);
  const [, force] = useState(0);

  const conversation = useConversation({
    onConnect: () => {
      setError(null);
      setTranscripts([]);
      agentTurnsRef.current = 0;
      userTurnsRef.current = 0;
      startedAtRef.current = Date.now();
      setElapsed(0);
    },
    onDisconnect: () => {
      setIsStarting(false);
      startedAtRef.current = null;
    },
    onError: (e) => {
      console.error("Conversation error", e);
      setError(typeof e === "string" ? e : "Connection error — check your Agent ID and try again.");
      setIsStarting(false);
    },
    onMessage: (msg: { source?: string; message?: string }) => {
      if (!msg?.message) return;
      const role: "agent" | "user" = msg.source === "user" ? "user" : "agent";
      if (role === "agent") agentTurnsRef.current += 1;
      else userTurnsRef.current += 1;
      force((n) => n + 1);
      setTranscripts((t) => [
        ...t,
        { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, role, text: msg.message! },
      ]);
    },
  });

  const status = conversation.status;
  const isConnected = status === "connected";
  const isSpeaking = conversation.isSpeaking;

  // Check mic permission on mount via Permissions API (when supported)
  useEffect(() => {
    let cancelled = false;
    async function check() {
      try {
        const res = await navigator.permissions?.query?.({ name: "microphone" as PermissionName });
        if (cancelled || !res) return;
        const map = (s: PermissionState): MicPermission =>
          s === "granted" ? "granted" : s === "denied" ? "denied" : "unknown";
        setMicPermission(map(res.state));
        res.onchange = () => setMicPermission(map(res.state));
      } catch {
        // Permissions API unsupported — leave as "unknown"
      }
    }
    check();
    return () => { cancelled = true; };
  }, []);

  // Tick elapsed time while connected
  useEffect(() => {
    if (!isConnected) return;
    const id = window.setInterval(() => {
      if (startedAtRef.current) setElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000));
    }, 500);
    return () => window.clearInterval(id);
  }, [isConnected]);

  const requestMic = useCallback(async () => {
    setMicPermission("checking");
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setMicPermission("granted");
    } catch {
      setMicPermission("denied");
      setError("Microphone access was blocked. Enable it in your browser site settings and try again.");
    }
  }, []);

  const start = useCallback(async () => {
    setError(null);
    setIsStarting(true);
    const profile = loadProfile();
    if (!profile.agentId) {
      setError("Please set your ElevenLabs Agent ID in Settings first.");
      setIsStarting(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setMicPermission("granted");
      await conversation.startSession({
        agentId: profile.agentId,
        connectionType: "webrtc",
        overrides: {
          agent: {
            prompt: { prompt: buildKannadaSystemPrompt(profile) },
            firstMessage: FIRST_MESSAGE,
            language: "kn",
          },
        },
      });
    } catch (e) {
      console.error(e);
      const msg = e instanceof Error ? e.message : "Failed to start the call.";
      if (/permission|denied|NotAllowed/i.test(msg)) setMicPermission("denied");
      setError(
        e instanceof Error
          ? `${e.message} — make sure mic access is allowed and your agent permits prompt/firstMessage/language overrides.`
          : "Failed to start the call.",
      );
      setIsStarting(false);
    }
  }, [conversation]);

  const stop = useCallback(async () => {
    await conversation.endSession();
  }, [conversation]);

  useEffect(() => {
    return () => {
      if (conversation.status === "connected") {
        try { void conversation.endSession(); } catch { /* noop */ }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fmtTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="space-y-8">
      {/* Mic permission banner */}
      <div
        className={`mx-auto flex max-w-xl items-start gap-3 rounded-xl border p-4 text-sm ${
          micPermission === "granted"
            ? "border-success/40 bg-success/10"
            : micPermission === "denied"
              ? "border-destructive/40 bg-destructive/10"
              : "border-border bg-card/60"
        }`}
      >
        {micPermission === "granted" ? (
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
        ) : micPermission === "denied" ? (
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
        ) : (
          <Mic className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        )}
        <div className="flex-1">
          <div className="font-semibold text-foreground">
            {micPermission === "granted"
              ? "Microphone ready"
              : micPermission === "denied"
                ? "Microphone blocked"
                : "Microphone access required"}
          </div>
          <div className="text-muted-foreground">
            {micPermission === "granted"
              ? "Your browser has granted mic access for this site."
              : micPermission === "denied"
                ? "Allow microphone access in your browser site settings, then reload."
                : "We need your microphone to capture your voice as the BESCOM agent."}
          </div>
        </div>
        {micPermission !== "granted" && (
          <Button size="sm" variant="outline" onClick={requestMic} disabled={micPermission === "checking"}>
            {micPermission === "checking" ? "Checking…" : "Allow mic"}
          </Button>
        )}
      </div>

      {/* Call orb */}
      <div className="relative mx-auto flex h-72 w-72 items-center justify-center">
        <div className="absolute inset-0 rounded-full border border-primary/20" />
        <div className="absolute inset-6 rounded-full border border-accent/20" />
        <div
          className={`relative flex h-44 w-44 items-center justify-center rounded-full transition-all ${
            isConnected ? "gradient-power glow-amber" : "bg-secondary"
          } ${isSpeaking ? "pulse-ring" : ""}`}
        >
          {isStarting ? (
            <Loader2 className="h-14 w-14 animate-spin text-primary-foreground" strokeWidth={2} />
          ) : isConnected ? (
            isSpeaking ? (
              <Mic className="h-14 w-14 text-primary-foreground flicker" strokeWidth={2} />
            ) : (
              <MicOff className="h-14 w-14 text-primary-foreground" strokeWidth={2} />
            )
          ) : (
            <Phone className="h-14 w-14 text-muted-foreground" strokeWidth={2} />
          )}
        </div>
      </div>

      {/* Status */}
      <div className="text-center">
        <div className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
          {isStarting ? "connecting" : isConnected ? (isSpeaking ? "agent speaking" : "listening") : "idle"}
        </div>
        <h2 className="mt-2 font-display text-2xl font-semibold text-foreground">
          {isConnected ? "Call in progress" : "Ready to start"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {isConnected ? "Speak in Kannada as the BESCOM agent." : "Tap the button below to begin."}
        </p>
      </div>

      {/* Metrics */}
      <div className="mx-auto grid max-w-xl grid-cols-3 gap-3">
        <Metric label="Duration" value={fmtTime(elapsed)} />
        <Metric label="Agent turns" value={String(agentTurnsRef.current)} />
        <Metric label="Your turns" value={String(userTurnsRef.current)} />
      </div>

      {/* Controls */}
      <div className="flex justify-center">
        {!isConnected ? (
          <Button
            onClick={start}
            disabled={isStarting || micPermission === "denied"}
            size="lg"
            className="gradient-power text-primary-foreground hover:opacity-90 glow-amber h-14 px-8 text-base font-semibold"
          >
            <Phone className="mr-2 h-5 w-5" />
            Start Call
          </Button>
        ) : (
          <Button onClick={stop} variant="destructive" size="lg" className="h-14 px-8 text-base font-semibold">
            <PhoneOff className="mr-2 h-5 w-5" />
            End Call
          </Button>
        )}
      </div>

      {error && (
        <div className="mx-auto flex max-w-xl items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive-foreground">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <div>{error}</div>
        </div>
      )}

      {/* Transcript */}
      <div className="rounded-2xl border border-border bg-card/60 backdrop-blur-sm">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">Live Transcript</div>
          <div className="flex items-center gap-1.5">
            <span className={`h-1.5 w-1.5 rounded-full ${isConnected ? "bg-success" : "bg-muted-foreground"}`} />
            <span className="font-mono text-[10px] uppercase text-muted-foreground">
              {isConnected ? "REC" : "off"}
            </span>
          </div>
        </div>
        <div className="max-h-96 min-h-[12rem] overflow-y-auto p-5">
          {transcripts.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Conversation will appear here once the call starts.
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence initial={false}>
                {transcripts.map((t) => (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${t.role === "agent" ? "justify-start" : "justify-end"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 font-kannada text-[15px] leading-relaxed ${
                        t.role === "agent"
                          ? "bg-primary/15 text-foreground border border-primary/30"
                          : "bg-accent/15 text-foreground border border-accent/30"
                      }`}
                    >
                      <div className="mb-0.5 font-mono text-[10px] uppercase tracking-wider opacity-60">
                        {t.role === "agent" ? "AI (citizen)" : "You (BESCOM)"}
                      </div>
                      {t.text}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card/60 px-4 py-3 text-center">
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-xl font-semibold tabular-nums text-foreground">{value}</div>
    </div>
  );
}
