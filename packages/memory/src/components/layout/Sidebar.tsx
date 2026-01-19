'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface FolderNode {
  name: string;
  path: string;
  children: FolderNode[];
  documentCount?: number;
}

interface SidebarProps {
  folders: FolderNode[];
  tags: { name: string; count: number }[];
  selectedFolder?: string;
  selectedTag?: string;
  onFolderSelect?: (path: string) => void;
  onTagSelect?: (tag: string) => void;
}

function FolderItem({
  folder,
  level = 0,
  selectedPath,
  onSelect,
}: {
  folder: FolderNode;
  level?: number;
  selectedPath?: string;
  onSelect?: (path: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(level < 2);
  const hasChildren = folder.children.length > 0;
  const isSelected = selectedPath === folder.path;

  return (
    <div>
      <button
        onClick={() => {
          if (hasChildren) {
            setIsExpanded(!isExpanded);
          }
          onSelect?.(folder.path);
        }}
        className={`
          w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded transition-colors
          ${isSelected
            ? 'bg-accent-blue text-white'
            : 'text-text-secondary hover:bg-[rgba(255,255,255,0.02)] hover:text-text-primary'
          }
        `}
        style={{ paddingLeft: `${12 + level * 16}px` }}
      >
        {hasChildren ? (
          <svg
            className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          <span className="w-3 h-3 flex items-center justify-center text-text-subtle">
            •
          </span>
        )}
        <svg
          className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-accent-cyan'}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
          />
        </svg>
        <span className="truncate flex-1 text-left">{folder.name}</span>
        {folder.documentCount !== undefined && folder.documentCount > 0 && (
          <span className={`text-xs ${isSelected ? 'text-white/70' : 'text-text-subtle'}`}>
            {folder.documentCount}
          </span>
        )}
      </button>

      {hasChildren && isExpanded && (
        <div>
          {folder.children.map((child) => (
            <FolderItem
              key={child.path}
              folder={child}
              level={level + 1}
              selectedPath={selectedPath}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function Sidebar({
  folders,
  tags,
  selectedFolder,
  selectedTag,
  onFolderSelect,
  onTagSelect,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="sidebar h-[calc(100vh-56px)] overflow-y-auto">
      {/* Folders Section */}
      <div className="sidebar-section">
        <h3 className="sidebar-section-title flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
            />
          </svg>
          Folders
        </h3>
        <nav className="space-y-0.5">
          {/* All Documents */}
          <button
            onClick={() => onFolderSelect?.('')}
            className={`
              w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded transition-colors
              ${!selectedFolder
                ? 'bg-accent-blue text-white'
                : 'text-text-secondary hover:bg-[rgba(255,255,255,0.02)] hover:text-text-primary'
              }
            `}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            <span>All Documents</span>
          </button>

          {/* Folder Tree */}
          {folders.map((folder) => (
            <FolderItem
              key={folder.path}
              folder={folder}
              selectedPath={selectedFolder}
              onSelect={onFolderSelect}
            />
          ))}
        </nav>
      </div>

      {/* Divider */}
      <div className="mx-4 border-t border-[rgba(255,255,255,0.08)]" />

      {/* Tags Section */}
      <div className="sidebar-section">
        <h3 className="sidebar-section-title flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
            />
          </svg>
          Tags
        </h3>
        <div className="flex flex-wrap gap-2">
          {tags.length === 0 ? (
            <p className="text-sm text-text-subtle px-1">No tags yet</p>
          ) : (
            tags.map((tag) => (
              <button
                key={tag.name}
                onClick={() => onTagSelect?.(tag.name)}
                className={`
                  tag tag-interactive
                  ${selectedTag === tag.name ? 'border-accent-blue bg-accent-blue/10' : ''}
                `}
              >
                {tag.name}
                <span className="text-text-subtle">({tag.count})</span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="sidebar-section mt-auto">
        <div className="mx-4 border-t border-[rgba(255,255,255,0.08)] mb-4" />
        <nav className="space-y-1">
          <Link
            href="/trash"
            className={`sidebar-link ${pathname === '/trash' ? 'sidebar-link-active' : ''}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            <span>Trash</span>
          </Link>
          <Link
            href="/settings"
            className={`sidebar-link ${pathname === '/settings' ? 'sidebar-link-active' : ''}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span>Settings</span>
          </Link>
        </nav>
      </div>
    </aside>
  );
}
