interface LatencyBadgeProps {
  latencyMs: number;
  className?: string;
}

export function LatencyBadge({ latencyMs, className = '' }: LatencyBadgeProps) {
  // Determine color based on latency
  // < 1ms = fast (green), 1-5ms = medium (yellow), > 5ms = slow (red)
  const variant =
    latencyMs < 1
      ? 'latency-badge-fast'
      : latencyMs <= 5
        ? 'latency-badge-medium'
        : 'latency-badge-slow';

  // Format latency with appropriate precision
  const formattedLatency =
    latencyMs < 1
      ? latencyMs.toFixed(2)
      : latencyMs < 10
        ? latencyMs.toFixed(1)
        : Math.round(latencyMs).toString();

  return (
    <span className={`latency-badge ${variant} ${className}`}>
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
          clipRule="evenodd"
        />
      </svg>
      {formattedLatency}ms
    </span>
  );
}
