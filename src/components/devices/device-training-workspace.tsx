"use client";

import Image from "next/image";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronLeft,
  LoaderCircle,
  Sparkles,
  Upload,
} from "lucide-react";

import { Button } from "@/components/ui/button";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const DEVICE_ANGLES = ["Front", "Back", "Left", "Right"] as const;

type BoundingBox = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

type Preview = {
  id: string;
  image_url: string;
  bounding_box: BoundingBox;
};

type PreviewResult = {
  device_name: string;
  device_type: string;
  source_filenames: string[];
  preview_count: number;
  planned_samples: number;
  augmentations: string[];
  previews: Preview[];
};

export function DeviceTrainingWorkspace({ onCancel }: { onCancel: () => void }) {
  const [deviceName, setDeviceName] = useState("");
  const [deviceType, setDeviceType] = useState("");
  const [sources, setSources] = useState<File[]>([]);
  const [result, setResult] = useState<PreviewResult | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");
  const hasAllSources = DEVICE_ANGLES.every((_, index) => Boolean(sources[index]));

  const sourceUrls = useMemo(
    () => sources.map((source) => URL.createObjectURL(source)),
    [sources],
  );
  useEffect(
    () => () => {
      sourceUrls.forEach((url) => URL.revokeObjectURL(url));
    },
    [sourceUrls],
  );

  const chooseFile = (
    index: number,
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSources((current) => {
      const next = [...current];
      next[index] = file;
      return next;
    });
    setResult(null);
    setError("");
    setStatus("idle");
  };

  const useReference = async () => {
    const references = await Promise.all(
      DEVICE_ANGLES.map(async (angle) => {
        const response = await fetch(`/images/rex615/${angle.toLowerCase()}.jpg`);
        const blob = await response.blob();
        return new File([blob], `ABB-REX615-${angle.toLowerCase()}.jpg`, {
          type: blob.type,
        });
      }),
    );
    setDeviceName("ABB REX615");
    setDeviceType("Protection relay");
    setSources(references);
    setResult(null);
    setError("");
  };

  const generate = async () => {
    if (!deviceName.trim() || !deviceType.trim() || !hasAllSources) return;
    setStatus("loading");
    setError("");
    const form = new FormData();
    sources.forEach((source) => form.append("sources", source));
    form.append("device_name", deviceName.trim());
    form.append("device_type", deviceType.trim());
    form.append("preview_count", "10");
    form.append("planned_samples", "10000");
    form.append("seed", "615");

    try {
      const response = await fetch(`${API_URL}/api/synthetic-datasets/preview`, {
        method: "POST",
        body: form,
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.detail ?? "Generation failed.");
      setResult(payload as PreviewResult);
      setStatus("idle");
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Could not generate previews.",
      );
      setStatus("error");
    }
  };

  return (
    <div className="mt-8">
      <button
        type="button"
        onClick={onCancel}
        className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition hover:text-foreground"
      >
        <ChevronLeft size={16} />
        Device Library
      </button>
      <div className="mt-5 overflow-hidden rounded-2xl border bg-background shadow-card">
        <section className="p-6">
          <div
            className="mt-5 grid"
            style={{ gridTemplateColumns: "280px minmax(0, 1fr)", gap: 20 }}
          >
            <div className="grid grid-cols-2 gap-2">
              {DEVICE_ANGLES.map((angle, index) => (
                <label
                  key={angle}
                  className="group relative grid cursor-pointer place-items-center overflow-hidden rounded-xl border border-dashed bg-subtle transition hover:border-primary/50 hover:bg-blue-50/40"
                  style={{ height: 116 }}
                >
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) => chooseFile(index, event)}
                    className="sr-only"
                  />
                  {sourceUrls[index] ? (
                    <Image
                      src={sourceUrls[index]}
                      alt={`${angle} device reference`}
                      fill
                      unoptimized
                      className="object-contain p-2"
                    />
                  ) : (
                    <span className="flex flex-col items-center gap-1 text-xs font-medium text-muted-foreground group-hover:text-primary">
                      <AngleGuide angle={angle} />
                      {angle}
                    </span>
                  )}
                </label>
              ))}
            </div>

            <div className="flex min-w-0 flex-col justify-center">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm font-medium">
                  Device name
                  <input
                    value={deviceName}
                    onChange={(event) => setDeviceName(event.target.value)}
                    placeholder="ABB REX615"
                    className="mt-2 h-11 w-full rounded-xl border bg-background px-3 font-normal outline-none transition focus:border-primary"
                  />
                </label>
                <label className="text-sm font-medium">
                  Device type
                  <input
                    value={deviceType}
                    onChange={(event) => setDeviceType(event.target.value)}
                    placeholder="Protection relay"
                    className="mt-2 h-11 w-full rounded-xl border bg-background px-3 font-normal outline-none transition focus:border-primary"
                  />
                </label>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button
                  disabled={
                    !deviceName.trim() ||
                    !deviceType.trim() ||
                    !hasAllSources ||
                    status === "loading"
                  }
                  onClick={generate}
                >
                  {status === "loading" ? (
                    <LoaderCircle className="animate-spin" />
                  ) : (
                    <Sparkles />
                  )}
                  {status === "loading"
                    ? "Generating previews…"
                    : "Generate 10,000 samples"}
                </Button>
                <Button variant="secondary" onClick={useReference}>
                  Use demo reference
                </Button>
              </div>
              {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
            </div>
          </div>
        </section>

        <section className="min-w-0 border-t p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Generated previews</h2>
          </div>
          {result && (
            <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
              <Check size={14} />
              {result.preview_count} shown · {result.planned_samples.toLocaleString()} planned
            </div>
          )}
        </div>

        {result ? (
          <div
            className="mt-5 grid"
            style={{
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: 12,
            }}
          >
            {result.previews.map((preview, index) => (
              <PreviewCard key={preview.id} preview={preview} index={index} />
            ))}
          </div>
        ) : (
          <div
            className="mt-6 flex items-center justify-center rounded-xl bg-subtle/70 px-8"
            style={{ minHeight: 180 }}
          >
            <div className="flex max-w-xl items-center text-left" style={{ gap: 16 }}>
              <span className="grid size-11 place-items-center rounded-xl bg-blue-50 text-primary">
                <Upload size={24} />
              </span>
              <div>
                <p className="font-medium">No previews yet</p>
              </div>
            </div>
          </div>
        )}
        </section>
      </div>
    </div>
  );
}

