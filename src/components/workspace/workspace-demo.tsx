"use client";

import { useCallback, useEffect, useState, type ChangeEvent, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  Check,
  ChevronLeft,
  CircleDot,
  FileText,
  Maximize2,
  Upload,
  Pencil,
  X,
  Paperclip,
  Trash2,
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
  const [assets, setAssets] = useState<AssetTag[]>([]);
  const [selected, setSelected] = useState<string | null>(() => searchParams.get("tag"));
  const [tagStatus, setTagStatus] = useState<"loading" | "ready" | "error">("loading");
  const [sidebarMode, setSidebarMode] = useState<"list" | "info" | "docs" | "edit">(
    () => searchParams.get("tag") ? "info" : "list",
  );
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null);
  const [assetDocuments, setAssetDocuments] = useState<Record<string, AssetDocument[]>>({});

  const [publishedTags, setPublishedTags] = useState<Set<string>>(new Set());

  useEffect(() => {
    localStorage.setItem(ACTIVE_SCAN_STORAGE_KEY, scanId);
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
    fetch(`${API_URL}/api/scans/veo-reference/tags`)
      .then((response) => {
        if (!response.ok) throw new Error("Tags are unavailable");
        return response.json() as Promise<AssetTag[]>;
      })
      .then((tags) => {
        const saved = localStorage.getItem("twintag_asset_overrides");
        const overrides: Record<string, Partial<AssetTag>> = saved ? JSON.parse(saved) : {};
        setAssets(tags.map((tag) => ({ ...tag, ...overrides[tag.id] })));
        setTagStatus("ready");
      })
      .catch(() => setTagStatus("error"));
  }, []);

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

  useEffect(() => {
    updateUrl({ camera: null, view: null });
  }, [updateUrl]);

  const documentsFor = (id: string) => assetDocuments[id] ?? DEFAULT_DOCUMENTS;

  const openEditor = (asset: AssetTag) => {
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
    if (!editDraft.label.trim() || Object.values(position).some((value) => !Number.isFinite(value))) return;

    const updated: AssetTag = {
      ...active,
      label: editDraft.label.trim(),
      asset_type: editDraft.assetType.trim() || active.asset_type,
      position,
      status: "reviewed",
    };
    setAssets((current) => current.map((asset) => asset.id === active.id ? updated : asset));

    const savedOverrides = JSON.parse(localStorage.getItem("twintag_asset_overrides") ?? "{}");
    savedOverrides[active.id] = {
      label: updated.label,
      asset_type: updated.asset_type,
      position: updated.position,
      status: updated.status,
    };
    localStorage.setItem("twintag_asset_overrides", JSON.stringify(savedOverrides));

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
    setSidebarMode("info");
  };

  return (
    <div className="flex min-h-dvh flex-col gap-4 p-4 pt-20 sm:p-6 md:pt-6 lg:p-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            VEO reference facility
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
              onSelectTag={selectAsset}
            />
          </div>
        </section>

        <aside className="flex min-h-0 flex-col border-t bg-background lg:border-t-0 lg:border-l">
          {sidebarMode === "list" && (
            <>
              <div className="flex h-14 shrink-0 items-center border-b px-5">
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
                        {asset.sweep_count} sweep confirmation
                      </span>
                    </span>
                    <span className="text-xs font-semibold text-emerald-700">
                      {Math.round(asset.confidence * 100)}%
                    </span>
                  </button>
                ))}
                {tagStatus === "error" && (
                  <div className="px-5 py-4 text-sm text-muted-foreground">
                    Start the TwinTag backend to load detected assets.
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
                <p className="text-sm font-semibold">Edit asset</p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-full"
                  onClick={() => setSidebarMode("info")}
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
                      onChange={(event) => setEditDraft({ ...editDraft, label: event.target.value })}
                    />
                  </EditorField>
                  <EditorField label="Asset type">
                    <input
                      className={inputClassName}
                      value={editDraft.assetType}
                      onChange={(event) => setEditDraft({ ...editDraft, assetType: event.target.value })}
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
                            onChange={(event) => setEditDraft({ ...editDraft, [axis]: event.target.value })}
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
                    Confidence and scan evidence stay locked to the model result.
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 gap-2 border-t p-4">
                <Button variant="outline" className="flex-1" onClick={() => setSidebarMode("info")}>Cancel</Button>
                <Button className="flex-1" onClick={saveAsset}>
                  <Check size={17} />
                  Save changes
                </Button>
              </div>
            </>
          )}
        </aside>
      </div>

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
        <Detail label="Confidence" value={`${(asset.confidence * 100).toFixed(1)}%`} />
        <Detail label="Confirmed in" value={`${asset.sweep_count} sweeps`} />
      </dl>
      <p className="mt-5 border-t pt-4 font-mono text-xs text-muted-foreground">
        XYZ · {asset.position.x.toFixed(3)}, {asset.position.y.toFixed(3)}, {asset.position.z.toFixed(3)}
      </p>
      <p className="mt-2 text-xs text-muted-foreground">
        Spatial agreement ±{Math.round(asset.spatial_spread * 100)} cm · {asset.observation_count} observations
      </p>
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
