import Link from "next/link";
import Image from "next/image";

import { cn } from "@/lib/utils";

const SIZES = {
  sm: "text-base [&_img]:size-6",
  md: "text-lg [&_img]:size-7",
  lg: "text-xl [&_img]:size-8",
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
        "inline-flex items-center gap-2.5 font-sans font-bold tracking-tight whitespace-nowrap transition-opacity hover:opacity-80",
        SIZES[size],
        className,
      )}
    >
      <Image src="/brand/twintag-mark.png" alt="" width={32} height={32} />
      <span>TwinTag</span>
    </Link>
  );
}
