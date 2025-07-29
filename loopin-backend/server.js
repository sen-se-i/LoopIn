const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const path = require('path');
const Student = require('./models/Student');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const MONGO_URI = process.env.MONGO_URI;
const EMAIL_ADDRESS = process.env.EMAIL_ADDRESS;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;
const JWT_SECRET = process.env.JWT_SECRET || "loopin_secret_key";

// ✅ Safety check
if (!MONGO_URI || !EMAIL_ADDRESS || !EMAIL_PASSWORD) {
  throw new Error("❌ Missing MONGO_URI, EMAIL_ADDRESS, or EMAIL_PASSWORD in .env");
}

app.use(cors());
app.use(bodyParser.json());

// ✅ MongoDB connection
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

const verificationCollection = mongoose.connection.collection("verifications");

// ✅ Expire verification codes after 5 mins
verificationCollection.createIndex({ createdAt: 1 }, { expireAfterSeconds: 300 });

// ✅ Email Sender
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

// 📮 Send Verification Code
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

// ✅ Sign Up
app.post('/signup', async (req, res) => {
  try {
    const {
      name, university, department, session,
      birthday, phone, password, interests, email
    } = req.body;

    if (!name || !university || !department || !session || !birthday || !phone || !password || !interests || !email) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const existingEmail = await Student.findOne({ email });
    if (existingEmail) {
      return res.status(409).json({ message: 'Email already registered.' });
    }

    const existingPhone = await Student.findOne({ phone });
    if (existingPhone) {
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


//loginroute
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: "Email and password are required." });

  try {
    const student = await Student.findOne({ email });

    if (!student) {
      return res.status(404).json({ message: "User not found." });
    }

    if (student.password !== password) {
      return res.status(401).json({ message: "Invalid password." });
    }

    const token = jwt.sign({ email: student.email }, JWT_SECRET, { expiresIn: '7d' });

    res.status(200).json({ message: "Login successful.", token });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Internal server error." });
  }
});

//const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) return res.status(401).json({ message: 'Access token required' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
}

//i guess this is profile 
app.get('/profile', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).send("❌ Unauthorized");

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).send("❌ Unauthorized");

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log("Decoded JWT:", decoded);

    const user = await Student.findOne({ email: new RegExp(`^${decoded.email}$`, 'i') });
    console.log("User found:", user);

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

//clubprofile 
const Club = require('./models/Club');
const bcrypt = require('bcryptjs');
//const jwt = require('jsonwebtoken');

// Club Signup Route
app.post('/club-signup', async (req, res) => {
  try {
    const {
      email,
      orgName,
      university,
      established,
      president,
      phone,
      password
    } = req.body;

    if (!email || !orgName || !university || !established || !president || !phone || !password) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    // Check if club already exists
    const existing = await Club.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Club already registered with this email.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save club
    const newClub = new Club({
      email,
      orgName,
      university,
      established,
      president,
      phone,
      password: hashedPassword
    });

    await newClub.save();

    // Generate JWT token
    const token = jwt.sign(
      { email, type: 'club' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({ token });

  } catch (error) {
    console.error('Club signup error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});


// editing profile
app.put('/profile', authenticateToken, async (req, res) => {
  try {
    const email = req.user.email;
    const updated = await Student.findOneAndUpdate(
      { email },
      { $set: req.body },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'Student not found' });
    res.json({ message: "Profile updated", student: updated });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});


// 🌐 Serve profile.html directly
app.get('/profile.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'profile.html'));
});

// ✅ Place this at the END
app.use(express.static(path.join(__dirname, 'public')));

// 🌐 Ping & Root
app.get('/', (req, res) => res.send("✅ LoopIn backend is running."));
app.get('/ping', (req, res) => res.send('✅ Backend is alive'));

// 🚀 Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at https://loopin-1.onrender.com/`);
});
