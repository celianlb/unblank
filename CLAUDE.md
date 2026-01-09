# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Unblank is a bookmark management SaaS application built with Next.js 16 (App Router), featuring a companion Chrome extension for quick link saving. The architecture follows Domain-Driven Design (DDD) principles with clean separation between domain logic, application services, and infrastructure.

## Commands

### Main Application
```bash
npm run dev           # Start Next.js dev server (http://localhost:3000)
npm run build         # Production build
npm run start         # Start production server
npm run lint          # Run ESLint
```

### Chrome Extension
```bash
npm run ext:dev       # Build extension with watch mode
npm run ext:build     # Production build for extension
npm run ext:type-check # Type-check extension code only
```

The extension has its own package.json in `/extension` with separate dependencies. You can also run commands directly:
```bash
cd extension
npm run dev           # Vite dev mode
npm run build         # TypeScript compile + Vite build
```

## Architecture

### Layered Architecture (DDD Pattern)

The codebase follows a strict layered architecture with dependency inversion:

1. **Domain Layer** (`/src/domain`) - Pure business logic, no external dependencies
   - Models: `User.ts`, `Link.ts`, `Tag.ts`, `Folder.ts`, `Group.ts`, `Share.ts`
   - Ports (interfaces): `AuthRepository.ts`, `LinkRepository.ts`, `TagRepository.ts`, etc.
   - Services: `AuthService.ts` - orchestrates business rules
   - UseCases: `SignInUseCase.ts`, `SignUpUseCase.ts`, `UpdateProfileUseCase.ts`, etc.

2. **Application Layer** (`/src/application`) - Use case orchestration
   - Application-specific services: `AvatarUrlService.ts`
   - UseCases that bridge domain and infrastructure: `UploadAvatarUseCase.ts`

3. **Infrastructure Layer** (`/src/infra`) - External service implementations
   - Supabase repositories implementing domain ports: `SupabaseAuthRepository.ts`, `SupabaseLinkRepository.ts`, etc.
   - Payment service: `StripePaymentService.ts`
   - Storage services: `SupabaseStorageService.ts`, `SupabaseAvatarStorageService.ts`

4. **Presentation Layer** (`/src/app`, `/src/components`)
   - Next.js App Router pages and layouts
   - React components with TanStack React Query for state management
   - Custom hooks: `useLinks.ts`, `useFolders.ts`, `useTags.ts`, `useSearch.ts`

### Factory Pattern

Services are created via singleton factories, not direct instantiation:
- `AuthFactory.ts` - Creates auth-related services
- `LinkFactory.ts`, `TagFactory.ts`, `FolderFactory.ts`, `SearchFactory.ts`, `ShareFactory.ts`
- Always use factories to get service instances for consistency and dependency injection

### Path Alias

The codebase uses `@/*` as an alias for `./src/*` (configured in tsconfig.json).

## Technology Stack

### Core
- **Next.js 16.0.7** with App Router
- **React 19.2.0**
- **TypeScript 5** (strict mode)
- **Tailwind CSS v4** with PostCSS

### Data & State
- **TanStack React Query 5** - Server state management, caching, synchronization
- **Supabase** - PostgreSQL, Auth, Real-time, Storage
  - Server-side client: `src/lib/supabase/server.ts`
  - Client-side client: `src/lib/supabase/client.ts`

### Payments & External Services
- **Stripe** - Subscription management via webhook events
- **Metascraper** - Webpage metadata extraction (title, description, image)
- **Sharp** - Server-side image processing

### Extension Stack
- **Vite 7** with @crxjs/vite-plugin
- **React 19** with TypeScript
- **Tailwind CSS v4**
- **Manifest v3** Chrome Extension

## Database & Infrastructure

### SQL Files (Root Directory)
- `db.sql` - Core schema (users, links, tags, folders, groups, shares)
- `rls.sql` - Row-Level Security policies for multi-tenancy
- `triggers.sql` - Database triggers
- `indexes.sql` - Performance indexes
- `functions.sql` - PostgreSQL functions
- `edge-functions.sql` - Supabase Edge Functions

### API Routes

Key API endpoints in `/src/app/api`:
- Auth: `/api/auth/reset-password`
- Links: `/api/links`, `/api/links/[linkId]`, `/api/links/[linkId]/tags`
- Tags: `/api/tags`, `/api/tags/[tagId]`, `/api/tags/merge`, `/api/tags/suggestions`
- Folders: `/api/folders/[folderId]`, `/api/folders/[folderId]/move`
- Search: `/api/search`, `/api/search/unified`
- Subscription: `/api/subscription/status`
- Utilities: `/api/proxy-image`, `/api/extract-metadata`

All API routes include CORS headers (configured in `next.config.ts`) to allow communication with the Chrome extension.

## Chrome Extension Architecture

### Key Difference: Separate Build System

The extension is a **separate Vite project** in `/extension` with its own dependencies, NOT part of the Next.js build. The tsconfig.json explicitly excludes `/extension` from the main build.

### Extension Components

1. **Popup** (`/extension/src/popup`) - Main UI when clicking extension icon
2. **Background** (`/extension/src/background`) - Service worker for persistent tasks
3. **Content Scripts** (`/extension/src/content`) - Scripts injected into web pages
4. **Utils** (`/extension/src/utils`) - Auth, API, storage, messaging helpers

