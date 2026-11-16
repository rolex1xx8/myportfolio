# Form → Google Sheet + Thank-you Email Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Each contact-form submission is appended to a Google Sheet and triggers a thank-you email, free of charge.

**Architecture:** A Google Apps Script web app (bound to the Sheet) receives a JSON POST, validates it, appends a row and sends mail via `MailApp`. `EmailForm.tsx` posts to it after the Firestore save succeeds.

**Tech Stack:** Google Apps Script, React 18 + TS, Vite env var.

**Spec:** `docs/superpowers/specs/2026-11-16-form-sheet-and-email-design.md`

## Global Constraints
- No new npm dependencies; do not read or edit `.env.local`.
- Webhook URL comes from `import.meta.env.VITE_SHEETS_WEBHOOK_URL`; skip the call if unset.
- Firestore save must never be blocked or reported failed because of the webhook.
- `npm run lint` (zero warnings) and `npm run build` must pass.

## Review Focus
- Name/description starting with `=`, `+`, `-`, `@` must be stored as text (leading `'`).
- HTML in name/description must be escaped in the email body.
- Empty/invalid email or oversized fields are rejected before any write.
- Double-clicking Submit must not send twice.
- Webhook URL unset or network down: user still sees success.

---

### Task 1: Apps Script backend

**Files:**
- Create: `apps-script/Code.gs`, `apps-script/README.md`

**Interfaces:**
- Produces: HTTP POST endpoint accepting a `text/plain` JSON body `{name, email, description}`; returns JSON `{ok: boolean, error?: string}`.

- [ ] **Step 1:** In `Code.gs`, implement `doPost(e)`, plus helpers `sanitizeCell(v: string): string`, `escapeHtml(v: string): string`, and `validate(data): string | null`. Limits: name ≤100, email ≤254 and matching a basic email regex, description ≤2000, all required. Append `[new Date(), name, email, description]` via `SpreadsheetApp.getActiveSpreadsheet().getSheets()[0]`, then `MailApp.sendEmail` with plain-text and HTML bodies (short, friendly thank-you that greets by escaped name). Wrap in try/catch and return `ContentService` JSON. Use `LockService` around the append.
- [ ] **Step 2:** In `README.md`, write the setup steps: create Sheet with headers `Timestamp, Name, Email, Description`; Extensions → Apps Script; paste the code; Deploy → Web app (Execute as: Me, Access: Anyone); authorize; copy the `/exec` URL into `VITE_SHEETS_WEBHOOK_URL`; note the ~100 emails/day quota; note that redeploying a new version is needed after edits.
- [ ] **Step 3:** Verify by reading the code for the Review Focus cases (no runtime available here; the user performs the deploy test).
- [ ] **Step 4:** Commit `feat: add Apps Script backend for form sheet + email`.

### Task 2: Frontend wiring and form fixes

**Files:**
- Modify: `src/components/EmailForm.tsx`
- Create: `src/vite-env.d.ts` only if the `ImportMetaEnv` typing is missing (check first).

**Interfaces:**
- Consumes: Task 1 endpoint contract.
- Produces: `sendToSheet(payload: {name: string; email: string; description: string}): Promise<void>` (module-local, never throws).

- [ ] **Step 1:** Add `status` state (`"idle" | "sending" | "success" | "error"`). In `handleSubmit`: ignore if already `sending`; trim values; validate required fields and email format client-side; `addDoc`; on success call `sendToSheet` (not awaited for failure: catch and `console.error`) and set `success` and clear the fields; on Firestore failure set `error`.
- [ ] **Step 2:** `sendToSheet` does `fetch(url, {method: "POST", mode: "no-cors", headers: {"Content-Type": "text/plain;charset=utf-8"}, body: JSON.stringify(payload)})`, returns early if the env var is empty.
- [ ] **Step 3:** UI: disable the button and show "Sending..." while sending; show a success or error message under the form (small text, matching the existing style); change textarea `id` to `description`; add `required` attributes on inputs.
- [ ] **Step 4:** Run `npm run lint` and `npm run build`; both must exit 0.
- [ ] **Step 5:** Commit `feat: send form submissions to Google Sheet and thank-you email`. Do not stage `.firebase/` cache, `package.json` or `package-lock.json`.
