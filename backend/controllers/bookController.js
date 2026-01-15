const Book = require('../models/Book');

// Generate a pseudo-ISBN that looks like a real one and is unique
// Format example: 978-1-234-567890-1
const generateRandomIsbn = () => {
  const prefix = '978';
  const group = Math.floor(Math.random() * 9) + 1; // 1-9
  const registrant = String(Math.floor(100 + Math.random() * 900)); // 3 digits
  const publication = String(Math.floor(100000 + Math.random() * 900000)); // 6 digits
  const checkDigit = Math.floor(Math.random() * 10); // 0-9
  return `${prefix}-${group}-${registrant}-${publication}-${checkDigit}`;
};

// Get all books
exports.getAllBooks = async (req, res) => {
  try {
    const books = await Book.find().sort({ createdAt: -1 });
    res.json(books);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get single book
exports.getBookById = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    res.json(book);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Add new book
exports.addBook = async (req, res) => {
  try {
    const {
      title,
      author,
      genre,
      shelfLocation,
      status,
      totalCopies,
      availableCopies
    } = req.body;

    // Generate a unique ISBN for this book
    let isbn;
    let attempts = 0;
    const maxAttempts = 5;

    while (!isbn && attempts < maxAttempts) {
      attempts += 1;
      const candidate = generateRandomIsbn();
      const existingBook = await Book.findOne({ isbn: candidate });
      if (!existingBook) {
        isbn = candidate;
      }
    }

    if (!isbn) {
      return res.status(500).json({ message: 'Failed to generate unique ISBN' });
    }

    const book = new Book({
      isbn,
      title,
      author,
      genre,
      shelfLocation,
      status,
      totalCopies,
      availableCopies
    });

    await book.save();
    res.status(201).json({ message: 'Book added successfully', book });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update book
exports.updateBook = async (req, res) => {
  try {
    const book = await Book.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    
    res.json({ message: 'Book updated successfully', book });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete book
exports.deleteBook = async (req, res) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);
    
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    
    res.json({ message: 'Book deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Search books
exports.searchBooks = async (req, res) => {
  try {
    const { query } = req.query;
    
    const books = await Book.find({
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { author: { $regex: query, $options: 'i' } },
        { isbn: { $regex: query, $options: 'i' } },
        { genre: { $regex: query, $options: 'i' } }
      ]
    }).sort({ title: 1 });
    
    res.json(books);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};