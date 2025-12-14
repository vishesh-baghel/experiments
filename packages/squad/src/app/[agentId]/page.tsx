import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/sections/header";
import { Footer } from "@/components/sections/footer";
import { Button } from "@/components/ui/button";
import { agents, getAgentById } from "@/config/agents";
import { Check } from "lucide-react";

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
  const isJack = agent.id === "jack";

  return (
    <div className="min-h-screen font-mono">
      <div className="max-w-[800px] mx-auto">
        <Header />

        <main>
          {/* Hero */}
          <section className="py-6">
            <div className="flex items-baseline gap-3 mb-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold">{agent.name}</h1>
              {isComingSoon && (
                <span className="text-xs px-2 py-0.5 bg-secondary text-muted-foreground leading-none">
                  coming soon
                </span>
              )}
              {!isComingSoon && (
                <div className="flex gap-3 text-sm">
                  {agent.demoUrl && (
                    <Link
                      href={agent.demoUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      live
                    </Link>
                  )}
                  {agent.specUrl && (
                    <Link
                      href={agent.specUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      spec
                    </Link>
                  )}
                </div>
              )}
            </div>
            <p className="text-base text-muted-foreground mb-4 italic">
              &quot;{agent.tagline}&quot;
            </p>
            <p className="text-sm sm:text-base">{agent.description}</p>
          </section>

          {/* Jack-specific: Authenticity Section */}
          {isJack && (
            <section className="py-6">
              <h2 className="text-base sm:text-lg font-bold mb-4 mt-0">
                staying authentic in the age of ai
              </h2>
              <div className="space-y-4 text-sm sm:text-base">
                <p>
                  generating posts is easy now. anyone can ask chatgpt to write
                  a thread. but that&apos;s exactly why authenticity matters
                  more than ever.
                </p>
                <p>
                  jack doesn&apos;t write for you - it helps you think. it
                  tracks what&apos;s trending, generates ideas, and creates
                  outlines. but the words? those are yours.
                </p>
                <p>
                  i want people to see how i actually create content. the messy
                  drafts that never made it. the ideas that seemed good at 2am.
                  the process of finding my voice, not just the polished output.
                </p>
              </div>
            </section>
          )}

          {/* Jack-specific: Core Ideas Section */}
          {isJack && (
            <section className="py-6">
              <h2 className="text-base sm:text-lg font-bold mb-4 mt-0">
                the idea behind this
              </h2>
              <div className="space-y-4 text-sm sm:text-base">
                <p>
                  i share everything i do - how i use ai tools to create, learn,
                  and explore tech. not to show off, but because i believe in
                  learning in public.
                </p>
                <p>
                  when you deploy jack, you get the same system i use. watch how
                  it learns your voice over time. see the ideas it generates.
                  understand the process, not just the result.
                </p>
                <p>
                  that&apos;s the point - to help you build your own authentic
                  presence, using ai as a thinking partner rather than a
                  ghostwriter.
                </p>
              </div>
            </section>
          )}

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
                <Button className="w-full no-underline" size="lg" asChild>
                  <Link href={`/deploy/${agent.id}`} className="no-underline">deploy your own</Link>
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

        </main>

        <Footer />
      </div>
    </div>
  );
};

export default AgentPage;
