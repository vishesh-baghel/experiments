"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export const Header = () => {
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  
  // Extract agentId from paths like /deploy/jack or /deploy/jack/guide
  const deployMatch = pathname.match(/^\/deploy\/([^\/]+)/);
  const agentId = deployMatch ? deployMatch[1] : null;
  const backHref = agentId ? `/${agentId}` : "/";

  return (
    <header className="sticky top-0 z-40 mb-10 bg-background supports-[backdrop-filter]:bg-background/80 backdrop-blur">
      <div className="flex h-12 items-center justify-between">
        <div className="flex items-center gap-3">
          {isHomePage ? (
            <Link
              href="/"
              className="text-xl font-bold text-foreground no-underline hover:no-underline"
            >
              squad
            </Link>
          ) : (
            <Link
              href={backHref}
              className="inline-flex items-center gap-2 text-sm text-foreground no-underline hover:text-muted-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              back
            </Link>
          )}
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};
