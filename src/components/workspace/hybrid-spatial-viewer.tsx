"use client";

import { useState } from "react";
import { Camera, ScanSearch } from "lucide-react";

import { PanoramaViewer } from "@/components/workspace/panorama-viewer";
import { PointCloudViewer } from "@/components/workspace/point-cloud-viewer";
import { cn } from "@/lib/utils";
import type { AssetTag } from "@/lib/asset-tags";

type ViewMode = "photo" | "spatial";

export function HybridSpatialViewer({
  tags,
  selectedTagId,
  onSelectTag,
}: {
  tags: AssetTag[];
  selectedTagId: string | null;
  onSelectTag: (id: string) => void;
}) {
  const [mode, setMode] = useState<ViewMode>("spatial");
  return (
    <div className="absolute inset-0">
      <PointCloudViewer
        showControls={mode === "spatial"}
        tags={tags}
        selectedTagId={selectedTagId}
        onSelectTag={onSelectTag}
      />
      <div
        className={cn(
          "absolute inset-0 z-5 transition-opacity duration-300",
          mode === "photo" ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <PanoramaViewer />
      </div>

      <div className="absolute inset-x-0 top-3 z-30 mx-auto flex w-fit rounded-full border border-white/10 bg-slate-950/70 p-1 text-xs text-white shadow-lg backdrop-blur-md">
        <ModeButton
          active={mode === "spatial"}
          icon={<ScanSearch size={14} />}
          label="3D"
          onClick={() => setMode("spatial")}
        />
        <ModeButton
          active={mode === "photo"}
          icon={<Camera size={14} />}
          label="Photo"
          onClick={() => setMode("photo")}
        />
      </div>
    </div>
  );
}

function ModeButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-full px-3 py-1.5 transition",
        active ? "bg-white text-slate-950" : "text-slate-300 hover:text-white",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
