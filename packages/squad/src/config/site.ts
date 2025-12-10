/**
 * Site Configuration
 *
 * Central configuration for site-wide settings, URLs, and metadata.
 */

export const siteConfig = {
  name: "squad",
  description:
    "hyper personalised agents i built, deploy them for yourself and let them do your boring work",
  url: "https://squad.visheshbaghel.com",

  // Links
  links: {
    portfolio: "https://visheshbaghel.com",
    github: "https://github.com/vishesh-baghel",
    twitter: "https://x.com/VisheshBaghell",
    linkedin: "https://www.linkedin.com/in/vishesh-baghel/",
    calendar: "https://cal.com/vishesh-baghel/15min",
    email: "visheshbaghel99@gmail.com",
    experimentsRepo: "https://github.com/vishesh-baghel/experiments",
  },

  // Author info
  author: {
    name: "vishesh baghel",
    email: "visheshbaghel99@gmail.com",
  },
} as const;

export type SiteConfig = typeof siteConfig;
