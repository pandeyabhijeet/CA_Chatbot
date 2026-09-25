# Phase 0 Research: CA Assist Chatbot

All unknowns from the Technical Context have been resolved below. No `NEEDS CLARIFICATION` markers
remain.

## 1. Frontend framework and build tool versions

- **Decision**: React 19.3 with Vite 8.3, TypeScript 5.9 in strict mode, and Node.js 20.19+.
- **Rationale**: The PRD fixes the framework to Vite + React + TypeScript. React 19 and Vite 6 are
  compatible with the approved stack. Initial installation surfaced audited development-tool
  vulnerabilities in the Vite 6/Vitest 2 dependency tree, so the compatible Vite 8/Vitest 5 releases
  were selected; `npm audit` then reported zero vulnerabilities. Node 20.19+ satisfies Vite 8's
  runtime requirement while retaining the PRD's Node 20 deployment target.
- **Alternatives considered**: Create React App (unmaintained, larger bundles, rejected); Next.js
  (adds server-rendering/routing capabilities not needed for a single static page and would
  complicate the GitHub Pages static-export story, rejected); staying on React 18 (still viable, but
  no PRD constraint requires it and 19 is the current stable release, so 19 was chosen).

## 2. Styling approach

- **Decision**: Plain CSS with a single stylesheet (`src/styles/app.css`) using CSS custom
  properties for spacing/color tokens and flexbox/grid for responsive layout.
- **Rationale**: The PRD and constitution explicitly forbid a UI library. Plain CSS keeps the bundle
  small and avoids an extra dependency surface.
- **Alternatives considered**: Tailwind CSS (adds a build dependency and utility classes not
  required by the PRD, rejected); CSS-in-JS libraries (adds runtime weight and conflicts with the
  "no UI library" and bundle-size constraints, rejected).

## 3. Markdown rendering

- **Decision**: `react-markdown` with `remark-gfm` for GitHub-flavored tables, using default safe
  rendering and no `rehype-raw`, so replies can contain lists, bold text, and tables without
  allowing arbitrary raw HTML from model output.
- **Rationale**: The PRD specifies `react-markdown`. Avoiding raw-HTML passthrough plugins prevents
  a stored/reflected XSS vector if the model ever returns HTML-like content, satisfying the OWASP
  concern for untrusted content rendering.
- **Alternatives considered**: `marked` + `dangerouslySetInnerHTML` (rejected: manual sanitization
  burden and direct XSS risk); enabling `rehype-raw` for richer HTML (rejected: unnecessary for the
  required lists/bold/tables and increases XSS surface).

## 4. HTTP client and request contract

- **Decision**: `src/api/geminiClient.ts` uses native `fetch` to the fixed Gemini `generateContent`
  endpoint, sends ordered `contents` plus the fixed `systemInstruction`, uses the `x-goog-api-key`
  request header, and enforces a 30-second `AbortController` timeout. It returns distinct typed
  results for HTTP 429, timeout, safe generic failures, malformed responses, and success.
- **Rationale**: This follows the PRD's fixed endpoint/client architecture. The browser key is read
  only from `VITE_GEMINI_API_KEY`, never placed in the URL or logged. The no-backend architecture
  means this key is public in delivered client assets, an exposure explicitly accepted by the owner;
  rotate leaked keys and restrict replacements.
- **Alternatives considered**: `axios` (extra dependency, unnecessary given `fetch` covers the need,
  rejected); a generic retry/interceptor library (adds complexity beyond the single-retry-via-Retry-
  button requirement, rejected).

## 5. State management

- **Decision**: Local React state via a single custom hook (`useConversation`), using `useReducer`
  for message list transitions (pending → complete/error) and `useState` for the input field.
- **Rationale**: Scope is a single in-memory conversation with no cross-component or cross-session
  sharing need (FR-010, FR-013). A reducer keeps the pending/complete/error/timeout/rate-limit
  transitions explicit and testable without a state-management library.
- **Alternatives considered**: Redux/Zustand/Context-heavy global store (unnecessary indirection for
  a single conversation scoped to one component tree, rejected).

## 6. Testing framework

- **Decision**: Vitest 5 + React Testing Library for unit/component tests; `@testing-library/user-event`
  for interaction simulation. No end-to-end browser test runner is introduced.
