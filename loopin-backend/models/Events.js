const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
  name: String,
  email: String,
  eventName: String,
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Event", eventSchema);
