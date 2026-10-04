"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@heroui/react";
import { Menu } from "lucide-react";

import { AppSidebar } from "@/components/app/app-sidebar";

export function AppShell({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex min-h-dvh bg-subtle">
      <button
        aria-label="Close navigation"
        className={`fixed inset-0 z-40 bg-foreground/25 backdrop-blur-xs transition-opacity lg:hidden ${isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={() => setIsOpen(false)}
        type="button"
      />
      <AppSidebar
        isCollapsed={isCollapsed}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onCollapseToggle={() => setIsCollapsed((current) => !current)}
      />
      <main className="relative min-h-0 min-w-0 flex-1 overflow-x-hidden md:pl-20 lg:pl-0">
        <Button
          aria-label="Open navigation"
          className="fixed top-4 left-4 z-30 bg-background/90 shadow-sm backdrop-blur md:hidden"
          isIconOnly
          size="lg"
          variant="secondary"
          onPress={() => setIsOpen(true)}
        >
          <Menu size={20} />
        </Button>
        {children}
      </main>
    </div>
  );
}
