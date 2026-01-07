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
  }
});

// Update availableCopies before saving (promise-based middleware, no next callback)
bookSchema.pre('save', function() {
  if (this.isNew && (this.availableCopies === undefined || this.availableCopies === null)) {
    this.availableCopies = this.totalCopies;
  }
});

module.exports = mongoose.model('Book', bookSchema);