# Chrome Extension Authentication Flow

This document describes the complete authentication flow between the Unblank Chrome Extension and the SaaS web application.

## Overview

The authentication flow allows users to authenticate through the SaaS web application and automatically sync their session with the Chrome extension. The extension checks for an existing session on startup and provides appropriate UI based on the authentication state.

## Architecture

### Components

1. **Extension Popup** (`extension/src/popup/App.tsx`)
   - Entry point when user clicks the extension icon
   - Checks authentication status on load
   - Shows login/signup buttons or connected view

2. **Connected View** (`extension/src/popup/ConnectedView.tsx`)
   - Displayed when user is authenticated
   - Shows user email and logout button

3. **Extension Auth Utility** (`extension/src/utils/auth.ts`)
   - Manages authentication state in Chrome storage
   - Provides functions to check auth status, get/save/clear sessions

4. **Background Script** (`extension/src/background/index.ts`)
   - Listens for auth messages from the SaaS app
   - Saves sessions and notifies extension components

5. **Content Script Injector** (`extension/src/content/injector.ts`)
   - Injects extension ID into SaaS pages
   - Enables communication from web page to extension

6. **SaaS Extension Bridge** (`src/lib/extension/extensionBridge.ts`)
   - Detects if page opened from extension (`?ext=true`)
   - Sends session data to extension
   - Auto-closes tab after successful auth

## Authentication Flow

### 1. User Opens Extension (Not Authenticated)

```
┌─────────────┐
│   User      │
│  clicks     │
│  extension  │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│  Popup Opens        │
│  - Checks storage   │
│  - No session found │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Shows Login/Signup │
│  Buttons            │
└─────────────────────┘
```

### 2. User Clicks "Se connecter" (Login)

```
┌─────────────┐
│  User       │
│  clicks     │
│  login btn  │
└──────┬──────┘
       │
       ▼
┌──────────────────────────┐
│  Extension opens new tab │
│  URL: /login?ext=true    │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│  Content Script Injects  │
│  Extension ID into page  │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│  SaaS Login Page         │
│  - Detects ?ext=true     │
│  - If already logged in: │
│    → Send session to ext │
│    → Close tab           │
│  - If not logged in:     │
│    → Show login form     │
└──────────────────────────┘
```

### 3. User Authenticates on SaaS

```
┌──────────────┐
│  User enters │
│  credentials │
│  and submits │
└──────┬───────┘
       │
       ▼
┌──────────────────────────┐
│  SaaS authenticates user │
│  via Supabase            │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│  Login page detects      │
│  ?ext=true param         │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│  extensionBridge sends   │
│  session to extension:   │
│  chrome.runtime.         │
│  sendMessage(extId, {    │
│    type: 'AUTH_SESSION', │
│    session: {...}        │
│  })                      │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│  Background script       │
│  receives message        │
│  - Saves to storage      │
│  - Notifies popup        │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│  Tab auto-closes         │
│  after 500ms             │
└──────────────────────────┘
```

### 4. Extension Updates UI

```
┌──────────────────────────┐
│  Popup receives          │
│  AUTH_SUCCESS message    │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│  Updates isAuth state    │
│  to true                 │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│  Renders ConnectedView   │
│  - Shows user email      │
│  - Shows logout button   │
└──────────────────────────┘
```

### 5. User Opens Extension (Already Authenticated)

```
┌─────────────┐
│  User       │
│  clicks     │
│  extension  │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│  Popup Opens        │
│  - Checks storage   │
│  - Session found    │
│  - Token not expired│
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Shows ConnectedView│
│  immediately        │
└─────────────────────┘
```

### 6. User Logs Out

```
┌─────────────┐
│  User       │
│  clicks     │
│  logout btn │
└──────┬──────┘
       │
       ▼
┌──────────────────────────┐
│  clearSession() called   │
│  - Removes from storage  │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│  Updates isAuth to false │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│  Shows Login/Signup      │
│  buttons again           │
└──────────────────────────┘
```

## Session Data Structure

```typescript
interface AuthSession {
  accessToken: string;      // Supabase access token
  refreshToken: string;     // Supabase refresh token
  expiresAt: number;        // Unix timestamp
  userId: string;           // User's unique ID
  email: string;            // User's email
}
```

## Storage

Sessions are stored in Chrome's `chrome.storage.sync` under the key `auth_session`. This allows the session to sync across devices where the user is logged into Chrome.

## Security Considerations

1. **Externally Connectable**: The extension manifest specifies which domains can communicate with it:
   - `http://localhost:3000/*` (development)
   - `https://*.unblank.app/*` (production)

2. **Extension ID**: The extension ID is injected into the page at `document_start` to enable communication. This is only done on trusted domains.

3. **Token Expiration**: The extension checks if the token is expired before considering the user authenticated.

4. **HTTPS Only**: In production, all communication happens over HTTPS.

## Environment Variables

### SaaS App

Create a `.env.local` file in the root:

```bash
# Optional: Set a fixed extension ID for development
NEXT_PUBLIC_EXTENSION_ID=your-extension-id-here
```

If not set, the extension will inject its ID dynamically.

## Development Setup

### 1. Build the Extension

```bash
cd extension
npm install
npm run build
```

### 2. Load Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `extension/dist` folder

### 3. Get Extension ID

After loading the extension, copy the Extension ID from the extensions page.

### 4. Configure SaaS App (Optional)

Add the extension ID to your `.env.local`:

```bash
NEXT_PUBLIC_EXTENSION_ID=your-extension-id
```

### 5. Start SaaS App

```bash
npm run dev
```

## Testing the Flow

1. **Open the extension popup** - Should show login/signup buttons
2. **Click "Se connecter"** - Opens localhost:3000/login?ext=true
3. **Log in with credentials** - Tab should close automatically after login
4. **Open extension popup again** - Should show connected view with email
5. **Click logout** - Should return to login/signup view

## Troubleshooting

### Tab doesn't close after login

- Check browser console for errors
- Ensure extension ID is being injected (check `window.__UNBLANK_EXTENSION_ID__`)
- Verify `externally_connectable` in manifest includes your domain

### Session not persisting

- Check Chrome storage in DevTools: `chrome.storage.sync.get(['auth_session'])`
- Verify token expiration time
- Check background script logs for errors

### Can't communicate with extension

- Verify extension is loaded and active
- Check that domain is in `externally_connectable` matches
- Ensure content script injector is running (check console logs)

## Files Modified/Created

### Extension Files

- `extension/src/popup/App.tsx` - Updated with auth flow
- `extension/src/popup/ConnectedView.tsx` - New connected view
- `extension/src/utils/auth.ts` - New auth utility
- `extension/src/background/index.ts` - Updated to handle auth messages
- `extension/src/content/injector.ts` - New injector script
- `extension/src/types/index.ts` - Updated with auth types
- `extension/public/manifest.json` - Updated with permissions and external connectivity

### SaaS Files

- `src/lib/extension/extensionBridge.ts` - New bridge for extension communication
- `src/app/(public)/login/page.tsx` - Updated to send session to extension
- `src/app/(public)/register/page.tsx` - Updated to send session to extension
- `src/lib/auth/useAuth.ts` - Updated to expose user and session state

## Future Enhancements

1. **Automatic Token Refresh**: Implement token refresh in the background
2. **Biometric Authentication**: Add support for WebAuthn/fingerprint
3. **Multiple Accounts**: Support switching between multiple accounts
4. **Session Sync**: Real-time session sync across tabs
5. **Offline Support**: Cache necessary data for offline functionality

