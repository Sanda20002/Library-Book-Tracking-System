const Member = require('../models/Member');
const Transaction = require('../models/Transaction');
const Book = require('../models/Book');

// Static library info the bot can always answer
const LIBRARY_INFO = {
  name: 'City Library - Diyathalawa',
  address: 'No.123 , Haputhale road , Diyathalawa',
  phone: '+94 57 234 5678',
  email: 'citylibrary@gmail.com',
  hours: [
    'Mon – Fri: 9:00 AM – 7:00 PM',
    'Saturday: 10:00 AM – 5:00 PM',
    'Sunday & Public Holidays: Closed',
  ],
};

// Very simple intent detection based on keywords
function getIntent(message) {
  const text = message.toLowerCase();

  if (text.includes('open') || text.includes('close') || text.includes('time') || text.includes('hour')) {
    return 'hours';
  }

  if (text.includes('contact') || text.includes('phone') || text.includes('email') || text.includes('address')) {
    return 'contact';
  }

  if (text.includes('borrowed') || text.includes('my books') || text.includes('currently have') || text.includes('currently borrowed')) {
    return 'currentBorrowed';
  }

  if (text.includes('overdue') || text.includes('late')) {
    return 'overdue';
  }

  if (text.includes('fine') || text.includes('penalty') || text.includes('fees')) {
    return 'fines';
  }

  if (text.includes('summary') || text.includes('history') || text.includes('activity')) {
    return 'summary';
  }

   // Global, admin-style questions
  if (
    (text.includes('available') && text.includes('book')) ||
    text.includes('available booklist') ||
    text.includes('available books')
  ) {
    return 'availableBooks';
  }

  if (
    text.includes('borrowed books') ||
    (text.includes('who') && text.includes('borrowed'))
  ) {
    return 'borrowedBooksAll';
  }

  if (
    text.includes('returned books') ||
    (text.includes('returned') && text.includes('books'))
  ) {
    return 'returnedOnDate';
  }

  return 'general';
}

