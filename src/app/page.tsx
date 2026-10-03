import { Hero } from "@/components/marketing/hero";
import { Workflow } from "@/components/marketing/workflow";
import { TeamGrid } from "@/components/marketing/team-grid";
import { SiteHeader } from "@/components/layout/site-header";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <Workflow />
        <TeamGrid />
      </main>
    </>
  );
}
