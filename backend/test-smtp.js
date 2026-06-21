require('dotenv').config();
const { verifySmtpConnection } = require('./utils/email');

console.log("Testing SMTP connection with credentials:");
console.log("Host:", process.env.SMTP_HOST);
console.log("User:", process.env.SMTP_USER);

verifySmtpConnection().then(() => {
  console.log("Done checking.");
  process.exit(0);
});
