---
description: "Task list template for feature implementation"
---

# Tasks: CA Assist Chatbot

**Input**: Design documents from `/specs/001-ca-assist-chatbot/`

**Prerequisites**: [plan.md](./plan.md) (required), [spec.md](./spec.md) (required for user stories),
[research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/),
[quickstart.md](./quickstart.md)

**Tests**: Test tasks are included because `plan.md` Technical Context and Project Structure
explicitly define Vitest + React Testing Library and a `tests/unit/` + `tests/contract/` layout as
required deliverables, and `quickstart.md`'s quality gates require `npm test` to pass.

**Organization**: Tasks are grouped by user story (from `spec.md`) to enable independent
implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- File paths are relative to the repository root

## Path Conventions

Single static frontend project at the repository root (`src/`, `tests/`), per `plan.md` Project
Structure — no backend/frontend split.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create the project skeleton per `plan.md` Project Structure: `index.html`, `src/`
      (`api/`, `components/`, `hooks/`, `types/`, `styles/`), and `tests/` (`unit/`, `contract/`)
      directories at the repository root
- [X] T002 Initialize `package.json` at the repository root with dependencies `react`, `react-dom`,
      `react-markdown`, and devDependencies `vite`, `@vitejs/plugin-react`, `typescript`, `eslint`,
      `typescript-eslint`, `eslint-plugin-react-hooks`, `vitest`,
      `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `jsdom`
      (depends on T001)
- [X] T003 [P] Configure `eslint.config.js` (flat config) at the repository root with
      `typescript-eslint` recommended-type-checked rules and `eslint-plugin-react-hooks`, per
      `research.md` §7 (depends on T002; JSX accessibility is validated by RTL and Lighthouse since
      the current `eslint-plugin-jsx-a11y` release does not support ESLint 10)
- [X] T004 [P] Configure `vite.config.ts` at the repository root with the React plugin and
      `base: '/CA_Chatbot/'`, per `research.md` §11 (depends on T002)
- [X] T005 [P] Configure `tsconfig.json`, `tsconfig.app.json`, and `tsconfig.node.json` at the
      repository root with TypeScript strict mode enabled and no implicit `any`, per Technical
      Context in `plan.md` (depends on T002)
- [X] T006 [P] Configure Vitest with a `jsdom` test environment and a `tests/setup.ts` file that
      loads `@testing-library/jest-dom` matchers, wired into `vite.config.ts`, per `research.md` §6
      (depends on T002)
- [X] T007 Add `dev`, `build`, `lint`, `typecheck`, `test`, and `preview` scripts to `package.json`
      (depends on T003, T004, T005, T006)
- [X] T008 [P] Create a root `.gitignore` including `node_modules`, `dist`, `.env.local`, and
      `.env*.local`, per constitution Principle III and PRD Configuration and deployment
- [X] T009 [P] Add a note to `README.md` stating that `VITE_GEMINI_API_KEY` / `.env.local` must
      never be committed and that live responses are gated off until explicit approval (FR-012)

**Checkpoint**: Tooling and project skeleton exist; `npm run lint` / `npm run typecheck` / `npm test`
are runnable and pass before user-story work begins.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core types, the typed Gemini client, conversation state, and shared UI/CSS that every
user story depends on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T010 [P] Define `ChatMessage` and `Conversation` types in `src/types/chat.ts` per
      `data-model.md`: `role: "user" | "assistant"`; `status: "complete" | "pending" | "error"`;
      `errorKind: "timeout" | "rate_limit" | "request_error" | undefined"`, set only when
      `status === "error"`; `content` for a `role: "user"` message MUST be non-empty after trimming
      whitespace (FR-001); a `pending` assistant message MUST have empty `content` until it resolves
- [X] T011 [P] Define the `AssistantRequest` and `AssistantResult` discriminated-union types in
      `src/api/types.ts` per `data-model.md` and `contracts/gemini-generate-content.md`: result kinds
      are `"success"` (with `text`), `"timeout"`, `"rate_limit"`, `"request_error"` (with
      `safeMessage`), and `"not_enabled"`
