import { useConversation } from "@elevenlabs/react";
import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Phone, PhoneOff, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { loadProfile, buildKannadaSystemPrompt, FIRST_MESSAGE } from "@/lib/userProfile";

type Transcript = { id: string; role: "agent" | "user"; text: string };

export function VoiceAgent() {
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  const conversation = useConversation({
    onConnect: () => {
      setError(null);
      setTranscripts([]);
    },
    onDisconnect: () => {
      setIsStarting(false);
    },
    onError: (e) => {
      console.error("Conversation error", e);
      setError(typeof e === "string" ? e : "ಸಂಪರ್ಕದಲ್ಲಿ ಸಮಸ್ಯೆ. Connection error — check your Agent ID and try again.");
      setIsStarting(false);
    },
    onMessage: (msg: { source?: string; message?: string }) => {
      if (!msg?.message) return;
      const role: "agent" | "user" = msg.source === "user" ? "user" : "agent";
      setTranscripts((t) => [
        ...t,
        { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, role, text: msg.message! },
      ]);
    },
  });

  const status = conversation.status;
  const isConnected = status === "connected";
  const isSpeaking = conversation.isSpeaking;

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
      await navigator.mediaDevices.getUserMedia({ audio: true });
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
      setError(
        e instanceof Error
          ? `${e.message} — make sure your agent allows prompt/firstMessage/language overrides.`
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
        conversation.endSession().catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-8">
      {/* Call orb */}
      <div className="relative mx-auto flex h-72 w-72 items-center justify-center">
        {/* outer rings */}
        <div className="absolute inset-0 rounded-full border border-primary/20" />
        <div className="absolute inset-6 rounded-full border border-accent/20" />
        {/* pulse when speaking */}
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
        <h2 className="mt-2 font-kannada text-2xl text-foreground">
          {isConnected ? "ಕರೆ ಸಕ್ರಿಯವಾಗಿದೆ" : "ಕರೆ ಪ್ರಾರಂಭಿಸಲು ಸಿದ್ಧ"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {isConnected ? "Speak in Kannada as the BESCOM agent." : "Tap the button below to begin."}
        </p>
      </div>

      {/* Controls */}
      <div className="flex justify-center">
        {!isConnected ? (
          <Button
            onClick={start}
            disabled={isStarting}
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
              ಸಂಭಾಷಣೆ ಇಲ್ಲಿ ಕಾಣಿಸುತ್ತದೆ — Conversation will appear here.
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
