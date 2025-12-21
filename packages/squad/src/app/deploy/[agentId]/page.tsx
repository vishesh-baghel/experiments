import { notFound, redirect } from "next/navigation";
import { Header } from "@/components/sections/header";
import { Footer } from "@/components/sections/footer";
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
      <div className="min-h-screen font-mono">
        <div className="max-w-[800px] mx-auto">
          <Header />

          <main>
            <section className="py-6">
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                deploy {agent.name}
              </h1>
              <p className="text-sm text-muted-foreground mb-6">
                we&apos;ll set up everything for you in about 2 minutes
              </p>

              <DeployFlow agent={agent} />
            </section>
          </main>

          <Footer />
        </div>
      </div>
    </DeployPageTracker>
  );
};

export default DeployPage;