- [X] T012 [P] Create `src/api/config.ts` with a single `MODEL_ID` constant
      (`"gemma-4-26b-a4b-it"`), the `generateContent` endpoint URL constant
      (`https://generativelanguage.googleapis.com/v1beta/models/gemma-4-26b-a4b-it:generateContent`),
      and the fixed CA-focused system prompt constant (not user-editable, no model picker per
      constitution Principle II)
- [X] T013 [P] Implement `isLiveResponsesEnabled()` in `src/api/liveResponseAvailability.ts`,
      returning `true` only when `VITE_GEMINI_API_KEY` is non-empty and returning `false` otherwise
      (FR-012, constitution Principle III)
- [X] T014 Implement the live `fetch` transport in `src/api/geminiClient.ts` per
      `contracts/gemini-generate-content.md`: send the ordered request through the fixed model and
      `systemInstruction`; read the key only from the env; use `x-goog-api-key` header; enforce a
      30-second `AbortController` timeout; map HTTP 429, aborts, generic failures, malformed bodies,
      and success to safe typed results. It returns `not_enabled` without fetch when the key is empty.
      The owner accepts the browser-bundle exposure for local and Pages; keys pasted into chat must be
      treated as compromised and rotated. Only rotated Gemini-restricted keys may be configured.
- [X] T015 Implement `useConversation` in `src/hooks/useConversation.ts`: a reducer implementing the
      `data-model.md` state machine (`(none) → pending`, `pending → complete`,
      `pending → error(timeout|rate_limit|request_error)`, `error → pending` on Retry), plus
      `submit`, `retry`, and `newChat` actions and a derived `isAwaitingReply` boolean (depends on
      T010, T011, and the T014 client)
- [X] T016 [P] Implement base plain CSS in `src/styles/app.css`: layout tokens, a responsive
      flex/grid layout for the chat window, and a visually-hidden utility class for the ARIA live
      region, per `research.md` §2 and §9
- [X] T017 [P] Implement `Disclaimer` in `src/components/Disclaimer.tsx` rendering the exact,
      non-configurable persistent text "For general information only. Consult a qualified CA for
      advice." (FR-005)
- [X] T018 Wire `src/main.tsx` and `src/App.tsx` to render a root layout that imports
      `src/styles/app.css` and renders `Disclaimer` alongside a `ChatWindow` placeholder (depends on
      T015, T016, T017)

**Checkpoint**: Foundation ready — user story implementation can now begin.

---

## Phase 3: User Story 1 - Get General CA Information (Priority: P1) 🎯 MVP

**Goal**: A user can submit a question via Send or Enter, see it appear in the conversation, and
receive a rendered reply that uses the full prior conversation for follow-ups, with the disclaimer
visible.

**Independent Test**: With `geminiClient.sendMessage` mocked to return `{ kind: "success", text }`,
submit a question, confirm it appears and resolves to a rendered reply, then submit a follow-up and
confirm the mocked call received the full prior history (per `research.md` and `data-model.md`,
since live approval — and therefore real model responses — is a separate release dependency).

### Tests for User Story 1

- [X] T019 [P] [US1] Contract test in `tests/contract/geminiClient.live.test.ts`: mocked `fetch`
      returns a valid response; assert the typed success result, API key header (fake test key only),
      ordered history, and fixed `systemInstruction` request body.
- [X] T020 [P] [US1] Unit test in `tests/unit/useConversation.submit.test.ts`: `submit` appends a
      `complete` user message and a `pending` assistant message, then resolves the assistant message
      to `complete` on a mocked success result; a second `submit` call sends all prior `complete`
      messages as `history` (FR-003)
- [X] T021 [P] [US1] Component test in `tests/unit/MessageInput.test.tsx`: typing text and clicking
      Send calls `onSubmit` with the trimmed text; pressing Enter does the same; empty or
      whitespace-only input does not call `onSubmit` (FR-001)
