# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Unblank is a visual bookmarking SaaS for designers and creatives. It consists of a Next.js web application and a Chrome extension for saving bookmarks from any website.

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, TailwindCSS v4
- **Backend**: Next.js API Routes, Supabase (PostgreSQL + Auth), Stripe for payments
- **AI Integration**: OpenAI GPT-4o-mini for automatic tag generation
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
│   ├── ai/           # OpenAI service implementation
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
- `links` - Saved bookmarks with metadata extraction and video support
- `folders` - Hierarchical organization with groups and subfolders
- `tags` - Manual and AI-powered automatic tagging (OpenAI integration)
- `shares` - Folder sharing with read-only or edit permissions, exit functionality
- `subscription` - Stripe integration (Free, Pro, Team plans) with usage limits
- `search` - Full-text search with tag filtering

## Chrome Extension

The extension communicates with the web app via:
- `src/lib/extension/extensionBridge.ts` - Sends auth tokens from web to extension
- `extension/src/background/index.ts` - Background service worker
- `extension/src/content/injector.ts` - Injects extension ID into web pages

Auth flow: User clicks login in extension → opens web app with `?ext=true` → web app sends session token to extension via `chrome.runtime.sendMessage()`.

### Extension Features
- Subscription-aware UI with feature gating based on plan
- User profile hook (`useUserProfile`) for subscription/usage data
- AI tag generation toggle for Pro/Team users

## API Endpoints

### Links
- `POST /api/links` - Create link with optional AI tagging
- `GET /api/links` - Get user links with pagination
- `PATCH /api/links/[linkId]` - Update link
- `DELETE /api/links/[linkId]` - Delete link
- `POST /api/links/[linkId]/generate-tags` - Generate AI tags for a link
- `POST /api/extract-metadata` - Extract metadata from URL (title, description, image)

### Tags
- `GET /api/tags` - Get user tags
- `POST /api/tags` - Create tag
- `PATCH /api/tags/[tagId]` - Rename tag
- `DELETE /api/tags/[tagId]` - Delete tag
- `POST /api/tags/merge` - Merge multiple tags
- `GET /api/tags/suggestions` - Get tag suggestions

### Subscription
- `POST /api/stripe/create-checkout-session` - Create Stripe checkout
- `POST /api/stripe/update-subscription` - Upgrade/downgrade plan
- `POST /api/stripe/customer-portal` - Access Stripe customer portal
- `POST /api/stripe/webhook` - Stripe webhook handler
- `GET /api/subscription/status` - Get current subscription status
- `GET /api/pricing` - Get dynamic pricing from Stripe

### Shares
- `POST /api/shares/invite` - Invite user to folder
- `POST /api/shares/exit` - Exit shared folder/group
- `POST /api/shares/validate` - Validate share token
- `GET /api/shares` - Get folder shares

### User
- `GET /api/me` - Get user profile, subscription, and usage data

## Subscription Plans

| Feature | Free | Pro (€6.99/mo) |
|---------|------|----------------|
| Monthly links | 50 | Unlimited |
| AI Tags | ❌ | ✅ |
| Folder Groups | ❌ | ✅ |
| Edit sharing | ❌ | ✅ |
| Share members | 15 | 30 |

## Environment Variables

Required in `.env.local`:
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY

# Stripe
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_PRICE_PRO_MONTHLY
STRIPE_PRICE_PRO_YEARLY

# OpenAI (for AI tagging)
OPEN_API_KEY

# Optional
NEXT_PUBLIC_EXTENSION_ID  # For dev
NEXT_PUBLIC_APP_URL       # For password reset
```

## Custom Commands

Claude Code commands are available in `.claude/commands/`:
- `/explore-and-plan` - EPCT workflow (Explore, Plan, Code, Test)
- `/fix-pr-comments` - Fix all PR comments automatically
- `/run-tasks` - Execute tasks from GitHub issues
- `/commit` - Smart commit with conventional format
- `/debug` - Systematic debugging workflow
- `/analyze-codebase` - Generate codebase documentation
- `/ultrathink` - Deep analysis mode
- `/update-claude` - Update this CLAUDE.md file

## Key Components

### Video Support
- `VideoCard.tsx` - Display video bookmarks (YouTube, Vimeo, etc.)
- `VideoPreviewModal.tsx` - Embedded video preview

### Image Handling
- `ImageCard.tsx` - Display image bookmarks
- `ImagePreviewModal.tsx` - Full-size image preview with metadata

### Modals
- `AddLinkModal.tsx` - Create links with AI tagging option (subscription-aware)
- `EditLinkModal.tsx` / `EditTagsModal.tsx` - Edit links and tags
- `ShareLinkModal.tsx` - Share folders with permissions
- `ExitConfirmModal.tsx` - Confirm exit from shared folders

## Language

Codebase comments and product content are in French.

## Recent Updates (2025-01-11)

### AI-Powered Auto-Tagging
- OpenAI GPT-4o-mini integration for automatic tag generation
- `GenerateAITagsUseCase` in application layer
- `OpenAITagService` infrastructure implementation
- Tags generated from image analysis with French focus

### Subscription System
- Full Stripe integration with Free, Pro, Team plans
- Usage tracking (links per month)
- Feature gating based on subscription plan
- Customer portal for subscription management
- Webhook handling for subscription events

### Extension Subscription Awareness
- `useUserProfile` hook for subscription data in extension
- Feature toggles based on plan (AI tags, groups, etc.)
- Usage limits displayed in extension UI

### Video Link Support
- Video detection for YouTube, Vimeo, Dailymotion
- VideoCard and VideoPreviewModal components
- Embedded video playback

### Share Improvements
- Exit functionality for shared folders/groups
- Email validation for invites (no self-invite, no duplicates)
- Subscription-based permission validation

### Metadata Extraction
- Server-side metadata extraction via metascraper
- Content type detection (image, video, link)
- Image format extraction
