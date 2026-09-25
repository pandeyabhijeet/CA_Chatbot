# CA Assist

CA Assist is a responsive chat interface for general Indian income tax, GST, TDS, ITR filing, and
accounting information. It is built as a static Vite + React + TypeScript application for GitHub
Pages, with no backend, database, or serverless functions.

> **Credential warning:** Live Gemini requests are enabled only when a non-empty key is configured.
> A `VITE_*` key is embedded in public assets and can be extracted by site visitors. The project
> owner accepted that exposure for local and Pages use. Rotate any key pasted into chat or otherwise
> shared, restrict replacement keys to Gemini, and set quotas before use.

## Features

- Chat message list, text input, Send and Enter submission, and New chat.
- Suggested questions for common Indian tax and accounting topics.
- Preview mode without a configured key; live requests use the fixed Gemini model when configured.
- Thinking, safe error, retry, timeout, and rate-limit UI states are available for the approved
	client contract and test doubles.
- Markdown replies support lists, emphasis, and tables without raw-HTML rendering.
- Responsive layout, keyboard-visible focus, screen-reader announcements, and persistent disclaimer:
	**For general information only. Consult a qualified CA for advice.**

## Technology

| Area | Choice |
| --- | --- |
| Framework | Vite, React, and strict TypeScript |
| Styling | Plain CSS |
| Markdown | `react-markdown` and `remark-gfm` |
| Approved model | `gemma-4-26b-a4b-it` only |
| Hosting | GitHub Pages |
| CI/CD | GitHub Actions |

The typed client uses only the fixed model and endpoint specified in [prd.md](prd.md), sends the
ordered conversation and fixed system instruction, and has no model/provider fallback. The app
makes no requests when no key is configured.

## Local development

Prerequisites: Node.js 20.19+ (or 22.12+) and npm.

```sh
npm ci
npm run dev
```

Without a local key, the app opens in preview mode and makes no model requests. For local live testing,
put a newly rotated, Gemini-restricted key in the Git-ignored `.env.local` as
`VITE_GEMINI_API_KEY=...`, then restart the dev server. Never paste a key into chat, commit it, or
share a screenshot that shows it. A key in the browser can be inspected by the local user.

## Quality checks

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

The production bundle target is under 300 KB gzipped and first usable load target is under 2 seconds
on 4G. Measure these targets before reporting compliance.

## GitHub Pages

The intended site URL is `https://pandeyabhijeet.github.io/CA_Chatbot/`; Vite uses the
`/CA_Chatbot/` base path. `.github/workflows/deploy.yml` runs on pushes to `main` and
`workflow_dispatch`, installs with `npm ci`, runs lint, type-check, and tests before the build, then
deploys to GitHub Pages. Add a newly rotated, Gemini-restricted key as the repository Actions secret
`GEMINI_API_KEY`. The workflow maps it to
`VITE_GEMINI_API_KEY` at build time; **the deployed key is public even though the source secret is
masked in Actions logs**. Restrict the key to Gemini, configure allowed web referrers where supported,
and set quotas before creating that secret. Lint, type-check, or test failures stop deployment.

## Credential safety

A `VITE_*` value is embedded in public client assets. A GitHub Actions secret does not keep that
value private after build and deployment. The approved local/public-browser flow therefore requires a
newly rotated Gemini authorization key, Gemini API restriction, origin/referrer restrictions where
supported, and quota monitoring. Google advises against exposing API keys in production client
applications; this project keeps its no-backend architecture only because the project owner
explicitly accepted that tradeoff. Never hard-code, commit, log, or publish an actual API key.
