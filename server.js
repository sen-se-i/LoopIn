const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { sendVerificationEmail, codes } = require('./sendVerificationEmail');

const app = express();
const PORT = 3000;

app.use(cors()); // ← important
app.use(bodyParser.json());

app.post('/send-code', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).send('Email is required.');
  sendVerificationEmail(email);
  res.send('Verification code sent to your email.');
});

app.post('/verify-code', (req, res) => {
  const { email, code } = req.body;
  if (codes[email] === code) {
    delete codes[email];
    return res.send('✅ Email verified successfully!');
  } else {
    return res.status(400).send('❌ Invalid verification code.');
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
