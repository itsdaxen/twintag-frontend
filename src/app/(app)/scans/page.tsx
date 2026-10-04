import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export default function ScansPage() {
  return (
    <div className="p-6 pt-20 md:p-10 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <PageHeader 
          eyebrow="Scan management" 
          title="Scans" 
          description="Upload, process and monitor digital-twin source files." 
        />
        <Button>
          <Plus size={16} />
          Add new scan
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-8">
        <Link href="/workspace?scan=veo-reference" className="block group">
          <div className="border rounded-2xl p-5 hover:border-primary transition bg-card h-full flex flex-col">
            <h3 className="font-semibold text-lg group-hover:text-primary transition">VEO reference facility</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4 flex-1">18 sweeps · 108 images · E57 ready</p>
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-50 w-fit px-2 py-1 rounded-md">
              <span className="size-1.5 rounded-full bg-emerald-500"></span>
              Processed
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
