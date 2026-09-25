import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MessageInput } from '../../src/components/MessageInput';

describe('MessageInput', () => {
  it('submits trimmed text from the Send button', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<MessageInput disabled={false} inputRef={createRef<HTMLTextAreaElement>()} onSubmit={onSubmit} />);
    const input = screen.getByRole('textbox', { name: /ask a question about indian tax or accounting/i });

    await user.type(input, '  What is GST?  ');
    await user.click(screen.getByRole('button', { name: 'Send message' }));

    expect(onSubmit).toHaveBeenCalledExactlyOnceWith('What is GST?');
  });

  it('submits with Enter and leaves Shift+Enter available for a new line', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<MessageInput disabled={false} inputRef={createRef<HTMLTextAreaElement>()} onSubmit={onSubmit} />);
    const input = screen.getByRole('textbox', { name: /ask a question about indian tax or accounting/i });

    await user.type(input, 'How is TDS calculated?{Enter}');

    expect(onSubmit).toHaveBeenCalledExactlyOnceWith('How is TDS calculated?');
  });

  it('does not submit empty or whitespace-only text', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<MessageInput disabled={false} inputRef={createRef<HTMLTextAreaElement>()} onSubmit={onSubmit} />);
    const input = screen.getByRole('textbox', { name: /ask a question about indian tax or accounting/i });
    const send = screen.getByRole('button', { name: 'Send message' });

    expect(send).toBeDisabled();
    await user.type(input, '   ');
    expect(send).toBeDisabled();
    await user.keyboard('{Enter}');

    expect(onSubmit).not.toHaveBeenCalled();
  });
});
