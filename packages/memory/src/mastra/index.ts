// Export all MCP tools for use in the Mastra server or direct invocation
export * from './tools';

// Export a tools object for convenience
export {
  memoryIndex,
  memorySearch,
  memoryRead,
  memoryWrite,
  memoryList,
  memoryDelete,
} from './tools';

// Note: In Mastra v0.5+, tools are registered via Agents, not directly on the Mastra instance.
// The MCP server setup would be done in a separate server configuration file.
