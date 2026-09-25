import { afterEach, describe, expect, it, vi } from 'vitest';
import { GENERATE_CONTENT_ENDPOINT, SYSTEM_INSTRUCTION } from '../../src/api/config';
import { geminiClient } from '../../src/api/geminiClient';
import type { AssistantRequest } from '../../src/api/types';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const request: AssistantRequest = {
  history: [
    { role: 'user', content: 'What is GST?' },
    { role: 'assistant', content: 'GST is a tax on supplies.' },
    { role: 'user', content: 'Who should check the current rules?' },
  ],
  systemInstruction: SYSTEM_INSTRUCTION,
};

describe('Gemini client live transport (mocked fetch only)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.useRealTimers();
  });

  it('sends ordered history and the fixed system instruction and extracts the reply', async () => {
    vi.stubEnv('VITE_GEMINI_API_KEY', 'test-only-gemini-key');
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({
      candidates: [{ content: { parts: [{ text: 'Please verify the latest GST rules.' }] } }],
    }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(geminiClient.sendMessage(request)).resolves.toEqual({
      kind: 'success',
      text: 'Please verify the latest GST rules.',
    });

    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe(GENERATE_CONTENT_ENDPOINT);
    const headers = new Headers(init?.headers);
    expect(headers.get('x-goog-api-key')).toBe('test-only-gemini-key');
    expect(init?.body).toBe(JSON.stringify({
      contents: [
        { role: 'user', parts: [{ text: 'What is GST?' }] },
        { role: 'model', parts: [{ text: 'GST is a tax on supplies.' }] },
        { role: 'user', parts: [{ text: 'Who should check the current rules?' }] },
      ],
      systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
    }));
  });

  it('maps HTTP 429 to a rate-limit result', async () => {
    vi.stubEnv('VITE_GEMINI_API_KEY', 'test-only-gemini-key');
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({}, 429)));

    await expect(geminiClient.sendMessage(request)).resolves.toEqual({ kind: 'rate_limit' });
  });

  it('returns only a safe generic error for provider and malformed-response failures', async () => {
    vi.stubEnv('VITE_GEMINI_API_KEY', 'test-only-gemini-key');
    const fetchMock = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ error: { message: 'private provider detail' } }, 403))
      .mockResolvedValueOnce(jsonResponse({ candidates: [] }));
    vi.stubGlobal('fetch', fetchMock);

    const errorResult = await geminiClient.sendMessage(request);
    expect(errorResult).toEqual({
      kind: 'request_error',
      safeMessage: 'We could not get a response. Please try again.',
    });
    expect(JSON.stringify(errorResult)).not.toContain('private provider detail');
    await expect(geminiClient.sendMessage(request)).resolves.toEqual({
      kind: 'request_error',
      safeMessage: 'We could not get a response. Please try again.',
    });
  });

  it('aborts after 30 seconds and returns timeout', async () => {
    vi.stubEnv('VITE_GEMINI_API_KEY', 'test-only-gemini-key');
    vi.useFakeTimers();
    const fetchMock = vi.fn<typeof fetch>().mockImplementation((_input, init) => new Promise((_, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), {
        once: true,
      });
    }));
    vi.stubGlobal('fetch', fetchMock);

    const resultPromise = geminiClient.sendMessage(request);
    await vi.advanceTimersByTimeAsync(30_000);

    await expect(resultPromise).resolves.toEqual({ kind: 'timeout' });
    expect(fetchMock).toHaveBeenCalledOnce();
  });
});
