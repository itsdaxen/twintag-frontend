import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, FileText, ScanLine } from "lucide-react";

import { Container } from "@/components/layout/container";
import { SectionHeader } from "@/components/layout/section-header";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const rows = [
  {
    eyebrow: "Structured scan ingestion",
    title: "The whole E57, understood",
    body: "TwinTag reads the point cloud, scanner poses and panoramic imagery together, preserving the spatial context behind every visual observation.",
    visual: <ScanVisual />,
  },
  {
    eyebrow: "Evidence-led recognition",
    title: "Devices found in context",
    body: "Recognition works across the captured views, links a device to its parent cubicle and keeps the source image that supports the result.",
    visual: <RecognitionVisual />,
  },
  {
    eyebrow: "Actionable asset records",
    title: "More useful than a label",
    body: "Every approved detection carries a 3D position, confidence, hierarchy and the technical documents a field team needs.",
    visual: <AssetRecordVisual />,
    action: true,
  },
] as const;

export function Workflow() {
  return (
    <section id="workflow" className="scroll-mt-20">
      <Container className="pt-16 pb-14 lg:pt-24 lg:pb-16">
        <SectionHeader
          centered
          title="From raw scan to trusted asset record."
          description="One traceable workflow, built around the data industrial teams already have."
        />
      </Container>

      {rows.map((row, index) => {
        const flip = index % 2 === 1;
        return (
          <div key={row.title} className="border-t border-border">
            <Container className="py-14 lg:py-0">
              <article className="grid items-stretch gap-8 lg:grid-cols-12 lg:gap-0">
                <div
                  className={cn(
                    "flex flex-col justify-center space-y-5 lg:py-16",
                    flip
                      ? "lg:order-3 lg:col-span-5 lg:col-start-8 lg:pl-12"
                      : "lg:col-span-5 lg:pr-12",
                  )}
                >
                  <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">
                    {row.eyebrow}
                  </p>
                  <h3 className="font-display text-2xl font-light tracking-tight text-balance lg:text-3xl">
                    {row.title}
                  </h3>
                  <p className="leading-relaxed text-muted-foreground">
                    {row.body}
                  </p>
                  {"action" in row && row.action ? (
                    <Button asChild className="w-fit">
                      <Link href="/workspace">
                        Open the app <ArrowRight />
                      </Link>
                    </Button>
                  ) : null}
                </div>
                <div
                  aria-hidden="true"
                  className={cn(
                    "hidden w-px justify-self-center bg-border lg:col-span-1 lg:block",
                    flip && "lg:order-2",
                  )}
                />
                <div
                  className={cn(
                    "flex items-center lg:col-span-6 lg:py-12",
                    flip && "lg:order-1",
                  )}
                >
                  {row.visual}
                </div>
              </article>
            </Container>
          </div>
        );
      })}
    </section>
  );
}

function ScanVisual() {
  return (
    <div className="w-full overflow-hidden rounded-3xl bg-slate-950 p-6 text-white shadow-card sm:p-8">
      <div className="flex items-center justify-between border-b border-white/10 pb-5">
        <span className="flex items-center gap-2 text-sm font-medium">
          <ScanLine className="text-sky-300" size={18} /> cloud_0-001.e57
        </span>
        <span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-xs text-emerald-300">
          Ready
        </span>
      </div>
      <div className="grid grid-cols-3 gap-3 py-8 text-center">
        <Metric value="116.6M" label="points" />
        <Metric value="18" label="sweeps" />
        <Metric value="108" label="images" />
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full w-full rounded-full bg-linear-to-r from-sky-400 to-emerald-300" />
      </div>
    </div>
  );
}

function RecognitionVisual() {
  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-3xl border bg-subtle shadow-card">
      <Image
        src="/images/rex615/front.jpg"
        alt="ABB REX615 recognition evidence"
        fill
        className="object-contain p-8"
        sizes="(min-width: 1024px) 50vw, 100vw"
      />
      <div className="absolute inset-[16%] rounded-2xl border-2 border-primary/70" />
      <div className="absolute right-5 bottom-5 rounded-2xl bg-slate-950/90 px-4 py-3 text-white shadow-xl backdrop-blur">
        <p className="text-sm font-semibold">ABB REX615</p>
        <p className="mt-1 text-xs text-emerald-300">96.4% confidence</p>
      </div>
    </div>
  );
}

function AssetRecordVisual() {
  return (
    <div className="w-full rounded-3xl border bg-background p-6 shadow-card sm:p-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-primary">Cubicle A</p>
          <h4 className="mt-1 text-lg font-semibold">ABB REX615</h4>
        </div>
        <span className="grid size-9 place-items-center rounded-full bg-emerald-50 text-emerald-700">
          <Check size={17} />
        </span>
      </div>
      <dl className="mt-6 grid grid-cols-2 gap-5 border-y py-5 text-sm">
        <RecordDetail label="Coordinate" value="16.92, 10.39, 0.92" />
        <RecordDetail label="Status" value="Ready to publish" />
      </dl>
      <div className="mt-5 space-y-2">
        <DocumentRow title="REX615 Technical Manual" />
        <DocumentRow title="Protection relay datasheet" />
      </div>
    </div>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="font-mono text-xl font-medium">{value}</p>
      <p className="mt-1 text-xs text-white/50">{label}</p>
    </div>
  );
}

function RecordDetail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-medium">{value}</dd>
    </div>
  );
}

function DocumentRow({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-subtle px-4 py-3 text-sm">
      <FileText className="text-primary" size={17} />
      {title}
    </div>
  );
}
