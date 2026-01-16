const Member = require('../models/Member');
const Transaction = require('../models/Transaction');

// Fallback generator in case schema default does not run
const generateMemberId = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `MEM${year}${random}`;
};

// Register new member
exports.registerMember = async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;

    // Check if email already exists
    const existingMember = await Member.findOne({ email });
    if (existingMember) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const member = new Member({
      memberId: generateMemberId(),
      name,
      email,
      phone,
      address
    });

    await member.save();
    res.status(201).json({ 
      message: 'Member registered successfully', 
      member 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all members
exports.getAllMembers = async (req, res) => {
  try {
    const members = await Member.find().sort({ createdAt: -1 });
    res.json(members);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get single member by ID
exports.getMemberById = async (req, res) => {
  try {
    const member = await Member.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }
    res.json(member);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get member by email
exports.getMemberByEmail = async (req, res) => {
  try {
    const { email } = req.params;
    const member = await Member.findOne({ email });
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }
    res.json(member);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update member
exports.updateMember = async (req, res) => {
  try {
    const member = await Member.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }
    
    res.json({ message: 'Member updated successfully', member });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete member
exports.deleteMember = async (req, res) => {
  try {
    const member = await Member.findByIdAndDelete(req.params.id);
    
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }
    
    res.json({ message: 'Member deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Search members
exports.searchMembers = async (req, res) => {
  try {
    const { query } = req.query;
    
    const members = await Member.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { memberId: { $regex: query, $options: 'i' } },
        { phone: { $regex: query, $options: 'i' } }
      ]
    }).sort({ name: 1 });
    
    res.json(members);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get detailed member summary (borrowed, returned, fines, overdue)
exports.getMemberSummary = async (req, res) => {
  try {
    const memberId = req.params.id;
    const member = await Member.findById(memberId);

    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }

    // Fetch all transactions associated with this member.
    // 1) Prefer strong identifiers: Member ObjectId and memberId string.
    // 2) As a fallback for older transactions created before member
    //    linkage existed, include entries that only have a matching
    //    borrowerName and no member/memberId set. This allows legacy
    //    data (like earlier "hobbit" borrows) to appear, while all
    //    new transactions remain cleanly separated by memberId.
    const transactions = await Transaction.find({
      $or: [
        { member: member._id },
        { memberId: member.memberId },
        {
          borrowerName: member.name,
          member: { $exists: false },
          memberId: { $in: [null, ''] },
        },
      ],
    }).sort({ borrowedDate: -1 });

    const now = new Date();
    let totalFinePaid = 0;
    let returnedBooks = 0;
    let activeBorrowed = 0;
    let overdueBooks = 0;
    let totalBorrowed = 0;

    transactions.forEach((t) => {
      if (t.transactionType === 'borrow') {
        totalBorrowed += 1;
        if (t.status === 'active') {
          activeBorrowed += 1;
          if (t.dueDate && t.dueDate < now) {
            overdueBooks += 1;
          }
        }
      }

      if (t.transactionType === 'return') {
        returnedBooks += 1;
        totalFinePaid += t.fineAmount || 0;
      }
    });

    res.json({
      member,
      stats: {
        currentBorrowed: activeBorrowed,
        totalBorrowed,
        returnedBooks,
        overdueBooks,
        totalFinePaid,
      },
      transactions,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};