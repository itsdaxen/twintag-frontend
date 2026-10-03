import { Upload } from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";

export default function WorkspacePage() {
  return (
    <div className="flex min-h-dvh flex-col gap-6 p-4 pt-20 sm:p-6 md:pt-6 lg:p-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <PageHeader eyebrow="VEO reference scan" title="HOS — Solar 2" description="Explore the supplied E57 scan and review assets recognized by TwinTag." />
        <Button><Upload />Process scan</Button>
      </div>
      <section className="grid min-h-[680px] flex-1 place-items-center rounded-3xl border bg-slate-950 text-center shadow-card">
        <div>
          <div className="mx-auto grid size-12 place-items-center rounded-2xl border border-white/10 bg-white/5 text-sky-300"><ScanLineIcon /></div>
          <p className="mt-4 text-sm font-medium text-white">Spatial viewer ready for integration</p>
          <p className="mt-2 text-xs text-slate-400">Three.js has intentionally not been installed yet.</p>
        </div>
      </section>
    </div>
  );
}

function ScanLineIcon() {
  return <span className="block size-5 rounded-sm border border-current shadow-[0_0_16px_currentColor]" />;
}
