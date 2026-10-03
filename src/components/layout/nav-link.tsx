import Link from "next/link";

import { cn } from "@/lib/utils";

export interface NavLinkProps extends React.ComponentProps<typeof Link> {
  isActive?: boolean;
  variant?: "desktop" | "mobile";
  overlay?: boolean;
}

export function NavLink({
  isActive = false,
  variant = "desktop",
  overlay = false,
  className,
  ...props
}: NavLinkProps) {
  return (
    <Link
      className={cn(
        "rounded-full font-medium transition-colors",
        variant === "desktop"
          ? "px-3.5 py-2 text-sm"
          : "px-3 py-2.5 text-base",
        overlay
          ? isActive
            ? "bg-white/15 text-white"
            : "text-white/80 hover:bg-white/10 hover:text-white"
          : isActive
            ? "bg-subtle text-foreground"
            : "text-muted-foreground hover:bg-subtle hover:text-foreground",
        className,
      )}
      {...props}
    />
  );
}
