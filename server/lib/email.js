// Simulated email delivery for development: logs the message to the server console
// instead of sending a real email. Swap the body of sendEmail() for a real provider
// (nodemailer + SMTP, SendGrid, etc.) when you have credentials — every call site
// elsewhere in the codebase stays the same.
function sendEmail({ to, subject, text }) {
  console.log(
    `\n--- [DEV] Simulated email ---\nTo: ${to}\nSubject: ${subject}\n\n${text}\n------------------------------\n`
  );
}

module.exports = { sendEmail };
