/**
 * Setup Guide Page
 *
 * Post-deployment setup instructions for each agent.
 */

import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getAgentById, agents } from "@/config/agents";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/sections/header";
import { Footer } from "@/components/sections/footer";
import { GuidePageTracker } from "@/components/analytics";

interface GuidePageProps {
  params: Promise<{ agentId: string }>;
}

export const generateStaticParams = async () => {
  return agents.map((agent) => ({ agentId: agent.id }));
};

export const generateMetadata = async ({
  params,
}: GuidePageProps): Promise<Metadata> => {
  const { agentId } = await params;
  const agent = getAgentById(agentId);

  if (!agent) {
    return { title: "Agent Not Found" };
  }

  return {
    title: `${agent.name} setup guide | squad`,
    description: `Complete setup instructions for your ${agent.name} agent deployment`,
  };
};

const GuidePage = async ({ params }: GuidePageProps) => {
  const { agentId } = await params;
  const agent = getAgentById(agentId);

  if (!agent) {
    notFound();
  }

  return (
    <GuidePageTracker agentId={agentId}>
      <div className="min-h-screen bg-background font-mono">
        <div className="max-w-[800px] mx-auto">
          <Header />
          
          <main>
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold">{agent.name} setup guide</h1>
            <p className="text-muted-foreground mt-2">
              follow these steps to complete your agent configuration
            </p>
          </div>

        {/* Steps from config */}
        <div className="space-y-6">
          {agent.guideSteps.map((step, index) => (
            <section key={index} className="border border-border p-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold leading-none relative top-[1px]">
                  {index + 1}
                </div>
                <div className="space-y-3 flex-1">
                  <h2 className="text-lg font-semibold">{step.title}</h2>
                  <p className="text-sm text-muted-foreground">
                    {step.description}
                  </p>
                  {step.details && step.details.length > 0 && (
                    <div className="bg-muted/50 p-3 rounded text-sm">
                      <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                        {step.details.map((detail, i) => (
                          <li key={i}>{detail}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                  {step.link && (
                    <Button variant="outline" size="sm" className="no-underline" asChild>
                      <a
                        href={step.link.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {step.link.text}
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </section>
          ))}

          {/* Done */}
          <section className="border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30 p-6">
            <div className="flex gap-4">
              <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0" />
              <div className="space-y-3 flex-1">
                <h2 className="text-lg font-semibold">all done</h2>
                <p className="text-sm text-muted-foreground">
                  once you&apos;ve completed all steps and redeployed, your{" "}
                  {agent.name} agent should be fully functional.
                </p>
                <div className="flex gap-3">
                  <Button asChild className="no-underline">
                    <Link href="/">deploy another agent</Link>
                  </Button>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Help */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            need help?{" "}
            <a
              href="https://x.com/visheshbaghell"
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              reach out on x
            </a>
          </p>
        </div>
        </main>
        
        <Footer />
      </div>
    </div>
    </GuidePageTracker>
  );
};

export default GuidePage;
