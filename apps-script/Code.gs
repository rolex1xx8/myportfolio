/**
 * Contact-form webhook: appends a row to the first sheet of the bound
 * spreadsheet and sends a thank-you email to the submitter.
 *
 * Request: POST, body = JSON string {name, email, description}
 * Response: JSON {ok: boolean, error?: string}
 */

var LIMITS = { name: 100, email: 254, description: 2000 };
var EMAIL_RE = /^[^\s@<>"',;]+@[^\s@<>"',;]+\.[^\s@<>"',;]+$/;

function doPost(e) {
  try {
    var raw = e && e.postData && e.postData.contents;
    var data = JSON.parse(raw || "{}");

    var clean = {
      name: String(data.name || "").trim(),
      email: String(data.email || "").trim(),
      description: String(data.description || "").trim(),
    };

    var error = validate(clean);
    if (error) return respond({ ok: false, error: error });

    var lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      SpreadsheetApp.getActiveSpreadsheet()
        .getSheets()[0]
        .appendRow([
          new Date(),
          sanitizeCell(clean.name),
          sanitizeCell(clean.email),
          sanitizeCell(clean.description),
        ]);
    } finally {
      lock.releaseLock();
    }

    // Only reached when the row was saved successfully.
    sendThankYou(clean);
    return respond({ ok: true });
  } catch (err) {
    console.error(err);
    return respond({ ok: false, error: "Server error" });
  }
}

/** Returns an error message, or null when valid. */
function validate(d) {
  if (!d.name || !d.email || !d.description) return "All fields are required";
  if (d.name.length > LIMITS.name) return "Name too long";
  if (d.email.length > LIMITS.email) return "Email too long";
  if (d.description.length > LIMITS.description) return "Description too long";
  if (!EMAIL_RE.test(d.email)) return "Invalid email";
  return null;
}

/** Stops Sheets from evaluating user text as a formula. */
function sanitizeCell(v) {
  return /^[=+\-@\t\r]/.test(v) ? "'" + v : v;
}

function escapeHtml(v) {
  return String(v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function sendThankYou(d) {
  var text =
    "Hi " + d.name + ",\n\n" +
    "Thanks for reaching out! I've received your message and will get back to you as soon as I can.\n\n" +
    "Your message:\n" + d.description + "\n\n" +
    "Best regards";

  var html =
    "<p>Hi " + escapeHtml(d.name) + ",</p>" +
    "<p>Thanks for reaching out! I've received your message and will get back to you as soon as I can.</p>" +
    "<p><strong>Your message:</strong></p>" +
    "<blockquote>" + escapeHtml(d.description).replace(/\n/g, "<br>") + "</blockquote>" +
    "<p>Best regards</p>";

  MailApp.sendEmail({
    to: d.email,
    subject: "Thanks for contacting me",
    body: text,
    htmlBody: html,
  });
}

function respond(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
