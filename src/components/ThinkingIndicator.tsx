interface ThinkingIndicatorProps {
  visible: boolean;
}

export function ThinkingIndicator({ visible }: ThinkingIndicatorProps) {
  if (!visible) {
    return null;
  }

  return (
    <div className="thinking-indicator" role="status" aria-label="CA Assist is thinking">
      <span className="thinking-indicator__dot" />
      <span className="thinking-indicator__dot" />
      <span className="thinking-indicator__dot" />
      <span>Thinking…</span>
    </div>
  );
}
