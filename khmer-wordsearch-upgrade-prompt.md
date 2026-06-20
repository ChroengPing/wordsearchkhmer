# Build Prompt — Khmer Word Search v2 (Categories + Progressive Grid)

You are improving an **existing** single-file web game: `khmer-word-search.html`
(Bootstrap 5 + vanilla JS, no build step). Do **not** rewrite from scratch — edit the
existing file and keep everything that already works.

## Current structure (already in the file — don't break it)
- `KhmerText.segment(text)` → splits a Khmer word into orthographic-syllable **clusters**
  (one cluster = one grid cell). Keep this exactly as is.
- `LEVELS` → array of `{ id, name, en, size, dirs, words:[{kh,en}] }`.
- `Puzzle.generate(words, size, dirsMode)` → builds the grid, places words in
  H / V / diagonal (+ reverse on `"hard"`), fills gaps with random consonants.
- `Game` module → render, drag-select, hints, timer, score, win modal, confetti.
- Existing features to **preserve**: drag-to-select (mouse + touch), hints, timer,
  score + bonuses, sound effects, dark mode, confetti, custom word list, Image export,
  Print, and the footer credit ("Chroeng Ping & Nimith").

---

## What to change (the two goals)

### 1) Turn levels into real CATEGORIES, and add many more of them
Replace the flat `LEVELS` array with a `CATEGORIES` array. Each category is a **theme**
with its own larger **word bank** (10–15 words), an icon, and Khmer + English names:

```js
const CATEGORIES = [
  { id:"animals", icon:"🐘", name:"សត្វ",       en:"Animals",   words:[ /* {kh,en} ... */ ] },
  { id:"nature",  icon:"🌳", name:"ធម្មជាតិ",   en:"Nature",    words:[ ... ] },
  // ...more categories (see starter list below)
];
```

Then **derive the playable levels from the categories** in order. Each category becomes
one level on the ladder, and each play session picks a **random subset** of that
category's word bank (so replaying a level gives a fresh puzzle).

### 2) Grid size must GROW as the level number increases
Stop hardcoding `size` per level. Compute it from the level index so columns/rows scale up:

```js
// level 1 → 8×8, then +1 per level, capped at 16×16
function sizeForLevel(i) { return Math.min(8 + i, 16); }
```

Also scale **direction difficulty** and **word count** with the level so later levels feel harder:

```js
function dirsForLevel(i) { return i < 2 ? "easy" : i < 4 ? "diag" : "hard"; }
function wordCountForLevel(i, bankLength) {
  return Math.min(bankLength, 5 + Math.floor(i * 0.7)); // 5 words early → more later
}
```

Pull `wordCountForLevel` random words from the category's bank, segment them, drop any
that are < 2 clusters, then call `Puzzle.generate(words, sizeForLevel(i), dirsForLevel(i))`.

---

## Detailed requirements

1. **Category/level map.** Because there will be 10+ categories now, replace the small
   "Levels" button row with a tidy responsive grid of category cards (icon + Khmer name +
   English + the computed grid size, e.g. "10×10"). Tapping a card loads that level.
   Show a small ✓ badge on categories the player has already cleared this session.

2. **Difficulty is automatic but visible.** Show the current level's grid size and
   difficulty (ងាយ / មធ្យម / ពិបាក · Easy/Medium/Hard) next to the level pill.

3. **Word count scales with the grid** via `wordCountForLevel`. Never request more words
   than the bank holds, and never let the longest word exceed the grid (the generator
   already auto-grows, but keep `sizeForLevel` ≥ longest word + 1 as a guard).

4. **Random subset per play.** Each load/Regenerate shuffles the bank and takes a fresh
   subset, so the same category replays differently.

5. **Keep mobile usable on big grids.** `fitFont()` already scales the cell font; verify a
   16×16 grid still fits and reads on a ~380px phone (shrink cell font / gap as needed,
   and allow the board container to stay square via `aspect-ratio`).

6. **Preserve all existing features** listed above. Custom-word mode should still work and
   should slot in as its own "★ ផ្ទាល់ខ្លួន / Custom" card at the end of the map.

7. **Progress flow.** The win modal's "Next" button advances to the next category in order
   (bigger grid). After the last category, show a friendly "all cleared" state instead of Next.

---

