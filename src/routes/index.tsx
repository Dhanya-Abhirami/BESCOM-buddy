import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Zap, Phone, MessageSquare, Brain, Shield, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import powerGridHero from "@/assets/power-grid-hero.jpg";
import electricCurrent from "@/assets/electric-current.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BESCOM Kannada Voice Agent — Report power cuts in Kannada" },
      {
        name: "description",
        content:
          "AI-powered Kannada voice agent that calls BESCOM to report power outages on your behalf. Sequential, polite, human-like conversation.",
      },
      { property: "og:title", content: "BESCOM Kannada Voice Agent" },
      {
        property: "og:description",
        content: "AI agent that reports power cuts to BESCOM in Kannada — naturally and politely.",
      },
      { property: "og:image", content: powerGridHero },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <div className="relative">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={powerGridHero}
            alt="High-voltage transmission grid at twilight with arcing electricity"
            width={1920}
            height={1080}
            className="h-full w-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
        </div>
        <div className="grid-bg absolute inset-0 opacity-30" />
        <div className="relative mx-auto max-w-6xl px-6 pt-24 pb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="mx-auto max-w-3xl text-center"
          >
            <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-mono uppercase tracking-[0.2em] text-primary">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
              Kannada Voice Agent · Live
            </div>

            <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl">
              Report power cuts to{" "}
              <span className="bg-gradient-to-br from-primary via-primary to-accent bg-clip-text text-transparent text-glow-amber">
                BESCOM
              </span>{" "}
              — without lifting a finger.
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground md:text-xl">
              An AI citizen that calls BESCOM customer care, reports your outage, and answers
              every question in fluent Kannada — politely, sequentially, like a real person.
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link to="/call">
                <Button
                  size="lg"
                  className="gradient-power text-primary-foreground hover:opacity-90 glow-amber h-14 px-8 text-base font-semibold"
                >
                  <Phone className="mr-2 h-5 w-5" />
                  Start a Call
                </Button>
              </Link>
              <Link to="/settings">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 px-8 text-base font-semibold border-border hover:bg-secondary"
                >
                  Configure Agent
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Floating preview card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7 }}
            className="mx-auto mt-20 max-w-2xl"
          >
            <div className="rounded-3xl border border-border bg-card/70 p-1 shadow-[var(--shadow-elev)] backdrop-blur-xl">
              <div className="rounded-[20px] bg-background/40 p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-muted-foreground" />
                    <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                      Live transcript
                    </span>
                  </div>
                  <span className="font-mono text-xs text-muted-foreground">00:00</span>
                </div>
                <div className="flex min-h-[10rem] items-center justify-center px-4 py-10 text-center text-sm text-muted-foreground">
                  Configure your details in Settings, then start a call to see the live Kannada conversation here.
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="relative border-t border-border bg-background/40 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <div className="font-mono text-xs uppercase tracking-[0.3em] text-accent">Capabilities</div>
            <h2 className="mt-3 font-display text-4xl font-bold tracking-tight">
              Built to sound like a real person.
            </h2>
          </div>

          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {[
              {
                icon: MessageSquare,
                title: "Sequential answers",
                body: "Shares only the information BESCOM specifically asks for — no info dumps.",
              },
              {
                icon: Brain,
                title: "Stateful memory",
                body: "Remembers what's been shared, never repeats itself, handles clarifications gracefully.",
              },
              {
                icon: Shield,
                title: "Polite & natural",
                body: "Natural Kannada phrasing with the politeness expected in a customer-care call.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card/60 p-7 transition hover:border-primary/40"
              >
                <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-xl font-semibold">{f.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
                <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-primary/5 blur-2xl transition group-hover:bg-primary/15" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden py-24">
        <img
          src={electricCurrent}
          alt="Electric current arcing through darkness"
          width={1280}
          height={832}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/70 to-background" />
        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <Zap className="mx-auto h-10 w-10 text-primary flicker" strokeWidth={2} />
          <h2 className="mt-6 font-display text-4xl font-bold tracking-tight">
            Your voice. Powered by AI.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Let an intelligent agent handle the call while you get on with your day.
          </p>
          <Link to="/call" className="mt-8 inline-block">
            <Button
              size="lg"
              className="gradient-power text-primary-foreground hover:opacity-90 glow-amber h-14 px-10 text-base font-semibold"
            >
              Try it now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center font-mono text-xs uppercase tracking-widest text-muted-foreground">
        Made for Bengaluru
      </footer>
    </div>
  );
}
