---
name: CA Assist Project Guidelines
description: "Use when implementing or changing the CA Assist Vite/React chatbot, Gemini API client, UI, or GitHub Pages deployment."
applyTo:
  - "src/**"
  - "index.html"
  - "vite.config.*"
  - "package.json"
  - "tsconfig*.json"
  - "eslint.config.*"
  - ".github/workflows/**"
  - ".gitignore"
  - "README.md"
---

# CA Assist Project Guidelines

Treat `prd.md` as the product specification. Preserve its approved stack, model/provider, static hosting, and no-backend architecture. If the specified model, endpoint, or API behavior conflicts with current provider capabilities, report the mismatch and ask before substituting or changing the architecture.

## Architecture and API

- Build a static Vite + React + TypeScript single-page application. Use plain CSS and `react-markdown`; do not add a UI library, backend, database, serverless function, or alternate model/provider.
- Keep TypeScript strict, avoid `any`, and isolate Gemini requests in a dedicated typed API client module.
- Use the PRD's Gemini `generateContent` endpoint and the fixed `gemma-4-26b-a4b-it` model. Define the model ID once; do not add a model picker or fallback provider.
- Send the ordered conversation history and the fixed CA-focused prompt through `systemInstruction` as specified in the PRD.

## Product behavior

- Keep answers scoped to general Indian tax, GST, TDS, ITR filing, and accounting information. Politely redirect off-topic questions; do not present responses as personalized professional advice or invent tax facts.
- Preserve the chat requirements: message list, text input, Send and Enter submission, thinking state, retryable safe errors, 30-second timeout, clear rate-limit messaging for HTTP 429, Markdown replies, and New chat.
- Keep the exact persistent disclaimer: “For general information only. Consult a qualified CA for advice.”
- Make the interface responsive and keyboard-accessible, with visible focus and an ARIA live region for new replies.

## Secrets and configuration

- Read the browser key from `import.meta.env.VITE_GEMINI_API_KEY`; use `.env.local` only for local development and keep it ignored by Git. In Actions, source the build-time variable from the `GEMINI_API_KEY` repository secret.
- Never hard-code, commit, log, or expose a key in source, documentation, or build logs.
- Do not implement or deploy the API-key integration until the user explicitly confirms how to proceed. A Vite environment variable is bundled into public client-side assets and is not secret from site visitors; a GitHub Actions secret does not keep the deployed key private.
- Preserve the PRD's no-backend constraint unless the user explicitly changes it. Before enabling the browser-key flow, explain the exposure and ask the user to confirm key restrictions and accept the tradeoff.

## Quality and deployment

- Preserve the PRD targets: first load under 2 seconds on 4G and production bundle under 300 KB gzipped; measure these before claiming they are met and justify dependencies that threaten them.
- GitHub Pages is the host. Configure Vite's base path for the repository name and use GitHub Actions on pushes to `main` plus `workflow_dispatch`.
- CI should install with `npm ci`, lint and type-check before building, then upload and deploy the Pages artifact. Lint or type-check failures must stop deployment. Use only the Pages permissions specified in the PRD: `contents: read`, `pages: write`, and `id-token: write`.
- Use the repository's existing scripts and conventions where present; do not invent commands or claim a check passed unless it was run.
