'use client';

import { useState, useRef, useEffect, type FormEvent, type KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lightbulb,
  SkipForward,
  TrendingUp,
  BookOpen,
  Coffee,
  RotateCcw,
  Send,
  Sparkles,
} from 'lucide-react';

/**
 * InputArea - Chat input with command palette
 *
 * Features:
 * - Auto-growing textarea
 * - Command suggestions when typing /
 * - Animated send button
 * - Keyboard shortcuts
 */

interface InputAreaProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

const COMMANDS = [
  { cmd: '/hint', label: 'Get a hint', icon: Lightbulb, description: 'Receive guidance without the answer' },
  { cmd: '/skip', label: 'Skip question', icon: SkipForward, description: 'Move to the next question' },
  { cmd: '/progress', label: 'View progress', icon: TrendingUp, description: 'See your mastery levels' },
  { cmd: '/topics', label: 'My topics', icon: BookOpen, description: 'View all learning topics' },
  { cmd: '/break', label: 'Take a break', icon: Coffee, description: 'Pause and save progress' },
  { cmd: '/review', label: 'Start review', icon: RotateCcw, description: 'Begin spaced repetition' },
];

export function InputArea({
  onSend,
  disabled = false,
  placeholder = 'Share your thoughts or type / for commands...',
}: InputAreaProps) {
  const [value, setValue] = useState('');
  const [showCommands, setShowCommands] = useState(false);
  const [selectedCommand, setSelectedCommand] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Filter commands based on input
  const filteredCommands = value.startsWith('/')
    ? COMMANDS.filter((c) =>
        c.cmd.toLowerCase().includes(value.toLowerCase())
      )
    : COMMANDS;

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
    }
  }, [value]);

  // Show commands when typing /
  useEffect(() => {
    setShowCommands(value.startsWith('/') && value.length < 15);
    setSelectedCommand(0);
  }, [value]);

  const handleSubmit = (e?: FormEvent) => {
    e?.preventDefault();
    if (value.trim() && !disabled) {
      onSend(value.trim());
      setValue('');
      setShowCommands(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (showCommands && filteredCommands.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedCommand((prev) =>
          prev < filteredCommands.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedCommand((prev) =>
          prev > 0 ? prev - 1 : filteredCommands.length - 1
        );
      } else if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault();
        setValue(filteredCommands[selectedCommand].cmd + ' ');
        setShowCommands(false);
        return;
      } else if (e.key === 'Escape') {
        setShowCommands(false);
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const selectCommand = (cmd: string) => {
    setValue(cmd + ' ');
    setShowCommands(false);
    textareaRef.current?.focus();
  };

  const isCommand = value.startsWith('/');

  return (
    <div className="relative border-t border-[hsl(var(--border))] bg-[hsl(var(--background))]">
      {/* Command palette */}
      <AnimatePresence>
        {showCommands && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-full left-0 right-0 p-3 bg-[hsl(var(--card))] border-t border-x border-[hsl(var(--border))] rounded-t-xl shadow-lg"
          >
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[hsl(var(--border))]">
              <Sparkles className="w-4 h-4 text-[hsl(var(--ki-orange))]" />
              <span className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wide">
                Techniques
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {filteredCommands.map((command, index) => {
                const Icon = command.icon;
                const isSelected = index === selectedCommand;
                return (
                  <motion.button
                    key={command.cmd}
                    onClick={() => selectCommand(command.cmd)}
                    className={`
                      flex items-start gap-3 p-3 rounded-lg text-left transition-all
                      ${isSelected
                        ? 'bg-[hsl(var(--ki-orange))/0.1] border border-[hsl(var(--ki-orange))/0.3]'
                        : 'hover:bg-[hsl(var(--muted))] border border-transparent'
                      }
                    `}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div
                      className={`
                        p-1.5 rounded-md
                        ${isSelected
                          ? 'bg-[hsl(var(--ki-orange))] text-white'
                          : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'
                        }
                      `}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-medium text-[hsl(var(--foreground))]">
                          {command.cmd}
                        </span>
                      </div>
                      <p className="text-xs text-[hsl(var(--muted-foreground))] truncate mt-0.5">
                        {command.description}
                      </p>
                    </div>
                  </motion.button>
                );
              })}
            </div>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-3 text-center">
              <kbd className="px-1.5 py-0.5 bg-[hsl(var(--muted))] rounded text-[10px] font-mono">↑↓</kbd>
              {' '}navigate{' '}
              <kbd className="px-1.5 py-0.5 bg-[hsl(var(--muted))] rounded text-[10px] font-mono">Tab</kbd>
              {' '}select{' '}
              <kbd className="px-1.5 py-0.5 bg-[hsl(var(--muted))] rounded text-[10px] font-mono">Esc</kbd>
              {' '}close
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input form */}
      <form onSubmit={handleSubmit} className="p-4">
        <div className="relative flex items-end gap-3 max-w-3xl mx-auto">
          {/* Text input */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              rows={1}
              className={`
                w-full px-4 py-3 pr-12
                bg-[hsl(var(--input))] border border-[hsl(var(--border))]
                rounded-2xl resize-none
                text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))]
                focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ki-orange))] focus:border-transparent
                transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed
                ${isCommand ? 'font-mono' : ''}
              `}
              style={{ minHeight: '48px', maxHeight: '150px' }}
            />

            {/* Character hint */}
            {value.length > 0 && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute right-4 bottom-3 text-xs text-[hsl(var(--muted-foreground))]"
              >
                {value.length > 500 ? `${value.length}/1000` : ''}
              </motion.span>
            )}
          </div>

          {/* Send button */}
          <motion.button
            type="submit"
            disabled={disabled || !value.trim()}
            className={`
              flex-shrink-0 p-3 rounded-xl
              bg-gradient-to-br from-[hsl(25,95%,53%)] to-[hsl(30,90%,48%)]
              text-white shadow-lg
              disabled:opacity-40 disabled:cursor-not-allowed
              transition-all duration-200
            `}
            whileHover={{ scale: disabled ? 1 : 1.05 }}
            whileTap={{ scale: disabled ? 1 : 0.95 }}
          >
            <Send className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Bottom hint */}
        <div className="flex items-center justify-center gap-4 mt-3 text-xs text-[hsl(var(--muted-foreground))]">
          <span>
            <kbd className="px-1.5 py-0.5 bg-[hsl(var(--muted))] rounded text-[10px] font-mono mr-1">
              Enter
            </kbd>
            to send
          </span>
          <span className="text-[hsl(var(--border))]">•</span>
          <span>
            <kbd className="px-1.5 py-0.5 bg-[hsl(var(--muted))] rounded text-[10px] font-mono mr-1">
              /
            </kbd>
            for techniques
          </span>
          <span className="text-[hsl(var(--border))]">•</span>
          <span>
            <kbd className="px-1.5 py-0.5 bg-[hsl(var(--muted))] rounded text-[10px] font-mono mr-1">
              Shift+Enter
            </kbd>
            new line
          </span>
        </div>
      </form>
    </div>
  );
}

export default InputArea;
