/**
 * Setup Guide Page
 *
 * Post-deployment setup instructions for each agent.
 */

import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getAgentById, agents } from "@/config/agents";
import { ArrowLeft, ExternalLink, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

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

  const userEnvVars = agent.envVars.filter((v) => v.source === "user");
  const generatedEnvVars = agent.envVars.filter((v) => v.source === "generated");

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/deploy/${agent.id}`}
            className="text-sm text-muted-foreground hover:underline inline-flex items-center gap-1 mb-4"
          >
            <ArrowLeft className="h-3 w-3" />
            back to deploy
          </Link>
          <h1 className="text-2xl font-bold">{agent.name} setup guide</h1>
          <p className="text-muted-foreground mt-2">
            follow these steps to complete your agent configuration
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-8">
          {/* Step 1: Verify Deployment */}
          <section className="border border-border p-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                1
              </div>
              <div className="space-y-3 flex-1">
                <h2 className="text-lg font-semibold">verify deployment</h2>
                <p className="text-sm text-muted-foreground">
                  make sure your vercel deployment completed successfully. check
                  your vercel dashboard for any build errors.
                </p>
                <Button variant="outline" size="sm" asChild>
                  <a
                    href="https://vercel.com/dashboard"
                    target="_blank"
                    rel="noreferrer"
                  >
                    open vercel dashboard
                    <ExternalLink className="ml-2 h-3 w-3" />
                  </a>
                </Button>
              </div>
            </div>
          </section>

          {/* Step 2: Database Setup */}
          <section className="border border-border p-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                2
              </div>
              <div className="space-y-3 flex-1">
                <h2 className="text-lg font-semibold">database setup</h2>
                <p className="text-sm text-muted-foreground">
                  if you added neon postgres during deployment, your database is
                  ready. otherwise, add it now from your vercel project settings.
                </p>
                <div className="bg-muted/50 p-3 rounded text-sm">
                  <p className="font-medium mb-2">to add neon postgres:</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>go to your vercel project settings</li>
                    <li>click &quot;storage&quot; tab</li>
                    <li>select &quot;neon&quot; and create a database</li>
                    <li>environment variables will be added automatically</li>
                  </ol>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a
                    href="https://neon.tech/docs/guides/vercel"
                    target="_blank"
                    rel="noreferrer"
                  >
                    neon + vercel docs
                    <ExternalLink className="ml-2 h-3 w-3" />
                  </a>
                </Button>
              </div>
            </div>
          </section>

          {/* Step 3: Environment Variables */}
          {(userEnvVars.length > 0 || generatedEnvVars.length > 0) && (
            <section className="border border-border p-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                  3
                </div>
                <div className="space-y-3 flex-1">
                  <h2 className="text-lg font-semibold">environment variables</h2>
                  <p className="text-sm text-muted-foreground">
                    add these environment variables in your vercel project
                    settings under &quot;environment variables&quot;.
                  </p>

                  {userEnvVars.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">required variables:</p>
                      <ul className="space-y-2">
                        {userEnvVars.map((v) => (
                          <li
                            key={v.key}
                            className="bg-muted/50 p-3 rounded text-sm"
                          >
                            <code className="font-mono font-semibold">
                              {v.key}
                            </code>
                            <p className="text-muted-foreground mt-1">
                              {v.description}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {generatedEnvVars.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">
                        variables you should generate:
                      </p>
                      <ul className="space-y-2">
                        {generatedEnvVars.map((v) => (
                          <li
                            key={v.key}
                            className="bg-muted/50 p-3 rounded text-sm"
                          >
                            <code className="font-mono font-semibold">
                              {v.key}
                            </code>
                            <p className="text-muted-foreground mt-1">
                              {v.description}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Step 4: Redeploy */}
          <section className="border border-border p-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                {userEnvVars.length > 0 || generatedEnvVars.length > 0 ? "4" : "3"}
              </div>
              <div className="space-y-3 flex-1">
                <h2 className="text-lg font-semibold">redeploy</h2>
                <p className="text-sm text-muted-foreground">
                  after adding environment variables, redeploy your project to
                  apply the changes. go to your vercel project and click
                  &quot;redeploy&quot;.
                </p>
              </div>
            </div>
          </section>

          {/* Agent-specific instructions */}
          {agent.deployInstructions.length > 0 && (
            <section className="border border-border p-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                  {userEnvVars.length > 0 || generatedEnvVars.length > 0 ? "5" : "4"}
                </div>
                <div className="space-y-3 flex-1">
                  <h2 className="text-lg font-semibold">
                    {agent.name}-specific setup
                  </h2>
                  <div className="space-y-4">
                    {agent.deployInstructions
                      .filter((i) => i.step > 1)
                      .map((instruction) => (
                        <div
                          key={instruction.step}
                          className="bg-muted/50 p-3 rounded"
                        >
                          <p className="text-sm font-medium">
                            {instruction.title}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {instruction.description}
                          </p>
                          {instruction.link && (
                            <a
                              href={instruction.link.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-sm underline text-muted-foreground hover:text-foreground mt-2 inline-flex items-center gap-1"
                            >
                              {instruction.link.text}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </section>
          )}

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
                  <Button asChild>
                    <Link href="/">deploy another agent</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href={`/${agent.id}`}>back to {agent.name}</Link>
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
      </div>
    </div>
  );
};

export default GuidePage;
