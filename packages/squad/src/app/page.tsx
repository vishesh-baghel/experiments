import { Header } from "@/components/sections/header";
import { AgentCard } from "@/components/agent-card";
import { getAvailableAgents, getComingSoonAgents } from "@/config/agents";
import { ArrowDown } from "lucide-react";

const HomePage = () => {
  const availableAgents = getAvailableAgents();
  const comingSoonAgents = getComingSoonAgents();

  return (
    <div className="min-h-screen">
      <Header />

      <main>
        {/* Hero Section */}
        <section className="py-20 md:py-32">
          <div className="container-narrow text-center">
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-6 leading-[1.1]">
              My AI agents.
              <br />
              <span className="text-[var(--color-foreground-muted)]">
                Try them yourself.
              </span>
            </h1>
            <p className="text-lg text-[var(--color-foreground-muted)] max-w-[520px] mx-auto mb-10 leading-relaxed">
              These are agents I use daily in my workflows. Deploy your own
              instance and see how they work for you.
            </p>
            <a
              href="#agents"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-[var(--color-foreground-muted)] border border-[var(--color-border)] hover:border-[var(--color-border-hover)] hover:text-[var(--color-foreground)] transition-all no-underline"
            >
              Browse agents
              <ArrowDown className="h-4 w-4" />
            </a>
          </div>
        </section>

        {/* Divider */}
        <div className="divider-gradient" />

        {/* Agents Section */}
        <section id="agents" className="py-16 md:py-20">
          <div className="container-narrow">
            {/* Available Agents */}
            <div className="mb-16">
              <div className="flex items-center gap-3 mb-8">
                <h2 className="text-sm font-medium uppercase tracking-wider text-[var(--color-foreground-subtle)] m-0">
                  Available
                </h2>
                <span className="flex-1 h-px bg-[var(--color-border)]" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableAgents.map((agent) => (
                  <AgentCard key={agent.id} agent={agent} />
                ))}
              </div>
            </div>

            {/* Coming Soon Agents */}
            {comingSoonAgents.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-8">
                  <h2 className="text-sm font-medium uppercase tracking-wider text-[var(--color-foreground-subtle)] m-0">
                    Coming Soon
                  </h2>
                  <span className="flex-1 h-px bg-[var(--color-border)]" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {comingSoonAgents.map((agent) => (
                    <AgentCard key={agent.id} agent={agent} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Divider */}
        <div className="divider-gradient" />

        {/* Why Section */}
        <section className="py-16 md:py-20">
          <div className="container-narrow">
            <div className="max-w-[600px]">
              <h2 className="text-2xl font-semibold mb-6 mt-0 tracking-tight">
                Why I&apos;m sharing these
              </h2>
              <div className="space-y-4 text-[var(--color-foreground-muted)]">
                <p className="leading-relaxed">
                  I built these agents for my own workflows. They help me create
                  content, learn new things, and stay productive. I use them
                  every day.
                </p>
                <p className="leading-relaxed">
                  Instead of just talking about what I build, I wanted to let
                  you try them yourself. Deploy your own instance, explore the
                  code, and see if they fit your workflow too.
                </p>
                <p className="leading-relaxed">
                  Everything is open source. You own your data, pay only for
                  what you use, and can modify anything you want.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default HomePage;
