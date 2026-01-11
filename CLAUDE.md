# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Unblank is a visual bookmarking SaaS for designers and creatives. It consists of a Next.js web application and a Chrome extension for saving bookmarks from any website.

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, TailwindCSS v4
- **Backend**: Next.js API Routes, Supabase (PostgreSQL + Auth), Stripe for payments
- **State Management**: TanStack React Query v5
- **Extension**: Vite, React 19, CRXJS (Manifest V3)
- **Package Manager**: pnpm

## Commands

```bash
# Main application
pnpm dev          # Start Next.js dev server (port 3000)
pnpm build        # Production build
pnpm lint         # ESLint

# Chrome extension (from root)
pnpm ext:dev      # Start extension dev server with HMR
pnpm ext:build    # Build extension
pnpm ext:type-check

# Or from /extension directory
cd extension && pnpm dev
```

## Architecture

The project follows **Clean Architecture** with strict layer separation:

```
src/
├── domain/           # Business logic (pure, no dependencies)
│   └── {feature}/
│       ├── models/   # Domain entities and value objects
│       ├── ports/    # Repository interfaces (abstractions)
│       ├── services/ # Domain services
│       └── usecases/ # Use cases (orchestrate domain logic)
│
├── application/      # Application layer (orchestrates domain + infra)
│   └── {feature}/
│       ├── usecases/ # Application-specific use cases
│       └── ports/    # Application-level port interfaces
│
├── infra/            # Implementation layer
│   ├── db/           # Supabase client
│   └── {feature}/    # Supabase repositories implementing ports
│
├── lib/              # Factories and utilities
│   └── {feature}/    # Factory pattern for dependency injection
│
├── hooks/            # React hooks wrapping use cases with React Query
├── components/       # React components
├── contexts/         # React context providers
├── app/              # Next.js App Router pages and API routes
```

### Key Patterns

**Factory Pattern**: All use cases are instantiated via factories in `lib/{feature}/`. Factories manage singleton instances and handle dependency injection.

```typescript
// Example: src/lib/auth/authFactory.ts
AuthFactory.createSignInUseCase()
```

**Repository Pattern**: Domain defines ports (interfaces) in `domain/{feature}/ports/`, infrastructure implements them in `infra/{feature}/`.

**API Route Pattern**: All routes authenticate via `authenticateRequest()`, create use cases via factories, and use `handleApiError()` for error handling.

```typescript
// Standard API route structure
const authResult = await authenticateRequest(request);
if (!authResult.success) return authResult.error;
const useCase = SomeFactory.createUseCase(authResult.data.supabase);
const result = await useCase.execute(input);
```

### Domain Features

- `auth` - User authentication (email/password, OAuth via Google/Pinterest)
- `links` - Saved bookmarks with metadata extraction
- `folders` - Hierarchical organization with groups and subfolders
- `tags` - Manual and AI-suggested tagging
- `shares` - Folder sharing with read-only or edit permissions
- `subscription` - Stripe integration (Free, Pro, Team plans)
- `search` - Full-text search with tag filtering

## Chrome Extension

The extension communicates with the web app via:
- `src/lib/extension/extensionBridge.ts` - Sends auth tokens from web to extension
- `extension/src/background/index.ts` - Background service worker
- `extension/src/content/injector.ts` - Injects extension ID into web pages

Auth flow: User clicks login in extension → opens web app with `?ext=true` → web app sends session token to extension via `chrome.runtime.sendMessage()`.

## Environment Variables

Required in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_*` (price IDs for each plan)
- `NEXT_PUBLIC_EXTENSION_ID` (optional, for dev)

## Language

Codebase comments and product content are in French.
