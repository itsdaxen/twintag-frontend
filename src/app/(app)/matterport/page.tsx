"use client";

import { PageHeader } from "@/components/app/page-header";
import { ControlledOverlayTrigger } from "@/components/controlled-overlay-trigger";
import { Button } from "@/components/ui/button";
import { Modal } from "@heroui/react";
import { Webhook, Check, Loader2, Download, ScanSearch } from "lucide-react";
import { useState, useEffect } from "react";
import type { AssetTag } from "@/lib/asset-tags";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface AssetDocument {
  id: string;
  title: string;
  file: string;
}

const DEFAULT_DOCUMENTS: AssetDocument[] = [
  { id: "installation", title: "Installation Guide", file: "/documents/REX615_inst_001864_ENc.pdf" },
  { id: "operation", title: "Operation Guide", file: "/documents/REX615_oper_001866_ENd.pdf" },
  { id: "iec61850", title: "IEC 61850 Engineering Guide", file: "/documents/REX615_iec61850eng_001863_ENc.pdf" },
  { id: "quick-install", title: "Quick Installation Guide", file: "/documents/REX615_Quick_installation_guide_2NGA001854_ENb.pdf" },
  { id: "quick-start", title: "Quick Start Guide", file: "/documents/REX615_QSG_2NGA002926_ENb.pdf" },
];

const ADD_TAG_MUTATION = `mutation addTag(
  $modelId: ID!
  $floorId: ID!
  $label: String
  $description: String
  $anchorPositionX: Float!
  $anchorPositionY: Float!
  $anchorPositionZ: Float!
) {
  addMattertag(
    modelId: $modelId
    field: id
    mattertag: {
      floorId: $floorId
      enabled: true
      color: "#2563eb"
      label: $label
      description: $description
      anchorPosition: { x: $anchorPositionX, y: $anchorPositionY, z: $anchorPositionZ }
      stemEnabled: true
      stemNormal: { x: 0, y: 0, z: 1 }
      stemLength: 0.12
    }
  ) { id }
}`;

