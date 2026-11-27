# Makenna Learning Lab

### Watch • Play • Learn • Grow

A progressive web application designed for children aged 5-8 to explore, learn, and grow through interactive educational content.

## 🎯 Features

- **Responsive Design**: Mobile-first, optimized for iPad and desktop
- **Offline Capable**: Works without internet connection
- **PWA Support**: Install on any device
- **Accessibility**: WCAG compliant with high contrast and reduced motion options
- **Theme System**: Light, Dark, and Auto modes
- **Smooth Animations**: Built with Framer Motion
- **Kid-Friendly UI**: Large touch targets, colorful design, Disney-inspired aesthetics
- **Child Accounts**: Secure PIN-based accounts with local storage
- **Cloud Sync**: Optional Supabase integration for cross-device sync

## 🛠️ Tech Stack

- React 18
- Vite
- Tailwind CSS
- React Router v7
- Framer Motion
- React Icons
- PWA (Workbox)
- Supabase (server-side, for cloud sync and account recovery)

## ☁️ Cloud Sync Setup

Cloud access is entirely server-side. The browser has **no** Supabase table grants and never receives credential hashes.

1. Create a project at [supabase.com](https://supabase.com).
2. Run **`supabase-schema.sql` once** in the Supabase SQL Editor. It is idempotent and replaces the older deprecated `supabase-*.sql` scripts.
3. Copy `.env.example` to `.env` for local development. Do **not** set `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` — the client no longer uses them.

```bash
cp .env.example .env
```

Serverless functions need these server-only variables:

```
DATA_STORE=supabase
SUPABASE_URL=https://YOUR-PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR-SERVICE-ROLE-KEY
DEVELOPER_JWT_SECRET=<random 48-byte base64url value>
CHILD_SESSION_SECRET=<another random 48-byte base64url value>
```

`DATA_STORE` defaults to `supabase`. TiDB Cloud MySQL-compatible mode is implemented
behind the same server-side store contract but is only selected with
`DATA_STORE=tidb` after its server-only credentials are configured. Never expose
`TIDB_PASSWORD`, `TIDB_CA`, or any other database secret with a `VITE_` prefix.

Child registration, login, credential reset, cloud sync and support requests are handled by `api/child-auth.js`, `api/child-sync.js` and `api/support.js`. Browser calls carry signed device tokens or developer session tokens.

The staged migration plan and manual TiDB setup/shadow-test steps are in
[`docs/tidb-migration-plan.md`](docs/tidb-migration-plan.md). Supabase remains
authoritative until the TiDB-backed deployment is verified and cutover is explicitly
approved.

## 🔐 Accounts, Recovery, and Developer Access

- New accounts get a `kid########` Child ID, require a parent email, and are written to Supabase by the server at registration.
- PIN/password hashes are created and verified only in serverless functions; they are never returned to the browser.
- Account creation requires the user to copy/acknowledge the generated Child ID.
- `/support` lets a parent submit a forgot-PIN request with the Child ID + parent email. A one-time code is emailed to that parent address and must be entered before the request is stored.
- The developer portal has a **Support** tab. Only verified recovery requests can be used, and issuing a one-time password signs out existing devices. The child must log in with that password and choose a new PIN or password before continuing.
- Legacy PIN/password hashes are upgraded to salted scrypt hashes automatically on the next successful verification. Developer reset links are single-use, and sign-in/recovery/tutor throttles are shared across serverless instances via Supabase.
- Developer login is restricted to `addaifrederick72@gmail.com` and a strong password. Reset links are only sent to that mailbox.
- Children already signed in on a device can keep using the app offline; signing in on a new device requires a network connection.

Production setup in Vercel:

1. Run `supabase-schema.sql` in the Supabase SQL editor (once; safe to re-run).
2. Generate the developer password hash:

   ```bash
   node scripts/hash-developer-password.js "your-strong-password"
   ```

3. Add the printed `DEVELOPER_PASSWORD_HASH` / `DEVELOPER_PASSWORD_SALT`, plus `DATA_STORE=supabase`, `DEVELOPER_JWT_SECRET`, `CHILD_SESSION_SECRET`, `DEVELOPER_EMAIL`, `SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY` as **server-only** Vercel env vars.
4. Add `GMAIL_USER`, `GMAIL_APP_PASSWORD` (Google App Password), `GMAIL_FROM`, and `APP_URL`. Gmail SMTP is handled by `api/mail.js`; browser code never sees these secrets.
5. Add only `VITE_DEVELOPER_EMAIL` and `VITE_ENABLE_CLOUD_SYNC` as client env vars. Never expose `SUPABASE_SERVICE_ROLE_KEY`, `TIDB_PASSWORD`, `TIDB_CA`, or any other database/JWT/SMTP secret with a `VITE_` prefix.
6. If Gmail is not configured locally, the developer portal shows the one-time password on screen so the flow can still be tested.

## 🎨 Branding Assets

The two root source PNGs are intentionally not committed. To regenerate PWA icons, splash screens, favicon and in-app logos from them:

```bash
powershell -ExecutionPolicy Bypass -File scripts/prepare-brand-assets.ps1
```

## 📁 Project Structure
src/
├── assets/ # Images, videos, audio, animations
├── components/ # Reusable components
│ ├── buttons/
│ ├── cards/
│ ├── layout/
│ ├── navigation/
│ ├── common/
│ └── animations/
├── pages/ # Page components
├── hooks/ # Custom React hooks
├── services/ # API and service functions
├── data/ # Static data
├── styles/ # Global styles
├── context/ # React context providers
├── utils/ # Utility functions
├── routes/ # Route configuration
├── pwa/ # PWA configuration
├── constants/ # Constants and configuration
└── config/ # App configuration


## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/makenna-learning-lab.git
cd makenna-learning-lab



npm install

npm run dev

npm run build

npm run preview