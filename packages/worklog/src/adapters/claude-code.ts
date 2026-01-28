import fs from 'fs/promises';
import path from 'path';
import type { SessionsIndex, SessionIndexEntry, RawEntry } from '../types.js';

const MIN_MESSAGE_COUNT = 5;

const projectPathToDir = (projectPath: string): string => {
  return projectPath.replace(/[/.]/g, '-');
};

export const getProjectDir = (basePath: string, projectPath: string): string => {
  return path.join(basePath, projectPathToDir(projectPath));
};

export const readSessionsIndex = async (projectDir: string): Promise<SessionsIndex> => {
  const indexPath = path.join(projectDir, 'sessions-index.json');
  const content = await fs.readFile(indexPath, 'utf-8');
  return JSON.parse(content);
};

export const getLatestSession = async (
  basePath: string,
  projectPath: string
): Promise<SessionIndexEntry | null> => {
  const projectDir = getProjectDir(basePath, projectPath);
  const index = await readSessionsIndex(projectDir);

  const candidates = index.entries
    .filter(e => !e.isSidechain)
    .filter(e => e.messageCount >= MIN_MESSAGE_COUNT)
    .filter(e => !e.sessionId.startsWith('agent-'))
    .sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime());

  return candidates[0] || null;
};

export const getSessionById = async (
  basePath: string,
  projectPath: string,
  sessionId: string
): Promise<SessionIndexEntry | null> => {
  const projectDir = getProjectDir(basePath, projectPath);
  const index = await readSessionsIndex(projectDir);
  return index.entries.find(e => e.sessionId === sessionId) || null;
};

export const readSessionEntries = async (entry: SessionIndexEntry): Promise<RawEntry[]> => {
  const content = await fs.readFile(entry.fullPath, 'utf-8');
  return content
    .split('\n')
    .filter(Boolean)
    .map(line => JSON.parse(line) as RawEntry);
};

export const listProjects = async (basePath: string): Promise<string[]> => {
  const entries = await fs.readdir(basePath, { withFileTypes: true });
  const projectDirs = entries.filter(e => e.isDirectory());

  const projects: string[] = [];
  for (const dir of projectDirs) {
    const indexPath = path.join(basePath, dir.name, 'sessions-index.json');
    try {
      const index: SessionsIndex = JSON.parse(await fs.readFile(indexPath, 'utf-8'));
      if (index.originalPath) {
        projects.push(index.originalPath);
      }
    } catch {
      // Skip directories without a valid index
    }
  }
  return projects;
};
