"use client";

import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, useRef } from "react";

type ScanJob = {
  id: string;
  name: string;
  status: "processing" | "ready";
  progress: number;
  stage: string;
};

export default function ScansPage() {
  const [scans, setScans] = useState<ScanJob[]>([
    {
      id: "veo-reference",
      name: "VEO reference facility",
      status: "ready",
      progress: 100,
      stage: "Processed",
    }
  ]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const newScan: ScanJob = {
      id: "mock-" + crypto.randomUUID(),
      name: file.name.replace(".e57", ""),
      status: "processing",
      progress: 0,
      stage: "Uploading...",
    };

    setScans((prev) => [newScan, ...prev]);
    e.target.value = ""; // Reset input
    simulateProcessing(newScan.id);
  };

  const simulateProcessing = (scanId: string) => {
    const stages = [
      { name: "Uploading file...", duration: 2000 },
      { name: "Reading scanner positions...", duration: 2500 },
      { name: "Extracting camera images...", duration: 3000 },
      { name: "Recognizing equipment...", duration: 3500 },
      { name: "Calculating 3D positions...", duration: 2000 },
      { name: "Preparing asset tags...", duration: 1500 },
    ];

    let currentStageIndex = 0;
    
    const nextStage = () => {
      if (currentStageIndex >= stages.length) {
        setScans((prev) =>
          prev.map((s) =>
            s.id === scanId
              ? { ...s, status: "ready", progress: 100, stage: "Processed" }
              : s
          )
        );
        return;
      }

      const stage = stages[currentStageIndex];
      const baseProgress = (currentStageIndex / stages.length) * 100;
      
      setScans((prev) =>
        prev.map((s) =>
          s.id === scanId
            ? { ...s, stage: stage.name, progress: baseProgress }
            : s
        )
      );

      // Simulate progress bar moving during the stage
      const interval = setInterval(() => {
        setScans((prev) =>
          prev.map((s) => {
            if (s.id !== scanId || s.status === "ready") return s;
            // Increment progress slowly up to the next stage boundary
            const nextBoundary = ((currentStageIndex + 1) / stages.length) * 100;
            const newProgress = Math.min(s.progress + (100 / stages.length / (stage.duration / 100)), nextBoundary);
            return { ...s, progress: newProgress };
          })
        );
      }, 100);

      setTimeout(() => {
        clearInterval(interval);
        currentStageIndex++;
        nextStage();
      }, stage.duration);
    };

    nextStage();
  };

  return (
    <div className="p-6 pt-20 md:p-10 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <PageHeader 
          eyebrow="Scan management" 
          title="Scans" 
          description="Upload, process and monitor digital-twin source files." 
        />
        <input 
          type="file" 
          accept=".e57" 
          className="hidden" 
          ref={fileInputRef} 
          onChange={handleFileSelect}
        />
        <Button onClick={() => fileInputRef.current?.click()}>
          <Plus size={16} />
          Add new scan
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-8">
        {scans.map((scan) => {
          if (scan.status === "processing") {
            return (
              <div key={scan.id} className="border rounded-2xl p-5 bg-card h-full flex flex-col relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-subtle">
                  <div 
                    className="h-full bg-primary transition-all duration-300 ease-linear" 
                    style={{ width: `\${scan.progress}%` }} 
                  />
                </div>
                <h3 className="font-semibold text-lg">{scan.name}</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-4 flex-1">Processing E57 file</p>
                <div className="flex items-center gap-2 text-xs font-medium text-amber-700 bg-amber-50 w-fit px-2 py-1 rounded-md">
                  <Loader2 size={12} className="animate-spin" />
                  {scan.stage}
                </div>
              </div>
            );
          }

          return (
            <Link key={scan.id} href={`/workspace?scan=\${scan.id}`} className="block group">
              <div className="border rounded-2xl p-5 hover:border-primary transition bg-card h-full flex flex-col">
                <h3 className="font-semibold text-lg group-hover:text-primary transition">{scan.name}</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-4 flex-1">18 sweeps · 108 images · E57 ready</p>
                <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-50 w-fit px-2 py-1 rounded-md">
                  <span className="size-1.5 rounded-full bg-emerald-500"></span>
                  Processed
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
