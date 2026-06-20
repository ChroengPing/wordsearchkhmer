# 🔒 Writing Secure Code — Protecting Your Data from Hackers

> A plain-English reference for building apps that don't leak data or get broken into.
> Tailored to your stack: **Supabase, Next.js, Flutter, Telegram/Discord bots, ABA payments.**

---

## How to use this file

1. **Read it once** to understand how hackers actually get in.
2. **Paste the last section ("Instructions for the AI") into Claude Code** *before* you ask it to write code — so it builds security in from the start instead of "just making it work."
3. **Run the pre-launch checklist** before any project goes live.

---

## The 3 rules of the security mindset

Everything below comes from three simple ideas:

1. **Never trust input.** Anything sent from a phone, browser, or form can be *faked*. The client (app/website) is literally in the attacker's hands — assume they can change anything before it reaches you.
2. **Check permission every single time.** For every action, ask: *"Is this exact user allowed to touch this exact data?"* Don't assume.
3. **Defense in depth.** Use many small locks, not one big one. If one fails, the others still hold.

Think of a **bank**: it doesn't rely only on the front door. It has guards, cameras, a vault, PINs, and limits on withdrawals. Your app should be the same.

---

## The main ways hackers get in (and how to stop each)

### 1. Broken access control — *"seeing other people's data"* (THE #1 risk)

**What it is:** A logged-in user changes an ID in a request to read or edit data that isn't theirs. For your POS, this is **Store A trying to read Store B's sales** by swapping a `store_id`. This is the exact "bypass" you were imagining.

**How to stop it:**
- **Never trust a `store_id` or `user_id` sent from the client.** Always figure out *who they are* from their logged-in session on the server.
- Use **Supabase Row Level Security (RLS)** so the *database itself* blocks cross-store access — even if your app code has a bug.
- Check ownership on **every read AND every write**, not just some.

> This is the single most important thing to get right in a multi-store SaaS. Test it: log in as Store A and try to reach Store B's data. It must fail.

---

### 2. Injection (SQL injection) — *"tricking your database"*

**What it is:** An attacker types database commands into a normal form field (like a search box) to make your database run *their* code — dumping or deleting data.

**How to stop it:**
- **Never build a query by gluing strings together** (`"... WHERE name = '" + input + "'"` is the classic mistake).
- Use **parameterized queries** or the **Supabase client library** — it does this safely for you automatically.
- Treat all user input as untrusted text, never as code.

---

### 3. Bad authentication — *"breaking in / pretending to be someone"*

**How to stop it:**
- **Use Supabase Auth. Do NOT build your own login system** — it's very easy to get wrong.
- **Never store passwords as plain text.** They must be hashed (Supabase does this for you).
- **Rate-limit login attempts** so attackers can't try thousands of passwords (brute force).
- Real logout, secure password reset, and short-lived session tokens.

---

### 4. Exposed secrets — *"finding your keys lying around"*

**What it is:** API keys, database passwords, or tokens written directly in the code or accidentally uploaded to GitHub.

**How to stop it:**
- **Secrets live in environment variables only** (Vercel for the website, Railway for backends/bots). Never hardcode them.
- Add `.env` to `.gitignore` so it never reaches GitHub.
- **⚠️ Critical for Supabase:** there are two keys.
  - The **anon key** is safe to use in the app/website (RLS protects it).
  - The **service_role key bypasses ALL security.** It must **only** live on a server — **never** in your Flutter app, your website's browser code, or anywhere a user can see it.

---

### 5. Leaking too much data — *"the API says too much"*

**How to stop it:**
- Return **only the fields the screen actually needs.** Never send password hashes, internal flags, or other users' rows.
- **Hide detailed error messages** from users — a stack trace tells a hacker how your system is built. Show "Something went wrong"; log the details privately.

---

### 6. No rate limiting — *"hammering the system"*

**How to stop it:** Limit how many requests one user or IP can make (especially login, signup, and any API). This stops brute force, abuse, and scraping.

---

### 7. Cross-site scripting (XSS) — *"injecting code into your page"* (web)

**What it is:** An attacker stores malicious script (e.g. in a product name), and it runs in another user's browser.

**How to stop it:**
- React/Next.js **escapes text by default** — good.
- **Avoid `dangerouslySetInnerHTML`** with user input. If you must render HTML, sanitize it first.

---

### 8. Insecure dependencies — *"weak parts you didn't write"*

**How to stop it:** Keep packages updated, run `npm audit`, and avoid installing random/unknown packages just because they're convenient.

---

## 💵 Special: Money & payments (ABA)

Payments are the highest-value target — be strict:

- **Never trust the amount the client says was paid.** Verify it server-side, against the bank's webhook.
- **Verify webhook signatures** — confirm a payment notification is *really* from ABA and not a faker sending fake "paid" messages.
- Make payment handling **idempotent** — if the same webhook arrives twice, it must not credit/activate twice.
- **Activate license keys / credit accounts on the server only**, never based on the client saying "I paid."

---

## 🤖 Special: Your bots (Telegram / Discord)

- **Check WHO is sending a command** before doing admin actions — verify the user/chat ID against an allowlist. Don't let just anyone run admin commands.
- Keep bot tokens in **environment variables**, never in the code.
- Don't trust message content blindly — validate it like any other input.

---

## ✅ Pre-launch security checklist

```
[ ] All secrets in environment variables; .env is gitignored
[ ] Supabase service_role key is NEVER in app/website/client code
[ ] RLS enabled on EVERY table, tested with two different accounts
[ ] All database access uses parameterized queries / the Supabase client
[ ] Every input is validated on the SERVER (not just in the app)
[ ] Login uses Supabase Auth and is rate-limited
[ ] APIs return only the data the screen needs
[ ] Error messages shown to users reveal no internal details
[ ] HTTPS everywhere (no plain http)
[ ] Payment webhooks verified; payment amounts verified server-side
[ ] Bot admin commands check the sender's ID
[ ] Dependencies updated and audited
```

---

## 📋 Instructions for the AI (paste this before asking it to write code)

> Copy everything in the box below and give it to Claude Code (or any AI) *before* your build request. It tells the AI to write secure code from the start.

```
Before writing this code, follow these security rules and apply them throughout:

1. ACCESS CONTROL: Never trust any user_id, store_id, or ownership info sent
   from the client. Always derive the user's identity from their authenticated
   session on the server. Check ownership on every read and every write.

2. DATABASE: Use parameterized queries or the Supabase client only. Never build
   SQL by concatenating strings with user input. Assume Row Level Security is on.

3. SECRETS: Never hardcode keys, passwords, or tokens. Read them from environment
   variables. Never put the Supabase service_role key in any client-side code.

4. INPUT: Validate and sanitize ALL input on the server, even if the app already
   checks it. Treat all input as untrusted.

5. AUTH: Use the platform's auth (Supabase Auth). Never store plaintext passwords.
   Add rate limiting to login, signup, and sensitive endpoints.

6. DATA EXPOSURE: Return only the fields needed. Never expose password hashes,
   other users' data, or internal fields. Do not leak error details/stack traces
   to the user.

7. PAYMENTS (if any): Never trust client-reported payment amounts. Verify on the
   server, verify webhook signatures, and make processing idempotent.

After writing the code, list any security assumptions you made and anything I
still need to configure (env vars, RLS policies, etc.).
```

---

*Security is never "done" — it's a habit. Run the checklist on every project, and keep this file handy. When in doubt: don't trust the client, and check permission every time.*
