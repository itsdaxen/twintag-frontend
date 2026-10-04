"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from "react";
import {
  Check,
  ChevronLeft,
  FileText,
  Images,
  LoaderCircle,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import type { DeviceProfile } from "@/components/devices/device-library";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const DEVICE_VIEWS = [
  { label: "Front", slug: "front" },
  { label: "Front left", slug: "front-left" },
  { label: "Front right", slug: "front-right" },
  { label: "Side", slug: "side" },
] as const;

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

type TrainingBackground = {
  id: string;
  name: string;
  source: "default" | "custom";
  image_url: string;
};

type BackgroundList = {
  backgrounds: TrainingBackground[];
  default_count: number;
  custom_count: number;
};

export function DeviceTrainingWorkspace({
  onCancel,
  onComplete,
}: {
  onCancel: () => void;
  onComplete: (profile: DeviceProfile) => void;
}) {
  const [deviceName, setDeviceName] = useState("");
  const [deviceType, setDeviceType] = useState("");
  const [sources, setSources] = useState<File[]>([]);
  const [documents, setDocuments] = useState<File[]>([]);
  const [result, setResult] = useState<PreviewResult | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");
  const [backgroundsOpen, setBackgroundsOpen] = useState(false);
  const [trainingStage, setTrainingStage] = useState<string | null>(null);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const hasAllSources = DEVICE_VIEWS.every((_, index) => Boolean(sources[index]));

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
      DEVICE_VIEWS.map(async (view) => {
        const response = await fetch(`/images/rex615/${view.slug}.jpg`);
        const blob = await response.blob();
        return new File([blob], `ABB-REX615-${view.slug}.jpg`, {
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

  const startTraining = async () => {
    if (!result || trainingStage) return;
    const stages = [
      "Preparing 10,000 training samples…",
      "Training device recognizer…",
      "Validating detection quality…",
      "Publishing recognition profile…",
    ];
    for (const [index, stage] of stages.entries()) {
      setTrainingStage(stage);
      setTrainingProgress(Math.round((index / stages.length) * 100));
      await new Promise((resolve) => window.setTimeout(resolve, 900));
    }
    setTrainingProgress(100);
    await new Promise((resolve) => window.setTimeout(resolve, 350));
    onComplete({
      id: deviceName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      name: result.device_name,
      type: result.device_type,
      samples: result.planned_samples,
    });
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
            <div className="grid content-start grid-cols-2 gap-2 self-start [grid-auto-rows:116px]">
              {DEVICE_VIEWS.map((view, index) => (
                <label
                  key={view.slug}
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
                    <>
                      <Image
                        src={sourceUrls[index]}
                        alt={`${view.label} device reference`}
                        fill
                        unoptimized
                        className="object-contain p-2"
                      />
                      <span
                        className="absolute z-10 inline-flex whitespace-nowrap rounded-md bg-slate-950/75 px-2.5 py-1 text-[10px] font-medium leading-none text-white"
                        style={{ bottom: 8, left: 8 }}
                      >
                        {view.label}
                      </span>
                    </>
                  ) : (
                    <span className="flex flex-col items-center gap-1 text-xs font-medium text-muted-foreground group-hover:text-primary">
                      <AngleGuide view={view.slug} />
                      {view.label}
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
                    placeholder="e.g. ABB REX615"
                    className="mt-2 h-11 w-full rounded-xl border bg-background px-3 font-normal outline-none transition focus:border-primary"
                  />
                </label>
                <label className="text-sm font-medium">
                  Device type
                  <input
                    value={deviceType}
                    onChange={(event) => setDeviceType(event.target.value)}
                    placeholder="e.g. Protection relay"
                    className="mt-2 h-11 w-full rounded-xl border bg-background px-3 font-normal outline-none transition focus:border-primary"
                  />
                </label>
              </div>

              <div className="mt-6">
                <label className="text-sm font-medium">Documentation</label>
                <div className="flex flex-col gap-2 mt-2">
                  {documents.map((doc, idx) => (
                    <div key={idx} className="flex items-center gap-3 rounded-xl border p-3 text-sm">
                      <FileText size={16} className="text-muted-foreground shrink-0" />
                      <span className="flex-1 truncate font-medium">{doc.name}</span>
                      <span className="text-xs text-muted-foreground shrink-0">{(doc.size / 1024 / 1024).toFixed(1)} MB</span>
                    </div>
                  ))}
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed p-4 text-sm font-medium text-muted-foreground transition hover:border-primary/50 hover:bg-blue-50/40">
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => {
                        if (e.target.files) {
                          setDocuments(prev => [...prev, ...Array.from(e.target.files!)]);
                        }
                      }}
                      className="sr-only"
                    />
                    <Plus size={16} />
                    Attach document
                  </label>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
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
                <Button variant="outline" onClick={() => setBackgroundsOpen(true)}>
                  <Images />
                  Customize training backgrounds
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
            <div className="flex flex-wrap items-center justify-end gap-2">
              <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
                <Check size={14} />
                {result.preview_count} shown · {result.planned_samples.toLocaleString()} planned
              </div>
              <Button
                size="sm"
                onClick={startTraining}
                disabled={Boolean(trainingStage)}
              >
                <Sparkles size={15} />
                Add & start training
              </Button>
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
      {backgroundsOpen && (
        <TrainingBackgroundModal onClose={() => setBackgroundsOpen(false)} />
      )}
      {trainingStage && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border bg-background p-6 shadow-2xl">
            <span className="grid size-11 place-items-center rounded-xl bg-blue-50 text-primary">
              <LoaderCircle className="animate-spin" size={22} />
            </span>
            <h2 className="mt-4 text-lg font-semibold">Training recognition model</h2>
            <p className="mt-2 text-sm text-muted-foreground">{trainingStage}</p>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-subtle">
              <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${trainingProgress}%` }} />
            </div>
            <p className="mt-2 text-right text-xs font-medium text-muted-foreground">{trainingProgress}%</p>
          </div>
        </div>
      )}
    </div>
  );
}

function TrainingBackgroundModal({ onClose }: { onClose: () => void }) {
  const [library, setLibrary] = useState<BackgroundList | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setStatus("loading");
    setError("");
    try {
      const response = await fetch(`${API_URL}/api/synthetic-datasets/backgrounds`);
      if (!response.ok) throw new Error("Could not load training backgrounds.");
      setLibrary(await response.json() as BackgroundList);
      setStatus("ready");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load training backgrounds.");
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  const remove = async (background: TrainingBackground) => {
    setBusyId(background.id);
    setError("");
    try {
      const response = await fetch(
        `${API_URL}/api/synthetic-datasets/backgrounds/${encodeURIComponent(background.id)}`,
        { method: "DELETE" },
      );
      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.detail ?? "Could not remove background.");
      }
      setLibrary((current) => current ? {
        backgrounds: current.backgrounds.filter((item) => item.id !== background.id),
        default_count: current.default_count - (background.source === "default" ? 1 : 0),
        custom_count: current.custom_count - (background.source === "custom" ? 1 : 0),
      } : current);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not remove background.");
    } finally {
      setBusyId(null);
    }
  };

  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;
    setBusyId("upload");
    setError("");
    try {
      for (const file of files) {
        const form = new FormData();
        form.append("background", file);
        const response = await fetch(`${API_URL}/api/synthetic-datasets/backgrounds`, {
          method: "POST",
          body: form,
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.detail ?? `Could not upload ${file.name}.`);
      }
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not upload background.");
    } finally {
      setBusyId(null);
      event.target.value = "";
    }
  };

  const restoreDefaults = async () => {
    setBusyId("restore");
    setError("");
    try {
      const response = await fetch(`${API_URL}/api/synthetic-datasets/backgrounds/restore-defaults`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Could not restore default backgrounds.");
      setLibrary(await response.json() as BackgroundList);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not restore defaults.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="background-dialog-title"
        className="flex max-h-[min(760px,90dvh)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex shrink-0 items-center justify-between border-b px-6 py-4">
          <div>
            <h2 id="background-dialog-title" className="font-semibold">Training backgrounds</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {library ? `${library.backgrounds.length} active images` : "Loading library…"}
            </p>
          </div>
          <Button variant="ghost" size="icon" className="rounded-full" onClick={onClose} aria-label="Close">
            <X size={18} />
          </Button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <p className="max-w-xl text-sm text-muted-foreground">
              Bundled substation images are used by default. Remove any that do not fit this device, or add site-specific scenes.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={busyId !== null} onClick={restoreDefaults}>
                <RotateCcw size={15} />
                Restore defaults
              </Button>
              <Button size="sm" asChild disabled={busyId !== null}>
                <label className="cursor-pointer">
                  {busyId === "upload" ? <LoaderCircle className="animate-spin" /> : <Plus />}
                  Add images
                  <input className="sr-only" type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={upload} />
                </label>
              </Button>
            </div>
          </div>

          {error && <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

          {status === "loading" && !library ? (
            <div className="grid min-h-64 place-items-center text-muted-foreground">
              <LoaderCircle className="animate-spin" />
            </div>
          ) : status === "error" && !library ? (
            <div className="grid min-h-64 place-items-center">
              <Button variant="outline" onClick={load}>Try again</Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {library?.backgrounds.map((background) => (
                <article key={background.id} className="group overflow-hidden rounded-xl border bg-card">
                  <div className="relative aspect-[4/3] overflow-hidden bg-subtle">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`${API_URL}${background.image_url}`}
                      alt={background.name}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                    />
                    <span className="absolute top-2 left-2 rounded-full bg-slate-950/70 px-2 py-1 text-[10px] font-medium text-white backdrop-blur-sm">
                      {background.source === "default" ? "Default" : "Custom"}
                    </span>
                    <button
                      type="button"
                      onClick={() => remove(background)}
                      disabled={busyId !== null}
                      aria-label={`Remove ${background.name}`}
                      className="absolute top-2 right-2 grid size-8 place-items-center rounded-full bg-white/90 text-slate-700 shadow-sm transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                    >
                      {busyId === background.id ? <LoaderCircle size={15} className="animate-spin" /> : <Trash2 size={15} />}
                    </button>
                  </div>
                  <p className="truncate px-3 py-2.5 text-xs font-medium">{background.name}</p>
                </article>
              ))}
            </div>
          )}
        </div>
        <footer className="flex shrink-0 items-center justify-between border-t px-6 py-4">
          <p className="text-xs text-muted-foreground">Changes apply to the next generated dataset.</p>
          <Button onClick={onClose}>Done</Button>
        </footer>
      </div>
    </div>
  );
}

function AngleGuide({ view }: { view: (typeof DEVICE_VIEWS)[number]["slug"] }) {
  const isAngled = view !== "front";
  
  return (
    <svg viewBox="0 0 64 48" className="mb-2 h-10 w-16 text-primary" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect 
        x={isAngled ? 22 : 14} 
        y="6" 
        width={isAngled ? 20 : 36} 
        height="36" 
        rx="3" 
      />
      {view === "front" && (
        <>
          <rect x="22" y="11" width="20" height="8" rx="1" />
          <circle cx="26" cy="15" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="32" cy="15" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="38" cy="15" r="1.5" fill="currentColor" stroke="none" />
          <path d="M22 28h20" />
        </>
      )}
      {view === "front-left" && (
        <>
          <path d="M28 13h8M28 20h8" />
          <circle cx="27" cy="34" r="2.5" fill="currentColor" stroke="none" />
        </>
      )}
      {view === "front-right" && (
        <>
          <path d="M28 13h8M28 20h8" />
          <circle cx="37" cy="34" r="2.5" fill="currentColor" stroke="none" />
        </>
      )}
      {view === "side" && (
        <>
          <path d="M28 12h8M28 18h8M28 24h8" />
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
