# Vishesh's Experiments

A collection of projects I build to learn new technologies and share what I learn with others.

Each project is production-ready and well-documented. I build these to understand how things work, then open source them so others can learn too.

## Projects

### LLM Router
Automatically picks the cheapest AI model that can handle your query. Simple questions go to cheap models, complex ones go to expensive models. Saves up to 90% on AI costs.

[View Project](./packages/llm-router/)

### LLM Router UI
Interactive demo of the LLM Router. Chat with it and see which model gets picked and how much each message costs.

[View Project](./packages/llm-router-ui/)

### Jack
AI agent that helps create X (Twitter) content. It tracks creators you follow, learns from your successful posts, and generates ideas that match your voice. You still write the actual content.

[View Project](./packages/jack-x-agent/)

### Squad
One-click deployment platform for my AI agents. Pick an agent, click deploy, and it sets up everything on your own infrastructure.

[View Project](./packages/squad/)

### Sensie
AI learning assistant that teaches through questions instead of giving answers. Has a Master Roshi personality - wise but demanding. Uses spaced repetition so you actually remember what you learn.

[View Project](./packages/sensie/)

## Getting Started

```bash
# Install dependencies
pnpm install

# Pick a project and run it
cd packages/llm-router
cp .env.example .env
pnpm dev
```

Each project has its own README with detailed setup instructions.

## Why I Build These

1. **Learning** - Best way to understand something is to build it
2. **Sharing** - Others can learn from the code and patterns
3. **Real Code** - Not toy examples, actual working software
4. **Documentation** - Every project is thoroughly documented

## License

MIT - Use however you want.

## Contact

**Vishesh Baghel**

[X](https://x.com/visheshbaghel) | [GitHub](https://github.com/vishesh-baghel) | [Email](mailto:hi@visheshbaghel.com)
