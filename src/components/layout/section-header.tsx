import * as React from "react";

import { cn } from "@/lib/utils";

export interface SectionHeaderProps extends React.ComponentProps<"div"> {
  eyebrow?: string;
  title: string;
  description?: string;
  centered?: boolean;
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  centered = false,
  className,
  ...props
}: SectionHeaderProps) {
  return (
    <div
      className={cn("space-y-4", centered && "text-center", className)}
      {...props}
    >
      {eyebrow ? (
        <p className="text-sm font-medium text-primary">{eyebrow}</p>
      ) : null}
      <h2 className="font-display text-3xl font-light tracking-tight text-balance md:text-4xl">
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            "max-w-3xl text-base text-muted-foreground md:text-xl",
            centered && "mx-auto",
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
