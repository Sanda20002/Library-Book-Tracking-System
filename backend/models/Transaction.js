const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  
  isbn: {
    type: String,
    required: true
  },
  bookTitle: {
    type: String,
    required: true
  },
  borrowerName: {
    type: String,
    required: true,
    trim: true
  },
  transactionType: {
    type: String,
    enum: ['borrow', 'return'],
    required: true
  },
  borrowedDate: {
    type: Date,
    required: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  returnedDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['active', 'returned', 'overdue'],
    default: 'active'
  },
  fineAmount: {
    type: Number,
    default: 0
  }
});
//export the model 
module.exports = mongoose.model('Transaction', transactionSchema);