import { Header } from "@/components/sections/header";
import { Footer } from "@/components/sections/footer";
import { AgentCard } from "@/components/agent-card";
import { agents } from "@/config/agents";

const HomePage = () => {
  return (
    <div className="min-h-screen font-mono">
      <div className="max-w-[800px] mx-auto">
        <Header />

        <main>
          {/* Hero Section */}
          <section className="py-6">
            <h1 className="text-2xl sm:text-3xl font-bold mb-4">
              personal agents i built and use daily
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              a collection of ai agents from my workflow. open source, so you
              can see how they work, learn from them, or build your own.
            </p>
          </section>

          {/* Why Section - moved before agents */}
          <section className="py-6">
            <h2 className="text-base sm:text-lg font-bold mb-4 mt-0">
              why i built these
            </h2>
            <div className="space-y-4 text-sm sm:text-base">
              <p>
                i believe software should be personal - shaped by how you think
                and work, not built for the masses. these agents started as
                tools for myself, and i&apos;m sharing them so others can learn
                from the approach.
              </p>
              <p>
                everything is open source. you can read the code, understand the
                architecture, and adapt the ideas for your own projects. no
                black boxes.
              </p>
              <p>
                if you want to run your own instance, you can deploy it to your
                infrastructure. you own the data, pay only for what you use, and
                can modify anything.
              </p>
            </div>
          </section>

          {/* Agents Section */}
          <section className="py-6">
            <h2 className="text-base sm:text-lg font-bold mb-6 mt-0">
              the agents
            </h2>
            <div className="space-y-4">
              {agents.map((agent) => (
                <AgentCard key={agent.id} agent={agent} />
              ))}
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default HomePage;
