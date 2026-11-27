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
- Supabase (optional - for cloud sync)

## ☁️ Cloud Sync Setup (Optional)

For cross-device account sync, connect to Supabase:

1. Create a free account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings → API to get your credentials
4. Run the migration SQL in `src/data/supabase-migration.sql` in your Supabase SQL editor
5. Run these migrations in order in the Supabase SQL editor:
   - `src/data/supabase-migration.sql`
   - `supabase-phase5-sync.sql`
   - `supabase-auth-recovery.sql`
   - `supabase-cloud-sync-fix.sql`

   The last one adds the recovery columns and the `UNIQUE(child_id)` constraint required by account upserts.
6. Copy `.env.example` to `.env` and add your Supabase credentials:

```bash
cp .env.example .env
```

Edit `.env`:
```
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR-ANON-KEY-HERE
VITE_ENABLE_CLOUD_SYNC=true
```

## 🔐 Accounts, Recovery, and Developer Access

- New accounts get a `kid########` Child ID, require a parent email, and are always queued for cloud persistence.
- Account creation requires the user to copy/acknowledge the generated Child ID.
- `/support` lets a parent submit a forgot-PIN request with the Child ID + parent email.
- The developer portal has a **Support** tab. When an ID/email pair matches an account, the developer can email a one-time password. The child must then choose a new PIN or password before continuing.
- Developer login is restricted to `addaifrederick72@gmail.com` and a strong password. Reset links are only sent to that mailbox.

Production setup in Vercel:

1. Run `src/data/supabase-migration.sql`, `supabase-phase5-sync.sql`, then `supabase-auth-recovery.sql` in the Supabase SQL editor.
2. Generate the password hash:

   ```bash
   node scripts/hash-developer-password.js "your-strong-password"
   ```

3. Add the printed `DEVELOPER_PASSWORD_HASH` / `DEVELOPER_PASSWORD_SALT`, plus `DEVELOPER_JWT_SECRET`, `DEVELOPER_EMAIL`, `SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY` as **server-only** Vercel env vars.
4. Add `GMAIL_USER`, `GMAIL_APP_PASSWORD` (Google App Password), `GMAIL_FROM`, and `APP_URL`. Gmail SMTP is handled by `api/mail.js`; browser code never sees these secrets.
5. Add the client-side `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_DEVELOPER_EMAIL` values.
6. If Gmail is not configured locally, the developer portal shows the one-time password on screen so the flow can still be tested.
7. If sync logs show HTTP 400 on `child_accounts?on_conflict=child_id`, run `supabase-cloud-sync-fix.sql`. The browser console will now print the exact PostgREST message, details, hint, and code.

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