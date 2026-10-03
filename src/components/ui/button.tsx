import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

// Pill buttons lit from above: inset top hairline, vertical gradient, soft shadow
const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-full text-sm font-medium tracking-tight whitespace-nowrap transition-all outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/45 disabled:pointer-events-none disabled:opacity-60 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "border border-blue-700/75 bg-linear-to-b from-blue-600 via-blue-700 to-blue-900 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_10px_24px_-14px_rgba(15,23,42,0.85),0_4px_10px_-8px_rgba(15,23,42,0.7)] hover:-translate-y-px hover:from-blue-500 hover:via-blue-600 hover:to-blue-800",
        secondary:
          "border border-zinc-300 bg-linear-to-b from-zinc-50 via-zinc-100 to-zinc-200 text-zinc-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.96),0_10px_22px_-16px_rgba(15,23,42,0.42),0_3px_8px_-8px_rgba(15,23,42,0.3)] hover:-translate-y-px hover:from-white hover:via-zinc-50 hover:to-zinc-100",
        dark: "border border-zinc-700 bg-linear-to-b from-zinc-700 via-zinc-800 to-zinc-900 text-zinc-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_10px_24px_-14px_rgba(0,0,0,0.78),0_4px_10px_-8px_rgba(0,0,0,0.65)] hover:-translate-y-px hover:from-zinc-600 hover:via-zinc-700 hover:to-zinc-900",
        outline:
          "border border-border bg-background text-foreground hover:bg-subtle",
        ghost: "text-foreground hover:bg-subtle",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-8 px-3.5 text-[13px]",
        default: "h-10 px-5",
        lg: "h-11 px-7",
        icon: "size-10",
        "icon-sm": "size-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
