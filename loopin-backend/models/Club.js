const mongoose = require('mongoose');

const clubSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  orgName: { type: String, required: true },
  university: { type: String, required: true },
  established: { type: Date, required: true },
  president: { type: String, required: true },
  phone: { type: String, required: true },
  password: { type: String, required: true }
});

module.exports = mongoose.model('Club', clubSchema);