### Extension Authentication Flow

The extension uses a **non-credential-based auth flow**:

1. User clicks extension → sees login/signup buttons if not authenticated
2. Clicking login opens `http://localhost:3000/login?ext=true` in new tab
3. Content script injects extension ID into page: `window.__UNBLANK_EXTENSION_ID__`
4. User logs in via Supabase on the SaaS app
5. `extensionBridge.ts` detects `?ext=true` param and extension presence
6. SaaS sends session token to extension via `chrome.runtime.sendMessage()`
7. Background script saves token to `chrome.storage.sync`
8. Tab auto-closes after 500ms
9. Extension popup shows connected view with user email

**Key files:**
- SaaS side: `src/lib/extension/extensionBridge.ts`
- Extension side: `extension/src/utils/auth.ts`, `extension/src/background/index.ts`
- Documentation: `EXTENSION_AUTH_FLOW.md`, `QUICK_START.md`

### Extension Manifest

Located at `extension/public/manifest.json`:
- Manifest v3
- Permissions: `storage`, `activeTab`, `scripting`, `tabs`
- `externally_connectable`: Allows `localhost:3000` and `*.unblank.app` to communicate

## Important Configuration

### next.config.ts
- Remote image patterns: Google Photos (`lh3.googleusercontent.com`) and Supabase (`*.supabase.co`)
- CORS headers on all `/api/:path*` routes for extension communication
- Externalized native packages: `re2` (for Turbopack compatibility)

### Environment Variables

The app reads environment variables via `src/config/env.ts`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_EXTENSION_ID` (optional, for fixed extension ID in dev)

## Key Development Patterns

### When Adding New Features

1. **Domain First**: Start by defining domain models and ports (interfaces) in `/src/domain`
2. **Use Cases**: Create use cases that orchestrate domain services
3. **Infrastructure**: Implement repository interfaces in `/src/infra` (usually Supabase)
4. **Factory**: Add factory methods if creating new services
5. **Presentation**: Create hooks in `/src/hooks` that use TanStack Query to call use cases
6. **UI**: Build React components in `/src/components`

### Authentication

All auth flows use:
- `AuthService` (domain layer) for business rules
- `SupabaseAuthRepository` (infrastructure) for actual auth operations
- Custom hooks (`useAuth`, etc.) for React integration
- Supabase session stored in cookies (server-side) and managed client-side

### State Management

- Use TanStack React Query for all server state
- Custom hooks wrap query logic: `useLinks()`, `useFolders()`, `useTags()`
- Context providers only for UI state, not server data
- Query keys are consistent: `['links']`, `['folders']`, `['tags', tagId]`

### Subscription & Payments

- Stripe handles all payments via checkout sessions
- Webhooks process subscription lifecycle events
- `StripePaymentService` in `/src/infra/payment` handles Stripe API calls
- User subscription status checked via `/api/subscription/status`

## Testing

Currently, there is no test setup in the project. Tests would need to be added with a testing framework (Jest, Vitest, etc.) if needed.

## Directory Structure Overview

```
/
├── src/                    # Main Next.js application
│   ├── app/               # Next.js App Router (pages, layouts, API routes)
│   ├── components/        # React components
│   ├── domain/           # Pure business logic (DDD)
│   ├── application/      # Use cases and application services
│   ├── infra/            # External service implementations
│   ├── lib/              # Factories, utilities, configs
│   ├── hooks/            # Custom React hooks
│   ├── contexts/         # React context providers
│   └── providers/        # Provider setup
├── extension/             # Chrome extension (separate Vite project)
│   ├── src/
│   │   ├── popup/        # Extension popup UI
│   │   ├── background/   # Service worker
│   │   ├── content/      # Content scripts
│   │   └── utils/        # Extension utilities
│   ├── public/           # manifest.json, icons
│   └── vite.config.ts    # Extension build config
├── db.sql, rls.sql, etc. # Database schema files
├── next.config.ts         # Next.js configuration
├── tsconfig.json         # TypeScript config (excludes extension)
└── EXTENSION_AUTH_FLOW.md # Extension auth documentation
```

## Common Patterns to Follow

### Repository Pattern
Always use repositories through their interfaces defined in `/src/domain`. Never import Supabase clients directly in components or pages.

### Error Handling
- Custom error classes in domain layer (e.g., `AuthError`)
- Proper error propagation through all layers
- API routes return appropriate HTTP status codes

### Multi-Tenancy
All database operations use Supabase Row-Level Security (RLS) policies to isolate user data. Always ensure queries are scoped to the authenticated user.

### Metadata Extraction
When saving links, use the metascraper utility to automatically extract title, description, and preview images from URLs. See `/api/extract-metadata` for reference.

## Notes for AI Assistants

- When modifying domain layer code, ensure no external dependencies leak in
- Always use factories to create service instances
- Remember the extension is a separate build - changes require rebuilding via `npm run ext:build`
- CORS is configured for extension communication - don't remove these headers
- The `?ext=true` query parameter is critical for extension auth flow
- Use TanStack Query for all data fetching - avoid useState for server data
- Follow existing patterns for new features (factory → repository → use case → hook → component)
- Never build after an edit if the user didn't asked