function AngleGuide({ angle }: { angle: (typeof DEVICE_ANGLES)[number] }) {
  const isSide = angle === "Left" || angle === "Right";
  return (
    <svg
      viewBox="0 0 64 48"
      className="h-12 w-16 text-primary"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x={isSide ? 20 : 12}
        y="5"
        width={isSide ? 24 : 40}
        height="36"
        rx="3"
        stroke="currentColor"
        strokeWidth="2"
      />
      {isSide ? (
        <>
          <path d="M26 11h12M26 16h12M26 32h12" stroke="currentColor" strokeWidth="2" />
          <circle cx={angle === "Left" ? 25 : 39} cy="25" r="2" fill="currentColor" />
        </>
      ) : angle === "Front" ? (
        <>
          <rect x="18" y="11" width="28" height="9" rx="1" stroke="currentColor" strokeWidth="2" />
          <circle cx="22" cy="28" r="2" fill="currentColor" />
          <circle cx="32" cy="28" r="2" fill="currentColor" />
          <circle cx="42" cy="28" r="2" fill="currentColor" />
          <path d="M18 35h28" stroke="currentColor" strokeWidth="2" />
        </>
      ) : (
        <>
          <path d="M18 12h28M18 18h28M18 24h28M18 30h28M18 36h28" stroke="currentColor" strokeWidth="2" />
        </>
      )}
    </svg>
  );
}

function PreviewCard({ preview, index }: { preview: Preview; index: number }) {
  const box = preview.bounding_box;
  return (
    <article className="overflow-hidden rounded-xl border bg-card">
      <div className="relative bg-slate-100" style={{ height: 180 }}>
        <Image
          src={preview.image_url}
          alt={`Synthetic variation ${index + 1}`}
          fill
          unoptimized
          className="object-cover"
        />
        <div
          className="absolute rounded-sm border border-emerald-300 shadow-[0_0_0_1px_rgba(15,23,42,0.35)]"
          style={{
            left: `${(box.left / 640) * 100}%`,
            top: `${(box.top / 640) * 100}%`,
            width: `${((box.right - box.left) / 640) * 100}%`,
            height: `${((box.bottom - box.top) / 640) * 100}%`,
          }}
        />
      </div>
      <div className="flex items-center justify-between px-3 py-2 text-xs">
        <span className="font-medium">Variation {String(index + 1).padStart(2, "0")}</span>
        <span className="text-emerald-700">box verified</span>
      </div>
    </article>
  );
}
