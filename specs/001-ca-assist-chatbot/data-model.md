# Phase 1 Data Model: CA Assist Chatbot

All entities below are client-side, in-memory only (no persistence layer), scoped to a single
browser page session per constitution Principle II and spec FR-010/FR-013.

## ChatMessage

Represents one turn in the conversation — either a user question or an assistant reply.

| Field       | Type                                                          | Notes |
|-------------|----------------------------------------------------------------|-------|
| `id`        | `string` (UUID)                                                 | Stable key for React lists; generated client-side. |
| `role`      | `"user" \| "assistant"`                                          | Who authored the message. |
| `content`   | `string`                                                         | Markdown text for assistant replies; plain text for user questions. Empty/whitespace-only user content is invalid (FR-001) and MUST NOT be constructed. |
| `status`    | `"complete" \| "pending" \| "error"`                             | `pending`/`error` only apply to assistant messages awaiting or failing a response; user messages are always `complete`. |
| `errorKind` | `"timeout" \| "rate_limit" \| "request_error" \| undefined`      | Set only when `status === "error"`; drives the safe message shown (FR-007, FR-008). |
| `createdAt` | `number` (epoch ms)                                              | Used for ordering and display only; not persisted. |

**Validation rules**:
- `content` for a `role: "user"` message MUST be non-empty after trimming whitespace (FR-001).
- `errorKind` MUST be `undefined` unless `status === "error"`.
- A `pending` assistant message MUST have empty `content` until it resolves to `complete` or `error`.

**State transitions** (assistant message only):

```text
(none) --submit user question--> pending
pending --success response--> complete
pending --timeout (>30s)--> error (errorKind: timeout)
pending --HTTP 429--> error (errorKind: rate_limit)
pending --other failure--> error (errorKind: request_error)
error --user selects Retry--> pending (same associated user question, new attempt)
```

## Conversation

Represents the ordered list of messages in the current session.

| Field              | Type            | Notes |
|--------------------|-----------------|-------|
| `messages`         | `ChatMessage[]` | Ordered oldest-first; sent in full to the API on each new question (FR-003, PRD FR-2). |
| `isAwaitingReply`   | `boolean`       | `true` while any message has `status === "pending"`; used to disable Send and show the thinking indicator (FR-006). |

**Rules**:
- New chat (FR-009 in the PRD / FR-010 in spec.md) replaces `messages` with an empty array and
  resets `isAwaitingReply` to `false`. It MUST NOT be reversible (edge case: no restore after New
  chat or after the page session ends).
- Selecting New chat while `isAwaitingReply` is `true` MUST NOT let a later-arriving response be
  appended to the now-cleared conversation (edge case in spec.md); any in-flight request must be
  aborted or its result discarded if the conversation was reset in the meantime.

## AssistantRequest (client-to-API request shape)

The typed input the API client accepts; not persisted, constructed fresh per submission.

| Field                | Type                                 | Notes |
|----------------------|--------------------------------------|-------|
| `history`            | `ChatMessage[]`                      | All prior `complete` messages, oldest-first, excluding the in-progress pending message (FR-003). |
| `systemInstruction`   | `string`                              | The fixed CA-focused system prompt constant (Principle I, PRD FR-3); not user-editable. |

## AssistantResult (client-side outcome type)

A discriminated union returned by the API client and consumed by `useConversation`:

| Variant                                   | Fields                              | Notes |
|--------------------------------------------|--------------------------------------|-------|
| `{ kind: "success"; text: string }`         | Markdown reply text                 | Written into the pending message's `content`, `status -> "complete"`. |
| `{ kind: "timeout" }`                       | —                                    | Request exceeded 30s; `status -> "error"`, `errorKind -> "timeout"`. |
| `{ kind: "rate_limit" }`                    | —                                    | HTTP 429 received; `status -> "error"`, `errorKind -> "rate_limit"`. |
| `{ kind: "request_error"; safeMessage: string }` | User-safe message, no raw API body | Any other failure; `status -> "error"`, `errorKind -> "request_error"`. |
| `{ kind: "not_enabled" }`                   | —                                    | Live responses are gated off per FR-012/Principle III; no network call is made. |

## LiveResponseAvailability (configuration, not user data)

| Field           | Type      | Notes |
|-----------------|-----------|-------|
| `isEnabled`     | `boolean` | Result of `isLiveResponsesEnabled()` (see research.md §10); `true` only when the owner-approved flow has a non-empty `VITE_GEMINI_API_KEY`, otherwise `false`. |

This is a build/runtime configuration flag, not a persisted entity, and has no relationships to
`Conversation` or `ChatMessage` beyond gating whether a submission produces a `not_enabled` result.
