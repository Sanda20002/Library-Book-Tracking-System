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

  // Member's full borrowing history style questions
  if (
    (text.includes('what') || text.includes('which')) &&
    text.includes('book') &&
    (text.includes('this member') || text.includes('member')) &&
    text.includes('borrowed')
  ) {
    return 'memberBorrowHistory';
  }

  if (text.includes('overdue') || text.includes('late')) {
    return 'overdue';
  }

  // Members who have fines recorded (global question)
  if (
    (text.includes('members') || text.includes('which') || text.includes('who')) &&
    (text.includes('fine') || text.includes('fines') || text.includes('penalty') || text.includes('fees'))
  ) {
    return 'membersWithFines';
  }

  if (text.includes('fine') || text.includes('penalty') || text.includes('fees')) {
    return 'fines';
  }

  if (text.includes('summary') || text.includes('history') || text.includes('activity')) {
    return 'summary';
  }

  // Date-based borrowed books (e.g. "borrowed books on 15 Jan 2026")
  if (
    (text.includes('borrowed books') || text.includes('books borrowed') || text.includes('borrowed')) &&
    text.includes('on')
  ) {
    return 'borrowedOnDate';
  }

  // Member's currently borrowed books
  if (
    text.includes('currently borrowed') ||
    text.includes('currently have') ||
    text.includes('current borrowed') ||
    text.includes('current books') ||
    text.includes('my books') ||
    (text.includes('borrowed') && (text.includes('now') || text.includes('right now')))
  ) {
    return 'currentBorrowed';
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
      ![
        'general',
        'hours',
        'contact',
        'availableBooks',
        'borrowedBooksAll',
        'returnedOnDate',
        'borrowedOnDate',
        'membersWithFines',
      ].includes(intent)
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

      const lines = activeBorrows.map((t, index) => {
        const due = t.dueDate ? t.dueDate.toDateString() : 'N/A';
        return (
          `#${index + 1}\n` +
          `Title : ${t.bookTitle}\n` +
          `ISBN  : ${t.isbn}\n` +
          `Due   : ${due}`
        );
      });

      return res.json({
        reply:
          `This member (${member.name}) currently has ${activeBorrows.length} active borrowing(s):\n\n` +
          lines.join('\n\n'),
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

      const lines = overdueBorrows.map((t, index) => {
        const daysOverdue = Math.ceil((now - t.dueDate) / (1000 * 60 * 60 * 24));
        const fine = daysOverdue * 100; // matches your Rs.100/day policy
        const due = t.dueDate ? t.dueDate.toDateString() : 'N/A';
        return (
          `#${index + 1}\n` +
          `Title    : ${t.bookTitle}\n` +
          `ISBN     : ${t.isbn}\n` +
          `Due date : ${due}\n` +
          `Overdue  : ${daysOverdue} day(s)\n` +
          `Fine est.: Rs. ${fine}`
        );
      });

      return res.json({
        reply:
          `This member currently has ${overdueBorrows.length} overdue book(s):\n\n` +
          lines.join('\n\n') +
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

    if (intent === 'memberBorrowHistory') {
      const borrows = await Transaction.find({
        $or: [
          { member: member._id },
          { memberId: member.memberId },
        ],
        transactionType: 'borrow',
      })
        .sort({ borrowedDate: -1 })
        .limit(30);

      if (borrows.length === 0) {
        return res.json({
          reply: `This member (${member.name}) has no recorded borrowings in the system.`,
        });
      }

      const lines = borrows.map((t, index) => {
        const borrowed = t.borrowedDate ? t.borrowedDate.toDateString() : 'N/A';
        const returned = t.returnedDate ? t.returnedDate.toDateString() : 'Not yet returned';
        const status = t.status ? t.status : (t.returnedDate ? 'returned' : 'active');
        return (
          `#${index + 1}\n` +
          `Title      : ${t.bookTitle}\n` +
          `ISBN       : ${t.isbn}\n` +
          `Borrowed on: ${borrowed}\n` +
          `Returned on: ${returned}\n` +
          `Status     : ${status}`
        );
      });

      return res.json({
        reply:
          `Borrowing history for ${member.name} (ID: ${member.memberId}) – latest ${borrows.length} record(s):\n\n` +
          lines.join('\n\n'),
      });
    }

    if (intent === 'membersWithFines') {
      const finedReturns = await Transaction.find({
        transactionType: 'return',
        fineAmount: { $gt: 0 },
      }).sort({ returnedDate: -1 });

      if (finedReturns.length === 0) {
        return res.json({
          reply: 'No members currently have any recorded fines in the system.',
        });
      }

      const aggregateByMember = new Map();

      for (const t of finedReturns) {
        const key = t.memberId || t.borrowerName || 'Unknown';
        if (!aggregateByMember.has(key)) {
          aggregateByMember.set(key, {
            memberId: t.memberId || '',
            name: t.borrowerName || 'Unknown name',
            totalFine: 0,
            count: 0,
            latestReturn: t.returnedDate || null,
          });
        }
        const entry = aggregateByMember.get(key);
        entry.totalFine += t.fineAmount || 0;
        entry.count += 1;
        if (t.returnedDate && (!entry.latestReturn || t.returnedDate > entry.latestReturn)) {
          entry.latestReturn = t.returnedDate;
        }
      }

      const membersWithFines = Array.from(aggregateByMember.values())
        .sort((a, b) => {
          if (b.totalFine !== a.totalFine) return b.totalFine - a.totalFine;
          if (a.latestReturn && b.latestReturn) return b.latestReturn - a.latestReturn;
          return 0;
        })
        .slice(0, 50);

      const lines = membersWithFines.map((m, index) => {
        const lastDate = m.latestReturn ? m.latestReturn.toDateString() : 'N/A';
        const memberIdLine = m.memberId ? m.memberId : 'Not recorded';
        return (
          `#${index + 1}\n` +
          `Name       : ${m.name}\n` +
          `Member ID  : ${memberIdLine}\n` +
          `Returns    : ${m.count} with fines\n` +
          `Total fines: Rs. ${m.totalFine}\n` +
          `Last fine  : ${lastDate}`
        );
      });

      return res.json({
        reply:
          'These members have recorded fines in the system (top 50 by total fines):\n\n' +
          lines.join('\n\n') +
          '\n\nNote: This list is based on recorded fine amounts from return transactions and does not track whether fines have later been paid.',
      });
    }

    if (intent === 'availableBooks') {
      const books = await Book.find({ status: 'available' }).sort({ title: 1 }).limit(20);

      if (books.length === 0) {
        return res.json({
          reply: 'There are no books currently marked as available in the system.',
        });
      }

      const lines = books.map((b, index) => {
        const copies = `${b.availableCopies}/${b.totalCopies} copies`;
        const shelf = b.shelfLocation ? `${b.shelfLocation}` : 'Not specified';
        return (
          `#${index + 1}\n` +
          `Title   : ${b.title}\n` +
          `Author  : ${b.author}\n` +
          `ISBN    : ${b.isbn}\n` +
          `Copies  : ${copies}\n` +
          `Shelf   : ${shelf}`
        );
      });

      return res.json({
        reply:
          `Here is a sample of available books (up to 20):\n\n` +
          lines.join('\n\n') +
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

      const lines = activeBorrows.map((t, index) => {
        const due = t.dueDate ? t.dueDate.toDateString() : 'N/A';
        const memberTag = t.memberId ? ` (Member ID: ${t.memberId})` : '';
        return (
          `#${index + 1}\n` +
          `Title    : ${t.bookTitle}\n` +
          `ISBN     : ${t.isbn}\n` +
          `Borrower : ${t.borrowerName}${memberTag}\n` +
          `Due date : ${due}`
        );
      });

      return res.json({
        reply:
          `Here are up to 50 currently borrowed books and who borrowed them:\n\n` +
          lines.join('\n\n'),
      });
    }

    if (intent === 'borrowedOnDate') {
      // Try to extract a date from the message text.
      const raw = message
        .replace(/\b(\d+)(st|nd|rd|th)\b/gi, '$1')
        .replace(/\s+/g, ' ');
      const parsed = Date.parse(raw);

      if (Number.isNaN(parsed)) {
        return res.json({
          reply:
            'Please specify the date more clearly, for example: "What are the borrowed books on 15 Jan 2026" or "borrowed books on 2026-01-15".',
        });
      }

      const day = new Date(parsed);
      const start = new Date(day.getFullYear(), day.getMonth(), day.getDate());
      const end = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1);

      const borrows = await Transaction.find({
        transactionType: 'borrow',
        borrowedDate: { $gte: start, $lt: end },
      }).sort({ borrowedDate: 1 });

      const niceDate = start.toDateString();

      if (borrows.length === 0) {
        return res.json({
          reply: `No books were recorded as borrowed on ${niceDate}.`,
        });
      }

      const lines = borrows.map((t, index) => {
        const time = t.borrowedDate ? t.borrowedDate.toTimeString().slice(0, 5) : '';
        const memberTag = t.memberId ? ` (Member ID: ${t.memberId})` : '';
        const due = t.dueDate ? t.dueDate.toDateString() : 'N/A';
        return (
          `#${index + 1}\n` +
          `Title    : ${t.bookTitle}\n` +
          `ISBN     : ${t.isbn}\n` +
          `Borrower : ${t.borrowerName}${memberTag}\n` +
          `Time     : ${time}\n` +
          `Due date : ${due}`
        );
      });

      return res.json({
        reply:
          `Books borrowed on ${niceDate}:\n\n` +
          lines.join('\n\n'),
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

      const lines = returns.map((t, index) => {
        const time = t.returnedDate ? t.returnedDate.toTimeString().slice(0, 5) : '';
        const memberTag = t.memberId ? ` (Member ID: ${t.memberId})` : '';
        const fine = t.fineAmount > 0 ? `Rs. ${t.fineAmount}` : 'None';
        return (
          `#${index + 1}\n` +
          `Title    : ${t.bookTitle}\n` +
          `ISBN     : ${t.isbn}\n` +
          `Borrower : ${t.borrowerName}${memberTag}\n` +
          `Time     : ${time}\n` +
          `Fine     : ${fine}`
        );
      });

      return res.json({
        reply:
          `Books returned on ${niceDate}:\n\n` +
          lines.join('\n\n'),
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
        '• "Which members currently have fines?"\n' +
        '• "What are the borrowed books on 15 Jan 2026"\n' +
        '• "What are the returned books on 15 Jan 2026"\n' +
        '• "What books has this member borrowed?" (include the member ID)\n' +
        '• "Does this member have any overdue books?"',
    });
  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({ reply: 'Sorry, something went wrong while processing your question.' });
  }
};
