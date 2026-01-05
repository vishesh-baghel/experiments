'use client';

import { useState, type FormEvent, type KeyboardEvent } from 'react';

/**
 * InputArea - Chat input with command support
 *
 * Features:
 * - Text input
 * - Send button
 * - Command hints
 * - Submit on Enter
 */

export interface InputAreaProps {
  onSend?: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function InputArea({
  onSend,
  disabled = false,
  placeholder = 'Type your message or /command...',
}: InputAreaProps) {
  const [value, setValue] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (value.trim() && onSend) {
      onSend(value.trim());
      setValue('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && onSend) {
        onSend(value.trim());
        setValue('');
      }
    }
  };

  const isCommand = value.startsWith('/');

  return (
    <div className="border-t p-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="flex-1 px-4 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-lg disabled:opacity-50"
        >
          Send
        </button>
      </form>

      {/* Command hints */}
      <div className="mt-2 text-xs text-muted-foreground">
        {isCommand ? (
          <div className="flex gap-2 flex-wrap">
            {['/hint', '/skip', '/progress', '/topics', '/break', '/review'].map(
              (cmd) => (
                <button
                  key={cmd}
                  type="button"
                  onClick={() => setValue(cmd)}
                  className={`px-2 py-1 rounded ${
                    value === cmd ? 'bg-primary/20' : 'hover:bg-muted'
                  }`}
                >
                  {cmd}
                </button>
              )
            )}
          </div>
        ) : (
          <span>
            Commands: /hint, /skip, /progress, /topics, /break, /review
          </span>
        )}
      </div>
    </div>
  );
}

export default InputArea;
