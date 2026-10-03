import Link from "next/link";

import { cn } from "@/lib/utils";

const SIZES = {
  sm: "text-base",
  md: "text-lg",
  lg: "text-xl",
} as const;

export interface LogoProps {
  href?: string;
  size?: keyof typeof SIZES;
  className?: string;
}

export function Logo({ href = "/", size = "md", className }: LogoProps) {
  return (
    <Link
      href={href}
      className={cn(
        "font-heading font-normal tracking-widest whitespace-nowrap uppercase transition-opacity hover:opacity-80",
        SIZES[size],
        className,
      )}
    >
      TwinTag
    </Link>
  );
}
