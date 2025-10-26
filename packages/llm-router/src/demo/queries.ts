/**
 * Demo queries for testing the LLM Router
 * Organized by complexity level
 */

export interface DemoQuery {
  query: string;
  expectedComplexity: 'simple' | 'moderate' | 'complex' | 'reasoning';
  category: string;
}

export const demoQueries: DemoQuery[] = [
  // ========== SIMPLE QUERIES ==========
  {
    query: 'What are your business hours?',
    expectedComplexity: 'simple',
    category: 'simple-factual',
  },
  {
    query: 'How do I reset my password?',
    expectedComplexity: 'simple',
    category: 'simple-procedural',
  },
  {
    query: "What's your return policy?",
    expectedComplexity: 'simple',
    category: 'simple-policy',
  },
  {
    query: 'Where is my order #12345?',
    expectedComplexity: 'simple',
    category: 'simple-status',
  },
  {
    query: 'Do you ship internationally?',
    expectedComplexity: 'simple',
    category: 'simple-yesno',
  },

  // ========== MODERATE QUERIES ==========
  {
    query:
      'I received a damaged product. What are my options for replacement or refund?',
    expectedComplexity: 'moderate',
    category: 'moderate-problem-solving',
  },
  {
    query:
      'Can you explain the differences between your premium and basic plans?',
    expectedComplexity: 'moderate',
    category: 'moderate-comparison',
  },
  {
    query:
      "I'm having trouble with the checkout process. The payment keeps failing. Can you help?",
    expectedComplexity: 'moderate',
    category: 'moderate-troubleshooting',
  },
  {
    query:
      'How do I upgrade my subscription and will I be charged immediately?',
    expectedComplexity: 'moderate',
    category: 'moderate-multi-part',
  },
  {
    query:
      'I need to change my shipping address for an order that has already been placed.',
    expectedComplexity: 'moderate',
    category: 'moderate-request',
  },

  // ========== COMPLEX QUERIES ==========
  {
    query:
      "I've been charged twice for the same order, but only received one item. I also noticed my subscription was upgraded without my consent. Can you investigate this and explain what happened?",
    expectedComplexity: 'complex',
    category: 'complex-multi-issue',
  },
  {
    query:
      'Compare the features, pricing, and use cases for all your service tiers. Which would be best for a small business with 10 employees that needs collaboration features?',
    expectedComplexity: 'complex',
    category: 'complex-analysis',
  },
  {
    query:
      'I need help understanding how your API authentication works. Specifically, how do I implement OAuth2 with refresh tokens and handle token expiration gracefully?',
    expectedComplexity: 'complex',
    category: 'complex-technical',
  },
  {
    query:
      'Explain the process for migrating my data from your legacy system to the new platform. What are the potential issues I should be aware of and how long will it take?',
    expectedComplexity: 'complex',
    category: 'complex-detailed-explanation',
  },
  {
    query: `I'm implementing your webhook system. Here's my code:
\`\`\`javascript
app.post('/webhook', (req, res) => {
  const signature = req.headers['x-signature'];
  // How do I verify this?
});
\`\`\`
Can you explain how to properly verify webhook signatures and handle retries?`,
    expectedComplexity: 'complex',
    category: 'complex-code-help',
  },

  // ========== REASONING QUERIES ==========
  {
    query:
      "I'm deciding between canceling my subscription or downgrading to a cheaper plan. Consider: I've used 80% of my quota this month, typically use 60%, and the project causing increased usage ends next month. What should I do and why?",
    expectedComplexity: 'reasoning',
    category: 'reasoning-decision',
  },
  {
    query:
      'Three months ago I ordered item A ($50), last month item B ($75), and today item C ($100) arrived damaged. I want to return C but also inquire about a discount on my next purchase given my history as a customer. What\'s the best approach to maximize my outcome while maintaining a good relationship with your company?',
    expectedComplexity: 'reasoning',
    category: 'reasoning-strategy',
  },
  {
    query:
      'Given these constraints: budget of $500/month, need for 24/7 uptime, team of 5 developers, and compliance with GDPR, recommend which of your plans I should choose and explain your reasoning step by step.',
    expectedComplexity: 'reasoning',
    category: 'reasoning-multi-constraint',
  },
  {
    query:
      'I have two competing priorities: reducing costs by 30% and improving performance by 20%. Looking at your service tiers, some are cheaper but slower, others are faster but more expensive. Help me think through the tradeoffs and recommend an approach that balances both goals.',
    expectedComplexity: 'reasoning',
    category: 'reasoning-tradeoff-analysis',
  },
  {
    query:
      'Calculate whether it makes more financial sense for my company to: (1) stay on the monthly plan at $99/month, (2) switch to annual at $950/year, or (3) upgrade to enterprise at $199/month with better features. Consider that we might grow from 5 to 15 users over the next year, and the enterprise plan includes features that could save us 10 hours/week of manual work.',
    expectedComplexity: 'reasoning',
    category: 'reasoning-calculation',
  },
];

/**
 * Get queries by complexity level
 */
export function getQueriesByComplexity(
  level: 'simple' | 'moderate' | 'complex' | 'reasoning'
): DemoQuery[] {
  return demoQueries.filter((q) => q.expectedComplexity === level);
}

/**
 * Get a random query
 */
export function getRandomQuery(): DemoQuery {
  return demoQueries[Math.floor(Math.random() * demoQueries.length)];
}

/**
 * Get queries by category
 */
export function getQueriesByCategory(category: string): DemoQuery[] {
  return demoQueries.filter((q) => q.category === category);
}