export default function MatterportPage() {
  const [isExporting, setIsExporting] = useState(false);
  const [exportData, setExportData] = useState<string | null>(null);
  
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const [tags, setTags] = useState<AssetTag[] | null>(null);
  const [scan, setScan] = useState<{ id: string; name: string; size: number } | null>(null);

  useEffect(() => {
    const scanId = localStorage.getItem("twintag_active_scan_id");
    if (!scanId || localStorage.getItem(`twintag_scan_processed:${scanId}`) !== "true") return;
    const name = localStorage.getItem(`twintag_scan_name:${scanId}`) ?? "VEO reference facility";
    const size = Number(localStorage.getItem(`twintag_scan_size:${scanId}`) ?? 3_200_000_000);
    queueMicrotask(() => setScan({ id: scanId, name, size }));
    fetch(`${API_URL}/api/scans/${encodeURIComponent(scanId)}/tags`)
      .then((response) => {
        if (!response.ok) throw new Error("Tags unavailable");
        return response.json() as Promise<AssetTag[]>;
      })
      .then((data) => {
        const overrides: Record<string, Partial<AssetTag>> = JSON.parse(localStorage.getItem("twintag_asset_overrides") ?? "{}");
        const deletedIds = new Set<string>(JSON.parse(localStorage.getItem(`twintag_deleted_tags:${scanId}`) ?? "[]"));
        const manualTags: AssetTag[] = JSON.parse(localStorage.getItem(`twintag_manual_tags:${scanId}`) ?? "[]");
        const reviewed = data
          .filter((tag) => !deletedIds.has(tag.id))
          .map((tag) => ({ ...tag, ...overrides[tag.id] }));
        setTags([...reviewed, ...manualTags]);
      })
      .catch(() => setTags([]));
  }, []);

  const handleExport = () => {
    setIsExporting(true);
    
    if (!tags) {
      setIsExporting(false);
      return;
    }

    const savedDocuments: Record<string, AssetDocument[]> = JSON.parse(localStorage.getItem("twintag_asset_documents") ?? "{}");
    const payload = {
      integration: "Matterport Model API",
      endpoint: "https://api.matterport.com/api/models/graph",
      sourceScanId: scan?.id,
      coordinateSpace: "Matterport Model API (Z-up)",
      requirements: {
        modelId: "Replace <MATTERPORT_MODEL_ID> with the model created by the Import API",
        floorId: "Replace <FLOOR_ID> with a floor ID queried from that model",
      },
      requests: tags.map((tag) => {
        const documents = (savedDocuments[tag.id] ?? DEFAULT_DOCUMENTS)
          .filter((document) => !document.file.startsWith("blob:"))
          .map((document) => ({
            title: document.title,
            url: new URL(document.file, window.location.origin).href,
          }));
        const documentLinks = documents.map((document) => `[${document.title}](${document.url})`).join("\n");
        const confidence = tag.source === "model" ? `Detection confidence: ${Math.round(tag.confidence * 100)}%` : "Manually placed tag";
        return {
          twinTagId: tag.id,
          query: ADD_TAG_MUTATION,
          variables: {
            modelId: "<MATTERPORT_MODEL_ID>",
            floorId: "<FLOOR_ID>",
            label: tag.label,
            description: [tag.asset_type, confidence, documentLinks].filter(Boolean).join("\n\n"),
            anchorPositionX: tag.position.x,
            anchorPositionY: tag.position.y,
            anchorPositionZ: tag.position.z,
          },
          documents,
        };
      }),
    };

    setTimeout(() => {
      setExportData(JSON.stringify(payload, null, 2));
      setIsExporting(false);
      setShowModal(true);
    }, 1500);
  };

  const handleCopy = () => {
    if (exportData) {
      navigator.clipboard.writeText(exportData);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="p-6 pt-20 md:p-10 max-w-4xl mx-auto flex flex-col min-h-dvh">
      <PageHeader eyebrow="Integrations" title="Matterport Model API" />

      <div className="mt-8">
        <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase mb-4">Processed Scans</h2>
        {scan ? (
          <div className="flex items-center justify-between bg-card border rounded-xl p-4 shadow-sm">
            <div className="flex flex-col">
              <span className="font-medium text-foreground">{scan.name}</span>
              <span className="text-sm text-muted-foreground mt-0.5">
                {formatBytes(scan.size)} • {tags ? `${tags.length} tags detected` : "Loading tags…"}
              </span>
            </div>
            <Button variant="secondary" size="sm" onClick={handleExport} disabled={isExporting || !tags?.length}>
              {isExporting ? <Loader2 className="animate-spin mr-2" size={16} /> : <Webhook className="mr-2" size={16} />}
              Export JSON
            </Button>
          </div>
        ) : (
          <div className="grid min-h-56 place-items-center rounded-xl border border-dashed bg-card px-6 text-center">
            <div>
              <span className="mx-auto grid size-11 place-items-center rounded-xl bg-blue-50 text-primary">
                <ScanSearch size={20} />
              </span>
              <p className="mt-4 font-medium">No processed scans</p>
              <p className="mt-1 text-sm text-muted-foreground">Process a scan before exporting Matterport tags.</p>
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={showModal} onOpenChange={setShowModal}>
        <ControlledOverlayTrigger />
        <Modal.Backdrop variant="blur">
          <Modal.Container size="lg">
            <Modal.Dialog className="max-w-3xl w-full bg-[#0f1115] border border-slate-800 text-white shadow-2xl">
              <Modal.Header className="flex justify-between items-center border-b border-slate-800 bg-[#14171c] py-4 px-5">
                <div className="flex items-center gap-2 text-base font-medium">
                  <Download size={18} className="text-slate-300" />
                  Matterport_Model_API_Requests.json
                </div>
              </Modal.Header>
              <Modal.Body className="p-6 bg-[#0f1115]">
                <pre className="text-sm font-mono leading-relaxed text-emerald-300 whitespace-pre-wrap break-all">
                  {exportData}
                </pre>
              </Modal.Body>
              <Modal.Footer className="bg-[#14171c] border-t border-slate-800 py-3 px-5">
                <Button size="sm" variant="outline" onClick={() => setShowModal(false)} className="bg-transparent border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white mr-2">
                  Close
                </Button>
                <Button 
                  size="sm" 
                  variant="secondary" 
                  onClick={handleCopy}
                >
                  {copied ? <Check size={14} className="text-emerald-500 mr-1.5" /> : null}
                  {copied ? "Copied!" : "Copy"}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "Unknown size";
  if (bytes >= 1_000_000_000) return `${(bytes / 1_000_000_000).toFixed(1)} GB`;
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  return `${Math.round(bytes / 1_000)} KB`;
}
