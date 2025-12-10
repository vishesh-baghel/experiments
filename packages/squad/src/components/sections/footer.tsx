import Link from "next/link";
import { siteConfig } from "@/config/site";

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-20 py-6 border-t border-border">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-4 text-sm">
          <Link
            href={siteConfig.links.portfolio}
            target="_blank"
            rel="noreferrer"
            className="text-muted-foreground hover:text-foreground no-underline"
          >
            portfolio
          </Link>
          <Link
            href={siteConfig.links.github}
            target="_blank"
            rel="noreferrer"
            className="text-muted-foreground hover:text-foreground no-underline"
          >
            github
          </Link>
          <Link
            href={siteConfig.links.calendar}
            target="_blank"
            rel="noreferrer"
            className="text-muted-foreground hover:text-foreground no-underline"
          >
            book a call
          </Link>
        </div>

        <p className="text-sm text-muted-foreground">
          {currentYear} {siteConfig.author.name}
        </p>
      </div>
    </footer>
  );
};
