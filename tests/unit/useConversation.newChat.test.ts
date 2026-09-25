import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { AssistantClient, AssistantResult } from '../../src/api/types';
import { useConversation } from '../../src/hooks/useConversation';

describe('useConversation New chat', () => {
  it('clears messages and discards a response that arrives after reset', async () => {
    let resolveResponse: ((value: Awaited<ReturnType<AssistantClient['sendMessage']>>) => void) | undefined;
    const client: AssistantClient = {
      sendMessage: vi.fn(() => new Promise<AssistantResult>((resolve) => {
        resolveResponse = resolve;
      })),
    };
    const { result } = renderHook(() => useConversation(client));

    act(() => result.current.submit('A pending question?'));
    expect(result.current.isAwaitingReply).toBe(true);
    expect(result.current.messages).toHaveLength(2);

    act(() => result.current.newChat());
    expect(result.current.messages).toEqual([]);
    expect(result.current.isAwaitingReply).toBe(false);

    await act(async () => {
      resolveResponse?.({ kind: 'success', text: 'This must not return.' });
      await Promise.resolve();
    });
    await waitFor(() => expect(result.current.messages).toEqual([]));
  });
});
