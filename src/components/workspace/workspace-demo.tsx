"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Check,
  CircleDot,
  FileText,
  Maximize2,
  Upload,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { HybridSpatialViewer } from "@/components/workspace/hybrid-spatial-viewer";
import type { AssetTag } from "@/lib/asset-tags";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export function WorkspaceDemo() {
  const [assets, setAssets] = useState<AssetTag[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [tagStatus, setTagStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const active = assets.find((asset) => asset.id === selected) ?? assets[0];

  useEffect(() => {
    fetch(`${API_URL}/api/scans/veo-reference/tags`)
      .then((response) => {
        if (!response.ok) throw new Error("Tags are unavailable");
        return response.json() as Promise<AssetTag[]>;
      })
      .then((tags) => {
        setAssets(tags);
        setSelected(tags[0]?.id ?? null);
        setTagStatus("ready");
      })
      .catch(() => setTagStatus("error"));
  }, []);

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

      <div className="grid min-h-[680px] flex-1 overflow-hidden rounded-2xl border bg-background shadow-card lg:h-[calc(100dvh-8.5rem)] lg:min-h-[560px] lg:flex-none lg:grid-cols-[minmax(0,1fr)_320px]">
        <section
          data-point-cloud-shell
          className="flex min-h-[500px] min-w-0 flex-col bg-slate-950 lg:min-h-0"
        >
          <div className="flex min-h-14 items-center justify-between gap-3 border-b border-white/10 px-4 text-white">
            <div className="flex items-center gap-3 text-sm">
              <span className="flex items-center gap-2 font-medium">
                <span className="size-2 rounded-full bg-emerald-400" />
                Digital twin
              </span>
            </div>
            <button
              type="button"
              aria-label="Open fullscreen"
              onClick={() =>
                document
                  .querySelector<HTMLElement>("[data-point-cloud-shell]")
                  ?.requestFullscreen()
              }
              className="grid size-8 place-items-center text-slate-400 transition hover:text-white"
            >
              <Maximize2 size={17} />
            </button>
          </div>

          <div className="relative flex-1 overflow-hidden">
            <HybridSpatialViewer
              tags={assets}
              selectedTagId={active?.id ?? null}
              onSelectTag={setSelected}
            />
          </div>
        </section>

        <aside className="flex min-h-0 flex-col border-t bg-background lg:border-t-0 lg:border-l">
          <div className="flex h-14 items-center border-b px-5">
            <div>
              <p className="text-sm font-semibold">Detected assets</p>
              <p className="text-xs text-muted-foreground">
                {tagStatus === "loading"
                  ? "Locating devices…"
                  : tagStatus === "error"
                    ? "Backend unavailable"
                    : `${assets.length} model-confirmed devices`}
              </p>
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto border-b py-2">
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
                    selected === asset.id
                      ? "bg-blue-100 text-blue-700"
                      : "bg-subtle text-muted-foreground",
                  )}
                >
                  <CircleDot size={17} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {asset.label}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {asset.sweep_count} sweep confirmation
                  </span>
                </span>
                <span className="text-xs font-semibold text-emerald-700">
                  {Math.round(asset.confidence * 100)}%
                </span>
              </button>
            ))}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-5">
            {active ? <div>
              <p className="text-xs font-semibold tracking-wide text-primary uppercase">
                Selected asset
              </p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight">
                {active.label}
              </h2>
              <DeviceDetails asset={active} />
            </div> : (
              <p className="text-sm text-muted-foreground">
                {tagStatus === "error"
                  ? "Start the TwinTag backend to load detected assets."
                  : "Loading detected assets…"}
              </p>
            )}
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

function DeviceDetails({ asset }: { asset: AssetTag }) {
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
        <Detail label="Confidence" value={`${(asset.confidence * 100).toFixed(1)}%`} />
        <Detail label="Confirmed in" value={`${asset.sweep_count} sweeps`} />
      </dl>
      <p className="mt-5 border-t pt-4 font-mono text-xs text-muted-foreground">
        XYZ · {asset.position.x.toFixed(3)}, {asset.position.y.toFixed(3)}, {asset.position.z.toFixed(3)}
      </p>
      <p className="mt-2 text-xs text-muted-foreground">
        Spatial agreement ±{Math.round(asset.spatial_spread * 100)} cm · {asset.observation_count} observations
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
