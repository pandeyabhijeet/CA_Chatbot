import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { AssistantClient, AssistantRequest, AssistantResult } from '../../src/api/types';
import { useConversation } from '../../src/hooks/useConversation';

describe('useConversation submit', () => {
  it('appends user and assistant messages and sends ordered completed history on follow-up', async () => {
    const requests: AssistantRequest[] = [];
    const client: AssistantClient = {
      sendMessage: vi.fn((request: AssistantRequest): Promise<AssistantResult> => {
        requests.push(request);
        return Promise.resolve({ kind: 'success', text: `Reply ${requests.length}` });
      }),
    };
    const { result } = renderHook(() => useConversation(client));

    act(() => result.current.submit('  First question?  '));
    await waitFor(() => expect(result.current.isAwaitingReply).toBe(false));

    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[0]).toMatchObject({
      role: 'user',
      content: 'First question?',
      status: 'complete',
    });
    expect(result.current.messages[1]).toMatchObject({
      role: 'assistant',
      content: 'Reply 1',
      status: 'complete',
    });

    act(() => result.current.submit('A follow-up?'));
    await waitFor(() => expect(result.current.isAwaitingReply).toBe(false));

    expect(requests[1]?.history).toEqual([
      { role: 'user', content: 'First question?' },
      { role: 'assistant', content: 'Reply 1' },
      { role: 'user', content: 'A follow-up?' },
    ]);
    expect(result.current.messages).toHaveLength(4);
  });
});
