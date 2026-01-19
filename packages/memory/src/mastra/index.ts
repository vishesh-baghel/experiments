import { Mastra } from '@mastra/core';
import {
  memoryIndex,
  memorySearch,
  memoryRead,
  memoryWrite,
  memoryList,
  memoryDelete,
} from './tools';

export const mastra = new Mastra({
  tools: {
    memoryIndex,
    memorySearch,
    memoryRead,
    memoryWrite,
    memoryList,
    memoryDelete,
  },
});

// Re-export tools for direct use
export * from './tools';
