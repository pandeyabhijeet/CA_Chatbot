import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MessageBubble } from '../../src/components/MessageBubble';
import type { ChatMessage } from '../../src/types/chat';

describe('MessageBubble Markdown rendering', () => {
  it('renders lists, bold text, and GFM tables without raw HTML', () => {
    const message: ChatMessage = {
      id: 'answer',
      role: 'assistant',
      content: 'Here is **general information**.\n\n- First\n- Second\n\n| Tax | Note |\n| --- | --- |\n| GST | Verify current rules |\n\n<script>alert(1)</script>',
      status: 'complete',
      errorKind: undefined,
      createdAt: 1,
    };

    const { container } = render(<MessageBubble message={message} onRetry={vi.fn()} />);

    expect(screen.getByText('general information')).toHaveProperty('tagName', 'STRONG');
    expect(screen.getByRole('list')).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(container.querySelector('script')).not.toBeInTheDocument();
  });
});
