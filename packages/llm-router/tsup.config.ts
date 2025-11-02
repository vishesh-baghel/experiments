import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  // Don't bundle these - they should be peer dependencies
  external: [
    '@ai-sdk/openai',
    '@ai-sdk/anthropic',
    '@ai-sdk/google',
    'ai',
    '@mastra/core',
    'groq-sdk',
    'together-ai',
    'ollama',
  ],
  // Bundle everything else including tiktoken
  noExternal: [
    '@dqbd/tiktoken',
  ],
});
