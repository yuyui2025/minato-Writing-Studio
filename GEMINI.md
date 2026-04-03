# GEMINI.md - minato Writing Studio

This file provides foundational context and instructions for Gemini CLI when working on the **minato Writing Studio** project.

## Project Overview

**minato Writing Studio** is a Progressive Web App (PWA) designed for Japanese creative writing. It integrates outline management, a focused editor, vertical text preview, and AI-driven writing assistance (Claude) into a unified workflow.

### Core Tech Stack
- **Frontend:** React 18, TypeScript, Vite 5
- **State Management:** Zustand 5 (Single Store Pattern)
- **Data Fetching:** TanStack Query (React Query) v5
- **Backend/Auth:** Supabase (PostgreSQL + Google OAuth)
- **AI Integration:** Anthropic Claude (API proxied via Vercel Serverless Functions)
- **Text Analysis:** Rust (compiled to WebAssembly via `wasm-pack`)
- **PWA:** `vite-plugin-pwa`
- **Testing:** Vitest + React Testing Library

## Architecture & Data Flow

### 1. State Management (`src/stores/useStudioStore.ts`)
The application uses a **single Zustand store** for all global states, including UI state, core data (scenes, manuscripts), and AI results.
- `useStudio()` is a common wrapper/alias for the store.
- **Derived State:** `computeDerived()` calculates `selectedScene`, `manuscriptText`, and `wordCount` synchronously within the store.

### 2. Side Effects & Lifecycle (`src/contexts/StudioContext.tsx`)
`StudioProvider` acts as the "Effect Layer." It handles:
- Initial data loading from `localStorage`/Supabase.
- Automatic saving (1000ms debounce).
- Periodic backups (10-minute intervals).
- Dynamic loading and execution of the Rust/WASM text analyzer.
- Syncing offline changes when the user regains connectivity.

### 3. Persistence (`src/utils/storage.ts`)
- **Primary:** `localStorage` (Synchronous success/failure).
- **Secondary:** Supabase (Best-effort, eventual consistency).
- **Conflict Resolution:** Uses `updated_at` timestamps; local changes usually take precedence if newer.

### 4. AI Interaction (`src/utils/ai.ts`)
Calls are proxied through `/api/anthropic` to protect API keys.
- **Development:** Vite proxy redirects to Anthropic API using local `.env` keys.
- **Production:** Vercel serverless function (`api/anthropic.ts`) manages keys.
- **AI Mode:** `AiMode = "standard" | "byok_local" | "byok_cloud"` — controls which API key is used and whether credits are consumed.

### 6. Plan & Credit System
`api/_lib/planConfig.ts` defines per-plan limits (overridable via env vars):
- Free: 10/day, 100/month
- Pro: 100/day, 2000/month
- BYOK: unlimited

`api/_lib/credits.ts` atomically consumes credits via Supabase RPC `check_and_consume_credit()`. Credits are only consumed in `standard` mode. `src/hooks/useCredits.ts` polls every 30s on the client. `src/hooks/useUserProfile.ts` fetches the user's plan (staleTime: 10s).

### 7. BYOK (Bring Your Own Key)
Users can supply their own Anthropic API key to bypass credit consumption.

| Mode | Storage | Multi-device |
|------|---------|--------------|
| `byok_local` | Browser localStorage | No |
| `byok_cloud` | Supabase (AES-256-GCM encrypted) | Yes |

Server-side: `ALLOW_BYOK_LOCAL` / `ALLOW_BYOK_CLOUD` env vars gate actual execution. Client-side: `VITE_ENABLE_BYOK_LOCAL` / `VITE_ENABLE_BYOK_CLOUD` control UI visibility.

### 8. Supabase Migrations
`supabase/migrations/` contains 001–009 SQL files. **Must be applied in order.**
```bash
supabase login
supabase link --project-ref <ref>
supabase db push
```
All files are idempotent (`CREATE TABLE IF NOT EXISTS` / `CREATE OR REPLACE`).

### 5. Text Analysis (`rust/text-analyzer/`)
High-performance Japanese text analysis (character counts, kanji ratios, etc.) is implemented in Rust and exposed via WASM.

## Development Commands

```bash
# Core
npm run dev          # Start development server
npm run build        # Typecheck + Production build
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript compiler (noEmit)

# Testing
npm run test         # Run Vitest in watch mode
npm run test:run     # Run Vitest once
npx vitest <path>    # Run specific test file

# WASM (Only if Rust code changes)
npm run build:wasm   # Rebuild Rust analyzer to src/wasm/text_analyzer/
```

## Engineering Standards & Conventions

### 1. Coding Style
- **Strict Typing:** Always use types from `src/types.ts`. Avoid `any`.
- **Zustand Usage:** Prefer selecting specific slices from the store to minimize re-renders.
- **Component Structure:** Keep UI logic in components and side effects in `StudioProvider` or dedicated utility functions.

### 2. Testing Practices
- **Location:** All tests reside in `src/__tests__/`.
- **Mocks:** Use `src/__mocks__/` for complex modules like Supabase and WASM.
- **Requirement:** New features or bug fixes must include corresponding tests in `src/__tests__/`.

### 3. Git Workflow
- **Branching:** Name branches based on Issue number/content (e.g., `feature/123-ai-expansion`).
- **Commits:** Clear, concise messages.
- **PRs:** All work should be submitted via Pull Request.

### 4. Security
- **API Keys:** Never hardcode keys. Use `.env` and Vercel environment variables.
- **Data:** Ensure Supabase RLS (Row Level Security) is maintained for user data isolation.

## Key File Map
- `src/types.ts`: Central source of truth for all data structures.
- `src/stores/useStudioStore.ts`: Global application state.
- `src/contexts/StudioContext.tsx`: App lifecycle and side-effect orchestration.
- `src/utils/storage.ts`: Persistence logic.
- `src/utils/ai.ts`: AI assistance logic.
- `rust/text-analyzer/src/lib.rs`: Rust source for text metrics.
- `api/anthropic.ts`: Production API proxy.
