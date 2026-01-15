const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  memberId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  membershipDate: {
    type: Date,
    default: Date.now
  },
  membershipStatus: {
    type: String,
    enum: ['active', 'suspended', 'expired'],
    default: 'active'
  },
  borrowedBooks: {
    type: Number,
    default: 0
  },
  overDueBooks: {
    type: Number,
    default: 0
  },
  totalBorrowed: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Generate member ID before saving
memberSchema.pre('save', function(next) {
  if (this.isNew) {
    const year = new Date().getFullYear();
    const random = Math.floor(1000 + Math.random() * 9000);
    this.memberId = `MEM${year}${random}`;
  }
  next();
});

module.exports = mongoose.model('Member', memberSchema);