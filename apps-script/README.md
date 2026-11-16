# Google Sheet + thank-you email webhook

`Code.gs` is a Google Apps Script web app. The contact form posts each submission to it. It appends a row to the Sheet and emails the submitter.

## Setup (free)

1. Create a Google Sheet. In row 1 of the first tab, add headers: `Timestamp`, `Name`, `Email`, `Description`.
2. In the Sheet, open **Extensions → Apps Script**. Replace the default code with the contents of `Code.gs`.
3. Optionally edit the email wording in `sendThankYou` (sign off with your name).
4. Click **Deploy → New deployment → Web app**:
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Authorize when prompted. The script needs access to the spreadsheet and to send email.
6. Copy the Web app URL (it ends in `/exec`).
7. Set it as `VITE_SHEETS_WEBHOOK_URL`:
   - Locally in `.env.local`: `VITE_SHEETS_WEBHOOK_URL=<url>`
   - In your Firebase/Netlify build environment, then rebuild.

After you edit the script, use **Deploy → Manage deployments → Edit → New version**. The `/exec` URL only serves the deployed version.

## Notes

- **Not SMTP:** mail is sent through your Gmail account using `MailApp`. The sender is the Google account that owns the script.
- **Quota:** about 100 emails/day on a free Google account. Beyond that the row is still saved, but the mail fails.
- **Public URL:** anyone with the URL can post to it. The script validates and length-limits input, but cannot stop deliberate spam.
- **No error feedback in the browser:** the browser can't read the response (CORS), so check the Sheet and **Apps Script → Executions** if something is missing.
