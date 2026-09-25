# Quickstart: CA Assist Chatbot

This validates the CA Assist UI and, when a newly rotated/restricted API key is configured, the
Gemini integration. The project owner has explicitly accepted local and public Pages browser-key
exposure (constitution Principle III, spec FR-012). The key previously pasted into chat must be
considered compromised: revoke/rotate it and do not use it.

## Prerequisites

- Node.js 20.19+ LTS and npm (or Node.js 22.12+).
- Repository cloned locally; this feature's code lives under `src/` at the repo root
  (see `plan.md` Project Structure).

## Setup

```bash
npm ci
```

No `.env.local` is required for UI and mocked tests. With no non-empty key configured, the app stays
in preview mode and the client makes no network request.

## Validate quality gates

```bash
npm run lint        # ESLint, must pass with zero errors
npm run typecheck    # tsc --noEmit, strict mode, no `any`
npm test             # Vitest unit/component suite
npm run build        # production build; verify dist bundle is < 300 KB gzipped
```

Record the gzipped size of the largest emitted JS chunk from the build output and confirm it is
under 300 KB before claiming the performance target is met (constitution Principle V).

## Run locally

```bash
npm run dev
```

Open the printed local URL and walk through the scenarios below.

## Manual acceptance walkthrough (maps to spec.md scenarios)

1. **No-key preview state (FR-012)**: With no non-empty key configured, submit any question. Confirm
   the UI says live responses are not configured and confirm (via browser dev tools Network tab)
   that no request was sent to `generativelanguage.googleapis.com`.
2. **Input handling (FR-001)**: Confirm Send is disabled/no-ops for empty or whitespace-only input,
   and that a non-empty question submits via both the Send button and the Enter key.
3. **Thinking indicator (FR-006)**: Confirm a visible "Thinking…" state appears while
   `isAwaitingReply` is `true` (simulate with a mocked pending client in tests, since live calls are
   gated off).
4. **Error and retry (FR-007)**: Inject a mock client returning `request_error` and `timeout` in the
   component/state tests; confirm a safe message and Retry action appear, and Retry resubmits the
   same question. The no-key preview client never calls the Gemini endpoint.
5. **Rate limit (FR-008)**: Inject a mock `rate_limit` result; confirm the UI says "Please wait a
   moment, then try again" and differs from the generic failure message.
6. **Markdown rendering (FR-009 in spec.md / PRD FR-7)**: Simulate a `success` result whose text
   contains a list, bold text, and a table; confirm each renders with correct structure.
7. **New chat (FR-010)**: Add messages, select New chat, and confirm the conversation is empty and
   does not reappear on reload (no persistence, per data-model.md `Conversation` rules).
8. **Accessibility (FR-011)**: Using keyboard only, complete submit → read reply → New chat. Confirm
   visible focus at each step and that a screen reader (or the accessibility tree) reports the new
   reply via the `aria-live="polite"` region.
9. **Disclaimer (FR-005)**: Confirm the exact text "For general information only. Consult a
   qualified CA for advice." is visible at a mobile viewport width and a desktop viewport width.
10. **Non-goals (FR-013)**: Confirm there is no login control, no persisted history after a reload,
    no file/document upload control, and no streaming/partial-token rendering of replies.

## Live response walkthrough (after rotating/restricting the key)

1. In Google AI Studio, revoke the key that was posted in chat and create a replacement authorization
   key. Restrict it to the Gemini API; set quota limits and web referrer restrictions where supported.
2. For local testing, put the replacement in ignored `.env.local` as `VITE_GEMINI_API_KEY=...` (do
   not paste it in chat or commit it), restart `./run.sh`, and confirm the UI indicates Live responses.
3. For Pages, add the same or a separate restricted key as the Actions repository secret
   `GEMINI_API_KEY`, then dispatch the workflow. The key is bundled into public assets; treat this as
   publicly readable, inspectable information.
4. Ask the five PRD sample tax/accounting questions and confirm answers are relevant and general
   information only (SC-001). Ask an off-topic recipe request and confirm a polite redirect (SC-002).
5. Confirm the request history and `systemInstruction` match
   `contracts/gemini-generate-content.md`, HTTP 429 shows the retry-later message, timeout is bounded
   at 30 seconds, and failures never expose provider response details or credentials.

## Expected outcome

All quality gates pass and the no-key preview scenarios behave as described. After replacing the
chat-shared key with a rotated, restricted key, the live walkthrough validates SC-001 and SC-002
against real model responses. Do not send real questions until the replacement is configured.
