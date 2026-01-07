const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');

// Get all books
router.get('/', bookController.getAllBooks);

// Search books
router.get('/search', bookController.searchBooks);

// Get single book
router.get('/:id', bookController.getBookById);

// Add new book
router.post('/', bookController.addBook);

// Update book
router.put('/:id', bookController.updateBook);

// Delete book
router.delete('/:id', bookController.deleteBook);

module.exports = router;