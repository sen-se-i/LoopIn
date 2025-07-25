// server.js

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { sendVerificationEmail, codes } = require('./sendVerificationEmail');

const app = express();
const PORT = process.env.PORT || 3000; // ✅ Use environment port on Render

// ✅ CORS setup — allow frontend from localhost and production domain
const allowedOrigins = ['http://127.0.0.1:5500', 'https://loopin-1.onrender.com'];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST'],
  credentials: true
}));

// ✅ Middleware
app.use(bodyParser.json());

// ✅ Route: Send Verification Code
app.post('/send-code', (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).send('❌ Email is required.');

  try {
    sendVerificationEmail(email);
    res.send('✅ Verification code sent to your email.');
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).send('❌ Failed to send verification code.');
  }
});

// ✅ Route: Verify Code
app.post('/verify-code', (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).send('❌ Email and code are required.');
  }

  if (codes[email] === code) {
    delete codes[email]; // Remove used code
    return res.send('✅ Email verified successfully!');
  } else {
    return res.status(400).send('❌ Invalid verification code.');
  }
});

// ✅ Home test route
app.get('/', (req, res) => {
  res.send('✅ LoopIn Email Verification Server is Running');
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
