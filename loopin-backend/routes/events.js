const express = require("express");
const router = express.Router();
const Event = require("../models/Events");

router.post("/register", async (req, res) => {
  try {
    const { name, email, eventName } = req.body;
    const newEvent = new Event({ name, email, eventName });
    await newEvent.save();
    res.status(201).json({ message: "Registration successful" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
