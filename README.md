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
- React Router v6
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
5. Copy `.env.example` to `.env` and add your Supabase credentials:

```bash
cp .env.example .env
```

Edit `.env`:
```
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR-ANON-KEY-HERE
VITE_ENABLE_CLOUD_SYNC=true
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