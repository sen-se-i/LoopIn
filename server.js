const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { sendVerificationEmail, codes } = require('./sendVerificationEmail');

const app = express();
const PORT = 3000;

// ✅ Enable CORS properly BEFORE any routes
app.use(cors({
  origin: 'http://127.0.0.1:5500',
  methods: ['GET', 'POST'],
  credentials: true
}));

// ✅ Parse JSON bodies
app.use(bodyParser.json());

// ✅ Route to send verification code
app.post('/send-code', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).send('Email is required.');
  sendVerificationEmail(email);
  res.send('Verification code sent to your email.');
});

// ✅ Route to verify the code
app.post('/verify-code', (req, res) => {
  const { email, code } = req.body;
  if (codes[email] === code) {
    delete codes[email];
    return res.send('✅ Email verified successfully!');
  } else {
    return res.status(400).send('❌ Invalid verification code.');
  }
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
