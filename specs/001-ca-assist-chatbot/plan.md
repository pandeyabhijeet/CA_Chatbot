# Implementation Plan: CA Assist Chatbot

**Branch**: `001-ca-assist-chatbot` | **Date**: 2026-09-25 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-ca-assist-chatbot/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

CA Assist is a static Vite + React + TypeScript single-page chat application for general Indian tax,
GST, TDS, ITR filing, and accounting questions. It keeps a single in-memory conversation per browser
session, renders Markdown, and supports thinking/error/rate-limit states. The dedicated typed client
uses the fixed `gemma-4-26b-a4b-it` Gemini `generateContent` endpoint with ordered history and the
CA-focused `systemInstruction`. Live calls are enabled only when `VITE_GEMINI_API_KEY` is configured.
The project owner explicitly accepted local and public Pages browser-key exposure; a leaked key must
be rotated and the replacement restricted. No backend or fallback model/provider is permitted.

## Technical Context

**Language/Version**: TypeScript 5.9 in strict mode, targeting Node.js 20.19+ LTS for tooling/build.

**Primary Dependencies**: React 19.3, Vite 8.3, `react-markdown` with `remark-gfm` for tables,
ESLint 10 flat config with `typescript-eslint` and `eslint-plugin-react-hooks`; Vitest 5 and React
Testing Library as dev-only test dependencies. Accessibility is validated with semantic RTL tests
and Lighthouse because the current `eslint-plugin-jsx-a11y` release does not support ESLint 10.

**Storage**: N/A — the conversation exists only in in-memory browser state for the current page
session; nothing is persisted (per FR-010, FR-013).

**Testing**: Vitest + React Testing Library for unit and component tests (message list, input,
disclaimer, conversation states, no-key gate, and mocked safe-error handling); manual
acceptance walkthroughs against spec.md scenarios for end-to-end validation, since there is no
backend to run integration tests against.

**Target Platform**: Evergreen desktop and mobile browsers, served as a static site on GitHub Pages.

**Project Type**: Single-page web frontend, no backend (static hosting only).

**Performance Goals**: First usable load under 2 seconds on simulated 4G; production bundle under
300 KB gzipped.

**Constraints**: 30-second request timeout; WCAG 2.1 AA (keyboard navigation, visible focus, ARIA
live region for new replies); no backend, database, or serverless function; use only
`gemma-4-26b-a4b-it` at the documented `generateContent` endpoint; never hard-code, commit, or log an
API key. An approved browser key is public in client assets and must be restricted/rotated; without a
key, the app stays in preview mode (FR-012, constitution Principle III).

**Scale/Scope**: Single-user, single-session conversational UI; 4 prioritized user stories, 13
functional requirements; no multi-tenant, auth, or persistence concerns.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Domain Scope and Responsible Guidance** — PASS. FR-002, FR-004, and FR-005 keep answers
  scoped to CA topics, require polite redirects, and require the exact persistent disclaimer; the
  fixed system prompt (designed in Phase 1) encodes the CA-focused scope and uncertainty framing.
- **II. Approved Architecture and Provider** — PASS. The app remains static Vite/React/TypeScript,
  plain CSS, and `react-markdown`; no backend or fallback provider is added. The typed client calls
  only the fixed model/endpoint and sends the prescribed system instruction and ordered history.
- **III. API-Key Safety and User Consent** — CONDITIONAL on safe configuration. The owner explicitly
  accepted local and public Pages browser-key exposure. The posted key is treated as exposed and
  must be rotated; only a newly created Gemini-restricted key may be used. Local `.env.local` and the
  Actions `GEMINI_API_KEY` secret are ignored/masked at rest, but the built `VITE_*` value is public.
  No request occurs without a non-empty key.
- **IV. Reliable and Accessible Chat** — PASS. FR-006 through FR-011 cover the thinking indicator,
  retryable safe errors, 30-second timeout, HTTP 429 messaging, Markdown rendering, New chat, and
  accessibility; Phase 1 design includes an `AbortController`-based timeout and ARIA live region.
- **V. Evidence-Based Quality and Safe Delivery** — PASS. TypeScript strict mode, ESLint, and Vitest
  are in Technical Context; CI (existing constitution requirement) runs lint and type-check before
  build, and performance/accessibility claims will be measured, not assumed.

No violations require an entry in Complexity Tracking.

### Post-Phase 1 re-check

Re-evaluated after `research.md`, `data-model.md`, `contracts/`, and `quickstart.md` were written:

- **I–II, IV, V** — Still PASS. The finalized model/endpoint contract, blank-key no-request state,
  plain-CSS/`react-markdown` UI contract (`contracts/ui-component-props.md`), sanitized Markdown
  rendering (research.md §3), and Vitest/ESLint/strict-TypeScript toolchain (research.md §6–7) match
  the Technical Context. `remark-gfm` is included to meet the required Markdown-table behavior.
- **III** — Owner approval is recorded in this session; the remaining operational gate is rotating
  the shared key and configuring Gemini/API origin and quota restrictions. No key is stored in
  source, and the current blank local file keeps requests disabled until the replacement is supplied.

No new violations were introduced during Phase 1 design; Complexity Tracking remains empty.

## Project Structure

### Documentation (this feature)

```text
specs/001-ca-assist-chatbot/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
index.html
public/
└── favicon.svg         # Local static app mark; no external image/font requests
vite.config.ts
 tsconfig.json
 tsconfig.app.json
 tsconfig.node.json
eslint.config.js
package.json
.env.local              # local-only, git-ignored; empty until rotated/restricted key is set
.github/
└── workflows/
    └── deploy.yml       # build, lint, type-check, then deploy to GitHub Pages

src/
├── main.tsx             # React entry point
├── App.tsx              # top-level layout: chat window + disclaimer footer
├── api/
│   ├── geminiClient.ts   # typed generateContent client; no request without a configured key
│   └── config.ts         # single MODEL_ID and endpoint constant, system prompt constant
├── components/
│   ├── ChatWindow.tsx
│   ├── MessageList.tsx
│   ├── MessageBubble.tsx # renders Markdown via react-markdown
│   ├── MessageInput.tsx  # text input + Send button, Enter-to-send
│   ├── ThinkingIndicator.tsx
│   ├── ErrorBanner.tsx   # safe error + Retry action, rate-limit messaging
│   └── Disclaimer.tsx    # persistent footer disclaimer
├── hooks/
│   └── useConversation.ts # conversation state, submit/retry/new-chat, timeout handling
├── types/
│   └── chat.ts           # ChatMessage, Conversation, ApiError types
└── styles/
    └── app.css            # plain CSS, responsive layout

tests/
├── unit/                 # component and hook unit tests (Vitest + RTL)
└── contract/             # fixed-model/prompt contract and disabled-client no-network tests
```

**Structure Decision**: Single static frontend project (no backend/frontend split needed since there
is no backend). All application code lives under `src/`, mirroring the existing
`.github/instructions/ca-assist.instructions.md` `applyTo` globs (`src/**`, `index.html`,
`vite.config.*`, `package.json`, `tsconfig*.json`, `eslint.config.*`,
`.github/workflows/**`). The Gemini API client is isolated in `src/api/` per constitution
Principle II, and the model ID / endpoint / system prompt live in one constants module
(`src/api/config.ts`) so there is a single place to change them and no UI model picker.

## Complexity Tracking

*No Constitution Check violations require justification; table intentionally omitted.*
