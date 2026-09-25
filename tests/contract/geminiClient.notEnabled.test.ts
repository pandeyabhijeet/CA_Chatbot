import { afterEach, describe, expect, it, vi } from 'vitest';
import { SYSTEM_INSTRUCTION } from '../../src/api/config';
import { geminiClient } from '../../src/api/geminiClient';

vi.mock('../../src/api/liveResponseAvailability', () => ({
  isLiveResponsesEnabled: () => false,
}));

describe('geminiClient with live responses disabled', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns not_enabled without making a request or disclosing the question', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(geminiClient.sendMessage({
      history: [{ role: 'user', content: 'What is GST?' }],
      systemInstruction: SYSTEM_INSTRUCTION,
    })).resolves.toEqual({ kind: 'not_enabled' });

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
