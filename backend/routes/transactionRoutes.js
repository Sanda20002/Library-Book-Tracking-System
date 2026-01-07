const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');

// Get all transactions
router.get('/', transactionController.getAllTransactions);

// Get active borrowings
router.get('/active', transactionController.getActiveBorrowings);

// Get dashboard stats
router.get('/dashboard', transactionController.getDashboardStats);

// Borrow a book
router.post('/borrow', transactionController.borrowBook);

// Return a book
router.post('/return', transactionController.returnBook);

module.exports = router;