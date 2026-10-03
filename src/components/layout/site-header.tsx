"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Map, Menu } from "lucide-react";

import { Logo } from "@/components/layout/logo";
import { NavLink } from "@/components/layout/nav-link";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "How it works", href: "/#workflow" },
  { label: "Team", href: "/#team" },
] as const;

// Transparent over the hero, solid once scrolled. Retracts on scroll down.
export function SiteHeader() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isAtTop, setIsAtTop] = useState(true);

  const isHome = pathname === "/";
  const isOverlay = isHome && isAtTop && !isOpen;

  useEffect(() => {
    let lastY = window.scrollY;

    const onScroll = () => {
      const y = window.scrollY;
      setIsAtTop(y < 24);

      if (isOpen || y < 96) setIsVisible(true);
      else if (y < lastY - 6) setIsVisible(true);
      else if (y > lastY + 6) setIsVisible(false);

      lastY = y;
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isOpen]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-transform duration-300",
        isVisible ? "translate-y-0" : "-translate-y-full",
      )}
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          className={cn(
            "rounded-b-2xl border border-t-0 transition-all duration-300",
            isOverlay
              ? "border-transparent bg-transparent shadow-none"
              : "border-border/80 bg-background/85 shadow-sm backdrop-blur-xl",
          )}
        >
          <div
            className={cn(
              "flex h-16 items-center justify-between gap-4 px-3 sm:px-4",
              isOverlay ? "text-white" : "text-foreground",
            )}
          >
            <Logo />

            <nav
              className="hidden items-center gap-1 lg:flex"
              aria-label="Main navigation"
            >
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  overlay={isOverlay}
                  isActive={pathname === item.href}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <Button
                asChild
                size="sm"
                variant={isOverlay ? "secondary" : "default"}
                className="hidden lg:inline-flex"
              >
                <Link href="/workspace">
                  <Map />
                  Open the app
                </Link>
              </Button>

              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Open menu"
                    className={cn(
                      "lg:hidden",
                      isOverlay && "text-white hover:bg-white/10",
                    )}
                  >
                    <Menu />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[85vw] max-w-sm p-0">
                  <SheetTitle className="sr-only">Main navigation</SheetTitle>
                  <div className="flex h-full flex-col">
                    <div className="border-b border-border/80 px-5 py-4">
                      <Logo />
                    </div>
                    <nav className="flex flex-1 flex-col gap-1 px-4 py-6">
                      {NAV_ITEMS.map((item) => (
                        <NavLink
                          key={item.href}
                          href={item.href}
                          variant="mobile"
                          isActive={pathname === item.href}
                          onClick={() => setIsOpen(false)}
                        >
                          {item.label}
                        </NavLink>
                      ))}
                    </nav>
                    <div className="border-t border-border/80 p-5">
                      <Button asChild className="w-full">
                        <Link
                          href="/workspace"
                          onClick={() => setIsOpen(false)}
                        >
                          <Map />
                          Open the app
                        </Link>
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
