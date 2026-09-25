import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ChatMessage } from '../../src/types/chat';
import { MessageList } from '../../src/components/MessageList';

const messages: ChatMessage[] = [
  {
    id: 'user-1', role: 'user', content: 'What is GST?', status: 'complete', errorKind: undefined, createdAt: 1,
  },
  {
    id: 'assistant-1',
    role: 'assistant',
    content: 'A **general** answer.\n\n- Point one\n- Point two\n\n| Topic | Note |\n| --- | --- |\n| GST | Check current rules |',
    status: 'complete',
    errorKind: undefined,
    createdAt: 2,
  },
];

describe('MessageList', () => {
  it('renders messages oldest-first and keeps Markdown structures readable', () => {
    render(<MessageList messages={messages} onRetry={vi.fn()} />);
    const listItems = screen.getAllByRole('listitem');
    const [userMessage, assistantMessage] = listItems;

    expect(within(userMessage).getByText('What is GST?')).toBeInTheDocument();
    expect(within(assistantMessage).getByText('general')).toBeInTheDocument();
    expect(within(assistantMessage).getByRole('list')).toBeInTheDocument();
    expect(within(assistantMessage).getByRole('table')).toBeInTheDocument();
  });
});