- [X] T022 [P] [US1] Component test in `tests/unit/MessageList.test.tsx`: renders `ChatMessage[]`
      oldest-first and preserves list/bold/table Markdown structure in assistant message content via
      `react-markdown` (FR-009)

### Implementation for User Story 1

- [X] T023 [US1] Implement `MessageInput` in `src/components/MessageInput.tsx` per
      `contracts/ui-component-props.md` `MessageInputProps`: `disabled` while `isAwaitingReply`;
      `onSubmit` no-ops for empty/whitespace-only input (FR-001); submits via a visible Send
      `<button>` and via Enter
- [X] T024 [US1] Implement `MessageBubble` in `src/components/MessageBubble.tsx`: renders `role:
      "user"` content as plain text and `role: "assistant"` content via `react-markdown` with no
      raw-HTML passthrough (research.md §3)
- [X] T025 [US1] Implement `MessageList` in `src/components/MessageList.tsx` per
      `contracts/ui-component-props.md` `MessageListProps`, rendering `ChatMessage[]` oldest-first
      using `MessageBubble`
- [X] T026 [US1] Implement `ChatWindow` in `src/components/ChatWindow.tsx` composing `Disclaimer`,
      `MessageList`, and `MessageInput`, wired to `useConversation`'s `messages`, `isAwaitingReply`,
      and `submit`
- [X] T027 [US1] Replace the `ChatWindow` placeholder in `src/App.tsx` (from T018) with the real
      `ChatWindow`, so a submitted question appears in the conversation and, once resolved, its reply
      is shown together with the persistent disclaimer (spec.md US1 Acceptance Scenario 1)

**Checkpoint**: User Story 1 is independently functional and testable via injected mock responses;
the default preview client keeps live answers disabled until the separate approval in `plan.md` and
`quickstart.md` is recorded.

---

## Phase 4: User Story 2 - Stay Within CA Topics (Priority: P1)

**Goal**: The fixed system prompt sent with every request instructs the model to stay scoped to
Indian tax/GST/TDS/ITR/accounting topics, politely redirect unrelated requests, and address only the
supported portion of mixed requests — the client never performs its own topic filtering.

**Independent Test**: Submit supported, off-topic, and mixed prompts to an injected client and assert
that each `AssistantRequest` contains the unchanged fixed `systemInstruction` and original user text.
The application performs no client-side keyword filtering; live redirect behavior remains gated on
the separate approval in `quickstart.md`.

### Tests for User Story 2

- [X] T028 [P] [US2] Contract test in `tests/contract/geminiClient.systemInstruction.test.ts`: for
      multiple distinct user questions (including supported, off-topic, and mixed examples), assert
      the `AssistantRequest` passed to the client always includes the exact fixed
      `SYSTEM_INSTRUCTION` from `src/api/config.ts`, never text derived from or altered by the user
      (uses an injected mock client and makes no live request)

### Implementation for User Story 2

