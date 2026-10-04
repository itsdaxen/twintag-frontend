"use client";

import { useCallback, useEffect, useState, type ChangeEvent, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Check,
  ChevronLeft,
  CircleDot,
  FileText,
  Maximize2,
  Upload,
  Pencil,
  Plus,
  X,
  Paperclip,
  Trash2,
  AlertCircle,
  LoaderCircle,
  BadgeCheck,
  StickyNote,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getFileTypeIconAsUrl } from "@fluentui/react-file-type-icons";
import { HybridSpatialViewer } from "@/components/workspace/hybrid-spatial-viewer";
import { ACTIVE_SCAN_STORAGE_KEY } from "@/components/workspace/workspace-resume";
import type { AssetTag } from "@/lib/asset-tags";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type AssetDocument = {
  id: string;
  title: string;
  file: string;
};

type EditDraft = {
  label: string;
  assetType: string;
  x: string;
  y: string;
  z: string;
  documents: AssetDocument[];
};

type EditSession = {
  original: AssetTag;
  isNew: boolean;
};

const DEFAULT_DOCUMENTS: AssetDocument[] = [
  { id: "installation", title: "Installation Guide", file: "/documents/REX615_inst_001864_ENc.pdf" },
  { id: "operation", title: "Operation Guide", file: "/documents/REX615_oper_001866_ENd.pdf" },
  { id: "iec61850", title: "IEC 61850 Engineering Guide", file: "/documents/REX615_iec61850eng_001863_ENc.pdf" },
  { id: "quick-install", title: "Quick Installation Guide", file: "/documents/REX615_Quick_installation_guide_2NGA001854_ENb.pdf" },
  { id: "quick-start", title: "Quick Start Guide", file: "/documents/REX615_QSG_2NGA002926_ENb.pdf" },
];

const inputClassName =
  "h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-3 focus:ring-primary/10";

