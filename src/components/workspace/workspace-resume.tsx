"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FolderOpen } from "lucide-react";

import { Button } from "@/components/ui/button";

export const ACTIVE_SCAN_STORAGE_KEY = "twintag_active_scan_id";

export function WorkspaceResume() {
  const router = useRouter();

  useEffect(() => {
    const scanId = localStorage.getItem(ACTIVE_SCAN_STORAGE_KEY);
    if (scanId) {
      router.replace(`/workspace?scan=${encodeURIComponent(scanId)}`);
    }
  }, [router]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center p-6 pt-20 text-center">
      <div className="flex max-w-md flex-col items-center justify-center gap-4">
        <div className="mb-2 flex items-center justify-center text-muted-foreground">
          <FolderOpen className="size-16" strokeWidth={1.5} />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">No scan selected</h1>
        <p className="text-muted-foreground">
          Select a scan to begin exploring the digital twin and assigning asset tags.
        </p>
        <Button asChild className="mt-4">
          <Link href="/scans">Browse scans</Link>
        </Button>
      </div>
    </div>
  );
}
