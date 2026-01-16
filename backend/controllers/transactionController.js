const Book = require('../models/Book');
const Transaction = require('../models/Transaction');
const Member = require('../models/Member');
const nodemailer = require('nodemailer');

// Borrow a book
exports.borrowBook = async (req, res) => {
  try {
    const { isbn, memberId, borrowerName: rawBorrowerName, dueDays = 14 } = req.body;

    // Find the member (required for new flow)
    let member = null;
    if (memberId) {
      member = await Member.findById(memberId);
      if (!member) {
        return res.status(400).json({ message: 'Selected member not found' });
      }
    }

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
    const borrowerName = member ? member.name : rawBorrowerName;
    book.borrowerName = borrowerName;
    book.borrowedDate = borrowedDate;
    book.dueDate = dueDate;
    await book.save();

    // Create transaction
    const transaction = new Transaction({
      member: member ? member._id : undefined,
      memberId: member ? member.memberId : undefined,
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

    // Update member statistics
    if (member) {
      member.borrowedBooks = (member.borrowedBooks || 0) + 1;
      member.totalBorrowed = (member.totalBorrowed || 0) + 1;
      await member.save();
    }

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

    // Find the transaction (including member reference)
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

    // Update member statistics if linked
    if (transaction.member) {
      const member = await Member.findById(transaction.member);
      if (member) {
        member.borrowedBooks = Math.max(0, (member.borrowedBooks || 0) - 1);
        if (fineAmount > 0) {
          member.overDueBooks = (member.overDueBooks || 0) + 1;
        }
        await member.save();
      }
    }

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

// Send notification email for a specific borrowing (demo-friendly: not limited to overdue)
exports.sendOverdueEmail = async (req, res) => {
  try {
    const { id } = req.params;
    const transaction = await Transaction.findById(id);

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // For demonstration, allow sending for any borrow transaction.
    // Still enforce that this is a borrow record to avoid confusion.
    if (transaction.transactionType !== 'borrow') {
      return res.status(400).json({ message: 'Email can only be sent for borrow transactions' });
    }

    const now = new Date();

    // Find the member's email using member reference or memberId
    let member = null;
    if (transaction.member) {
      member = await Member.findById(transaction.member);
    }
    if (!member && transaction.memberId) {
      member = await Member.findOne({ memberId: transaction.memberId });
    }

    if (!member || !member.email) {
      return res.status(400).json({ message: 'No email address found for this member' });
    }

    const isOverdue = transaction.dueDate && now > transaction.dueDate;
    const daysOverdue = isOverdue
      ? Math.ceil((now - transaction.dueDate) / (1000 * 60 * 60 * 24))
      : 0;
    const estimatedFine = daysOverdue * 100; // Rs.100 per day when overdue

    const smtpHost = process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpConfigured = smtpHost && smtpUser && smtpPass;

    const subject = isOverdue
      ? `Overdue Book Reminder: ${transaction.bookTitle}`
      : `Library Book Reminder: ${transaction.bookTitle}`;

    const statusLine = isOverdue
      ? `Status: OVERDUE\nDays Overdue: ${daysOverdue} day(s)\nEstimated Fine (at Rs.100/day): Rs. ${estimatedFine}\n\n`
      : `Status: Currently borrowed (not overdue yet)\n\n`;

    const mailPayload = {
      to: member.email,
      subject,
      text: `Dear ${member.name},\n\n` +
        `This is a reminder about the following book you borrowed from the library:\n\n` +
        `Book: ${transaction.bookTitle}\n` +
        `ISBN: ${transaction.isbn}\n` +
        `Borrowed Date: ${transaction.borrowedDate.toDateString()}\n` +
        (transaction.dueDate ? `Due Date: ${transaction.dueDate.toDateString()}\n` : '') +
        statusLine +
        `Please keep this in mind and return the book on time.\n\n` +
        `Thank you,\n` +
        `City Library`,
    };

    if (!smtpConfigured) {
      // Demo mode: no real SMTP configured, just log and pretend success
      console.log('Simulated email (SMTP not configured):', mailPayload);
      return res.json({ message: 'Email simulated (SMTP not configured on server)' });
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const fromAddress = process.env.SMTP_FROM || smtpUser;

    await transporter.sendMail({
      from: fromAddress,
      ...mailPayload,
    });

    res.json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending overdue email:', error);
    res.status(500).json({ message: 'Failed to send email', error: error.message });
  }
};