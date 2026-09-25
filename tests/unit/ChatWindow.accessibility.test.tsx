import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AssistantClient } from '../../src/api/types';
import { ChatWindow } from '../../src/components/ChatWindow';

describe('ChatWindow accessibility', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_GEMINI_API_KEY', '');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('announces disabled responses and keeps the composer keyboard reachable', async () => {
    const user = userEvent.setup();
    const client: AssistantClient = {
      sendMessage: vi.fn().mockResolvedValue({ kind: 'not_enabled' }),
    };
    render(<ChatWindow client={client} />);
    const input = screen.getByRole('textbox', { name: /ask a question about indian tax or accounting/i });

    await user.type(input, 'What is GST?{Enter}');

    expect(await screen.findByText('Live responses aren’t configured.')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('Live responses are not configured. Your question was not sent.', {
        selector: 'p[role="status"]',
      })).toBeInTheDocument();
    });
    expect(client.sendMessage).toHaveBeenCalledTimes(1);
    expect(input).toHaveFocus();
    expect(screen.getByText('For general information only. Consult a qualified CA for advice.')).toBeInTheDocument();
  });

  it('announces completed replies and safe errors through the polite live region', async () => {
    const user = userEvent.setup();
    const client: AssistantClient = {
      sendMessage: vi.fn<AssistantClient['sendMessage']>()
        .mockResolvedValueOnce({ kind: 'success', text: 'Check the current filing date.' })
        .mockResolvedValueOnce({ kind: 'request_error', safeMessage: 'private provider detail' }),
    };
    render(<ChatWindow client={client} />);
    const input = screen.getByRole('textbox', { name: /ask a question about indian tax or accounting/i });

    await user.type(input, 'When is my filing due?{Enter}');
    expect(await screen.findByText('Check the current filing date.')).toBeInTheDocument();
    expect(document.querySelector('.sr-only[aria-live="polite"]')).toHaveTextContent(
      'New CA Assist reply: Check the current filing date.',
    );

    await user.type(input, 'Please explain a follow-up{Enter}');
    expect(await screen.findByText('We couldn’t get a response.')).toBeInTheDocument();
    expect(document.querySelector('.sr-only[aria-live="polite"]')).toHaveTextContent(
      'A response could not be retrieved. You can retry your question.',
    );
    expect(document.querySelector('.sr-only[aria-live="polite"]')).not.toHaveTextContent(
      'private provider detail',
    );
  });
});
