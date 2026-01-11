import { notFound, redirect } from "next/navigation";
import { Header } from "@/components/sections/header";
import { getAgentById } from "@/config/agents";
import { DeployFlow } from "./deploy-flow";
import { DeployPageTracker } from "@/components/analytics";


interface DeployPageProps {
  params: Promise<{
    agentId: string;
  }>;
}


export const generateMetadata = async ({ params }: DeployPageProps) => {
  const { agentId } = await params;
  const agent = getAgentById(agentId);

  if (!agent) {
    return { title: "Agent Not Found" };
  }

  return {
    title: `Deploy ${agent.name}`,
    description: `Deploy ${agent.name} to your own infrastructure`,
  };
};

// Page Component

const DeployPage = async ({ params }: DeployPageProps) => {
  const { agentId } = await params;
  const agent = getAgentById(agentId);

  // Agent not found
  if (!agent) {
    notFound();
  }

  // Agent not available for deployment
  if (agent.status === "coming-soon") {
    redirect(`/${agentId}`);
  }

  return (
    <DeployPageTracker agentId={agentId}>
      <div className="min-h-screen">
        <Header />

        <main>
          <section className="py-8 md:py-12">
            <div className="container-narrow">
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                deploy {agent.name}
              </h1>
              <p className="text-sm text-[var(--color-foreground-muted)] mb-8">
                we&apos;ll set up everything for you in about 2 minutes
              </p>

              <DeployFlow agent={agent} />
            </div>
          </section>
        </main>
      </div>
    </DeployPageTracker>
  );
};

export default DeployPage;
