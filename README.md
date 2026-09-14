# Orrery

A branching writing and note-taking app. Write freely, fork alternate paths with AI, visualize your checkpoint tree.

## Stack

- **Next.js 16** (App Router, Turbopack)
- **Supabase** — Auth, Postgres (notes/checkpoints/branches), Storage
- **TipTap** — Rich markdown-style editor with wiki-links and tags
- **React Flow + elkjs** — Checkpoint/branch canvas visualization
- **Zustand** — State management
- **Framer Motion** — Subtle transitions
- **Radix UI** — Accessible component primitives
- **Dexie (IndexedDB)** — Local-first offline storage
- **OpenRouter** — AI branch generation (nvidia/nemotron-3-ultra-550b-a55b:free)

## Setup

### 1. Apply the Supabase schema

1. Go to [https://supabase.com/dashboard/project/wwvsqudgvezrucmcamdw/sql/new](https://supabase.com/dashboard/project/wwvsqudgvezrucmcamdw/sql/new)
2. Paste the contents of `supabase-schema.sql` and click **Run**

### 2. Enable OAuth providers in Supabase

1. Go to **Authentication → Providers**
2. Enable **GitHub** — add your GitHub OAuth app credentials
3. Enable **Google** — add your Google OAuth credentials
4. Set redirect URL to `http://localhost:3000/home` (dev) and your production URL

### 3. Install and run

```bash
# Install pnpm if needed
npm install -g pnpm --ignore-scripts

# Install dependencies
pnpm install

# Start dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment variables

Already configured in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://wwvsqudgvezrucmcamdw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable__ufLqMudB3z9XZD0c-xNvw_4f4ZkkFe
SUPABASE_SERVICE_ROLE_KEY=...
```

## Features

- **Sign in** — GitHub OAuth, Google OAuth, or magic link email
- **Home** — Recent notes grid (Keep Notes-inspired)
- **Editor** — TipTap rich editor with:
  - Full markdown formatting (H1–H6, bold, italic, strike, code, blockquote, lists, tasks, tables, links, images)
  - `[[wiki-links]]` between notes with autocomplete
  - `#tags` with autocomplete
  - Syntax-highlighted code blocks
  - Auto-save (800ms debounce)
- **Canvas** — React Flow checkpoint/branch tree (elkjs layout), Sudowrite-inspired
- **AI sidebar** — Ask questions about your note, generate alternate branches with streaming
- **Settings**:
  - Account (avatar from OAuth, name, email, sign out)
  - Theme (light / dark / system) — olive primary accent
  - Keyboard shortcuts — all editable, press to record, save/reset per key
  - AI — OpenRouter API key management

## Keyboard shortcuts (defaults)

| Action | Shortcut |
|--------|----------|
| New note | `Ctrl+N` |
| Save note | `Ctrl+S` |
| Toggle sidebar | `Ctrl+\` |
| Toggle canvas | `Ctrl+Shift+V` |
| Fork branch | `Ctrl+Shift+B` |
| Quick search | `Ctrl+K` |
| Open settings | `Ctrl+,` |
| Bold | `Ctrl+B` |
| Italic | `Ctrl+I` |
| Strikethrough | `Ctrl+Shift+S` |
| Heading 1 | `Ctrl+Alt+1` |
| Heading 2 | `Ctrl+Alt+2` |
| Heading 3 | `Ctrl+Alt+3` |

All shortcuts are editable in Settings → Keyboard shortcuts.
