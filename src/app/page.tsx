import { Container } from "@/components/layout/container";
import { Logo } from "@/components/layout/logo";

export default function Home() {
  return (
    <main className="flex min-h-dvh items-center bg-subtle">
      <Container size="md">
        <div className="rounded-3xl border bg-background p-10 shadow-card">
          <Logo size="lg" />
          <p className="mt-5 max-w-md text-sm leading-6 text-muted-foreground">
            Industrial asset intelligence for navigable digital twins.
          </p>
        </div>
      </Container>
    </main>
  );
}
