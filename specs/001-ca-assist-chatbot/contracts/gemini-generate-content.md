# Contract: Gemini `generateContent` Request/Response

This documents the external HTTP contract the typed API client depends on. It is fixed by the PRD
and constitution — no alternate provider, model, or endpoint is permitted.

**Endpoint**: `POST https://generativelanguage.googleapis.com/v1beta/models/gemma-4-26b-a4b-it:generateContent`

**Auth**: The client sends `VITE_GEMINI_API_KEY` in the `x-goog-api-key` request header. It never
places the key in the URL, hard-codes it, or logs it. With an empty variable, the client returns
`not_enabled` without making a request. A non-empty Vite key is public in browser assets and must be
rotated/restricted as described in `research.md` §10 and data-model.md `LiveResponseAvailability`.

## Request body (shape the client sends)

```jsonc
{
  "contents": [
    // One entry per prior message in the conversation, oldest-first, mapped from ChatMessage:
    // role "user" -> "user", role "assistant" -> "model"
    { "role": "user", "parts": [{ "text": "What is the ITR filing due date for salaried individuals?" }] },
    { "role": "model", "parts": [{ "text": "…previous reply…" }] },
    { "role": "user", "parts": [{ "text": "…latest question…" }] }
  ],
  "systemInstruction": {
    "parts": [{ "text": "<fixed CA-focused system prompt constant>" }]
  }
}
```

- `contents` MUST reflect the full ordered history plus the new question (PRD FR-2, spec FR-003).
- `systemInstruction` MUST carry the fixed prompt from `src/api/config.ts`; it is never built from
  user input and never exposes a model picker (constitution Principle II).
- The client MUST NOT add generation parameters not specified by the PRD unless the user approves
  such a change.

## Response body (success shape the client expects)

```jsonc
{
  "candidates": [
    {
      "content": {
        "parts": [{ "text": "…assistant reply markdown…" }]
      }
    }
  ]
}
```

- The client reads `candidates[0].content.parts[0].text` as the reply Markdown string.
- If the shape does not match (missing candidates/parts), the client MUST treat it as an
  `AssistantResult` of kind `request_error` with a safe, generic message — it MUST NOT surface the
  raw response body to the user.

## Error responses the client MUST distinguish

| HTTP status                       | Client `AssistantResult` kind | User-facing behavior |
|------------------------------------|--------------------------------|------------------------|
| `429 Too Many Requests`            | `rate_limit`                   | Show a clear "please retry later" message (FR-008). |
| Request exceeds 30s (client-side `AbortController` timeout, no response) | `timeout`      | Show a safe timeout message with Retry (FR-007). |
| Any other non-2xx status or network failure | `request_error`          | Show a generic safe error message with Retry (FR-007); never include raw error bodies, stack traces, or the API key. |

## Client function contract (`src/api/geminiClient.ts`)

This is the internal TypeScript contract the rest of the app depends on. It is a type-level contract
for planning purposes — the concrete implementation is produced during the implementation phase.

```ts
export interface AssistantRequest {
  history: ReadonlyArray<{ role: "user" | "assistant"; content: string }>;
  systemInstruction: string;
}

export type AssistantResult =
  | { kind: "success"; text: string }
  | { kind: "timeout" }
  | { kind: "rate_limit" }
  | { kind: "request_error"; safeMessage: string }
  | { kind: "not_enabled" };

export interface GeminiClient {
  /**
   * Sends the ordered conversation history and fixed system prompt to the approved
   * gemma-4-26b-a4b-it model via generateContent, enforcing a 30-second timeout.
  * Returns `{ kind: "not_enabled" }` without making a network request when no
  * non-empty API key is configured (see LiveResponseAvailability).
   */
  sendMessage(request: AssistantRequest): Promise<AssistantResult>;
}
```

- `sendMessage` MUST be the only place `fetch` is called for Gemini requests (constitution
  Principle II: "dedicated typed client").
- `sendMessage` MUST check `LiveResponseAvailability.isEnabled` first and short-circuit to
  `{ kind: "not_enabled" }` when `false`, per FR-012.
- `sendMessage` MUST NOT accept or expose the raw API key to callers; the key stays internal to this
  module.
