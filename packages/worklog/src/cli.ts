import path from 'path';
import os from 'os';
import { Command } from 'commander';
import { loadConfig } from './config.js';
import { getLatestSession, getSessionById, listProjects } from './adapters/claude-code.js';
import { processSession } from './pipeline/index.js';

const CLAUDE_PROJECTS_DIR = path.join(os.homedir(), '.claude', 'projects');

const program = new Command();

program
  .name('worklog')
  .description('Ingest coding agent sessions and publish to Memory')
  .version('0.1.0');

program
  .command('ingest')
  .description('Process a coding session and publish to Memory')
  .option('--source <source>', 'Agent source', 'claude-code')
  .option('--project <path>', 'Project path (absolute)')
  .option('--session <id>', 'Specific session ID (default: latest)')
  .action(async (options) => {
    const { source, project, session: sessionId } = options;

    if (source !== 'claude-code') {
      console.error(`Unsupported source: ${source}. Only "claude-code" is supported.`);
      process.exit(1);
    }

    if (!project) {
      console.error('--project is required. Provide the absolute path to the project.');
      process.exit(1);
    }

    const config = loadConfig();

    console.log(`[worklog] Ingesting session from: ${project}`);

    const entry = sessionId
      ? await getSessionById(config.sessionPaths.claudeCode, project, sessionId)
      : await getLatestSession(config.sessionPaths.claudeCode, project);

    if (!entry) {
      console.error('[worklog] No eligible session found.');
      process.exit(1);
    }

    console.log(`[worklog] Session: ${entry.sessionId}`);
    console.log(`[worklog] Summary: ${entry.summary}`);
    console.log(`[worklog] Messages: ${entry.messageCount}`);
    console.log(`[worklog] Date: ${entry.created.split('T')[0]}`);
    console.log(`[worklog] Processing...`);

    const result = await processSession(entry, config);

    if (result.published) {
      console.log(`[worklog] Published to Memory`);
      console.log(`[worklog] Significant: ${result.isSignificant}`);
      if (result.summary) {
        console.log(`[worklog] Entry: ${result.summary}`);
      }
    } else {
      console.log(`[worklog] Skipped: ${result.skippedReason}`);
    }
  });

program
  .command('list-projects')
  .description('List available projects with sessions')
  .action(async () => {
    const projects = await listProjects(CLAUDE_PROJECTS_DIR);

    if (projects.length === 0) {
      console.log('No projects found.');
      return;
    }

    console.log('Available projects:');
    for (const project of projects) {
      console.log(`  ${project}`);
    }
  });

program
  .command('list-sessions')
  .description('List recent sessions for a project')
  .requiredOption('--project <path>', 'Project path (absolute)')
  .option('--limit <n>', 'Number of sessions to show', '10')
  .action(async (options) => {
    const { project, limit } = options;

    const { readSessionsIndex, getProjectDir } = await import('./adapters/claude-code.js');

    const projectDir = getProjectDir(CLAUDE_PROJECTS_DIR, project);
    const index = await readSessionsIndex(projectDir);

    const sessions = index.entries
      .filter(e => !e.isSidechain && !e.sessionId.startsWith('agent-'))
      .sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime())
      .slice(0, parseInt(limit));

    if (sessions.length === 0) {
      console.log('No sessions found.');
      return;
    }

    console.log(`Recent sessions for: ${project}\n`);
    for (const s of sessions) {
      const date = s.created.split('T')[0];
      console.log(`  ${s.sessionId.slice(0, 8)}  ${date}  ${s.messageCount.toString().padStart(3)} msgs  ${s.summary}`);
    }
  });

program.parse();
