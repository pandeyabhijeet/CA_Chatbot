# CA Assist

CA Assist is a planned conversational assistant for general Indian income tax, GST, TDS, ITR filing, and accounting questions. It is intended for individuals and small businesses seeking clear, CA-style general information.

> **Project status:** This repository is currently at the specification stage. The Vite application and GitHub Pages workflow have not yet been scaffolded, so the commands and deployment details below describe the planned setup.

## Product goals

- Provide reliable, professional, domain-scoped answers.
- Use only the approved Google AI Studio model, `gemma-4-26b-a4b-it`, through the Gemini API.
- Remain a static, maintainable Vite + React + TypeScript application, with no backend, database, or serverless functions.
- Build and deploy to GitHub Pages through GitHub Actions.

## Planned features

- Chat message list, text input, and Send button; Enter also submits.
- Send the conversation history to the Gemini `generateContent` endpoint with a fixed CA-focused system instruction.
- Politely redirect off-topic questions to Indian tax and accounting topics.
- Show a “Thinking...” state, retryable safe errors, a 30-second request timeout, and a clear rate-limit message for HTTP 429.
- Render assistant replies as Markdown, including lists, bold text, and tables.
- Provide a New chat action and a responsive mobile/desktop layout.
- Keep this disclaimer visible: **For general information only. Consult a qualified CA for advice.**

Answers are for general information and are not a substitute for advice from a qualified Chartered Accountant.

## Planned technology

| Area | Choice |
| --- | --- |
| Framework | Vite, React, and TypeScript (strict mode) |
| Styling | Plain CSS |
| Markdown | `react-markdown` |
| Model | `gemma-4-26b-a4b-it` |
| API | Gemini `generateContent` REST endpoint, called with `fetch` |
| Hosting | GitHub Pages |
| CI/CD | GitHub Actions |

The model identifier should live in one constant. The UI will not provide a model picker or alternate provider. The typed Gemini API client should be isolated in its own module and avoid `any`.

## API key security

The specification proposes reading `VITE_GEMINI_API_KEY` in the browser and providing it at build time from a `GEMINI_API_KEY` GitHub Actions secret. **A Vite `VITE_*` value is embedded in public client-side assets; a GitHub Actions secret does not keep it private after the build.**

Accordingly, API-key integration and deployment are paused pending explicit approval of how to handle this exposure. Do not commit a key or add it to source, documentation, or build logs. If the client-side approach is later approved, use applicable API-key restrictions and monitor quotas; preserve the no-backend constraint unless the product requirements are explicitly changed.

## Local development

Once the application scaffold is present, the planned local workflow is:

1. Use Node.js 20 or later.
2. Install dependencies with `npm ci`.
3. Start the Vite development server with `npm run dev`.

The eventual local API configuration is intended to use an ignored `.env.local` file. Do not add a real key until the API-key approach is approved. These commands are not available until the app and its package scripts have been added.

## GitHub Pages deployment

The intended site URL is `https://pandeyabhijeet.github.io/CA_Chatbot/`. Configure Vite's `base` as `/CA_Chatbot/` and use GitHub Actions as the Pages source.

The planned workflow is `.github/workflows/deploy.yml`, triggered by pushes to `main` and `workflow_dispatch`. It should install with `npm ci`, lint and type-check before building, upload the `dist` artifact, and deploy it with the Pages actions. A lint or type-check failure must stop deployment. The intended workflow permissions are `contents: read`, `pages: write`, and `id-token: write`.

## Quality targets

- First load under 2 seconds on a 4G connection.
- Production bundle under 300 KB gzipped.
- WCAG 2.1 AA: keyboard navigation, visible focus, and an ARIA live region for new replies.
- 30-second API timeout and clear HTTP 429 handling.
- No API key committed to the repository.

Measure performance and accessibility before claiming these targets are met.

## Acceptance checks

- `npm run dev` starts the app after the scaffold is implemented.
- The Pages workflow completes successfully on a push to `main`.
- The deployed site has no broken assets.
- A salaried ITR due-date question gets a relevant CA-style response.
- An off-topic question, such as a recipe request, receives a polite redirect.
- The disclaimer remains visible at mobile and desktop sizes.
- No API key appears in committed source or public documentation.
