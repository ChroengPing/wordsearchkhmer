# CLAUDE.md — Project Rules & Memory

This file holds the rules you must follow for this project. Read it fully at the
start of every session before doing anything. These rules override your default
behavior. If anything here is unclear, ask me — do not guess.

---

## 1. ASK BEFORE YOU ACT (most important rule)

Do NOT start writing code, creating files, building a website, or changing
anything until you understand what I actually want.

Before any real action you must:
- Ask me clarifying questions if there is ANY ambiguity about what I want.
- Confirm the goal, the scope, and the look/feel before touching files.
- Tell me your plan in plain words, then wait for me to say go.
- Never edit code randomly or "fix" things I didn't ask you to fix.
- If you notice another problem while working, tell me about it and ask
  before changing it. Do not silently rewrite my code.

A good move looks like: "Here's what I think you want, here are 2-3 questions,
here's my suggested approach — should I proceed?"

A bad move looks like: immediately generating a full app or rewriting files
without checking with me first.

---

## 2. KEEP A DATED WORK LOG

Maintain a file in this folder called `PROGRESS.txt`.

How it works:
- When I tell you the date (example: "today is 6/11/2026"), you create a new
  dated section in `PROGRESS.txt` and record what we did that day.
- Each entry should include: the date, what was built or changed, any decisions
  we made, and anything still pending or unfinished.
- Always append. Never delete old entries. This is our memory of the project.
- If I tell you the date and you have not updated the log yet, update it.

Format to use inside PROGRESS.txt:

    ===========================================
    DATE: 6/11/2026
    -------------------------------------------
    DONE TODAY:
    - ...
    - ...

    DECISIONS MADE:
    - ...

    STILL PENDING / NEXT TIME:
    - ...
    ===========================================

At the start of a session, read the last few entries in PROGRESS.txt so you
remember where we left off.

---

## 3. REMEMBER EVERYTHING ABOUT THE SYSTEM

You are responsible for keeping a clear picture of how this project works.

- Keep track of the tech stack, folder structure, key files, how things connect,
  config, and any important details we set up.
- If you are unsure how part of the system works, look at the actual files or
  ask me — do not assume and do not invent details.
- Before changing anything, make sure you understand how it fits with the rest
  of the system so you don't break something else.
- If we set a rule or a preference once, keep following it for the whole project.

---

## 4. WRITING & STYLE — SOUND LIKE A NORMAL HUMAN

- Do NOT use a lot of emoji. Use them rarely, or not at all, unless I ask.
- Write copy, text, comments, and UI wording the way a real person would write
  them. Avoid the robotic, over-polished "AI voice."
- No over-the-top phrases, no filler, no excessive bold or exclamation marks.
- Keep explanations clear and direct.

---

## 5. ASSETS — SUGGEST REAL RESOURCES, DON'T AUTO-GENERATE

When a design needs icons, images, fonts, or other assets:

- Do NOT just generate them with AI by default.
- Instead, suggest specific real resources I can grab them from, and tell me
  exactly which icon/font/style to use so it looks good.
- For icons, suggest sources like Lucide, Heroicons, Font Awesome, Tabler Icons,
  Phosphor, or similar — and name the specific icons that fit.
- For fonts, suggest specific Google Fonts or other free font pairings.
- For images, suggest sources like Unsplash, Pexels, or similar, with a clear
  description of what to search for.
- The goal is a clean, professional, hand-made look — not something that
  obviously looks auto-generated.

If AI-generated assets are genuinely the better choice for a case, you can say
so, but explain why and let me decide. Default to real resources.

---

## 6. ALWAYS SUGGEST THE BEST OPTION + EXTRA IDEAS

- Don't just do the first thing that works. Tell me what you think the best
  option is and why.
- Offer 1-2 alternative ideas or improvements I might not have thought of.
- If you see a smarter, cleaner, or cheaper way to do something, mention it.
- Be honest about trade-offs (speed vs. quality, simple vs. flexible, etc.).

---

## 7. HONESTY

- If you are not sure about something, say so. Don't present a guess as a fact.
- Don't invent file names, library names, or details. If you need to check,
  check the real files or ask me.
- It's better to ask than to assume.

---

## 8. TRACK WHO MADE EACH CHANGE

This project can be worked on by more than one person (e.g. Nimith, Chroeng Ping,
or anyone else added later). You must track who made what change and when.

Rules:
- At the start of a session, the person will tell you their name. Remember it for
  the whole session and use it in all log entries.
- If no one tells you their name, ask: "Who am I working with today?"
- In PROGRESS.txt, every entry must include a "CHANGED BY" line with the person's
  name and the date.
- If two people make changes on the same day in separate sessions, create two
  separate entries in PROGRESS.txt — one per person.
- In the DONE TODAY section, write it in a personal way, e.g.:
    "Nimith added dark mode" or "Chroeng Ping updated the word list"
  Not just "dark mode was added."
- This makes it easy to look back and know exactly who did what and when.

Example entry format:

    ===========================================
    DATE: 2026-06-20
    CHANGED BY: Nimith
    -------------------------------------------
    DONE TODAY:
    - Nimith split index.html into index.html / styles.css / script.js
    - Nimith set dark mode as the default theme

    DECISIONS MADE:
    - ...

    STILL PENDING / NEXT TIME:
    - ...
    ===========================================

---

## QUICK CHECKLIST (run this in your head before acting)

1. Do I fully understand what the person wants? If not -> ask.
2. Do I know who I am working with today? If not -> ask their name first.
3. Have I told them my plan and the best option + alternatives?
4. Did they say the date? If yes -> update PROGRESS.txt with their name.
5. Am I about to edit something they didn't ask me to touch? If yes -> ask first.
6. Am I keeping emoji minimal and writing like a human?
7. For assets, am I suggesting real resources instead of auto-generating?
8. After the work, did I log it in PROGRESS.txt with the correct person's name?
