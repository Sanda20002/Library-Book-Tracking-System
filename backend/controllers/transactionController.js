const Book = require('../models/Book');
const Transaction = require('../models/Transaction');

// Borrow a book
exports.borrowBook = async (req, res) => {
  try {
    const { isbn, borrowerName, dueDays = 14 } = req.body;

    // Find the book
    const book = await Book.findOne({ isbn });
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    // Check if book is available
    if (book.availableCopies < 1) {
      return res.status(400).json({ message: 'No copies available for borrowing' });
    }

    // Calculate dates
    const borrowedDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + parseInt(dueDays));

    // Update book
    book.availableCopies -= 1;
    book.status = book.availableCopies === 0 ? 'borrowed' : 'available';
    book.borrowerName = borrowerName;
    book.borrowedDate = borrowedDate;
    book.dueDate = dueDate;
    await book.save();

    // Create transaction
    const transaction = new Transaction({
      
      isbn: book.isbn,
      bookTitle: book.title,
      borrowerName,
      transactionType: 'borrow',
      borrowedDate,
      dueDate,
      status: 'active',
      fineAmount: 0
    });

    await transaction.save();

    res.status(201).json({ 
      message: 'Book borrowed successfully', 
      transaction,
      book 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Return a book
exports.returnBook = async (req, res) => {
  try {
    const { transactionId } = req.body;

    // Find the transaction
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (transaction.transactionType !== 'borrow' || transaction.status === 'returned') {
      return res.status(400).json({ message: 'Invalid transaction for return' });
    }

    // Find the book
    const book = await Book.findOne({ isbn: transaction.isbn });
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    // Calculate fine if overdue
    const returnedDate = new Date();
    let fineAmount = 0;
    
    if (returnedDate > transaction.dueDate) {
      const daysOverdue = Math.ceil((returnedDate - transaction.dueDate) / (1000 * 60 * 60 * 24));
      fineAmount = daysOverdue * 100; // Rs.100 per day
    }

    // Update book
    book.availableCopies += 1;
    book.status = 'available';
    book.borrowerName = '';
    book.borrowedDate = null;
    book.dueDate = null;
    await book.save();

    // Update transaction
    transaction.transactionType = 'return';
    transaction.returnedDate = returnedDate;
    transaction.status = 'returned';
    transaction.fineAmount = fineAmount;
    await transaction.save();

    res.json({ 
      message: 'Book returned successfully', 
      transaction,
      fineAmount
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all transactions
exports.getAllTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get active borrowings
exports.getActiveBorrowings = async (req, res) => {
  try {
    const borrowings = await Transaction.find({
      transactionType: 'borrow',
      status: 'active'
    }).sort({ dueDate: 1 });

    res.json(borrowings);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get dashboard stats
exports.getDashboardStats = async (req, res) => {
  try {
    const totalBooks = await Book.countDocuments();
    const availableBooks = await Book.countDocuments({ status: 'available' });
    const borrowedBooks = await Book.countDocuments({ status: 'borrowed' });
    
    const totalTransactions = await Transaction.countDocuments();
    const activeBorrowings = await Transaction.countDocuments({ 
      transactionType: 'borrow', 
      status: 'active' 
    });
    
    const overdueBorrowings = await Transaction.countDocuments({
      transactionType: 'borrow',
      status: 'active',
      dueDate: { $lt: new Date() }
    });

    res.json({
      totalBooks,
      availableBooks,
      borrowedBooks,
      totalTransactions,
      activeBorrowings,
      overdueBorrowings
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};