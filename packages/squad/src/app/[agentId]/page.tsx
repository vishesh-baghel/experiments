import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/sections/header";
import { agents, getAgentById } from "@/config/agents";
import {
  Check,
  ExternalLink,
  Bot,
  Brain,
  Megaphone,
  ArrowRight,
} from "lucide-react";
import { AgentPageTracker } from "@/components/analytics";

interface AgentPageProps {
  params: Promise<{
    agentId: string;
  }>;
}

export const generateStaticParams = () => {
  return agents.map((agent) => ({
    agentId: agent.id,
  }));
};

export const generateMetadata = async ({ params }: AgentPageProps) => {
  const { agentId } = await params;
  const agent = getAgentById(agentId);

  if (!agent) {
    return {
      title: "Agent Not Found",
    };
  }

  return {
    title: agent.name,
    description: agent.description,
  };
};

const getAgentIcon = (agentId: string) => {
  switch (agentId) {
    case "jack":
      return <Bot className="h-8 w-8" />;
    case "sensie":
      return <Brain className="h-8 w-8" />;
    case "gary":
      return <Megaphone className="h-8 w-8" />;
    default:
      return <Bot className="h-8 w-8" />;
  }
};

const AgentPage = async ({ params }: AgentPageProps) => {
  const { agentId } = await params;
  const agent = getAgentById(agentId);

  if (!agent) {
    notFound();
  }

  const isComingSoon = agent.status === "coming-soon";
  const isJack = agent.id === "jack";

  return (
    <AgentPageTracker agentId={agentId}>
      <div className="min-h-screen">
        <Header />

        <main>
          {/* Hero */}
          <section className="py-12 md:py-16">
            <div className="container-narrow">
              {/* Agent header */}
              <div className="flex items-start gap-5 mb-6">
                <div className="w-16 h-16 bg-[var(--color-background-muted)] flex items-center justify-center text-[var(--color-foreground-muted)] shrink-0">
                  {getAgentIcon(agent.id)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl md:text-4xl font-semibold tracking-tight m-0 leading-tight">
                      {agent.name}
                    </h1>
                    {isComingSoon && (
                      <span className="text-xs font-medium uppercase tracking-wider px-2.5 py-1 bg-[var(--color-background-muted)] text-[var(--color-foreground-subtle)] border border-[var(--color-border)]">
                        Coming Soon
                      </span>
                    )}
                  </div>
                  <p className="text-lg text-[var(--color-foreground-muted)] leading-tight">
                    {agent.tagline}
                  </p>
                </div>
              </div>

              {/* Meta info row */}
              <div className="flex flex-wrap items-center gap-4 mb-8">
                <span className="text-sm font-mono text-[var(--color-foreground-subtle)] px-3 py-1.5 bg-[var(--color-background-muted)]">
                  {agent.estimatedMonthlyCost}
                </span>
                {!isComingSoon && agent.demoUrl && (
                  <Link
                    href={agent.demoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-foreground-muted)] hover:text-[var(--color-foreground)] transition-colors no-underline"
                  >
                    Try demo
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                )}
                {!isComingSoon && agent.specUrl && (
                  <Link
                    href={agent.specUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-foreground-muted)] hover:text-[var(--color-foreground)] transition-colors no-underline"
                  >
                    View spec
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>

              {/* Description */}
              <p className="text-[var(--color-foreground-muted)] leading-relaxed max-w-[640px]">
                {agent.description}
              </p>

              {/* Deploy CTA - prominent position */}
              {!isComingSoon && (
                <div className="mt-8">
                  <Link
                    href={`/deploy/${agent.id}`}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--color-accent)] text-white font-medium hover:bg-[var(--color-accent-muted)] transition-colors no-underline"
                  >
                    Deploy your own
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <p className="text-sm text-[var(--color-foreground-subtle)] mt-3">
                    Takes ~2 minutes. You&apos;ll own the code and data.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Divider */}
          <div className="divider-gradient" />

          {/* Jack-specific: Authenticity Section */}
          {isJack && (
            <section className="py-12 md:py-16">
              <div className="container-narrow">
                <div className="max-w-[640px]">
                  <h2 className="text-xl font-semibold mb-4 mt-0 tracking-tight">
                    Staying authentic in the age of AI
                  </h2>
                  <div className="space-y-4 text-[var(--color-foreground-muted)]">
                    <p className="leading-relaxed">
                      Generating posts is easy now. Anyone can ask ChatGPT to
                      write a thread. But that&apos;s exactly why authenticity
                      matters more than ever.
                    </p>
                    <p className="leading-relaxed">
                      Jack doesn&apos;t write for you — it helps you think. It
                      tracks what&apos;s trending, generates ideas, and creates
                      outlines. But the words? Those are yours.
                    </p>
                    <p className="leading-relaxed">
                      I want people to see how I actually create content. The
                      messy drafts that never made it. The ideas that seemed
                      good at 2am. The process of finding my voice, not just the
                      polished output.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          )}

          {isJack && <div className="divider-gradient" />}

          {/* Features */}
          <section className="py-12 md:py-16">
            <div className="container-narrow">
              <h2 className="text-xl font-semibold mb-8 mt-0 tracking-tight">
                What it does
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {agent.features.map((feature, index) => (
                  <div key={index} className="glass p-5">
                    <h3 className="text-base font-medium mb-2 mt-0">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-[var(--color-foreground-muted)] leading-relaxed m-0">
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Divider */}
          <div className="divider-gradient" />

          {/* Requirements */}
          <section className="py-12 md:py-16">
            <div className="container-narrow">
              <h2 className="text-xl font-semibold mb-8 mt-0 tracking-tight">
                What you need
              </h2>
              <div className="glass overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--glass-border)]">
                      <th className="text-left p-4 font-medium text-[var(--color-foreground-subtle)]">
                        Service
                      </th>
                      <th className="text-left p-4 font-medium text-[var(--color-foreground-subtle)]">
                        Cost
                      </th>
                      <th className="text-left p-4 font-medium text-[var(--color-foreground-subtle)] hidden md:table-cell">
                        Description
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {agent.requirements.map((req, index) => (
                      <tr
                        key={index}
                        className="border-b border-[var(--glass-border)] last:border-b-0"
                      >
                        <td className="p-4 font-medium">{req.name}</td>
                        <td className="p-4 font-mono text-[var(--color-foreground-muted)]">
                          {req.cost}
                        </td>
                        <td className="p-4 text-[var(--color-foreground-muted)] hidden md:table-cell">
                          {req.description}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-sm text-[var(--color-foreground-subtle)] mt-4">
                This project is free and open source. You only pay for the
                services you use directly.
              </p>
            </div>
          </section>

          {/* Divider */}
          <div className="divider-gradient" />

          {/* Deployment Steps */}
          {!isComingSoon && (
            <section className="py-12 md:py-16">
              <div className="container-narrow">
                <h2 className="text-xl font-semibold mb-8 mt-0 tracking-tight">
                  How deployment works
                </h2>
                <div className="space-y-4">
                  {[
                    "Clone the repo to your GitHub account",
                    "Create a Vercel project",
                    "Optionally add Neon Postgres database",
                    "Deploy to production",
                  ].map((step, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 p-4 glass"
                    >
                      <div className="w-8 h-8 bg-[rgba(34,197,94,0.1)] flex items-center justify-center shrink-0">
                        <Check className="h-4 w-4 text-[var(--color-success)]" />
                      </div>
                      <span className="text-[var(--color-foreground-muted)]">
                        {step}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-[var(--color-foreground-subtle)] mt-6">
                  After deployment, follow the setup guide to complete
                  configuration.
                </p>
              </div>
            </section>
          )}

          {/* Final CTA */}
          {!isComingSoon && (
            <section className="py-12 md:py-16">
              <div className="container-narrow">
                <div className="glass p-8 md:p-12 text-center">
                  <h2 className="text-2xl font-semibold mb-4 mt-0 tracking-tight">
                    Ready to deploy?
                  </h2>
                  <p className="text-[var(--color-foreground-muted)] mb-8 max-w-[400px] mx-auto">
                    Get your own {agent.name} instance running in minutes. Full
                    ownership, no lock-in.
                  </p>
                  <Link
                    href={`/deploy/${agent.id}`}
                    className="inline-flex items-center gap-2 px-8 py-4 bg-[var(--color-accent)] text-white font-medium text-lg hover:bg-[var(--color-accent-muted)] transition-colors no-underline"
                  >
                    Deploy your own
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </div>
              </div>
            </section>
          )}

          {/* Coming Soon CTA */}
          {isComingSoon && (
            <section className="py-12 md:py-16">
              <div className="container-narrow">
                <div className="glass p-8 md:p-12 text-center">
                  <h2 className="text-xl font-semibold mb-4 mt-0 tracking-tight">
                    Coming Soon
                  </h2>
                  <p className="text-[var(--color-foreground-muted)] max-w-[400px] mx-auto">
                    This agent is still in development. Check back soon or
                    follow me for updates.
                  </p>
                </div>
              </div>
            </section>
          )}
        </main>
      </div>
    </AgentPageTracker>
  );
};

export default AgentPage;
