import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { AssistantClient } from '../../src/api/types';
import { useConversation } from '../../src/hooks/useConversation';

describe('useConversation retry', () => {
  it('retries the same failed question without discarding it', async () => {
    const sendMessage = vi.fn<AssistantClient['sendMessage']>()
      .mockResolvedValueOnce({ kind: 'request_error', safeMessage: 'Try again.' })
      .mockResolvedValueOnce({ kind: 'success', text: 'Recovered answer.' });
    const { result } = renderHook(() => useConversation({ sendMessage }));

    act(() => result.current.submit('My question?'));
    await waitFor(() => expect(result.current.isAwaitingReply).toBe(false));
    expect(result.current.messages[1]).toMatchObject({ status: 'error', errorKind: 'request_error' });

    act(() => result.current.retry());
    await waitFor(() => expect(result.current.isAwaitingReply).toBe(false));

    expect(sendMessage).toHaveBeenCalledTimes(2);
    expect(sendMessage.mock.calls[1]?.[0].history).toEqual([
      { role: 'user', content: 'My question?' },
    ]);
    expect(result.current.messages[0]?.content).toBe('My question?');
    expect(result.current.messages[1]).toMatchObject({
      status: 'complete',
      content: 'Recovered answer.',
    });
  });
});
