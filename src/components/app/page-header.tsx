export function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <header>
      <p className="text-xs font-semibold tracking-widest text-primary uppercase">
        {eyebrow}
      </p>
      <h1 className="font-heading mt-2 text-3xl font-normal tracking-tight sm:text-4xl">
        {title}
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </header>
  );
}
