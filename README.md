# ល្បែងរកពាក្យខ្មែរ · Khmer Word Search

A browser-based Khmer and English word search game built with Vite, React, and Bootstrap 5.

## Features

- Khmer syllable cluster segmentation — one grid cell = one readable Khmer cluster
- 10 word categories × 5 levels each (50 levels total)
- English version at `/play/en`
- Drag to select words (mouse, touch, and stylus via Pointer Events)
- Stars, score, coins, streak multiplier
- Hint system (3 hints per level)
- Web Audio sound effects, speech synthesis
- Confetti on level complete
- Admin mode — unlocks all levels in-session
- Custom word list support
- Download puzzle as PNG, print-friendly layout
- Dark/light theme with localStorage persistence
- Progress saved to localStorage (stars and cleared levels survive refresh)

## How to Run Locally

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`.

> **Windows PowerShell note:** If you get a script execution error, run this once:
> ```
> Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
> ```

## Build for Production

```bash
npm run build
```

Output goes to `dist/`. The GitHub Actions workflow deploys this automatically on every push to `main`.

## Project Structure

```
wordsearchkhmer/
├── index.html                   — Vite entry point
├── vite.config.js
├── package.json
├── .gitignore
├── .github/workflows/deploy.yml — auto-deploy to GitHub Pages
├── public/
│   └── admin.json               — admin credentials (not committed to git)
└── src/
    ├── main.jsx                 — app entry, Bootstrap import, HashRouter
    ├── App.jsx                  — routes: / | /play/km | /play/en
    ├── app.css                  — all game styles
    ├── data/
    │   ├── lang-km.js           — Khmer categories + language config
    │   └── lang-en.js           — English categories + language config
    ├── engine/
    │   ├── puzzle.js            — puzzle generator
    │   └── sound.js             — Web Audio sound module
    ├── hooks/
    │   └── useGame.js           — full game state (useReducer)
    └── components/
        ├── HomePage.jsx         — dashboard with category cards and progress
        ├── GamePage.jsx         — two-column game layout, all modals
        ├── GameBoard.jsx        — interactive word search grid
        ├── WinModal.jsx         — level complete screen
        ├── HelpModal.jsx        — how to play
        ├── AdminModal.jsx       — admin login
        └── CustomModal.jsx      — custom word entry
```

## Adding or Editing Words

Open [src/data/lang-km.js](src/data/lang-km.js) and find the `CATEGORIES` array. Each category looks like:

```js
{ id: 'animals', icon: '🐘', name: 'សត្វ', en: 'Animals', words: [
  { kh: 'ដំរី', en: 'elephant' },
  { kh: 'ទន្សាយ', en: 'rabbit' },
]},
```

Words with fewer than 2 syllable clusters are skipped automatically.

## Admin Mode

Create a file at `public/admin.json` (not committed to git):

```json
{ "username": "admin", "password": "yourpassword" }
```

Click the 🔐 button in the header to log in. Admin mode unlocks all levels for the current session.

## Developers

Designed & Developed by **Chroeng Ping** & **Nimith**  
*Curriculum Developer & Educational Content Organizer*
