const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: String,
  
  university: String,
  department: String,
  session: String,
  birthday: String,
  phone: { type: String, unique: true },
  email: { type: String, unique: true, required: true },
  password: String,
  interests: [String]
});

module.exports = mongoose.model('Student', studentSchema);