exports.handleChat = async (req, res) => {
  try {
    const { message, memberId } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ reply: 'Please send a text message to the chatbot.' });
    }

    const intent = getIntent(message);

    // Handle static, non-member-specific questions
    if (intent === 'hours') {
      return res.json({
        reply:
          `Our opening hours are:\n` +
          LIBRARY_INFO.hours.join('\n') +
          `\n\nLocation: ${LIBRARY_INFO.address}.`,
      });
    }

    if (intent === 'contact') {
      return res.json({
        reply:
          `You can contact us using:\n` +
          `Phone: ${LIBRARY_INFO.phone}\n` +
          `Email: ${LIBRARY_INFO.email}\n` +
          `Address: ${LIBRARY_INFO.address}`,
      });
    }

    // For member‑specific questions we need a memberId
    let member = null;
    if (memberId && memberId.trim()) {
      member = await Member.findOne({ memberId: memberId.trim() });
      if (!member) {
        return res.json({
          reply:
            `I couldn't find a member with ID ${memberId}. ` +
            `Please check your member ID or ask staff to confirm it.`,
        });
      }
    }

    if (
      !member &&
      !['general', 'hours', 'contact', 'availableBooks', 'borrowedBooksAll', 'returnedOnDate'].includes(intent)
    ) {
      return res.json({
        reply:
          'To answer that, please provide the member ID so I can look up this member. ' +
          'For example: "Member ID is MEM20261234".',
      });
    }

    if (member && !req.body.memberIdStored) {
      // Let the frontend know this member was resolved successfully
      // so it can store the ID for future turns if needed.
    }

    if (intent === 'currentBorrowed') {
      const activeBorrows = await Transaction.find({
        $or: [
          { member: member._id },
          { memberId: member.memberId },
        ],
        transactionType: 'borrow',
        status: 'active',
      }).sort({ dueDate: 1 });

      if (activeBorrows.length === 0) {
        return res.json({
          reply: `This member (${member.name}) does not have any books currently borrowed.`,
        });
      }

      const lines = activeBorrows.map((t) => {
        const due = t.dueDate ? t.dueDate.toDateString() : 'N/A';
        return `• ${t.bookTitle} (ISBN: ${t.isbn}) – due on ${due}`;
      });

      return res.json({
        reply:
          `This member (${member.name}) currently has ${activeBorrows.length} active borrowing(s):\n` +
          lines.join('\n'),
      });
    }

    if (intent === 'overdue') {
      const now = new Date();
      const overdueBorrows = await Transaction.find({
        $or: [
          { member: member._id },
          { memberId: member.memberId },
        ],
        transactionType: 'borrow',
        status: 'active',
        dueDate: { $lt: now },
      }).sort({ dueDate: 1 });

      if (overdueBorrows.length === 0) {
        return res.json({
          reply: `Good news! This member (${member.name}) does not have any overdue books right now.`,
        });
      }

      const lines = overdueBorrows.map((t) => {
        const daysOverdue = Math.ceil((now - t.dueDate) / (1000 * 60 * 60 * 24));
        const fine = daysOverdue * 100; // matches your Rs.100/day policy
        return `• ${t.bookTitle} (ISBN: ${t.isbn}) – overdue by ${daysOverdue} day(s), estimated fine Rs. ${fine}`;
      });

      return res.json({
        reply:
          `This member currently has ${overdueBorrows.length} overdue book(s):\n` +
          lines.join('\n') +
          '\n\nPlease inform the member to return them as soon as possible.',
      });
    }

    if (intent === 'fines') {
      const pastReturns = await Transaction.find({
        $or: [
          { member: member._id },
          { memberId: member.memberId },
        ],
        transactionType: 'return',
        fineAmount: { $gt: 0 },
      });

      const totalFines = pastReturns.reduce((sum, t) => sum + (t.fineAmount || 0), 0);

      if (totalFines === 0) {
        return res.json({
          reply: `This member (${member.name}) does not have any recorded past fines.`,
        });
      }

      return res.json({
        reply:
          `This member (${member.name}) has total recorded fines of Rs. ${totalFines}. ` +
          'For an exact breakdown, please refer to the fines/transactions view.',
      });
    }

    if (intent === 'summary') {
      return res.json({
        reply:
          `Member summary for ${member.name} (ID: ${member.memberId}):\n` +
          `• Current borrowed books: ${member.borrowedBooks || 0}\n` +
          `• Total books ever borrowed: ${member.totalBorrowed || 0}\n` +
          `• Overdue cases on record: ${member.overDueBooks || 0}\n` +
          'For detailed history of every transaction, please see the member summary screen used by staff.',
      });
    }

    if (intent === 'availableBooks') {
      const books = await Book.find({ status: 'available' }).sort({ title: 1 }).limit(20);

      if (books.length === 0) {
        return res.json({
          reply: 'There are no books currently marked as available in the system.',
        });
      }

      const lines = books.map((b) => {
        const copies = `${b.availableCopies}/${b.totalCopies} copies`;
        const shelf = b.shelfLocation ? ` – Shelf: ${b.shelfLocation}` : '';
        return `• ${b.title} by ${b.author} (ISBN: ${b.isbn}) – ${copies}${shelf}`;
      });

      return res.json({
        reply:
          `Here is a sample of available books (up to 20):\n` +
          lines.join('\n') +
          '\n\nFor the full list, please use the main Books page.',
      });
    }

    if (intent === 'borrowedBooksAll') {
      const activeBorrows = await Transaction.find({
        transactionType: 'borrow',
        status: 'active',
      })
        .sort({ dueDate: 1 })
        .limit(50);

      if (activeBorrows.length === 0) {
        return res.json({
          reply: 'There are no active borrowed books in the system right now.',
        });
      }

      const lines = activeBorrows.map((t) => {
        const due = t.dueDate ? t.dueDate.toDateString() : 'N/A';
        const memberTag = t.memberId ? ` (Member ID: ${t.memberId})` : '';
        return `• ${t.bookTitle} (ISBN: ${t.isbn}) – borrowed by ${t.borrowerName}${memberTag}, due on ${due}`;
      });

      return res.json({
        reply:
          `Here are up to 50 currently borrowed books and who borrowed them:\n` +
          lines.join('\n'),
      });
    }

    if (intent === 'returnedOnDate') {
      // Try to extract a date from the message text.
      const raw = message
        .replace(/\b(\d+)(st|nd|rd|th)\b/gi, '$1')
        .replace(/\s+/g, ' ');
      const parsed = Date.parse(raw);

      if (Number.isNaN(parsed)) {
        return res.json({
          reply:
            'Please specify the date more clearly, for example: "What are the returned books on 15 Jan 2026" or "returned books on 2026-01-15".',
        });
      }

      const day = new Date(parsed);
      const start = new Date(day.getFullYear(), day.getMonth(), day.getDate());
      const end = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1);

      const returns = await Transaction.find({
        transactionType: 'return',
        returnedDate: { $gte: start, $lt: end },
      }).sort({ returnedDate: 1 });

      const niceDate = start.toDateString();

      if (returns.length === 0) {
        return res.json({
          reply: `No books were recorded as returned on ${niceDate}.`,
        });
      }

      const lines = returns.map((t) => {
        const time = t.returnedDate ? t.returnedDate.toTimeString().slice(0, 5) : '';
        const memberTag = t.memberId ? ` (Member ID: ${t.memberId})` : '';
        const fine = t.fineAmount > 0 ? ` – Fine: Rs. ${t.fineAmount}` : '';
        return `• ${t.bookTitle} (ISBN: ${t.isbn}) – returned by ${t.borrowerName}${memberTag} at ${time}${fine}`;
      });

      return res.json({
        reply:
          `Books returned on ${niceDate}:\n` +
          lines.join('\n'),
      });
    }

    // Fallback: general help
    return res.json({
      reply:
        'I can help you with library hours, contact details, overall borrowing activity, and a member\'s borrowing status. ' +
        'For example, try asking:\n' +
        '• "What time do you open?"\n' +
        '• "How can I contact the library?"\n' +
        '• "Give me available booklist"\n' +
        '• "What are the borrowed books and who borrowed them"\n' +
        '• "What are the returned books on 15 Jan 2026"\n' +
        '• "What books has this member borrowed?" (include the member ID)\n' +
        '• "Does this member have any overdue books?"',
    });
  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({ reply: 'Sorry, something went wrong while processing your question.' });
  }
};
