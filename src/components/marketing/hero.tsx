import Link from "next/link";
import { ArrowRight, Box } from "lucide-react";

import { Button } from "@/components/ui/button";

const HEADLINE = ["From", "scan", "to", "intelligent", "asset"];
const HIGHLIGHT = 3;

// Copy sits low so the upper frame stays clear
export function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <video
          src="/media/twintag-demo.mp4"
          poster="/media/twintag-demo-poster.jpg"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
          className="size-full object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-b from-slate-950/70 via-slate-900/55 to-slate-900/35" />
      </div>

      <div className="relative z-20 mx-auto max-w-6xl px-8 pt-[25vh] pb-24 sm:pt-[32vh] md:px-12 md:pt-[34vh] lg:pt-[35vh] xl:px-4">
        <div className="max-w-3xl">
          <p className="text-white/85 text-lg font-bold">
            JunctionX 2026 • Vaasa, Finland
          </p>
          <h1 className="font-display flex flex-row flex-wrap gap-x-[0.28em] text-5xl leading-tight font-light tracking-tight text-white drop-shadow-[0_10px_30px_rgba(0,0,0,0.35)] lg:flex-nowrap lg:text-7xl">
            {HEADLINE.map((word, i) => (
              <span
                key={word + i}
                className={
                  i === HIGHLIGHT
                    ? "animate-rise bg-linear-to-r from-white via-sky-300 to-blue-300 bg-clip-text text-transparent"
                    : "animate-rise"
                }
                style={{ animationDelay: `${0.1 + i * 0.06}s` }}
              >
                {word}
              </span>
            ))}
          </h1>

          <p
            className="animate-rise mt-5 max-w-[62ch] text-base leading-relaxed text-white/85 md:text-xl"
            style={{ animationDelay: "0.45s" }}
          >
            TwinTag reads industrial E57 scans, recognizes cubicles and devices,
            and anchors useful asset records exactly where they belong.
          </p>

          <div
            className="animate-rise mt-8 flex flex-col gap-4 sm:flex-row"
            style={{ animationDelay: "0.6s" }}
          >
            <Button asChild size="lg" variant="secondary" className="h-14 px-8">
              <Link href="/workspace">
                <Box />
                Open the app
              </Link>
            </Button>
            <Button asChild size="lg" variant="dark" className="h-14 px-8">
              <Link href="/#workflow">
                How it works
                <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
