import { WorkspaceDemo } from "@/components/workspace/workspace-demo";
import { WorkspaceResume } from "@/components/workspace/workspace-resume";

export default async function WorkspacePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  
  if (!params.scan) {
    return <WorkspaceResume />;
  }

  const scanId = Array.isArray(params.scan) ? params.scan[0] : params.scan;
  return <WorkspaceDemo scanId={scanId} />;
}
