import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { AssistantClient, AssistantResult } from '../../src/api/types';
import { ChatWindow } from '../../src/components/ChatWindow';

describe('ChatWindow request states', () => {
  it('shows Thinking while the injected client is pending', async () => {
    let resolveResponse: ((result: AssistantResult) => void) | undefined;
    const client: AssistantClient = {
      sendMessage: vi.fn(() => new Promise<AssistantResult>((resolve) => {
        resolveResponse = resolve;
      })),
    };
    const user = userEvent.setup();
    render(<ChatWindow client={client} />);
    const input = screen.getByRole('textbox', { name: /ask a question about indian tax or accounting/i });

    await user.type(input, 'What is GST?{Enter}');

    expect(await screen.findByRole('status', { name: 'CA Assist is thinking' })).toBeInTheDocument();
    act(() => {
      resolveResponse?.({ kind: 'not_enabled' });
    });
  });

  it('shows a retryable safe failure and retries the same question', async () => {
    const sendMessage = vi.fn<AssistantClient['sendMessage']>()
      .mockResolvedValueOnce({ kind: 'request_error', safeMessage: 'Do not expose this message.' })
      .mockResolvedValueOnce({ kind: 'success', text: 'A safe general answer.' });
    const user = userEvent.setup();
    render(<ChatWindow client={{ sendMessage }} />);
    const input = screen.getByRole('textbox', { name: /ask a question about indian tax or accounting/i });

    await user.type(input, 'How is TDS on rent calculated?{Enter}');
    await user.click(await screen.findByRole('button', { name: 'Retry' }));

    expect(await screen.findByText('A safe general answer.')).toBeInTheDocument();
    expect(sendMessage).toHaveBeenCalledTimes(2);
    expect(sendMessage.mock.calls[1]?.[0].history).toEqual([
      { role: 'user', content: 'How is TDS on rent calculated?' },
    ]);
    expect(screen.queryByText('Do not expose this message.')).not.toBeInTheDocument();
    expect(input).toHaveFocus();
  });

  it('clears the conversation with the accessible New chat action and returns focus', async () => {
    const client: AssistantClient = {
      sendMessage: vi.fn().mockResolvedValue({ kind: 'not_enabled' }),
    };
    const user = userEvent.setup();
    render(<ChatWindow client={client} />);
    const input = screen.getByRole('textbox', { name: /ask a question about indian tax or accounting/i });

    await user.type(input, 'A question to clear{Enter}');
    expect(await screen.findByText('A question to clear')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'New chat' }));

    expect(screen.queryByText('A question to clear')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /good questions deserve clear answers/i })).toBeInTheDocument();
    expect(input).toHaveFocus();
  });
});
