import { WorkspaceDemo } from "@/components/workspace/workspace-demo";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FolderOpen } from "lucide-react";

export default async function WorkspacePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  
  if (!params.scan) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center p-6 text-center pt-20">
        <div className="flex flex-col items-center justify-center max-w-md gap-4">
          <div className="flex items-center justify-center text-muted-foreground mb-2">
            <FolderOpen className="size-16" strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">No scan selected</h1>
          <p className="text-muted-foreground">Select a scan from your dashboard to begin exploring the digital twin and assigning asset tags.</p>
          <Button asChild className="mt-4">
            <Link href="/scans">Browse scans</Link>
          </Button>
        </div>
      </div>
    );
  }

  const scanId = Array.isArray(params.scan) ? params.scan[0] : params.scan;
  return <WorkspaceDemo scanId={scanId} />;
}
