import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { AssistantClient, AssistantRequest } from '../../src/api/types';
import { SYSTEM_INSTRUCTION } from '../../src/api/config';
import { useConversation } from '../../src/hooks/useConversation';

describe('fixed CA system instruction', () => {
  it('directs unrelated requests, handles mixed requests, and flags unverifiable facts', () => {
    expect(SYSTEM_INSTRUCTION).toContain('politely decline');
    expect(SYSTEM_INSTRUCTION).toContain('mixed requests');
    expect(SYSTEM_INSTRUCTION).toContain('Do not invent tax facts');
  });

  it('passes the exact fixed instruction for supported, off-topic, and mixed questions', async () => {
    const requests: AssistantRequest[] = [];
    const client: AssistantClient = {
      sendMessage: vi.fn((request: AssistantRequest) => {
        requests.push(request);
        return Promise.resolve({ kind: 'not_enabled' as const });
      }),
    };
    const { result } = renderHook(() => useConversation(client));

    for (const question of [
      'Which ITR form applies to freelance income?',
      'Tell me a recipe for pasta.',
      'Explain GST and then write a recipe.',
    ]) {
      act(() => result.current.submit(question));
      await waitFor(() => expect(result.current.isAwaitingReply).toBe(false));
    }

    expect(requests).toHaveLength(3);
    expect(requests.map((request) => request.systemInstruction)).toEqual([
      SYSTEM_INSTRUCTION,
      SYSTEM_INSTRUCTION,
      SYSTEM_INSTRUCTION,
    ]);
    expect(requests.map((request) => request.history.at(-1)?.content)).toEqual([
      'Which ITR form applies to freelance income?',
      'Tell me a recipe for pasta.',
      'Explain GST and then write a recipe.',
    ]);
  });
});
