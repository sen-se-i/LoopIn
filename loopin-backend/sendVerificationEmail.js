const nodemailer = require('nodemailer');

function generate6DigitCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendVerificationEmail(db, userEmail) {
  const code = generate6DigitCode();

  // Insert into MongoDB with timestamp
  await db.collection("verifications").insertOne({
    email: userEmail,
    code,
    createdAt: new Date()
  });

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'mymirrordimension@gmail.com',
      pass: 'vflb lhuc gclj hnht' // no spaces
    }
  });

  const mailOptions = {
    from: 'LoopIn <mymirrordimension@gmail.com>',
    to: userEmail,
    subject: 'Your LoopIn Verification Code',
    html: `
      <p>Hi there!</p>
      <p>Your verification code is:</p>
      <h2 style="color:#1a73e8">${code}</h2>
      <p>This code will expire in 5 minutes.</p>
    `
  };

  await transporter.sendMail(mailOptions);
  console.log("✅ Verification code sent to:", userEmail);

  return code;
}

module.exports = { sendVerificationEmail };