- [X] T029 [US2] Author the fixed CA-focused system prompt text in `src/api/config.ts` (extending
      T012's constant) instructing the model to: answer only Indian income tax, GST, TDS, ITR
      filing, and accounting questions; politely redirect unrelated requests to those topics; answer
      only the supported portion of a mixed request and redirect the rest; and state when a fact
      needs current verification rather than presenting it as certain (FR-002, FR-004, spec.md Edge
      Cases)

**Checkpoint**: User Stories 1 and 2 both work independently; the prompt contract is locked in for
later live validation.

---

## Phase 5: User Story 3 - Understand Waiting and Recover From Errors (Priority: P2)

**Goal**: A user sees a thinking indicator while waiting, safe distinguishable messages plus Retry
for failures/timeouts/rate-limits, and a clear configuration notice if no key is configured — without
ever losing their original question.

**Independent Test**: With `geminiClient.sendMessage` mocked to return each of `timeout`,
`rate_limit`, `request_error`, and `not_enabled`, confirm the corresponding safe message appears
(the no-key result makes zero `fetch` calls), and Retry resubmits the same original question.

### Tests for User Story 3

- [X] T030 [P] [US3] Contract test in `tests/contract/geminiClient.live.test.ts`: with fake key and
      mocked `fetch` that listens for abort, advance 30 seconds and assert `{ kind: "timeout" }`.
- [X] T031 [P] [US3] Contract test in `tests/contract/geminiClient.live.test.ts`: mocked HTTP 429
      maps to `rate_limit`; non-2xx and malformed responses map to safe `request_error` without
      returning raw provider details.
- [X] T032 [P] [US3] Contract test in `tests/contract/geminiClient.notEnabled.test.ts`: with
      `isLiveResponsesEnabled()` mocked `false`, assert `sendMessage` resolves
      `{ kind: "not_enabled" }` and that `fetch` was never called (FR-012, SC-007)
- [X] T033 [P] [US3] Unit test in `tests/unit/useConversation.retry.test.ts`: after an assistant
      message resolves to `status: "error"`, calling `retry` resubmits the same original user
      question and transitions the message back to `pending` without discarding it (spec.md Edge
      Cases)

### Implementation for User Story 3

- [X] T034 [US3] Implement `ThinkingIndicator` in `src/components/ThinkingIndicator.tsx` per
      `contracts/ui-component-props.md` `ThinkingIndicatorProps`, visible while `isAwaitingReply` is
      `true` (FR-006)
- [X] T035 [US3] Implement `ErrorBanner` in `src/components/ErrorBanner.tsx` per
      `contracts/ui-component-props.md` `ErrorBannerProps`, rendering a distinct safe message for
      each of `"timeout"`, `"rate_limit"`, and `"request_error"`, each with a Retry action (FR-007,
      FR-008)
- [X] T036 [US3] Add a "live responses are not configured" notice, shown in place of `ErrorBanner`
      when the resolved result is `{ kind: "not_enabled" }`, explaining that no question or
      credential was sent (FR-012)
- [X] T037 [US3] Wire `useConversation`'s `retry` action (implemented in T015) to the `ErrorBanner`'s
      `onRetry` so it resubmits the original user question tied to the failed assistant message
- [X] T038 [US3] Wire `ChatWindow` to render `ThinkingIndicator` while `isAwaitingReply` and to render
      `ErrorBanner` / the not-enabled notice for the corresponding message `status`/`errorKind`
      (FR-006, FR-007, FR-008, FR-012)

**Checkpoint**: User Stories 1, 2, and 3 all work independently.

---

## Phase 6: User Story 4 - Read and Manage a Conversation (Priority: P2)

**Goal**: Assistant replies stay readable across Markdown structures, New chat clears the
conversation irreversibly, and the full flow is keyboard- and screen-reader-accessible with a
responsive layout.

**Independent Test**: Render a reply containing a list, bold text, and a table and confirm structure;
add messages, select New chat, and confirm the conversation is empty and a stale in-flight response
is not appended; complete submit → read reply → New chat using only the keyboard, confirming visible
focus and an ARIA live announcement, at both a mobile and a desktop viewport width.

### Tests for User Story 4

- [X] T039 [P] [US4] Component test in `tests/unit/MessageBubble.markdown.test.tsx`: assistant
      content containing a Markdown list, bold text, and a table renders with the corresponding
      `<ul>`/`<strong>`/`<table>` structure intact (FR-009)
- [X] T040 [P] [US4] Unit test in `tests/unit/useConversation.newChat.test.ts`: `newChat` clears
      `messages` to `[]` and resets `isAwaitingReply` to `false`; a mocked `sendMessage` result that
      resolves after `newChat` was called is discarded and does not reappear in the (now empty)
      conversation (spec.md Edge Cases)
- [X] T041 [P] [US4] Accessibility test in `tests/unit/ChatWindow.accessibility.test.tsx`: an
      `aria-live="polite"` region announces text when a message transitions to `complete` or `error`,
      and focus returns to the message input after submit, Retry, and New chat (FR-011)

### Implementation for User Story 4

- [X] T042 [US4] Implement `NewChatButton` in `src/components/NewChatButton.tsx` per
      `contracts/ui-component-props.md` `NewChatButtonProps`, calling `useConversation`'s `newChat`
      action (FR-010)
- [X] T043 [US4] Add the `aria-live="polite"` announcement region to `ChatWindow` (using the
      visually-hidden utility class from T016) that announces new assistant replies and errors
      (FR-011)
- [X] T044 [US4] Implement focus management in `ChatWindow`/`MessageInput`: return focus to the
      message input after submit, Retry, and New chat (FR-011)
- [X] T045 [US4] Implement the responsive layout in `src/styles/app.css` for `ChatWindow`,
      `MessageList`, `MessageInput`, and `Disclaimer` across mobile and desktop breakpoints, keeping
      the disclaimer visible at every size (FR-005, FR-011)
- [X] T046 [US4] Harden `useConversation`'s `newChat` (from T015) so any in-flight request tied to a
      cleared conversation is aborted or its result is ignored on arrival, per `data-model.md`
      `Conversation` rules and the corresponding edge case

**Checkpoint**: All four user stories are independently functional.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Deployment pipeline, measured quality targets, and final documentation/security checks.

- [X] T047 [P] Create `.github/workflows/deploy.yml`: checkout, Node 20.19, `npm ci`, lint,
      type-check, tests, and `npm run build` with `VITE_GEMINI_API_KEY` sourced from the approved
      repository secret `GEMINI_API_KEY`; upload/deploy on push to `main` and `workflow_dispatch`,
      with only `contents: read`, `pages: write`, and `id-token: write`. The built browser key is
      public; configure only a newly rotated Gemini-restricted key with quotas.
- [X] T048 [P] Run `npm run build`, measure the gzipped size of the largest emitted JS chunk, and
      record the latest result: 119.31 KB (under the 300 KB target; constitution Principle V).
- [X] T049 [P] Measure first-load rendering under Fast 4G and record the latest result: LCP 1,612 ms,
      CLS 0.00 (lab trace; under the 2-second target; SC-004).
- [ ] T050 [P] Rerun live acceptance after a newly rotated, restricted Gemini key is configured:
      verify the five PRD questions and off-topic redirect against the fixed model, confirm timeout,
      HTTP 429 and safe-error behavior, and record results. No-key preview and mocked tests pass.
- [X] T051 [P] Update `README.md` to remove the "specification stage" status note and document the
      real `npm run dev` / `build` / `lint` / `typecheck` / `test` scripts now that they exist
- [ ] T052 **PARTIAL — rotated-key / CI review pending**: scan committed files, build output, and
      Actions logs for unintended key exposure after configuring a replacement key. The key shared
      in chat was cleared from `.env.local`; do not reuse it. Never print secret values during scans.
      A Vite-bundled key is inherently public to site visitors.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories.
- **User Stories (Phase 3–6)**: All depend on Foundational completion.
  - US1 and US2 have no dependency on each other and can proceed in parallel.
  - US3 depends on the `AssistantResult` variants from Foundational (T011, T014) but not on US1/US2
    completion; it can proceed in parallel with them, though it reuses `ChatWindow` (T026 from US1),
    so in a single-developer sequence, complete US1 first.
  - US4 reuses `ChatWindow` (US1) and benefits from US3's error-state UI existing, so in a
    single-developer sequence, implement it last; a second developer could still start US4's
    `MessageBubble`/CSS/`useConversation` tests in parallel.
- **Polish (Phase 7)**: UI, mocked tests, and static build are complete. Live acceptance (T050) and
      post-deployment secret/log review (T052) require a replacement key and a successful CI run.

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational — no dependency on other stories.
- **User Story 2 (P1)**: Can start after Foundational — no dependency on other stories (touches the
      fixed prompt in `src/api/config.ts` and verifies it through an injected mock client).
- **User Story 3 (P2)**: Can start after the typed-client/UI foundation — integrates with US1's `ChatWindow` but its
  own components/tests are independently addable.
- **User Story 4 (P2)**: Can start after Foundational — integrates with US1's `ChatWindow` and US3's
      safe error UI; components/tests are independently addable once shared files exist.

### Within Each User Story

- Tests are written before their corresponding implementation tasks and are expected to fail first.
- Types/contracts (Foundational) before hook wiring before components before page-level wiring.
- Story complete and checkpointed before moving to the next priority.

### Parallel Opportunities

- All Setup tasks marked [P] (T003–T006, T008, T009) can run in parallel once T002 is done.
- All Foundational tasks marked [P] (T010–T013, T016, T017) can run in parallel.
- Once Foundational completes, US1 and US2 can be worked on in parallel; all [P] test tasks within a
  story can run in parallel; all [P] component/model tasks within a story can run in parallel.

---

## Parallel Example: User Story 1

```bash
# Launch all User Story 1 tests together:
Task: "Unit test in tests/unit/useConversation.submit.test.ts"
Task: "Component test in tests/unit/MessageInput.test.tsx"
Task: "Component test in tests/unit/MessageList.test.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories).
3. Complete Phase 3: User Story 1.
4. **STOP and VALIDATE**: Run T020–T022 tests and the applicable `quickstart.md` scenarios (1, 2, 6)
   against a mocked client; confirm US1 works independently.
5. Demo with mocked responses; live model answers require a newly rotated/restricted key in ignored
      `.env.local` or in the approved Pages Actions secret.

### Incremental Delivery

1. Setup + Foundational → foundation ready.
2. Add User Story 1 → validate independently → MVP demo (mocked responses).
3. Add User Story 2 → validate the system-prompt contract independently.
4. Add User Story 3 → validate thinking/error/retry/not-enabled states independently.
5. Add User Story 4 → validate Markdown structure, New chat, and accessibility independently.
6. Polish (Phase 7) → deployment workflow, measured performance, security review.
7. Once a newly rotated, Gemini-restricted key is configured locally or in the Pages Actions secret,
      run the `quickstart.md` live-response walkthrough to validate SC-001 and SC-002 against real model
      responses.

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together.
2. Once Foundational is done:
   - Developer A: User Story 1 (`ChatWindow`/`MessageList`/`MessageInput`).
   - Developer B: User Story 2 (system prompt content + contract test).
   - Developer C: User Story 3 (error/timeout/rate-limit/not-enabled UI), coordinating with
     Developer A on `ChatWindow` integration points.
3. User Story 4 (accessibility/New chat/responsive layout) is best done after US1's `ChatWindow`
   exists, so schedule it after Developer A's initial `ChatWindow` lands.

---

## Notes

- [P] tasks = different files, no dependencies.
- Live Gemini responses are enabled only when `VITE_GEMINI_API_KEY` is non-empty. The owner accepted
      local and public Pages exposure. T014, T019, T030, and T031 are implemented and tested with fake
      credentials/mocked fetch; no live provider call was made during those tests.
- The key shared in chat was cleared from `.env.local` and must be revoked/rotated. Only a replacement
      restricted to Gemini with quotas/referrer controls may be configured. The built client key is
      public to site visitors.
- Measured after enabling the keyed client, but with the cleared env key in preview: JavaScript gzip
      119.31 KB; mobile Fast 4G LCP 1,612 ms, CLS 0.00; mobile Lighthouse accessibility, best-practices,
      SEO, and agentic-browsing scores were 100.
- T050 live acceptance and T052 replacement-key/CI-log audit remain pending a new key and CI run. Do
      not print secret values in scans or reports.
- Commit after each task or logical group.
- Stop at any checkpoint to validate a story independently.
- Avoid: vague tasks, same-file conflicts within a marked-[P] group, and cross-story dependencies
  that break independence.
