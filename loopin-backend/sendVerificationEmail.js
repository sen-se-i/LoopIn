const nodemailer = require('nodemailer');

// Temporary store (should use DB in production)
const codes = {};

function generate6DigitCode() {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
}

function sendVerificationEmail(userEmail) {
  const code = generate6DigitCode();
  codes[userEmail] = code; // Store code mapped to email

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'mymirrordimension@gmail.com',
      pass: 'vflb lhuc gclj hnht', // Use Gmail App Password
    },
  });

  const mailOptions = {
    from: 'LoopIn <your_email@gmail.com>',
    to: userEmail,
    subject: 'Your LoopIn Verification Code',
    html: `
      <p>Hi there!</p>
      <p>Your verification code is:</p>
      <h2 style="color:#1a73e8">${code}</h2>
      <p>This code will expire in 5 minutes.</p>
    `,
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.error('Email send error:', err);
    } else {
      console.log('Verification code sent to:', userEmail);
    }
  });

  return code;
}

module.exports = { sendVerificationEmail, codes };
