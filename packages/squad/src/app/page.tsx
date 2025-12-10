import { Header } from "@/components/sections/header";
import { Footer } from "@/components/sections/footer";
import { AgentCard } from "@/components/agent-card";
import { agents } from "@/config/agents";
import { siteConfig } from "@/config/site";
import Link from "next/link";

const HomePage = () => {
  return (
    <div className="min-h-screen font-mono">
      <div className="max-w-[800px] mx-auto">
        <Header />

        <main>
          {/* Hero Section */}
          <section className="py-6">
            <h1 className="text-2xl sm:text-3xl font-bold mb-4">
              hyper personalised agents i built, deploy them for yourself and
              let them do your boring work
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              these are tools i use daily. open source, but you can deploy your
              own instance in 2 minutes.
            </p>
          </section>

          {/* Agents Section */}
          <section className="py-6">
            <h2 className="text-base sm:text-lg font-bold mb-6 mt-0">agents</h2>
            <div className="space-y-4">
              {agents.map((agent) => (
                <AgentCard key={agent.id} agent={agent} />
              ))}
            </div>
          </section>

          {/* Why Section */}
          <section className="py-6">
            <h2 className="text-base sm:text-lg font-bold mb-4 mt-0">
              why this exists
            </h2>
            <p className="text-sm sm:text-base mb-4">
              i build these agents for myself. they help me ship faster and stay
              consistent. the code is open source - you can read it, fork it, or
              deploy your own instance here.
            </p>
            <div className="flex flex-wrap gap-4 text-sm">
              <Link
                href={siteConfig.links.portfolio}
                target="_blank"
                rel="noreferrer"
              >
                portfolio
              </Link>
              <Link
                href={siteConfig.links.github}
                target="_blank"
                rel="noreferrer"
              >
                github
              </Link>
              <Link
                href={siteConfig.links.calendar}
                target="_blank"
                rel="noreferrer"
              >
                book a call
              </Link>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default HomePage;
