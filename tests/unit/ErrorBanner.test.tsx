import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ErrorBanner } from '../../src/components/ErrorBanner';
import type { MessageErrorKind } from '../../src/types/chat';

const cases: ReadonlyArray<{
  errorKind: MessageErrorKind;
  expected: string;
  detail: string;
}> = [
  { errorKind: 'timeout', expected: 'That took longer than expected.', detail: 'Please try your question again.' },
  { errorKind: 'rate_limit', expected: 'We’re receiving too many requests right now.', detail: 'Please wait a moment, then try again.' },
  { errorKind: 'request_error', expected: 'We couldn’t get a response.', detail: 'Your question is still here. Please try again.' },
];

describe('ErrorBanner', () => {
  it.each(cases)('shows a safe $errorKind message and a Retry action', async ({ errorKind, expected, detail }) => {
    const onRetry = vi.fn();
    const user = userEvent.setup();
    render(<ErrorBanner errorKind={errorKind} onRetry={onRetry} />);

    expect(screen.getByText(expected)).toBeInTheDocument();
    expect(screen.getByText(detail)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledExactlyOnceWith();
  });
});
