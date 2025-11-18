# Quick Start: Chrome Extension Authentication

## 🚀 How It Works (Simple Version)

```
┌─────────────────────────────────────────────────────────────┐
│                    USER FLOW                                 │
└─────────────────────────────────────────────────────────────┘

1. User clicks extension icon 🖱️
   ↓
2. Extension checks: "Do I have a token?" 🔍
   ↓
   ├─ YES ✅ → Show connected view (email + logout)
   │
   └─ NO ❌ → Show login/signup buttons
              ↓
              User clicks "Se connecter"
              ↓
              Opens: http://localhost:3000/login?ext=true
              ↓
              User logs in on website
              ↓
              Website sends token to extension 📤
              ↓
              Tab closes automatically 🚪
              ↓
              Extension now has token! ✅
              ↓
              Shows connected view
```

## 🎯 What You Need to Know

### As a User:
1. Click extension → Click "Se connecter"
2. Log in on the website that opens
3. Tab closes → You're connected!

### As a Developer:
1. The extension **never** collects credentials
2. All auth happens on your SaaS (Supabase)
3. Only the **session token** is sent to extension
4. Token is stored in `chrome.storage.sync`

## 🔧 Quick Test

### Terminal 1: Start SaaS
```bash
npm run dev
```

### Terminal 2: Build Extension
```bash
cd extension
npm run build
```

### Chrome:
1. Go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" → Select `extension/dist`
4. Click the extension icon
5. Click "Se connecter"
6. Log in when the page opens
7. Tab should close automatically
8. Extension should show "Connecté en tant que [email]"

## ✅ Success Indicators

- ✅ Extension popup shows login buttons initially
- ✅ Clicking login opens new tab with `?ext=true`
- ✅ Console shows: `[Unblank Extension] Extension ID injected: ...`
- ✅ Tab closes after successful login
- ✅ Extension popup now shows your email
- ✅ Reopening extension still shows connected state

## 🐛 Quick Debug

### Problem: Tab doesn't close after login
**Check:**
```javascript
// In browser console on login page:
window.__UNBLANK_EXTENSION_ID__  // Should show extension ID
```

### Problem: Extension doesn't detect auth
**Check:**
```javascript
// In extension popup console:
chrome.storage.sync.get(['auth_session'], console.log)
```

### Problem: Can't send message to extension
**Check:**
- Is extension loaded and enabled?
- Does manifest include your domain in `externally_connectable`?

## 📝 Key Files

```
extension/
├── src/
│   ├── popup/App.tsx           ← Main popup (login vs connected)
│   ├── popup/ConnectedView.tsx ← What you see when logged in
│   ├── utils/auth.ts           ← Auth helpers (check/save/clear)
│   ├── background/index.ts     ← Receives auth from website
│   └── content/injector.ts     ← Injects extension ID

src/
├── lib/
│   └── extension/
│       └── extensionBridge.ts  ← Sends auth to extension
├── app/(public)/
│   ├── login/page.tsx          ← Detects ?ext=true, sends auth
│   └── register/page.tsx       ← Same as login
```

## 🎨 Architecture (Super Simple)

```
┌──────────────┐                      ┌──────────────┐
│  Extension   │                      │   SaaS App   │
│              │                      │              │
│  1. Open     │ ──[New Tab]────────> │  2. Login    │
│              │                      │     Page     │
│              │                      │              │
│              │ <──[Extension ID]─── │  (injected)  │
│              │                      │              │
│              │ <──[Auth Session]─── │  3. Send     │
│              │                      │     Token    │
│  4. Save     │                      │              │
│     Token    │                      │  5. Close    │
│              │                      │     Tab      │
│  6. Show     │                      │              │
│     Email    │                      │              │
└──────────────┘                      └──────────────┘
```

## 💡 Cool Features

1. **Smart Auto-Close**: If you're already logged in on the website, the tab opens and closes instantly
2. **Cross-Device**: Login on one Chrome, works on all your Chromes (via sync)
3. **Token Expiry**: Extension checks if token expired before showing connected view
4. **No Password Storage**: Extension never sees your password, only the token

## 🚨 Important URLs

- Login: `http://localhost:3000/login?ext=true`
- Register: `http://localhost:3000/register?ext=true`
- The `?ext=true` tells the website to send the token to the extension!

## 🎓 Learn More

- Full details: See `EXTENSION_AUTH_FLOW.md`
- Implementation: See `IMPLEMENTATION_SUMMARY.md`

