"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Box,
  Check,
  CircleDot,
  FileText,
  Maximize2,
  ScanLine,
  Upload,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Selection = "cubicle" | "rex615";
const assets = [
  {
    id: "cubicle" as const,
    label: "Cubicle A",
    kind: "Equipment group",
    confidence: 98,
  },
  {
    id: "rex615" as const,
    label: "ABB REX615",
    kind: "Protection relay",
    confidence: 96,
  },
];

export function WorkspaceDemo() {
  const [selected, setSelected] = useState<Selection>("rex615");
  const active = assets.find((asset) => asset.id === selected)!;

  return (
    <div className="flex min-h-dvh flex-col gap-4 p-4 pt-20 sm:p-6 md:pt-6 lg:p-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            HOS — Solar 2
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            18 sweeps · 108 images · E57 ready
          </p>
        </div>
        <Button>
          <Upload />
          Process scan
        </Button>
      </div>

      <div className="grid min-h-[680px] flex-1 overflow-hidden rounded-2xl border bg-background shadow-card xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="flex min-h-[580px] min-w-0 flex-col bg-slate-950">
          <div className="flex min-h-14 items-center justify-between gap-3 border-b border-white/10 px-4 text-white">
            <div className="flex items-center gap-3 text-sm">
              <span className="flex items-center gap-2 font-medium">
                <span className="size-2 rounded-full bg-emerald-400" />
                Spatial preview
              </span>
            </div>
            <button
              type="button"
              aria-label="Open fullscreen"
              className="grid size-8 place-items-center text-slate-400 transition hover:text-white"
            >
              <Maximize2 size={17} />
            </button>
          </div>

          <div className="relative flex-1 overflow-hidden">
            <Image
              src="/images/scan-preview.jpg"
              alt="Mock spatial preview of the industrial scan"
              fill
              priority
              className="object-cover brightness-[.72] saturate-[.7]"
              sizes="(min-width: 1280px) 70vw, 100vw"
            />
            <div className="absolute inset-0 bg-linear-to-t from-slate-950/75 via-transparent to-slate-950/15" />
            <SpatialTag
              className="top-[33%] left-[58%]"
              label="Cubicle A"
              active={selected === "cubicle"}
              onClick={() => setSelected("cubicle")}
            />
            <SpatialTag
              className="top-[52%] left-[70%]"
              label="ABB REX615"
              active={selected === "rex615"}
              onClick={() => setSelected("rex615")}
              accent
            />
          </div>
        </section>

        <aside className="flex min-h-0 flex-col border-t bg-background xl:border-t-0 xl:border-l">
          <div className="flex h-14 items-center border-b px-5">
            <div>
              <p className="text-sm font-semibold">Detected assets</p>
              <p className="text-xs text-muted-foreground">2 results</p>
            </div>
          </div>
          <div className="border-b py-2">
            {assets.map((asset) => (
              <button
                key={asset.id}
                type="button"
                onClick={() => setSelected(asset.id)}
                className={cn(
                  "flex w-full items-center gap-3 border-l-2 px-5 py-3 text-left transition",
                  selected === asset.id
                    ? "border-primary bg-blue-50/70"
                    : "border-transparent hover:bg-subtle",
                )}
              >
                <span
                  className={cn(
                    "grid size-9 shrink-0 place-items-center rounded-xl",
                    asset.id === "cubicle"
                      ? "bg-zinc-200 text-zinc-700"
                      : "bg-blue-100 text-blue-700",
                  )}
                >
                  {asset.id === "cubicle" ? (
                    <Box size={17} />
                  ) : (
                    <CircleDot size={17} />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {asset.label}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {asset.kind}
                  </span>
                </span>
                <span className="text-xs font-semibold text-emerald-700">
                  {asset.confidence}%
                </span>
              </button>
            ))}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-5">
            <div>
              <p className="text-xs font-semibold tracking-wide text-primary uppercase">
                Selected asset
              </p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight">
                {active.label}
              </h2>
            </div>
            {selected === "rex615" ? <DeviceDetails /> : <CubicleDetails />}
          </div>
          <div className="border-t p-4">
            <Button className="w-full">
              <Check />
              Publish tag
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function DeviceDetails() {
  return (
    <>
      <div className="relative mt-5 aspect-[16/8] overflow-hidden rounded-xl bg-subtle">
        <Image
          src="/images/rex615/front.jpg"
          alt="ABB REX615 reference device"
          fill
          className="object-contain p-3"
          sizes="330px"
        />
      </div>
      <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
        <Detail label="Confidence" value="96.4%" />
        <Detail label="Parent" value="Cubicle A" />
      </dl>
      <p className="mt-5 border-t pt-4 font-mono text-xs text-muted-foreground">
        XYZ · 16.9208, 10.3897, 0.9231
      </p>
      <div className="mt-5">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Related documents
        </p>
        <Document title="REX615 technical manual" />
      </div>
    </>
  );
}

function CubicleDetails() {
  return (
    <div className="mt-5 rounded-2xl border bg-subtle p-5">
      <Box className="text-primary" />
      <p className="mt-4 text-sm font-medium">Equipment group</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        This cubicle contains one recognized protection relay and provides its
        spatial parent.
      </p>
      <div className="mt-4 flex items-center gap-2 text-sm">
        <ScanLine size={16} className="text-primary" />1 detected child asset
      </div>
    </div>
  );
}
function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-medium">{value}</dd>
    </div>
  );
}
function Document({ title }: { title: string }) {
  return (
    <button
      type="button"
      className="mt-2 flex w-full items-center gap-3 rounded-2xl border p-3 text-left text-sm transition hover:bg-subtle"
    >
      <FileText size={17} className="text-primary" />
      <span className="flex-1">{title}</span>
      <span className="text-muted-foreground">↗</span>
    </button>
  );
}
function SpatialTag({
  label,
  active,
  accent,
  className,
  onClick,
}: {
  label: string;
  active: boolean;
  accent?: boolean;
  className: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "absolute z-10 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold shadow-xl backdrop-blur-md transition hover:scale-105",
        accent
          ? "border-sky-300/60 bg-blue-600/90 text-white"
          : "border-white/25 bg-slate-950/75 text-white",
        active ? "opacity-100" : "opacity-75",
        className,
      )}
    >
      <span
        className={cn(
          "size-2 rounded-full",
          accent ? "bg-emerald-300" : "bg-white",
        )}
      />
      {label}
    </button>
  );
}
