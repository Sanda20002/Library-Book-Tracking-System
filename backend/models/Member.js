const mongoose = require('mongoose');

// Helper to generate a member ID like MEM20260001
const generateMemberId = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `MEM${year}${random}`;
};

const memberSchema = new mongoose.Schema({
  memberId: {
    type: String,
    unique: true,
    trim: true,
    default: generateMemberId
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

module.exports = mongoose.model('Member', memberSchema);