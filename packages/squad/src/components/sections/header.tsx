"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export const Header = () => {
  const pathname = usePathname();
  const isHomePage = pathname === "/";

  return (
    <header className="sticky top-0 z-40 mb-10 bg-background supports-[backdrop-filter]:bg-background/80 backdrop-blur">
      <div className="flex h-12 items-center justify-between">
        <div className="flex items-center gap-3">
          {isHomePage ? (
            <Link
              href="/"
              className="text-base font-bold text-foreground no-underline hover:no-underline"
            >
              squad
            </Link>
          ) : (
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-foreground no-underline hover:text-muted-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              squad
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
