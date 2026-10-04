"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Webhook, 
  Box,
  Library,
  PanelLeftClose,
  PanelLeftOpen,
  ScanLine,
  Settings,
  X,
} from "lucide-react";
import { Button } from "@heroui/react";

import { Logo } from "@/components/layout/logo";
import { cn } from "@/lib/utils";

const items = [
  { href: "/workspace", label: "Workspace", icon: Box },
  { href: "/scans", label: "Scans", icon: ScanLine },
  { href: "/devices", label: "Device Library", icon: Library },
  { href: "/matterport", label: "Matterport API", icon: Webhook },
] as const;

export function AppSidebar({
  isCollapsed,
  isOpen,
  onClose,
  onCollapseToggle,
}: {
  isCollapsed: boolean;
  isOpen: boolean;
  onClose: () => void;
  onCollapseToggle: () => void;
}) {
  const pathname = usePathname();
  const settingsActive = pathname.startsWith("/settings");

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-68 flex-col border-r bg-rail px-3 py-4 shadow-xl transition-[width,transform] duration-200 md:w-20 md:translate-x-0 lg:sticky lg:top-0 lg:shadow-none",
        isCollapsed ? "lg:w-20" : "lg:w-68",
        isOpen ? "translate-x-0" : "-translate-x-full",
      )}
    >
      <div
        className={cn(
          "flex min-h-10 items-center justify-between px-3 md:justify-center",
          isCollapsed ? "lg:justify-center lg:px-0" : "lg:justify-between",
        )}
      >
        <Logo
          className={cn(
            "md:[&>span]:hidden lg:[&>span]:inline",
            isCollapsed && "lg:hidden",
          )}
        />
        <Button
          aria-label="Close navigation"
          className="md:hidden"
          isIconOnly
          size="md"
          variant="ghost"
          onPress={onClose}
        >
          <X size={19} />
        </Button>
        <Button
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="hidden lg:flex"
          isIconOnly
          size="md"
          variant="ghost"
          onPress={onCollapseToggle}
        >
          {isCollapsed ? (
            <PanelLeftOpen size={19} />
          ) : (
            <PanelLeftClose size={19} />
          )}
        </Button>
      </div>
      <nav className="mt-6" aria-label="Application navigation">
        <ul className="space-y-1">
          {items.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={onClose}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-11 items-center gap-3 rounded-2xl px-3.5 text-sm font-medium transition-colors md:justify-center md:px-0",
                    isCollapsed
                      ? "lg:justify-center lg:px-0"
                      : "lg:justify-start lg:px-3.5",
                    active
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:bg-background/70 hover:text-foreground",
                  )}
                >
                  <Icon size={19} strokeWidth={1.8} />
                  <span
                    className={cn(
                      "md:hidden lg:inline",
                      isCollapsed && "lg:hidden",
                    )}
                  >
                    {label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="flex-1" />
      <div className="border-t pt-3">
        <Link
          href="/settings"
          aria-current={settingsActive ? "page" : undefined}
          className={cn(
            "flex min-h-11 items-center gap-3 rounded-2xl px-3.5 text-sm font-medium transition md:justify-center md:px-0",
            isCollapsed
              ? "lg:justify-center lg:px-0"
              : "lg:justify-start lg:px-3.5",
            settingsActive
              ? "bg-background text-foreground shadow-xs"
              : "text-muted-foreground hover:bg-background/70 hover:text-foreground",
          )}
        >
          <Settings size={19} strokeWidth={1.8} />
          <span
            className={cn("md:hidden lg:inline", isCollapsed && "lg:hidden")}
          >
            Settings
          </span>
        </Link>
      </div>
    </aside>
  );
}
