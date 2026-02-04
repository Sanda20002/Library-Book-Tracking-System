import React, { useState, useEffect } from 'react';
import { bookAPI, transactionAPI, memberAPI } from '../services/api';
import { useNotification } from '../context/NotificationContext';
import '../styles/BorrowReturn.css';

// Main BorrowReturn Component
const BorrowReturn = () => {
  const [activeSection, setActiveSection] = useState('borrow');
  const [books, setBooks] = useState([]);
  const [members, setMembers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [activeBorrowings, setActiveBorrowings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [borrowLoading, setBorrowLoading] = useState(false);
  const [returnLoading, setReturnLoading] = useState(false);
  const [emailSendingId, setEmailSendingId] = useState(null);
  const { showNotification } = useNotification();

  // Borrow form state
  const [borrowForm, setBorrowForm] = useState({
    isbn: '',
    memberId: '',
    dueDays: 14
  });

  // Return form state
  const [returnForm, setReturnForm] = useState({
    transactionId: ''
  });

  // Fetch all data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  // Fetch books, members, transactions, and active borrowings
  const fetchData = async () => {
    setLoading(true);
    try {
      // Always load books; this drives the dropdown
      const booksRes = await bookAPI.getAll();

      // Load members for borrower selection
      let membersRes;
      try {
        membersRes = await memberAPI.getAll();
      } catch (error) {
        console.error('Error fetching members:', error);
      }

      // Load all transactions, but don't break if this fails
      let transactionsRes;
      try {
        transactionsRes = await transactionAPI.getAll();
      } catch (error) {
        console.error('Error fetching transactions:', error);
      }

      // Load active borrowings separately so a failure here
      // does not stop books from showing
      let activeRes;
      try {
        activeRes = await transactionAPI.getActive();
      } catch (error) {
        console.error('Error fetching active borrowings:', error);
      }

      setBooks(booksRes.data || []);
      setMembers(membersRes?.data || []);
      setTransactions((transactionsRes?.data || []).slice(0, 10)); // Show only recent 10
      setActiveBorrowings(activeRes?.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      showNotification('Failed to load data. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  //Handle form input changes
  const handleBorrowChange = (e) => {
    setBorrowForm({
      ...borrowForm,
      [e.target.name]: e.target.value
    });
  };

  //Handle return form input changes
  const handleReturnChange = (e) => {
    setReturnForm({
      ...returnForm,
      [e.target.name]: e.target.value
    });
  };

  //Handle borrow form submission
  const handleBorrowSubmit = async (e) => {
    e.preventDefault();
    
    if (!borrowForm.isbn || !borrowForm.memberId) {
      showNotification('Please fill in all required fields.', 'warning');
      return;
    }

    //Find selected member details
    const selectedMember = members.find((m) => m._id === borrowForm.memberId);
    if (!selectedMember) {
      showNotification('Selected member not found. Please refresh and try again.', 'error');
      return;
    }

    setBorrowLoading(true);
    
    try {
      const payload = {
        isbn: borrowForm.isbn,
        memberId: borrowForm.memberId,
        borrowerName: selectedMember.name,
        dueDays: borrowForm.dueDays,
      };

      const response = await transactionAPI.borrow(payload);
      const dueDate = new Date(response.data.transaction.dueDate).toLocaleDateString();
      showNotification(`Book borrowed successfully! Due Date: ${dueDate}`, 'success');
      setBorrowForm({ isbn: '', memberId: '', dueDays: 14 });
      fetchData(); // Refresh data
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error borrowing book';
      showNotification(errorMessage, 'error');
    } finally {
      setBorrowLoading(false);
    }
  };

  //Handle return form submission
  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    
    if (!returnForm.transactionId) {
      showNotification('Please select a transaction to return.', 'warning');
      return;
    }

    setReturnLoading(true);
    
    try {
      const response = await transactionAPI.return(returnForm);
      if (response.data.fineAmount > 0) {
        showNotification(`Book returned successfully! Fine Amount: Rs. ${response.data.fineAmount}`, 'success');
      } else {
        showNotification('Book returned successfully! No fine charged.', 'success');
      }
      setReturnForm({ transactionId: '' });
      fetchData(); // Refresh data
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error returning book';
      showNotification(errorMessage, 'error');
    } finally {
      setReturnLoading(false);
    }
  };

  const getAvailableBooks = () => {
    return books.filter(book => book.availableCopies > 0);
  };

  // Get transaction details by ID
  const getSelectedTransaction = () => {
    return activeBorrowings.find(t => t._id === returnForm.transactionId);
  };

  // Calculate overdue days and fine
  const calculateOverdueDetails = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const isOverdue = today > due;
    const daysOverdue = isOverdue 
      ? Math.ceil((today - due) / (1000 * 60 * 60 * 24))
      : 0;
    const fineAmount = daysOverdue * 100; // Rs. 100 per day
    
    return { isOverdue, daysOverdue, fineAmount };
  };

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div className="loading-spinner-large"></div>
        <p className="loading-text">Loading transaction data...</p>
      </div>
    );
  }

  return (
    <div className="borrow-return">
      {/* Page Header */}
      <div className="page-header">
        <h1>Borrow & Return Books</h1>
        <p>Manage book transactions and track borrowing activities</p>
      </div>

      {/* Tabs Navigation */}
      <div className="tabs-container">
        <button
          onClick={() => setActiveSection('borrow')}
          className={`tab-btn ${activeSection === 'borrow' ? 'tab-active' : ''}`}
        >
          📚 Borrow Book
        </button>
        <button
          onClick={() => setActiveSection('return')}
          className={`tab-btn ${activeSection === 'return' ? 'tab-active' : ''}`}
        >
          🔄 Return Book
        </button>
        <button
          onClick={() => setActiveSection('active')}
          className={`tab-btn ${activeSection === 'active' ? 'tab-active' : ''}`}
        >
          ⏳ Active Borrowings
        </button>
        <button
          onClick={() => setActiveSection('recent')}
          className={`tab-btn ${activeSection === 'recent' ? 'tab-active' : ''}`}
        >
          📝 Recent Transactions
        </button>
      </div>

      {/* Borrow Section */}
      {activeSection === 'borrow' && (
        <div className="section-grid">
          {/* Borrow Form */}
          <div className="section-card">
            <h2>Borrow a Book</h2>
            <form onSubmit={handleBorrowSubmit}>
              <div className="transaction-form">
                {/* ISBN Selection */}
                <div className="form-field">
                  <label className="field-label">
                    Book ISBN *
                  </label>
                  <div>
                    <select
                      name="isbn"
                      value={borrowForm.isbn}
                      onChange={handleBorrowChange}
                      required
                      className="field-select"
                    >
                      <option value="">Select a book...</option>
                      {getAvailableBooks().map((book) => (
                        <option key={book._id} value={book.isbn}>
                          {book.isbn} - {book.title} (Available: {book.availableCopies})
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="field-hint">
                    Only books with available copies are shown
                  </p>
                </div>

                {/* Borrower Selection */}
                <div className="form-field">
                  <label className="field-label">
                    Borrower *
                  </label>
                  <div>
                    <select
                      name="memberId"
                      value={borrowForm.memberId}
                      onChange={handleBorrowChange}
                      required
                      className="field-select"
                    >
                      <option value="">Select a member...</option>
                      {members.map((member) => (
                        <option key={member._id} value={member._id}>
                          {member.memberId} - {member.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="field-hint">
                    Only registered members can borrow books
                  </p>
                </div>

                {/* Due Days Slider */}
                <div className="form-field">
                  <label className="field-label">
                    Borrowing Period (Days) *
                  </label>
                  <div className="range-wrapper">
                    <input
                      type="range"
                      name="dueDays"
                      min="1"
                      max="30"
                      value={borrowForm.dueDays}
                      onChange={handleBorrowChange}
                      className="range-slider"
                    />
                    <span className="range-value">
                      {borrowForm.dueDays} days
                    </span>
                  </div>
                  <p className="field-hint">
                    Due date: {new Date(Date.now() + borrowForm.dueDays * 24 * 60 * 60 * 1000).toLocaleDateString()}
                  </p>
                </div>

                {/* Available Books Summary */}
                <div className="info-box blue">
                  <h3>📋 Available Books Summary</h3>
                  <p>
                    {getAvailableBooks().length} book{getAvailableBooks().length !== 1 ? 's' : ''} available for borrowing
                  </p>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={borrowLoading || getAvailableBooks().length === 0}
                  className="submit-btn blue"
                >
                  {borrowLoading ? (
                    <>
                      <span className="btn-spinner"></span>
                      Processing...
                    </>
                  ) : (
                    'Borrow Book'
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Available Books List */}
          <div className="section-card">
            <h2>Available Books</h2>
            {getAvailableBooks().length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📚</div>
                <h3 className="empty-title">No Books Available</h3>
                <p className="empty-description">All books are currently borrowed</p>
              </div>
            ) : (
              <div className="list-container">
                {getAvailableBooks().map((book) => (
                  <div
                    key={book._id}
                    className="list-item"
                  >
                    <div className="list-item-header">
                      <div>
                        <h3>{book.title}</h3>
                        <p>{book.author}</p>
                        <div className="list-item-badges">
                          <span className="badge green">ISBN: {book.isbn}</span>
                          <span className="badge blue">📍 {book.shelfLocation}</span>
                        </div>
                      </div>
                      <div className="list-item-meta">
                        <div className="badge green">
                          {book.availableCopies}/{book.totalCopies} copies
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Return Section */}
      {activeSection === 'return' && (
        <div className="section-grid">
          {/* Return Form */}
          <div className="section-card">
            <h2>Return a Book</h2>
            <form onSubmit={handleReturnSubmit}>
              <div className="transaction-form">
                {/* Transaction Selection */}
                <div className="form-field">
                  <label className="field-label">
                    Select Borrowing Transaction *
                  </label>
                  <div>
                    <select
                      name="transactionId"
                      value={returnForm.transactionId}
                      onChange={handleReturnChange}
                      required
                      className="field-select"
                    >
                      <option value="">Select a transaction...</option>
                      {activeBorrowings.map((transaction) => (
                        <option key={transaction._id} value={transaction._id}>
                          {transaction.bookTitle} - Borrowed by {transaction.borrowerName} (Due: {formatDate(transaction.dueDate)})
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="field-hint">
                    {activeBorrowings.length} active borrowing{activeBorrowings.length !== 1 ? 's' : ''} found
                  </p>
                </div>

                {/* Selected Transaction Details */}
                {returnForm.transactionId && (() => {
                  const transaction = getSelectedTransaction();
                  if (!transaction) return null;
                  
                  const { isOverdue, daysOverdue, fineAmount } = calculateOverdueDetails(transaction.dueDate);
                  
                  return (
                    <div className="info-box yellow">
                      <h3>📋 Selected Borrowing Details</h3>
                      <div>
                        <p>
                          <span className="font-medium">Book:</span> {transaction.bookTitle}
                        </p>
                        <p>
                          <span className="font-medium">Borrower:</span> {transaction.borrowerName}
                        </p>
                        <p>
                          <span className="font-medium">Borrowed Date:</span> {formatDate(transaction.borrowedDate)}
                        </p>
                        <p>
                          <span className="font-medium">Due Date:</span> {formatDate(transaction.dueDate)}
                        </p>
                        {isOverdue && (
                          <div className="info-box red" style={{ marginTop: '0.75rem' }}>
                            <p>
                              ⚠️ Overdue by {daysOverdue} day{daysOverdue !== 1 ? 's' : ''}
                            </p>
                            <p>
                              Fine Amount: <span className="font-bold">Rs. {fineAmount}</span>
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={returnLoading || activeBorrowings.length === 0}
                  className="submit-btn green"
                >
                  {returnLoading ? (
                    <>
                      <span className="btn-spinner"></span>
                      Processing Return...
                    </>
                  ) : (
                    'Return Book'
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Active Borrowings List */}
          <div className="section-card">
            <h2>Active Borrowings</h2>
            {activeBorrowings.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">✅</div>
                <h3 className="empty-title">No Active Borrowings</h3>
                <p className="empty-description">All books are returned</p>
              </div>
            ) : (
              <div className="list-container">
                {activeBorrowings.map((transaction) => {
                  const { isOverdue, daysOverdue, fineAmount } = calculateOverdueDetails(transaction.dueDate);
                  
                  return (
                    <div
                      key={transaction._id}
                      className={`list-item ${isOverdue ? 'overdue' : ''}`}
                    >
                      <div className="list-item-header">
                        <div>
                          <h3>{transaction.bookTitle}</h3>
                          <p>Borrowed by: {transaction.borrowerName}</p>
                          <div className="list-item-badges">
                            <span className="badge blue">📅 {formatDate(transaction.borrowedDate)}</span>
                            <span className={`badge ${isOverdue ? 'red' : 'green'}`}>
                              ⏰ Due: {formatDate(transaction.dueDate)}
                            </span>
                          </div>
                        </div>
                        {isOverdue && (
                          <div className="list-item-meta">
                            <div className="badge red">
                              {daysOverdue} day{daysOverdue !== 1 ? 's' : ''} overdue - Fine: Rs. {fineAmount}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Active Borrowings Section */}
      {activeSection === 'active' && (
        <div className="section-card">
          <div className="section-card-header">
            <h2>All Active Borrowings</h2>
            <div className="section-card-sub">
              {activeBorrowings.length} active borrowing{activeBorrowings.length !== 1 ? 's' : ''}
            </div>
          </div>

          {activeBorrowings.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📚</div>
              <h3 className="empty-title">No Active Borrowings</h3>
              <p className="empty-description">All books are currently available in the library</p>
              <a 
                href="/books"
                className="empty-action-btn"
              >
                Browse Available Books
              </a>
            </div>
          ) : (
            <div className="table-view">
              <table className="transaction-table active-borrowings-table">
                <thead>
                  <tr>
                    <th>Book Details</th>
                    <th>Borrower Info</th>
                    <th>Dates</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activeBorrowings.map((transaction) => {
                    const { isOverdue, daysOverdue, fineAmount } = calculateOverdueDetails(transaction.dueDate);
                    
                    return (
                      <tr key={transaction._id}>
                        <td>
                          <div className="table-book-title">{transaction.bookTitle}</div>
                          <div className="table-book-sub">ISBN: {transaction.isbn}</div>
                        </td>
                        <td>
                          <div className="table-book-title">{transaction.borrowerName}</div>
                        </td>
                        <td>
                          <div>
                            <div>
                              <span className="font-medium">Borrowed:</span> {formatDate(transaction.borrowedDate)}
                            </div>
                            <div>
                              <span className="font-medium">Due:</span> {formatDate(transaction.dueDate)}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div>
                            <span className={`badge ${isOverdue ? 'red' : 'green'}`}>
                              {isOverdue ? `Overdue (${daysOverdue} days)` : 'Active'}
                            </span>
                            {isOverdue && (
                              <span className="table-book-sub">
                                Fine: Rs. {fineAmount}
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="table-actions">
                            <button
                              onClick={() => {
                                setReturnForm({ transactionId: transaction._id });
                                setActiveSection('return');
                              }}
                              className="return-btn"
                            >
                              Return
                            </button>
                            <button
                              className="email-btn"
                              disabled={emailSendingId === transaction._id}
                              onClick={async () => {
                                try {
                                  setEmailSendingId(transaction._id);
                                  await transactionAPI.sendOverdueEmail(transaction._id);
                                  showNotification('Overdue email sent successfully.', 'success');
                                } catch (error) {
                                  const msg = error.response?.data?.message || 'Failed to send overdue email.';
                                  showNotification(msg, 'error');
                                } finally {
                                  setEmailSendingId(null);
                                }
                              }}
                            >
                              {emailSendingId === transaction._id ? 'Sending...' : 'Send Email'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Recent Transactions Section */}
      {activeSection === 'recent' && (
        <div className="section-card">
          <div className="section-card-header">
            <h2>Recent Transactions</h2>
            <div className="section-card-sub">
              Last {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
            </div>
          </div>

          {transactions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <h3 className="empty-title">No Transactions Yet</h3>
              <p className="empty-description">Start borrowing and returning books to see transaction history</p>
              <button
                onClick={() => setActiveSection('borrow')}
                className="empty-action-btn"
              >
                Borrow a Book
              </button>
            </div>
          ) : (
            <div className="list-container">
              {transactions.map((transaction) => {
                const isBorrow = transaction.transactionType === 'borrow';
                
                return (
                  <div
                    key={transaction._id}
                    className="list-item"
                  >
                    <div className="list-item-header">
                      <div className={`stat-icon-small ${isBorrow ? 'blue' : 'green'}`}>
                        {isBorrow ? '📚' : '🔄'}
                      </div>
                      <div>
                        <h3>{transaction.bookTitle}</h3>
                        <div className="table-book-sub">
                          {isBorrow ? 'Borrowed' : 'Returned'} by {transaction.borrowerName}
                        </div>
                        <div className="list-item-badges">
                          <span className="badge blue">ISBN: {transaction.isbn}</span>
                          {!isBorrow && transaction.fineAmount > 0 && (
                            <span className="badge red">Fine: Rs. {transaction.fineAmount}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="list-item-meta">
                      <div className="table-book-sub">
                        {formatDate(transaction.borrowedDate)}
                      </div>
                      {transaction.returnedDate && (
                        <div className="table-book-sub">
                          Returned: {formatDate(transaction.returnedDate)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Quick Stats Footer */}
      <div className="stats-footer">
        <div className="stat-card-small">
          <div className="stat-icon-small blue">
            📚
          </div>
          <div className="stat-content-small">
            <p>Available Books</p>
            <div className="stat-value-small">{getAvailableBooks().length}</div>
          </div>
        </div>
        <div className="stat-card-small">
          <div className="stat-icon-small yellow">
            ⏳
          </div>
          <div className="stat-content-small">
            <p>Active Borrowings</p>
            <div className="stat-value-small">{activeBorrowings.length}</div>
          </div>
        </div>
        <div className="stat-card-small">
          <div className="stat-icon-small red">
            ⚠️
          </div>
          <div className="stat-content-small">
            <p>Overdue Books</p>
            <div className="stat-value-small">
              {activeBorrowings.filter(t => calculateOverdueDetails(t.dueDate).isOverdue).length}
            </div>
          </div>
        </div>
        <div className="stat-card-small">
          <div className="stat-icon-small purple">
            📊
          </div>
          <div className="stat-content-small">
            <p>Total Transactions</p>
            <div className="stat-value-small">{transactions.length}</div>
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div className="help-section">
        <h3>
          <span className="help-icon">💡</span>
          How to Use This Page
        </h3>
        <div className="help-grid">
          <div className="help-card">
            <span className="help-card-icon">📚</span>
            <h4>Borrow Books</h4>
            <p>
              Select an available book, enter borrower details, and set the borrowing period
            </p>
          </div>
          <div className="help-card">
            <span className="help-card-icon">🔄</span>
            <h4>Return Books</h4>
            <p>
              Select an active borrowing to return. Overdue books will incur fines automatically
            </p>
          </div>
          <div className="help-card">
            <span className="help-card-icon">📊</span>
            <h4>Track Activities</h4>
            <p>
              View all active borrowings and recent transactions to monitor library activities
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

//export the component
export default BorrowReturn;