"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Github } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { siteConfig } from "@/config/site";

export const Header = () => {
  const pathname = usePathname();
  const isHomePage = pathname === "/";

  // Extract agentId from paths like /deploy/jack or /deploy/jack/guide
  const deployMatch = pathname.match(/^\/deploy\/([^\/]+)/);
  const agentId = deployMatch ? deployMatch[1] : null;
  const backHref = agentId ? `/${agentId}` : "/";

  return (
    <header className="sticky top-0 z-40 bg-[var(--color-background)]/80 backdrop-blur-xl border-b border-[var(--color-border)]">
      <div className="container-narrow">
        <div className="flex h-14 items-center justify-between">
          {/* Left side */}
          <div className="flex items-center gap-3">
            {isHomePage ? (
              <Link
                href="/"
                className="text-lg font-semibold text-[var(--color-foreground)] no-underline hover:no-underline tracking-tight"
              >
                squad
              </Link>
            ) : (
              <Link
                href={backHref}
                className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-foreground-muted)] no-underline hover:text-[var(--color-foreground)] transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </Link>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <Link
              href={siteConfig.links.portfolio}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[var(--color-foreground-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-background-muted)] transition-all no-underline"
            >
              portfolio
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href={siteConfig.links.github}
              target="_blank"
              rel="noreferrer"
              className="w-9 h-9 flex items-center justify-center text-[var(--color-foreground-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-background-muted)] transition-all"
              aria-label="GitHub"
            >
              <Github className="h-[18px] w-[18px]" />
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
};
