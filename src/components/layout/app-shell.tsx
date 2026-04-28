"use client";

import { type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { SidebarV2 } from "@/components/layout/sidebar-v2";
import { TopBar } from "@/components/layout/top-bar";
import { CommandBar } from "@/components/layout/command-bar";
import { MobileNav } from "@/components/layout/sidebar";
import { useV2 } from "@/components/layout/v2-context";

export function AppShell({ children }: { children: ReactNode }) {
  const { sidebarVariant, showGrid } = useV2();
  const pathname = usePathname();
  const isDashboard = pathname === "/";

  return (
    <>
      <div
        className="grid h-screen overflow-hidden"
        style={{
          gridTemplateColumns: sidebarVariant === "rail" ? "56px 1fr" : "224px 1fr",
          transition: "grid-template-columns 200ms ease",
        }}
      >
        <SidebarV2 />
        <div className="flex flex-col overflow-hidden">
          <TopBar />
          <main
            className={`flex-1 overflow-y-auto v2-scroll ${isDashboard && showGrid ? "with-grid" : ""}`}
            style={{ background: "var(--bg)" }}
          >
            {children}
          </main>
        </div>
      </div>
      <MobileNav />
      <CommandBar />
    </>
  );
}
