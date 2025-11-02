'use client';

import { useChat } from 'ai/react';
import { useState, useEffect } from 'react';
import React from 'react';
import { Send, ChevronDown, ChevronUp, Zap, DollarSign, Database, TrendingDown, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RoutingMetadata {
  model: string;
  provider: string;
  complexity: string;
  cost: number;
  cacheHit: boolean;
}

export function Chat() {
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
  const [totalCost, setTotalCost] = useState(0);
  const [costSaved, setCostSaved] = useState(0);
  const [cacheHits, setCacheHits] = useState(0);
  const [totalRequests, setTotalRequests] = useState(0);
  const [routingMetadata, setRoutingMetadata] = useState<Map<string, RoutingMetadata>>(new Map());
  const chatContainerRef = React.useRef<HTMLDivElement>(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    onResponse: async (response) => {
      // Extract routing metadata from response headers
      const model = response.headers.get('X-Router-Model') || 'unknown';
      const provider = response.headers.get('X-Router-Provider') || 'unknown';
      const complexity = response.headers.get('X-Router-Complexity') || 'unknown';
      const cost = parseFloat(response.headers.get('X-Router-Cost') || '0');
      const cacheHit = response.headers.get('X-Router-Cache-Hit') === 'true';

      // Store metadata for the latest message
      const metadata: RoutingMetadata = {
        model,
        provider,
        complexity,
        cost,
        cacheHit,
      };

      // Update metrics
      setTotalRequests((prev) => prev + 1);
      
      if (cacheHit) {
        setCacheHits((prev) => prev + 1);
        // Estimate cost saved (average cost of similar queries)
        setCostSaved((prev) => prev + 0.0003);
      } else {
        setTotalCost((prev) => prev + cost);
      }

      // Store metadata - we'll associate it with the next assistant message
      setRoutingMetadata((prev) => {
        const next = new Map(prev);
        next.set('latest', metadata);
        return next;
      });
    },
  });

  // Associate metadata with messages after they're added
  if (messages.length > 0 && routingMetadata.has('latest')) {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role === 'assistant' && !routingMetadata.has(lastMessage.id)) {
      const metadata = routingMetadata.get('latest')!;
      setRoutingMetadata((prev) => {
        const next = new Map(prev);
        next.set(lastMessage.id, metadata);
        next.delete('latest');
        return next;
      });
    }
  }


  const toggleExpanded = (messageId: string) => {
    setExpandedMessages((prev) => {
      const next = new Set(prev);
      if (next.has(messageId)) {
        next.delete(messageId);
      } else {
        next.add(messageId);
      }
      return next;
    });
  };

  // Extract routing metadata for a specific message
  const getRoutingMetadata = (messageId: string): RoutingMetadata | null => {
    return routingMetadata.get(messageId) || null;
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages.length]);

  const sampleQueries = [
    {
      category: '💬 Simple Queries',
      description: 'Fast models (gpt-4o-mini)',
      queries: [
        { text: 'What are your business hours?', type: 'base' },
        { text: 'When are you open?', type: 'semantic', hint: 'Similar to above' },
        { text: 'What time do you close?', type: 'semantic', hint: 'Similar to above' },
        { text: 'How can I contact support?', type: 'base' },
        { text: 'What is your email address?', type: 'semantic', hint: 'Similar to above' },
      ],
    },
    {
      category: '🔄 Semantic Variations',
      description: 'Different words, same meaning',
      queries: [
        { text: 'How do I reset my password?', type: 'base' },
        { text: 'I forgot my password, how can I change it?', type: 'semantic', hint: 'Similar meaning' },
        { text: 'What\'s the process to recover my account password?', type: 'semantic', hint: 'Similar meaning' },
        { text: 'Can you help me update my login credentials?', type: 'semantic', hint: 'Similar meaning' },
      ],
    },
    {
      category: '🧠 Complex Queries',
      description: 'Advanced models (gpt-4o)',
      queries: [
        { text: "I've been charged twice for the same order, but only received one item. I also noticed my subscription was upgraded without my consent. Can you investigate this and explain what happened?", type: 'base' },
        { text: "I got double charged for my order and only got one item. Also my subscription got upgraded without asking me. What's going on?", type: 'semantic', hint: 'Similar to above' },
        { text: 'I need to return a product to a different address than my billing address, and I want the refund to go to my original payment method. How do I do this?', type: 'base' },
        { text: 'Can I ship my return to another location and still get refunded to my card?', type: 'semantic', hint: 'Similar to above' },
      ],
    },
    {
      category: '🎯 Exact Match',
      description: '100% cache hits',
      queries: [
        { text: 'Hello, how can you help me?', type: 'base' },
        { text: 'Hello, how can you help me?', type: 'exact', hint: 'Exact match' },
        { text: 'What services do you offer?', type: 'base' },
        { text: 'What services do you offer?', type: 'exact', hint: 'Exact match' },
      ],
    },
  ];

  return (
    <div className="flex flex-col h-screen max-w-7xl mx-auto p-4">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-3xl font-bold mb-2">LLM Router Demo</h1>
        <p className="text-muted-foreground">
          Intelligent routing with cost optimization and caching
        </p>
      </div>

      {/* Two Column Layout */}
      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* Left: Metrics + Sample Queries */}
        <div className="w-80 flex-shrink-0 flex flex-col gap-4">
          {/* Metrics Box */}
          <div className="border border-border rounded-lg p-3 bg-muted/30">
            <h3 className="text-xs font-semibold mb-3 text-muted-foreground">Performance Metrics</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-3 h-3 text-blue-500" />
                  <span className="text-xs text-muted-foreground">Total Cost</span>
                </div>
                <span className="text-xs font-semibold">${totalCost.toFixed(6)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-3 h-3 text-green-500" />
                  <span className="text-xs text-muted-foreground">Cost Saved</span>
                </div>
                <span className="text-xs font-semibold text-green-600">
                  ${costSaved.toFixed(6)}
                  {totalCost + costSaved > 0 && (
                    <span className="text-[9px] ml-1">({((costSaved / (totalCost + costSaved)) * 100).toFixed(0)}%)</span>
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="w-3 h-3 text-purple-500" />
                  <span className="text-xs text-muted-foreground">Cache Hit Rate</span>
                </div>
                <span className="text-xs font-semibold">{totalRequests > 0 ? ((cacheHits / totalRequests) * 100).toFixed(1) : 0}%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-3 h-3 text-orange-500" />
                  <span className="text-xs text-muted-foreground">Messages</span>
                </div>
                <span className="text-xs font-semibold">{messages.length}</span>
              </div>
            </div>
          </div>

          {/* Sample Queries */}
          <div className="flex-1 border border-border rounded-lg p-4 bg-muted/20 overflow-hidden flex flex-col">
            <h2 className="text-sm font-semibold mb-3">Sample Queries</h2>
          <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2">
            {sampleQueries.map((category, idx) => (
              <div key={idx}>
                <p className="text-xs font-semibold text-muted-foreground mb-2">
                  {category.category}
                </p>
                <p className="text-xs text-muted-foreground/70 mb-2">
                  {category.description}
                </p>
                <div className="space-y-2">
                  {category.queries.map((query, qIdx) => (
                    <button
                      key={qIdx}
                      onClick={() => {
                        handleInputChange({ target: { value: query.text } } as any);
                        // Auto-submit after a short delay
                        setTimeout(() => {
                          const form = document.querySelector('form');
                          if (form) form.requestSubmit();
                        }, 100);
                      }}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-xs cursor-pointer",
                        query.type === 'semantic' && "border border-green-500/30",
                        query.type === 'exact' && "border border-blue-500/30"
                      )}
                    >
                      <div className="line-clamp-2">{query.text}</div>
                      {query.hint && (
                        <div className={cn(
                          "text-[10px] mt-1",
                          query.type === 'semantic' && "text-green-600",
                          query.type === 'exact' && "text-blue-600"
                        )}>
                          ← {query.hint}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          </div>
        </div>

        {/* Right: Chat Messages */}
        <div className="flex-1 flex flex-col min-w-0">
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto space-y-4 mb-4 custom-scrollbar">
            {messages.length === 0 && (
              <div className="flex items-center justify-center h-full text-center text-muted-foreground">
                <div>
                  <p className="text-lg mb-2">Click a sample query to start</p>
                  <p className="text-sm">Watch routing decisions and cache hits in real-time</p>
                </div>
              </div>
            )}

        {messages.map((message) => {
          const isUser = message.role === 'user';
          const metadata = !isUser ? getRoutingMetadata(message.id) : null;
          const isExpanded = expandedMessages.has(message.id);

          return (
            <div
              key={message.id}
              className={cn(
                'flex',
                isUser ? 'justify-end' : 'justify-start'
              )}
            >
              <div
                className={cn(
                  'max-w-[80%] rounded-lg p-4',
                  isUser
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                )}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>

                {/* Routing Details (Assistant messages only) */}
                {!isUser && metadata && (
                  <div className="mt-3">
                    <button
                      onClick={() => toggleExpanded(message.id)}
                      className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Zap className="w-3 h-3" />
                      <span>Routing details</span>
                      {isExpanded ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="mt-2 space-y-1 text-xs font-mono">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Model:</span>
                          <span className="font-medium">{metadata.model}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Provider:</span>
                          <span className="font-medium">{metadata.provider}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Complexity:</span>
                          <span className="font-medium capitalize">{metadata.complexity}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Cost:</span>
                          <span className="font-medium">${metadata.cost.toFixed(6)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Cache:</span>
                          <span className={cn(
                            "font-medium",
                            metadata.cacheHit ? "text-green-600" : "text-muted-foreground"
                          )}>
                            {metadata.cacheHit ? '✓ Hit' : '✗ Miss'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg p-4 bg-muted">
                  <div className="flex gap-2">
                    <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" />
                    <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:0.2s]" />
                    <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              value={input}
              onChange={handleInputChange}
              placeholder="Ask a question..."
              className="flex-1 rounded-lg border border-input bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              Send
            </button>
          </form>
        </div>
      </div>

      {/* Custom scrollbar styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: hsl(var(--muted));
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: hsl(var(--muted-foreground) / 0.3);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--muted-foreground) / 0.5);
        }
      `}</style>
    </div>
  );
}
