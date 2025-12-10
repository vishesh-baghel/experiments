import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/sections/header";
import { Footer } from "@/components/sections/footer";
import { Button } from "@/components/ui/button";
import { agents, getAgentById } from "@/config/agents";
import { Check, ExternalLink } from "lucide-react";

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

const AgentPage = async ({ params }: AgentPageProps) => {
  const { agentId } = await params;
  const agent = getAgentById(agentId);

  if (!agent) {
    notFound();
  }

  const isComingSoon = agent.status === "coming-soon";

  return (
    <div className="min-h-screen font-mono">
      <div className="max-w-[800px] mx-auto">
        <Header />

        <main>
          {/* Hero */}
          <section className="py-6">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl sm:text-3xl font-bold">{agent.name}</h1>
              {isComingSoon && (
                <span className="text-xs px-2 py-1 bg-secondary text-muted-foreground">
                  coming soon
                </span>
              )}
            </div>
            <p className="text-base text-muted-foreground mb-4 italic">
              &quot;{agent.tagline}&quot;
            </p>
            <p className="text-sm sm:text-base">{agent.description}</p>
          </section>

          {/* Features */}
          <section className="py-6">
            <h2 className="text-base sm:text-lg font-bold mb-4 mt-0">
              what it does
            </h2>
            <ul className="space-y-4">
              {agent.features.map((feature, index) => (
                <li key={index} className="before:content-none">
                  <div className="font-semibold text-sm">{feature.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {feature.description}
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Requirements */}
          <section className="py-6">
            <h2 className="text-base sm:text-lg font-bold mb-4 mt-0">
              what you need
            </h2>
            <div className="space-y-2 text-sm font-mono">
              {agent.requirements.map((req, index) => (
                <div key={index} className="flex justify-between">
                  <span>{req.name}</span>
                  <span className="text-muted-foreground">{req.cost}</span>
                </div>
              ))}
              <div className="border-t border-border pt-2 mt-4 flex justify-between font-semibold">
                <span>estimated total</span>
                <span>{agent.estimatedMonthlyCost}</span>
              </div>
            </div>
          </section>

          {/* What We Set Up */}
          {!isComingSoon && (
            <section className="py-6">
              <h2 className="text-base sm:text-lg font-bold mb-4 mt-0">
                what we&apos;ll set up for you
              </h2>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2 before:content-none">
                  <Check className="h-4 w-4 text-green-600" />
                  fork the repo to your github
                </li>
                <li className="flex items-center gap-2 before:content-none">
                  <Check className="h-4 w-4 text-green-600" />
                  create vercel project
                </li>
                <li className="flex items-center gap-2 before:content-none">
                  <Check className="h-4 w-4 text-green-600" />
                  provision neon postgres database
                </li>
                <li className="flex items-center gap-2 before:content-none">
                  <Check className="h-4 w-4 text-green-600" />
                  configure ai gateway
                </li>
                <li className="flex items-center gap-2 before:content-none">
                  <Check className="h-4 w-4 text-green-600" />
                  set all environment variables
                </li>
                <li className="flex items-center gap-2 before:content-none">
                  <Check className="h-4 w-4 text-green-600" />
                  deploy to production
                </li>
              </ul>
              {agent.envVars.some((v) => v.source === "user") && (
                <p className="text-xs text-muted-foreground mt-4">
                  you&apos;ll need to add{" "}
                  {agent.envVars
                    .filter((v) => v.source === "user")
                    .map((v) => v.key)
                    .join(", ")}{" "}
                  after deployment.
                </p>
              )}
            </section>
          )}

          {/* Deploy CTA */}
          {!isComingSoon && (
            <section className="py-6">
              <div className="border border-border p-6">
                <Button className="w-full" size="lg">
                  deploy your own
                </Button>
                <p className="text-xs text-center text-muted-foreground mt-3">
                  takes ~2 minutes. you&apos;ll own the code and data.
                </p>
              </div>
            </section>
          )}

          {/* Coming Soon CTA */}
          {isComingSoon && (
            <section className="py-6">
              <div className="border border-border p-6 bg-secondary/20">
                <p className="text-sm text-center text-muted-foreground">
                  this agent is still in development. check back soon.
                </p>
              </div>
            </section>
          )}

          {/* Links */}
          <section className="py-6">
            <div className="flex flex-wrap gap-4 text-sm">
              {agent.demoUrl && (
                <Link
                  href={agent.demoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1"
                >
                  see it live (demo)
                  <ExternalLink className="h-3 w-3" />
                </Link>
              )}
              {agent.specUrl && (
                <Link
                  href={agent.specUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1"
                >
                  read the spec
                  <ExternalLink className="h-3 w-3" />
                </Link>
              )}
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default AgentPage;
