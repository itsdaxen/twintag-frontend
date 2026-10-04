"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CircleDot, Plus, ScanSearch } from "lucide-react";

import { DeviceTrainingWorkspace } from "@/components/devices/device-training-workspace";
import { Button } from "@/components/ui/button";

export function DeviceLibrary() {
  const [isCreating, setIsCreating] = useState(false);
  const [profiles, setProfiles] = useState<DeviceProfile[]>([]);

  useEffect(() => {
    queueMicrotask(() => {
      setProfiles(JSON.parse(localStorage.getItem("twintag_device_profiles") ?? "[]"));
    });
  }, []);

  const addProfile = (profile: DeviceProfile) => {
    const next = [...profiles.filter((item) => item.id !== profile.id), profile];
    setProfiles(next);
    localStorage.setItem("twintag_device_profiles", JSON.stringify(next));
    setIsCreating(false);
  };

  if (isCreating) {
    return <DeviceTrainingWorkspace onCancel={() => setIsCreating(false)} onComplete={addProfile} />;
  }

  return (
    <div className="mt-8">
      <div className="flex justify-end">
        <Button onClick={() => setIsCreating(true)}>
          <Plus />
          Add new device
        </Button>
      </div>

      {profiles.length ? (
        <div className="mt-4 space-y-3">
          {profiles.map((profile) => (
            <div key={profile.id} className="rounded-2xl border bg-background px-5 py-4 shadow-card">
              <div className="flex items-center gap-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-primary">
                  <CircleDot size={20} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{profile.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{profile.type} · synthetic training set</p>
                </div>
                <div className="hidden shrink-0 text-right sm:block">
                  <p className="text-sm font-medium">{profile.samples.toLocaleString()} samples</p>
                  <p className="mt-1 text-xs text-muted-foreground">Model ready</p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/workspace">
                    <ScanSearch size={15} />
                    Open scan
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 grid min-h-56 place-items-center rounded-2xl border border-dashed bg-background px-6 text-center">
          <div>
            <span className="mx-auto grid size-11 place-items-center rounded-xl bg-blue-50 text-primary">
              <CircleDot size={20} />
            </span>
            <p className="mt-4 font-medium">No recognition profiles yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Add a device before processing a scan.</p>
          </div>
        </div>
      )}
    </div>
  );
}

export type DeviceProfile = {
  id: string;
  name: string;
  type: string;
  samples: number;
};
