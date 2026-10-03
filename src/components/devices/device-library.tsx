"use client";

import { useState } from "react";
import { Check, CircleDot, Plus } from "lucide-react";

import { DeviceTrainingWorkspace } from "@/components/devices/device-training-workspace";
import { Button } from "@/components/ui/button";

export function DeviceLibrary() {
  const [isCreating, setIsCreating] = useState(false);

  if (isCreating) {
    return <DeviceTrainingWorkspace onCancel={() => setIsCreating(false)} />;
  }

  return (
    <div className="mt-8">
      <div className="flex justify-end">
        <Button onClick={() => setIsCreating(true)}>
          <Plus />
          Add new device
        </Button>
      </div>

      <div className="mt-4 rounded-2xl border bg-background px-5 py-4 shadow-card">
        <div className="flex items-center gap-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-primary">
            <CircleDot size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">ABB REX615</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Protection relay · synthetic training set
            </p>
          </div>
          <div className="hidden shrink-0 text-right sm:block">
            <p className="text-sm font-medium">10,000 samples</p>
            <p className="mt-1 text-xs text-muted-foreground">10 previewed</p>
          </div>
          <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
            <Check size={13} />
            Training done
          </span>
        </div>
      </div>
    </div>
  );
}
