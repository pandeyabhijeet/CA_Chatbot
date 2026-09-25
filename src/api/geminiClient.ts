import { GENERATE_CONTENT_ENDPOINT } from './config';
import { isLiveResponsesEnabled } from './liveResponseAvailability';
import type { AssistantClient, AssistantRequest, AssistantResult } from './types';

interface GeminiCandidate {
  content?: {
    parts?: Array<{ text?: string }>;
  };
}

interface GeminiResponse {
  candidates?: GeminiCandidate[];
}

const REQUEST_TIMEOUT_MS = 30_000;
const SAFE_REQUEST_ERROR = 'We could not get a response. Please try again.';

function isGeminiResponse(value: unknown): value is GeminiResponse {
  if (typeof value !== 'object' || value === null || !('candidates' in value)) {
    return false;
  }

  const candidates = value.candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) {
    return false;
  }

  const firstCandidate: unknown = candidates[0];
  if (typeof firstCandidate !== 'object' || firstCandidate === null || !('content' in firstCandidate)) {
    return false;
  }

  const content: unknown = firstCandidate.content;
  if (typeof content !== 'object' || content === null || !('parts' in content)) {
    return false;
  }

  const parts = content.parts;
  if (!Array.isArray(parts) || parts.length === 0) {
    return false;
  }

  const firstPart: unknown = parts[0];
  return typeof firstPart === 'object' && firstPart !== null &&
    'text' in firstPart && typeof firstPart.text === 'string';
}

function createContents(request: AssistantRequest): Array<{
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}> {
  return request.history.map((turn) => ({
    role: turn.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: turn.content }],
  }));
}

/** Calls only the fixed approved Gemini model and endpoint. */
export const geminiClient: AssistantClient = {
  async sendMessage(request: AssistantRequest): Promise<AssistantResult> {
    if (!isLiveResponsesEnabled()) {
      return { kind: 'not_enabled' };
    }

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim();
    if (!apiKey) {
      return { kind: 'not_enabled' };
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(GENERATE_CONTENT_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: createContents(request),
          systemInstruction: { parts: [{ text: request.systemInstruction }] },
        }),
        signal: controller.signal,
      });

      if (response.status === 429) {
        return { kind: 'rate_limit' };
      }
      if (!response.ok) {
        return { kind: 'request_error', safeMessage: SAFE_REQUEST_ERROR };
      }

      const responseText = await response.text();
      const body: unknown = JSON.parse(responseText) as unknown;
      if (!isGeminiResponse(body)) {
        return { kind: 'request_error', safeMessage: SAFE_REQUEST_ERROR };
      }

      const text = body.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (!text) {
        return { kind: 'request_error', safeMessage: SAFE_REQUEST_ERROR };
      }

      return { kind: 'success', text };
    } catch (error: unknown) {
      if (controller.signal.aborted || (error instanceof DOMException && error.name === 'AbortError')) {
        return { kind: 'timeout' };
      }
      return { kind: 'request_error', safeMessage: SAFE_REQUEST_ERROR };
    } finally {
      window.clearTimeout(timeout);
    }
  },
};
