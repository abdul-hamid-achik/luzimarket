### Cursor setup for Luzimarket

This guide configures Cursor to work smoothly with this Next.js + TypeScript monorepo.

#### 1) Install and sign in
- Install Cursor and sign in with your account.

#### 2) Add LLM provider keys (Cursor app Settings)
Use any of the following; at least one is required:
- OpenAI: add your API key. Good general-purpose coding and search models.
- Anthropic (Claude): strong reasoning for larger refactors and test triage.
- OpenRouter: convenient multi-provider routing (ensure your account has model access).
- Google (Gemini) / Mistral: optional, useful for speed or cost.

Recommended pairing
- Chat/Reasoning: Claude Sonnet or OpenAI GPT-4.1/4o
- Inline/Small edits: 4o-mini, GPT-4.1-mini, Gemini Flash

Note: Provider selection is controlled in the Cursor client; this repo cannot enforce a model. The `.cursorrules` file only gives guidance.

#### 3) Pull app environment
- Copy `.env.local` from your team vault or run:
  - `vercel link --yes`
  - `vercel env pull`
- Or create `.env.local` manually matching `README.md` → Environment Variables.
- For optional AI images, set: `OPENAI_SECRET_KEY=sk-...`

#### 4) Install and run
```bash
npm install
npm run db:setup   # push + seed
npm run dev
```

#### 5) Testing within Cursor
- Run Playwright tests: `npm test`
- Artifacts (JSON + JUnit) are written under `tmp/` (see `playwright.config.ts`).
- For UI mode or headed runs, use the scripts in `e2e/README.md`.

#### 6) Recommended Cursor settings
- Enable Background Agents and Terminal tool access.
- Prefer non-interactive CLI flags; avoid pagers (pipe to `| cat` when needed).
- Limit context ingestion by honoring `.cursorignore` (already added).
- Use the `Rules` panel to confirm `.cursorrules` is loaded for this workspace.

#### 7) Workflow tips
- After edits affecting runtime/types: `npm run build` or `npm test` in background.
- Keep edits small and explicit. Follow TypeScript strictness and the code style described in `.cursorrules`.
- For image generation code paths, guard for missing `OPENAI_SECRET_KEY`.

Troubleshooting
- Rate limits/model access errors: switch provider or pick a smaller model.
- Context too large: update `.cursorignore` or narrow files you open.
- Environment missing: run `vercel env pull` or update `.env.local`.