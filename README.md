# ល្បែងរកពាក្យខ្មែរ · Khmer Word Search

A browser-based Khmer word search game built with Bootstrap 5 and vanilla JavaScript. No build tools or backend required — just open `index.html`.

## Features

- Khmer orthographic cluster segmentation (one grid cell = one readable syllable)
- 5 built-in levels: Animals, Nature, Colors, Food, School
- Custom word list support (type your own Khmer words)
- Drag to select words (mouse & touch)
- Hints, scoring, and timer
- Web Audio sound effects (no external audio files)
- Dark mode by default, togglable light mode
- Confetti celebration on level complete
- Download puzzle as PNG image
- Print-friendly layout

## File Structure

```
wordsearchkhmer/
├── index.html   — HTML structure and layout
├── styles.css   — All CSS (theme tokens, board, animations, print styles)
└── script.js    — Game engine (segmenter, levels, sound, puzzle generator, UI)
```

## How to Run

Open `index.html` directly in any modern browser. No server needed.

## How to Add or Edit Levels

Open [script.js](script.js) and find the `LEVELS` array near the top. Each level looks like:

```js
{ id: 1, name: "សត្វ", en: "Animals", size: 8, dirs: "easy", words: [
  { kh: "ដំរី", en: "elephant" },
  { kh: "ទន្សាយ", en: "rabbit" },
]},
```

- `size` — grid dimension (e.g. `8` for 8×8)
- `dirs` — `"easy"` (horizontal + vertical), `"diag"` (+ diagonal), `"hard"` (all directions + reverse)
- `kh` — Khmer word, `en` — English translation shown as a hint label

## Custom Words In-Game

Click the **✏️ ពាក្យផ្ទាល់ខ្លួន** button and type one Khmer word per line. Words with only one syllable cluster are skipped automatically.

## Theme

Defaults to **dark mode**. Click the ☀️ button in the header to switch to light mode.

## Developers

Designed & Developed by **Chroeng Ping** & **Nimith**  
*Curriculum Developer & Educational Content Organizer*