export function WorkspaceDemo({ scanId }: { scanId: string }) {
  const searchParams = useSearchParams();
  const [scanName, setScanName] = useState("VEO reference facility");
  const [assets, setAssets] = useState<AssetTag[]>([]);
  const [detectedAssets, setDetectedAssets] = useState<AssetTag[]>([]);
  const [selected, setSelected] = useState<string | null>(() => searchParams.get("tag"));
  const [tagStatus, setTagStatus] = useState<"loading" | "ready" | "error">("loading");
  const [sidebarMode, setSidebarMode] = useState<"list" | "info" | "docs" | "edit">(
    () => searchParams.get("tag") ? "info" : "list",
  );
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null);
  const [editSession, setEditSession] = useState<EditSession | null>(null);
  const [assetDocuments, setAssetDocuments] = useState<Record<string, AssetDocument[]>>({});
  const [processing, setProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState("");
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processPromptOpen, setProcessPromptOpen] = useState(false);
  const [deletePromptOpen, setDeletePromptOpen] = useState(false);
  const [scanProcessed, setScanProcessed] = useState(false);

  const [publishedTags, setPublishedTags] = useState<Set<string>>(new Set());

  useEffect(() => {
    localStorage.setItem(ACTIVE_SCAN_STORAGE_KEY, scanId);
    const savedName = localStorage.getItem(`twintag_scan_name:${scanId}`);
    if (savedName) queueMicrotask(() => setScanName(savedName));
  }, [scanId]);

  useEffect(() => {
    try {
      const savedPublished = localStorage.getItem("twintag_published_tags");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (savedPublished) setPublishedTags(new Set(JSON.parse(savedPublished)));
      const savedDocuments = localStorage.getItem("twintag_asset_documents");
      if (savedDocuments) setAssetDocuments(JSON.parse(savedDocuments));
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handlePublish = (id: string) => {
    const nextPublished = new Set(publishedTags);
    nextPublished.add(id);
    setPublishedTags(nextPublished);
    localStorage.setItem("twintag_published_tags", JSON.stringify(Array.from(nextPublished)));
  };

  const active = selected ? assets.find((asset) => asset.id === selected) : null;

  useEffect(() => {
    fetch(`${API_URL}/api/scans/${encodeURIComponent(scanId)}/tags`)
      .then((response) => {
        if (!response.ok) throw new Error("Tags are unavailable");
        return response.json() as Promise<AssetTag[]>;
      })
      .then((tags) => {
        const saved = localStorage.getItem("twintag_asset_overrides");
        const overrides: Record<string, Partial<AssetTag>> = saved ? JSON.parse(saved) : {};
        const manualTags: AssetTag[] = JSON.parse(localStorage.getItem(`twintag_manual_tags:${scanId}`) ?? "[]");
        const deletedIds = new Set<string>(JSON.parse(localStorage.getItem(`twintag_deleted_tags:${scanId}`) ?? "[]"));
        const prepared = tags
          .filter((tag) => !deletedIds.has(tag.id))
          .map((tag) => ({ ...tag, ...overrides[tag.id] }));
        const wasProcessed = localStorage.getItem(`twintag_scan_processed:${scanId}`) === "true";
        setDetectedAssets(prepared);
        setScanProcessed(wasProcessed);
        setAssets(wasProcessed ? [...prepared, ...manualTags] : manualTags);
        setTagStatus("ready");
      })
      .catch(() => setTagStatus("error"));
  }, [scanId]);

  const updateUrl = useCallback((updates: Record<string, string | null>) => {
    const url = new URL(window.location.href);
    url.searchParams.set("scan", scanId);
    for (const [key, value] of Object.entries(updates)) {
      if (value === null) url.searchParams.delete(key);
      else url.searchParams.set(key, value);
    }
    window.history.replaceState(window.history.state, "", url);
  }, [scanId]);

  const selectAsset = (id: string | null) => {
    setSelected(id);
    setSidebarMode(id ? "info" : "list");
    updateUrl({ tag: id });
  };

  const processScan = async () => {
    const profiles = JSON.parse(localStorage.getItem("twintag_device_profiles") ?? "[]");
    if (!Array.isArray(profiles) || profiles.length === 0) {
      setProcessPromptOpen(true);
      return;
    }
    if (tagStatus !== "ready") return;
    setProcessing(true);
    setSelected(null);
    setSidebarMode("list");
    updateUrl({ tag: null });
    const stages = [
      "Running device recognition…",
      "Comparing detections across sweeps…",
      "Calculating 3D tag positions…",
      "Preparing asset tags…",
    ];
    for (const [index, stage] of stages.entries()) {
      setProcessingStage(stage);
      setProcessingProgress(Math.round((index / stages.length) * 100));
      await new Promise((resolve) => window.setTimeout(resolve, 850));
    }
    setProcessingProgress(100);
    await new Promise((resolve) => window.setTimeout(resolve, 250));
    const manualTags = assets.filter((asset) => asset.source === "manual");
    setAssets([...detectedAssets, ...manualTags]);
    setScanProcessed(true);
    localStorage.setItem(`twintag_scan_processed:${scanId}`, "true");
    setProcessing(false);
  };

  useEffect(() => {
    updateUrl({ camera: null, view: null });
  }, [updateUrl]);

  const documentsFor = (id: string) => assetDocuments[id] ?? DEFAULT_DOCUMENTS;

  const openEditor = (asset: AssetTag) => {
    setEditSession({ original: { ...asset, position: { ...asset.position } }, isNew: false });
    setEditDraft({
      label: asset.label,
      assetType: asset.asset_type,
      x: String(asset.position.x),
      y: String(asset.position.y),
      z: String(asset.position.z),
      documents: documentsFor(asset.id).map((document) => ({ ...document })),
    });
    setSidebarMode("edit");
  };

  const createTag = () => {
    const fallback = assets[0]?.position ?? { x: 0, y: 0, z: 0 };
    const tag: AssetTag = {
      id: `manual-${crypto.randomUUID()}`,
      asset_type: "Manual asset",
      label: "New asset tag",
      source: "manual",
      status: "reviewed",
      confidence: 1,
      position: { ...fallback },
      observation_count: 0,
      sweep_count: 0,
      spatial_spread: 0,
      evidence: [],
    };
    setAssets((current) => [...current, tag]);
    setSelected(tag.id);
    updateUrl({ tag: tag.id });
    setEditSession({ original: tag, isNew: true });
    setEditDraft({
      label: tag.label,
      assetType: tag.asset_type,
      x: String(tag.position.x),
      y: String(tag.position.y),
      z: String(tag.position.z),
      documents: [],
    });
    setSidebarMode("edit");
  };

  const updateDraft = (changes: Partial<EditDraft>) => {
    if (!active || !editDraft) return;
    const next = { ...editDraft, ...changes };
    setEditDraft(next);
    const position = { x: Number(next.x), y: Number(next.y), z: Number(next.z) };
    const hasValidPosition = [next.x, next.y, next.z].every((value) => value.trim() !== "")
      && Object.values(position).every(Number.isFinite);
    setAssets((current) => current.map((asset) => asset.id === active.id ? {
      ...asset,
      label: next.label,
      asset_type: next.assetType,
      position: hasValidPosition ? position : asset.position,
    } : asset));
  };

  const cancelEdit = () => {
    if (!editSession) return;
    if (editSession.isNew) {
      setAssets((current) => current.filter((asset) => asset.id !== editSession.original.id));
      setSelected(null);
      updateUrl({ tag: null });
      setSidebarMode("list");
    } else {
      setAssets((current) => current.map((asset) => asset.id === editSession.original.id ? editSession.original : asset));
      setSidebarMode("info");
    }
    setEditDraft(null);
    setEditSession(null);
  };

  const addDocuments = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;
    setEditDraft((draft) => draft ? {
      ...draft,
      documents: [
        ...draft.documents,
        ...files.map((file, index) => ({
          id: `upload-${Date.now()}-${index}`,
          title: file.name.replace(/\.pdf$/i, ""),
          file: URL.createObjectURL(file),
        })),
      ],
    } : draft);
    event.target.value = "";
  };

  const saveAsset = () => {
    if (!active || !editDraft) return;
    const position = {
      x: Number(editDraft.x),
      y: Number(editDraft.y),
      z: Number(editDraft.z),
    };
    if (
      !editDraft.label.trim()
      || [editDraft.x, editDraft.y, editDraft.z].some((value) => value.trim() === "")
      || Object.values(position).some((value) => !Number.isFinite(value))
    ) return;

    const updated: AssetTag = {
      ...active,
      label: editDraft.label.trim(),
      asset_type: editDraft.assetType.trim() || active.asset_type,
      position,
      status: "reviewed",
    };
    setAssets((current) => current.map((asset) => asset.id === active.id ? updated : asset));

    if (updated.source === "manual") {
      const manualTags = assets
        .map((asset) => asset.id === updated.id ? updated : asset)
        .filter((asset) => asset.source === "manual");
      localStorage.setItem(`twintag_manual_tags:${scanId}`, JSON.stringify(manualTags));
    } else {
      const savedOverrides = JSON.parse(localStorage.getItem("twintag_asset_overrides") ?? "{}");
      savedOverrides[active.id] = {
        label: updated.label,
        asset_type: updated.asset_type,
        position: updated.position,
        status: updated.status,
      };
      localStorage.setItem("twintag_asset_overrides", JSON.stringify(savedOverrides));
    }

    const nextDocuments = { ...assetDocuments, [active.id]: editDraft.documents };
    setAssetDocuments(nextDocuments);
    localStorage.setItem(
      "twintag_asset_documents",
      JSON.stringify(Object.fromEntries(Object.entries(nextDocuments).map(([id, documents]) => [
        id,
        documents.filter((document) => !document.file.startsWith("blob:")),
      ]))),
    );

    const nextPublished = new Set(publishedTags);
    nextPublished.delete(active.id);
    setPublishedTags(nextPublished);
    localStorage.setItem("twintag_published_tags", JSON.stringify(Array.from(nextPublished)));
    setEditDraft(null);
    setEditSession(null);
    setSidebarMode("info");
  };

  const deleteAsset = () => {
    if (!active) return;
    const remaining = assets.filter((asset) => asset.id !== active.id);
    setAssets(remaining);
    setDetectedAssets((current) => current.filter((asset) => asset.id !== active.id));

    if (active.source === "manual") {
      localStorage.setItem(
        `twintag_manual_tags:${scanId}`,
        JSON.stringify(remaining.filter((asset) => asset.source === "manual")),
      );
    } else {
      const deletedIds = new Set<string>(JSON.parse(localStorage.getItem(`twintag_deleted_tags:${scanId}`) ?? "[]"));
      deletedIds.add(active.id);
      localStorage.setItem(`twintag_deleted_tags:${scanId}`, JSON.stringify(Array.from(deletedIds)));

      const overrides = JSON.parse(localStorage.getItem("twintag_asset_overrides") ?? "{}");
      delete overrides[active.id];
      localStorage.setItem("twintag_asset_overrides", JSON.stringify(overrides));
    }

    const nextDocuments = { ...assetDocuments };
    delete nextDocuments[active.id];
    setAssetDocuments(nextDocuments);
    localStorage.setItem("twintag_asset_documents", JSON.stringify(nextDocuments));

    const nextPublished = new Set(publishedTags);
    nextPublished.delete(active.id);
    setPublishedTags(nextPublished);
    localStorage.setItem("twintag_published_tags", JSON.stringify(Array.from(nextPublished)));

    setDeletePromptOpen(false);
    setEditDraft(null);
    setEditSession(null);
    setSelected(null);
    setSidebarMode("list");
    updateUrl({ tag: null });
  };

  return (
    <div className="flex min-h-dvh flex-col gap-4 p-4 pt-20 sm:p-6 md:pt-6 lg:p-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {scanName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            18 sweeps · 108 images · E57 ready
          </p>
        </div>
        <Button onClick={processScan} disabled={processing || tagStatus === "loading"}>
          {processing ? <LoaderCircle className="animate-spin" /> : scanProcessed ? <Check /> : <Upload />}
          {processing ? "Detecting assets…" : scanProcessed ? "Processed" : "Process scan"}
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
              onSelectTag={selectAsset}
            />
            {processing && (
              <div className="absolute inset-0 z-40 grid place-items-center bg-slate-950/55 p-6 backdrop-blur-[2px]">
                <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-950/90 p-5 text-white shadow-2xl">
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-xl bg-blue-500/15 text-blue-300">
                      <LoaderCircle className="animate-spin" size={20} />
                    </span>
                    <div>
                      <p className="text-sm font-semibold">Processing digital twin</p>
                      <p className="mt-0.5 text-xs text-slate-400">{processingStage}</p>
                    </div>
                  </div>
                  <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-blue-500 transition-[width] duration-500" style={{ width: `${processingProgress}%` }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        <aside className="flex min-h-0 flex-col border-t bg-background lg:border-t-0 lg:border-l">
          {sidebarMode === "list" && (
            <>
              <div className="flex h-14 shrink-0 items-center justify-between gap-3 border-b px-4">
                <div>
                  <p className="text-sm font-semibold">Detected assets</p>
                  <p className="text-xs text-muted-foreground">
                    {tagStatus === "loading"
                      ? "Locating devices…"
                      : tagStatus === "error"
                        ? "Backend unavailable"
                        : !scanProcessed
                          ? "Run processing to detect assets"
                          : `${assets.length} asset tags`}
                  </p>
                </div>
                <Button variant="outline" size="sm" className="h-8 shrink-0 px-2.5" onClick={createTag}>
                  <Plus size={14} />
                  Add tag
                </Button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto py-2">
                {assets.map((asset) => (
                  <button
                    key={asset.id}
                    type="button"
                    onClick={() => selectAsset(asset.id)}
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
                        {asset.source === "manual" ? "Manual tag" : `${asset.sweep_count} sweep confirmation`}
                      </span>
                    </span>
                    {asset.source === "model" && (
                      <span className="text-xs font-semibold text-emerald-700">
                        {Math.round(asset.confidence * 100)}%
                      </span>
                    )}
                  </button>
                ))}
                {tagStatus === "error" && (
                  <div className="px-5 py-4 text-sm text-muted-foreground">
                    Start the TwinTag backend to load detected assets.
                  </div>
                )}
                {tagStatus === "ready" && assets.length === 0 && (
                  <div className="grid min-h-56 place-items-center px-6 text-center">
                    <div>
                      <span className="mx-auto grid size-10 place-items-center rounded-xl bg-blue-50 text-primary">
                        <CircleDot size={18} />
                      </span>
                      <p className="mt-3 text-sm font-medium">No asset tags yet</p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        Process this scan after adding a recognition profile.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
          {sidebarMode === "info" && active && (
            <>
              <div className="flex h-14 shrink-0 items-center gap-2 border-b px-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0 rounded-full"
                  onClick={() => selectAsset(null)}
                  aria-label="Back to list"
                >
                  <ChevronLeft size={18} />
                </Button>
                <div>
                  <p className="text-sm font-semibold">Asset details</p>
                </div>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto p-5">
                <p className="text-xs font-semibold tracking-wide text-primary uppercase">
                  Selected asset
                </p>
                <h2 className="mt-1 text-xl font-semibold tracking-tight">
                  {active.label}
                </h2>
                <DeviceDetails asset={active} onOpenDocs={() => setSidebarMode("docs")} />
              </div>
              <div className="border-t p-4 flex flex-col gap-2">
                {publishedTags.has(active.id) ? (
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => openEditor(active)}>
                      <Pencil size={16} />
                      Edit
                    </Button>
                    <Button className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700" disabled>
                      <Check size={18} />
                      Published
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2 w-full">
                    <Button variant="outline" className="flex-1" onClick={() => openEditor(active)}>
                      <Pencil size={16} />
                      Edit
                    </Button>
                    <Button className="flex-1 bg-blue-600 text-white hover:bg-blue-700" onClick={() => handlePublish(active.id)}>
                      <Check size={18} />
                      Publish
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
          {sidebarMode === "docs" && active && (
            <>
              <div className="flex h-14 shrink-0 items-center gap-2 border-b px-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0 rounded-full"
                  onClick={() => setSidebarMode("info")}
                  aria-label="Back to details"
                >
                  <ChevronLeft size={18} />
                </Button>
                <div>
                  <p className="text-sm font-semibold">Documentation</p>
                </div>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto p-5">
                <h2 className="text-lg font-semibold tracking-tight mb-4">
                  {active.label} Manuals
                </h2>
                <div className="flex flex-col gap-2">
                  {documentsFor(active.id).map((document) => (
                    <Document key={document.id} title={document.title} file={document.file} onClick={setPdfUrl} />
                  ))}
                </div>
              </div>
            </>
          )}
          {sidebarMode === "edit" && active && editDraft && (
            <>
              <div className="flex h-14 shrink-0 items-center justify-between border-b px-4">
                <p className="text-sm font-semibold">{editSession?.isNew ? "Add tag" : "Edit asset"}</p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-full"
                  onClick={cancelEdit}
                  aria-label="Close editor"
                >
                  <X size={18} />
                </Button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto p-5">
                <div className="space-y-5">
                  <EditorField label="Asset name">
                    <input
                      className={inputClassName}
                      value={editDraft.label}
                      onChange={(event) => updateDraft({ label: event.target.value })}
                    />
                  </EditorField>
                  <EditorField label="Asset type">
                    <input
                      className={inputClassName}
                      value={editDraft.assetType}
                      onChange={(event) => updateDraft({ assetType: event.target.value })}
                    />
                  </EditorField>
                  <fieldset>
                    <legend className="mb-2 text-xs font-medium text-muted-foreground">Coordinates</legend>
                    <div className="space-y-2">
                      {(["x", "y", "z"] as const).map((axis) => (
                        <label key={axis} className="flex items-center gap-3 rounded-xl border bg-background px-3 focus-within:border-primary focus-within:ring-3 focus-within:ring-primary/10">
                          <span className="w-4 shrink-0 text-xs font-semibold text-muted-foreground uppercase">
                            {axis}
                          </span>
                          <input
                            type="number"
                            step="0.001"
                            aria-label={`${axis.toUpperCase()} coordinate`}
                            className="h-10 min-w-0 flex-1 appearance-none bg-transparent font-mono text-sm outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                            value={editDraft[axis]}
                            onChange={(event) => updateDraft({ [axis]: event.target.value })}
                          />
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <div className="border-t pt-5">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Documents</p>
                        <p className="text-xs text-muted-foreground">{editDraft.documents.length} attached</p>
                      </div>
                      <label className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition hover:bg-subtle">
                        <Paperclip size={14} />
                        Attach PDF
                        <input type="file" accept="application/pdf" multiple className="sr-only" onChange={addDocuments} />
                      </label>
                    </div>
                    <div className="space-y-2">
                      {editDraft.documents.map((document) => (
                        <div key={document.id} className="flex items-center gap-2 rounded-xl border px-3 py-2.5">
                          <DocumentIcon file={document.file} />
                          <input
                            aria-label="Document title"
                            className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                            value={document.title}
                            onChange={(event) => setEditDraft({
                              ...editDraft,
                              documents: editDraft.documents.map((item) => item.id === document.id ? { ...item, title: event.target.value } : item),
                            })}
                          />
                          <button
                            type="button"
                            aria-label={`Remove ${document.title}`}
                            className="grid size-7 shrink-0 place-items-center rounded-lg text-muted-foreground transition hover:bg-red-50 hover:text-red-600"
                            onClick={() => setEditDraft({
                              ...editDraft,
                              documents: editDraft.documents.filter((item) => item.id !== document.id),
                            })}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <p className="border-t pt-4 text-xs leading-relaxed text-muted-foreground">
                    {active.source === "model"
                      ? "Confidence and scan evidence stay locked to the model result."
                      : "Manual tags can be positioned precisely using their XYZ coordinates."}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 gap-2 border-t p-4">
                {!editSession?.isNew && (
                  <Button
                    variant="outline"
                    size="icon"
                    className="shrink-0 text-red-600 hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                    onClick={() => setDeletePromptOpen(true)}
                    aria-label="Delete tag"
                  >
                    <Trash2 size={17} />
                  </Button>
                )}
                <Button variant="outline" className="flex-1" onClick={cancelEdit}>Cancel</Button>
                <Button className="flex-1" onClick={saveAsset}>
                  <Check size={17} />
                  {editSession?.isNew ? "Add tag" : "Save changes"}
                </Button>
              </div>
            </>
          )}
        </aside>
      </div>

      {processPromptOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm" onMouseDown={() => setProcessPromptOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="process-requirement-title"
            className="w-full max-w-sm rounded-2xl border bg-background p-6 shadow-2xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <span className="grid size-10 place-items-center rounded-xl bg-amber-50 text-amber-700">
              <AlertCircle size={20} />
            </span>
            <h2 id="process-requirement-title" className="mt-4 text-lg font-semibold">Add a device first</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              TwinTag needs at least one trained recognition profile before it can detect assets in this scan.
            </p>
            <div className="mt-6 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setProcessPromptOpen(false)}>Cancel</Button>
              <Button className="flex-1" asChild>
                <Link href="/devices">Add device</Link>
              </Button>
            </div>
          </div>
        </div>
      )}

      {deletePromptOpen && active && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm" onMouseDown={() => setDeletePromptOpen(false)}>
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-tag-title"
            className="w-full max-w-sm rounded-2xl border bg-background p-6 shadow-2xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <span className="grid size-10 place-items-center rounded-xl bg-red-50 text-red-600">
              <Trash2 size={19} />
            </span>
            <h2 id="delete-tag-title" className="mt-4 text-lg font-semibold">Delete this tag?</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {active.label} will be removed from this scan, including its saved edits and documents.
            </p>
            <div className="mt-6 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setDeletePromptOpen(false)}>Cancel</Button>
              <Button className="flex-1 bg-red-600 text-white hover:bg-red-700" onClick={deleteAsset}>
                <Trash2 size={16} />
                Delete tag
              </Button>
            </div>
          </div>
        </div>
      )}

      {pdfUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-8">
          <div className="relative flex h-full w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex h-14 items-center justify-between border-b px-4">
              <span className="font-medium text-slate-900">Document Reader</span>
              <Button variant="ghost" size="sm" onClick={() => setPdfUrl(null)}>
                Close
              </Button>
            </div>
            <iframe src={pdfUrl} className="h-full w-full border-0" title="PDF Document" />
          </div>
        </div>
      )}
    </div>
  );
}

function DeviceDetails({ asset, onOpenDocs }: { asset: AssetTag; onOpenDocs: () => void }) {
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
        {asset.source === "model" ? (
          <>
            <Detail label="Confidence" value={`${(asset.confidence * 100).toFixed(1)}%`} />
            <Detail label="Confirmed in" value={`${asset.sweep_count} sweeps`} />
          </>
        ) : (
          <>
            <Detail label="Source" value="Manual" />
            <Detail label="Status" value="Reviewed" />
          </>
        )}
      </dl>
      <p className="mt-5 border-t pt-4 font-mono text-xs text-muted-foreground">
        XYZ · {asset.position.x.toFixed(3)}, {asset.position.y.toFixed(3)}, {asset.position.z.toFixed(3)}
      </p>
      {asset.source === "model" && (
        <p className="mt-2 text-xs text-muted-foreground">
          Spatial agreement ±{Math.round(asset.spatial_spread * 100)} cm · {asset.observation_count} observations
        </p>
      )}
      {asset.context && (
        <div className="mt-5 border-t pt-4">
          <p className="text-xs font-semibold tracking-wide text-primary uppercase">Extracted context</p>
          <p className="mt-1 text-[11px] text-muted-foreground">Qwen3-VL · full-resolution scan evidence</p>
          {asset.context.official_labels.length > 0 && (
            <div className="mt-3 rounded-xl border bg-blue-50/50 p-3">
              <div className="flex items-center gap-2 text-xs font-medium text-blue-700">
                <BadgeCheck size={14} />
                Official equipment label
              </div>
              <p className="mt-1.5 text-sm font-semibold">
                {asset.context.official_labels.map((item) => item.text).join(" · ")}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {Math.round(Math.min(...asset.context.official_labels.map((item) => item.confidence)) * 100)}% OCR confidence
              </p>
            </div>
          )}
          {asset.context.inspection_markings.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-medium text-muted-foreground">Inspection status</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {asset.context.inspection_markings.map((item) => (
                  <span key={item.text} className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
                    {item.text}
                  </span>
                ))}
              </div>
            </div>
          )}
          {asset.context.field_notes.map((item) => (
            <div key={item.text} className="mt-3 flex gap-2 rounded-xl bg-amber-50 p-3 text-amber-950">
              <StickyNote size={15} className="mt-0.5 shrink-0 text-amber-700" />
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-amber-700">Unverified field note</p>
                <p className="mt-0.5 text-xs font-medium">{item.text}</p>
                <p className="mt-1 text-[10px] text-amber-700">{Math.round(item.confidence * 100)}% OCR confidence · review recommended</p>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="mt-5 border-t pt-4">
        <Button variant="outline" className="w-full justify-between" onClick={onOpenDocs}>
          <span className="flex items-center gap-2">
            <FileText size={17} />
            View documentation
          </span>
          <span className="text-muted-foreground">↗</span>
        </Button>
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

function EditorField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function DocumentIcon({ file, className }: { file: string; className?: string }) {
  const extension = file.split(".").pop()?.toLowerCase() ?? "";
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className={cn("shrink-0", className)} style={{ width: 20, height: 20 }} />;
  }

  const iconUrl = getFileTypeIconAsUrl({ extension, size: 20 });
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={iconUrl}
      alt={`${extension} icon`}
      className={cn("shrink-0 object-contain", className)}
      style={{ width: 20, height: 20 }}
    />
  );
}

function Document({ title, file, onClick }: { title: string; file: string; onClick: (url: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onClick(file)}
      className="flex w-full items-center gap-3 rounded-2xl border p-3 text-left text-sm transition hover:bg-subtle"
    >
      <DocumentIcon file={file} className="shrink-0" />
      <span className="flex-1">{title}</span>
      <span className="text-muted-foreground shrink-0">↗</span>
    </button>
  );
}
