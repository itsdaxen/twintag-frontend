"use client";

import { PageHeader } from "@/components/app/page-header";
import { ControlledOverlayTrigger } from "@/components/controlled-overlay-trigger";
import { Button } from "@/components/ui/button";
import { Modal } from "@heroui/react";
import { Webhook, Check, Loader2, X, Download } from "lucide-react";
import { useState, useEffect } from "react";

interface TagData {
  label: string;
  confidence: number;
  position: { x: number; y: number; z: number };
}

export default function MatterportPage() {
  const [isExporting, setIsExporting] = useState(false);
  const [exportData, setExportData] = useState<string | null>(null);
  
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const [tags, setTags] = useState<TagData[] | null>(null);

  useEffect(() => {
    fetch('/api/scans/veo-reference/tags')
      .then(res => res.json())
      .then(data => setTags(data))
      .catch(console.error);
  }, []);

  const handleExport = () => {
    setIsExporting(true);
    
    if (!tags) {
      setIsExporting(false);
      return;
    }

    const payload = {
      query: `mutation CreateMattertag($modelId: ID!, $mattertag: MattertagInput!) { ... }`,
      variables: {
        modelId: "m_twin_tags",
        tags: tags.map((tag) => ({
          label: tag.label,
          description: `Confidence: ${Math.round(tag.confidence * 100)}%`,
          anchorPosition: { x: tag.position.x, y: tag.position.y, z: tag.position.z },
          stemVector: { x: 0, y: 1, z: 0 },
          color: "#3b82f6"
        }))
      }
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
        <div className="flex items-center justify-between bg-card border rounded-xl p-4 shadow-sm">
          <div className="flex flex-col">
            <span className="font-medium text-foreground">Veo Reference Scan</span>
            <span className="text-sm text-muted-foreground mt-0.5">
              3.2 GB • {tags ? `${tags.length} Tags Detected` : "Loading tags..."}
            </span>
          </div>
          <Button variant="secondary" size="sm" onClick={handleExport} disabled={isExporting || !tags}>
            {isExporting ? <Loader2 className="animate-spin mr-2" size={16} /> : <Webhook className="mr-2" size={16} />}
            Export JSON
          </Button>
        </div>
      </div>

      <Modal isOpen={showModal} onOpenChange={setShowModal}>
        <ControlledOverlayTrigger />
        <Modal.Backdrop variant="blur">
          <Modal.Container size="lg">
            <Modal.Dialog className="max-w-3xl w-full bg-[#0f1115] border border-slate-800 text-white shadow-2xl">
              <Modal.Header className="flex justify-between items-center border-b border-slate-800 bg-[#14171c] py-4 px-5">
                <div className="flex items-center gap-2 text-base font-medium">
                  <Download size={18} className="text-slate-300" />
                  Matterport_Tags_Schema.json
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
