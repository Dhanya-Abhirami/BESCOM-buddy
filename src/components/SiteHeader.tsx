import { Link } from "@tanstack/react-router";
import { Zap } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link to="/" className="group flex items-center gap-2.5">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-lg gradient-power text-primary-foreground glow-amber transition-transform group-hover:scale-105">
            <Zap className="h-5 w-5" strokeWidth={2.5} />
          </div>
          <div className="leading-tight">
            <div className="font-display text-sm font-bold tracking-tight">BESCOM Voice Agent</div>
            <div className="text-[11px] text-muted-foreground">Kannada · Bengaluru</div>
          </div>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link
            to="/"
            className="rounded-md px-3 py-1.5 text-muted-foreground transition hover:text-foreground"
            activeProps={{ className: "rounded-md px-3 py-1.5 text-foreground bg-secondary" }}
            activeOptions={{ exact: true }}
          >
            Home
          </Link>
          <Link
            to="/call"
            className="rounded-md px-3 py-1.5 text-muted-foreground transition hover:text-foreground"
            activeProps={{ className: "rounded-md px-3 py-1.5 text-foreground bg-secondary" }}
          >
            Call
          </Link>
          <Link
            to="/settings"
            className="rounded-md px-3 py-1.5 text-muted-foreground transition hover:text-foreground"
            activeProps={{ className: "rounded-md px-3 py-1.5 text-foreground bg-secondary" }}
          >
            Settings
          </Link>
        </nav>
      </div>
    </header>
  );
}
