# Contact form → Google Sheet + thank-you email (short design)

## Intent
Each contact-form submission is saved to a Google Sheet (in addition to Firestore) and the submitter gets a thank-you email. Must be free.

## Goals / non-goals / anti-goals
- Goals: Sheet row per submission; thank-you email to the address given; no paid plan; no secrets in the browser bundle.
- Non-goals: true SMTP protocol, custom sender domain, admin notification email, replacing Firestore.
- Anti-goals: a failure in Sheet/email must never lose the Firestore save or show the user a false "failed".

## Approaches
1. Firebase Cloud Function (Firestore trigger) - rejected: needs Blaze billing.
2. Netlify Function - rejected: ties hosting to Netlify.
3. **Google Apps Script web app (chosen by user, free).** Caveat: sends via Gmail (`MailApp`), not SMTP. Sender is the Google account that owns the script; ~100 emails/day on a free account.

## Design
- `apps-script/Code.gs` (committed, pasted by the user into a script bound to the Sheet): `doPost` parses the JSON body, validates name/email/description (required, email format, length caps), neutralises spreadsheet formula injection (values starting with `= + - @` get a leading `'`), appends `[timestamp, name, email, description]`, then sends the HTML-escaped thank-you email, and returns JSON.
- `EmailForm.tsx`: after the Firestore `addDoc` succeeds, POST to `VITE_SHEETS_WEBHOOK_URL` using `fetch` with `mode: "no-cors"` and a `text/plain` body (Apps Script doesn't answer CORS preflight, so the response is unreadable). A webhook failure is logged only. Also fixes the known form issues: client validation, success/error message, submit-disabled while sending, `id="description"` matching its label.
- Config: `VITE_SHEETS_WEBHOOK_URL` is added by the user to `.env.local` and the Firebase/Netlify build env. I won't touch `.env.local`. The code skips the webhook if the variable is unset.
- Setup steps for the user (create Sheet, paste script, deploy as Web app "Anyone", authorize, copy URL) go in `apps-script/README.md`.

## Risks
- The web-app URL is public, so anyone can post to it. Mitigation: server-side validation and length caps. Residual risk: spam can burn the daily email quota.
- Because of `no-cors`, the browser can't confirm the Sheet/email step worked. Check the Sheet and the Apps Script execution log.

## Left to the builder
Exact email wording (short, friendly, signed with the site owner's name) and the Sheet column headers.
