import Link from "next/link";
import { siteConfig } from "@/config/site";

export const Footer = () => {
  return (
    <footer className="border-t border-[var(--color-border)] mt-20">
      <div className="container-narrow py-8">
        <div className="flex items-center justify-center gap-6">
          <Link
            href={siteConfig.links.portfolio}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-[var(--color-foreground-subtle)] hover:text-[var(--color-foreground)] transition-colors no-underline"
          >
            portfolio
          </Link>
          <span className="text-[var(--color-border)]">·</span>
          <Link
            href={siteConfig.links.calendar}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-[var(--color-foreground-subtle)] hover:text-[var(--color-foreground)] transition-colors no-underline"
          >
            book a call
          </Link>
        </div>
      </div>
    </footer>
  );
};
