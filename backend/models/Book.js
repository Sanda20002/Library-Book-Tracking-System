const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  isbn: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  author: {
    type: String,
    required: true,
    trim: true
  },
  publisher: {
    type: String,
    trim: true
  },
  publicationYear: {
    type: Number,
    min: 1000,
    max: new Date().getFullYear()
  },
  genre: {
    type: String,
    trim: true
  },
  shelfLocation: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['available', 'borrowed'],
    default: 'available'
  },
  totalCopies: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  availableCopies: {
    type: Number,
    required: true,
    min: 0
  },
  borrowerName: {
    type: String,
    default: ''
  },
  borrowedDate: {
    type: Date
  },
  dueDate: {
    type: Date
  }
}, {
  timestamps: true
});

// Update availableCopies before saving
bookSchema.pre('save', function(next) {
  if (this.isNew) {
    this.availableCopies = this.totalCopies;
  }
  next();
});

module.exports = mongoose.model('Book', bookSchema);