## Khmer correctness rules (important — follow strictly)
- Use only **common, correctly-spelled** Khmer words. Do **not** invent or guess spellings.
- If you are unsure whether a word is spelled correctly, **leave a `// VERIFY` comment**
  next to it rather than shipping a guess. Nimith (a native Khmer speaker) will confirm.
- Every word must segment to **≥ 2 clusters** via `KhmerText.segment` (1-cluster words
  can't be found). Quietly skip any that don't.
- English glosses are a learning aid; keep them short and accurate.

---

## Starter category list (seed words — EXPAND each to ~12, and VERIFY spellings)
These seeds are common everyday words; treat them as a starting point, fill each bank out
to ~12 words, and flag anything uncertain with `// VERIFY`.

- **🐘 សត្វ Animals:** ដំរី(elephant) ទន្សាយ(rabbit) ក្រពើ(crocodile) កណ្ដុរ(rat) ពពែ(goat) ក្របី(buffalo)
- **🌳 ធម្មជាតិ Nature:** ទន្លេ(river) សមុទ្រ(sea) ដើមឈើ(tree) ស្លឹក(leaf) ផ្កាយ(star) ខ្យល់(wind) ព្រះអាទិត្យ(sun)
- **🎨 ពណ៌ Colors:** ក្រហម(red) លឿង(yellow) បៃតង(green) ខៀវ(blue) ត្នោត(brown) ប្រផេះ(grey)
- **🍚 អាហារ Food:** បាយ(rice) នំបុ័ង(bread) សាច់(meat) បន្លែ(vegetable) ផ្លែឈើ(fruit) ទឹក(water) អំបិល(salt) ស្វាយ(mango)
- **🏫 សាលារៀន School:** សៀវភៅ(book) ប៊ិច(pen) សាលា(school) សិស្ស(student) ខ្មៅដៃ(pencil) បន្ទប់(room) មេរៀន(lesson) ក្រដាស(paper) កៅអី(chair)
- **👨‍👩‍👧 គ្រួសារ Family:** ឪពុក(father) ម្ដាយ(mother) បងប្រុស(older brother) បងស្រី(older sister) ជីដូន(grandmother) ជីតា(grandfather)
- **🧍 រាងកាយ Body:** ក្បាល(head) ភ្នែក(eye) ច្រមុះ(nose) ត្រចៀក(ear) មាត់(mouth) ស្មា(shoulder)
- **🍎 ផ្លែឈើ Fruits:** ស្វាយ(mango) ចេក(banana) ដូង(coconut) ល្ហុង(papaya) ម្នាស់(pineapple) ឪឡឹក(watermelon) ក្រូច(orange)
- **🥬 បន្លែ Vegetables:** ត្រកួន(morning glory) ស្ពៃ(cabbage) ការ៉ុត(carrot) ត្រសក់(cucumber) ខ្ទឹម(onion/garlic)  // VERIFY each
- **👕 សម្លៀកបំពាក់ Clothing:** អាវ(shirt) ខោ(trousers) សំពត់(skirt) មួក(hat) ស្បែកជើង(shoes)
- **⚽ កីឡា Sports:** បាល់ទាត់(football) បាល់ទះ(volleyball) ហែលទឹក(swimming) រត់(running)  // VERIFY
- **🌤️ អាកាសធាតុ Weather:** ភ្លៀង(rain) ផ្គរ(thunder) ព្រិល(snow) ត្រជាក់(cold) ក្ដៅ(hot)  // VERIFY 1-cluster ones

> Optional extra categories if you want a longer ladder: លេខ Numbers, ថ្ងៃ/ខែ Days&Months,
> មុខរបរ Jobs, ខេត្ត Provinces of Cambodia, គ្រឿងបន្លាស់ Household items.

---

## Acceptance checklist (verify before finishing)
- [ ] `CATEGORIES` array with **10+** themed banks; levels derived in order.
- [ ] Grid size **increases** with level index (8×8 → up to 16×16) and is shown in the UI.
- [ ] Direction difficulty and word count scale with level.
- [ ] Category map renders as responsive cards with size + cleared ✓ badges.
- [ ] Replaying/Regenerating a level gives a **different** word subset & layout.
- [ ] 16×16 grid is still readable and square on a ~380px phone.
- [ ] Sound, dark mode, hints, timer, score, confetti, Image export, Print, custom words,
      and the footer credit all still work.
- [ ] Every shipped word segments to ≥ 2 clusters; uncertain spellings marked `// VERIFY`.
- [ ] No console errors; single self-contained HTML file (CDN links allowed).