- **Rationale**: Vitest integrates natively with Vite's config and transform pipeline (no separate
  Jest/Babel setup), keeping the dev toolchain small and fast. React Testing Library encourages
  accessibility-driven queries (role/label), which directly supports verifying the WCAG 2.1 AA
  requirements (focus, ARIA live region, keyboard operation).
- **Alternatives considered**: Jest (extra configuration to work with Vite/ESM, rejected in favor of
  Vitest); Playwright/Cypress E2E (there is no backend to exercise end-to-end and the PRD's
  acceptance criteria are verifiable via component tests plus manual walkthroughs, so a full E2E
  runner is deferred as unnecessary scope for this feature).

## 7. Linting and type-checking

- **Decision**: ESLint 10 flat config (`eslint.config.js`) with `typescript-eslint` recommended-type-
  checked rules and `eslint-plugin-react-hooks`; `tsc -b --pretty` for strict type-checking.
  Accessibility is validated with semantic React Testing Library checks and Lighthouse.
- **Rationale**: Constitution Principle V and the PRD require ESLint, TypeScript strict mode, and a
  lint/type-check gate before build. The current `eslint-plugin-jsx-a11y` release does not declare
  ESLint 10 support, so it is omitted instead of forcing an unsupported peer combination; WCAG
  behavior remains covered by tests and Lighthouse.
- **Alternatives considered**: ESLint 9 (npm marks this version line unsupported); Biome (viable, but
  ESLint is explicitly named in the PRD); forcing the unsupported JSX-a11y plugin peer range (not
  selected because compatibility would be unverified).

## 8. Timeout, retry, and rate-limit handling pattern

- **Decision**: The typed client classifies timeout, HTTP 429, other request errors, malformed
  responses, and success; the UI maps failures to safe messages and Retry. Without a configured key,
  the client returns `not_enabled` without a network request.
- **Rationale**: This implements FR-006 through FR-008 and keeps the app usable as a no-request
  preview when local/deployment credentials are absent.
- **Alternatives considered**: A single generic error type with a string reason (rejected: harder to
  keep type-safe and to guarantee user-safe messaging without leaking raw API error bodies).

## 9. Accessibility pattern for new replies and focus

- **Decision**: A visually-hidden `aria-live="polite"` region announces when a new assistant message
  or error arrives; Send/Retry/New chat are native `<button>` elements; focus returns to the message
  input after submit, retry, or New chat.
- **Rationale**: Satisfies FR-011 and constitution Principle IV (visible focus, ARIA live region,
  full keyboard operability) using standard, dependency-free browser/ARIA primitives.
- **Alternatives considered**: `aria-live="assertive"` (rejected: would interrupt screen-reader users
  more aggressively than needed for a chat reply); a toast/notification library (unnecessary
  dependency for this requirement, rejected).

## 10. API-key handling and the "live responses not yet enabled" state

- **Decision**: `isLiveResponsesEnabled()` checks for a non-empty `VITE_GEMINI_API_KEY`; with no
  configured key, the UI presents Preview mode and no request is made. The app's existing no-backend
  browser-key flow is enabled by the user's explicit approval for local and GitHub Pages use.
- **Rationale**: Vite inlines `VITE_*` into public assets; a GitHub Actions secret does not protect the
  resulting bundle. The posted key must be considered compromised; the owner must rotate it and
  create a new Gemini-restricted authorization key, set quota controls, and restrict web referrers
  where supported before adding a replacement to `.env.local` or the Actions secret.
- **Alternatives considered**: Moving the key to a backend (rejected because the PRD explicitly
  requires static hosting/no server and the owner confirmed the browser exposure tradeoff); keeping
  preview-only mode (now rejected by user request/approval, although it remains the no-key behavior).

## 11. GitHub Pages base path and deployment

- **Decision**: `vite.config.ts` sets `base: '/CA_Chatbot/'`. The Pages workflow uses Node 20.19,
  `npm ci`, lint, type-check, tests, and build; it injects the repository `GEMINI_API_KEY` secret
  into `VITE_GEMINI_API_KEY` only for the build. Pages permissions remain limited to the approved
  three permissions.
- **Rationale**: Matches the PRD and the owner's explicit approval; the deployed client key is public
  and must be restricted/rotated accordingly.
- **Alternatives considered**: None — this is fixed by the PRD and constitution.
