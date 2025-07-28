const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const path = require('path'); // ✅ NEW
const Student = require('./models/Student');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const MONGO_URI = process.env.MONGO_URI;
const EMAIL_ADDRESS = process.env.EMAIL_ADDRESS;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;
const JWT_SECRET = process.env.JWT_SECRET || "loopin_secret_key";

if (!MONGO_URI || !EMAIL_ADDRESS || !EMAIL_PASSWORD) {
  throw new Error("❌ Missing MONGO_URI, EMAIL_ADDRESS, or EMAIL_PASSWORD in .env");
}

// ✅ Serve static files from the "public" folder
app.use(express.static(path.join(__dirname, 'public')));

app.use(cors());
app.use(bodyParser.json());

// ✅ MongoDB Connection
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

const verificationCollection = mongoose.connection.collection("verifications");

// ✅ TTL index to auto-delete verification codes after 5 minutes
verificationCollection.createIndex(
  { createdAt: 1 },
  { expireAfterSeconds: 300 }
);

// 📩 Email Sender
async function sendVerificationEmail(email, code) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: EMAIL_ADDRESS,
      pass: EMAIL_PASSWORD
    }
  });

  const mailOptions = {
    from: `"LoopIn" <${EMAIL_ADDRESS}>`,
    to: email,
    subject: 'LoopIn Email Verification',
    text: `Your verification code is: ${code}`
  };

  await transporter.sendMail(mailOptions);
}

// 📮 Send Code
app.post('/send-code', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).send('Email is required.');

  const code = Math.floor(100000 + Math.random() * 900000).toString();

  try {
    await sendVerificationEmail(email, code);
    await verificationCollection.insertOne({ email, code, createdAt: new Date() });
    res.send("✅ Verification code sent.");
  } catch (err) {
    console.error("❌ Email send error:", err);
    res.status(500).send("❌ Failed to send email.");
  }
});

// ✅ Verify Code
app.post('/verify-code', async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) return res.status(400).send("Email and code required.");

  try {
    const record = await verificationCollection.findOne({ email, code });
    if (record) {
      await verificationCollection.deleteOne({ _id: record._id });
      res.send("✅ Email verified successfully!");
    } else {
      res.status(400).send("❌ Invalid or expired verification code.");
    }
  } catch (err) {
    console.error("❌ Verification error:", err);
    res.status(500).send("❌ Something went wrong.");
  }
});

// ✅ Sign-Up Route
app.post('/signup', async (req, res) => {
  try {
    const {
      name, university, department, session,
      birthday, phone, password, interests, email
    } = req.body;

    if (!name || !university || !department || !session || !birthday || !phone || !password || !interests || !email) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const existing = await Student.findOne({ phone });
    if (existing) {
      return res.status(409).json({ message: 'Phone already registered.' });
    }

    const newStudent = new Student({
      name, university, department, session,
      birthday, phone, password, interests, email
    });

    await newStudent.save();

    const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ message: '✅ Student account created.', token });

  } catch (err) {
    console.error("❌ Signup error:", err);
    res.status(500).json({ message: '❌ Internal server error.' });
  }
});

// ✅ Profile Route (requires token)
app.get('/profile', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).send("❌ Unauthorized");

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).send("❌ Unauthorized");

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await Student.findOne({ email: decoded.email });

    if (!user) return res.status(404).send("❌ User not found");

    res.json({
      student: {
        name: user.name,
        email: user.email,
        department: user.department,
        university: user.university,
        session: user.session,
        birthday: user.birthday,
        phone: user.phone,
        interests: user.interests
      }
    });

  } catch (err) {
    console.error("❌ Token error:", err);
    res.status(401).send("❌ Invalid or expired token");
  }
});

// 🌐 Optional: Route to serve profile.html explicitly
app.get('/profile.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'profile.html'));
});

// 🌐 Root & Ping Routes
app.get('/', (req, res) => res.send("✅ LoopIn backend is running."));
app.get('/ping', (req, res) => res.send('✅ Backend is alive'));

// 🚀 Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running at https://loopin-1.onrender.com/`);
});
