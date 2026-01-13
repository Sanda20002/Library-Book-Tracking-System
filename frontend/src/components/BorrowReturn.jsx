import React, { useState, useEffect } from 'react';
import { bookAPI, transactionAPI } from '../services/api';
import '../styles/BorrowReturn.css';

const BorrowReturn = () => {
  const [activeSection, setActiveSection] = useState('borrow');
  const [books, setBooks] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [activeBorrowings, setActiveBorrowings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [borrowLoading, setBorrowLoading] = useState(false);
  const [returnLoading, setReturnLoading] = useState(false);

  // Borrow form state
  const [borrowForm, setBorrowForm] = useState({
    isbn: '',
    borrowerName: '',
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

  const fetchData = async () => {
    setLoading(true);
    try {
      const [booksRes, transactionsRes, activeRes] = await Promise.all([
        bookAPI.getAll(),
        transactionAPI.getAll(),
        transactionAPI.getActive()
      ]);
      
      setBooks(booksRes.data);
      setTransactions(transactionsRes.data.slice(0, 10)); // Show only recent 10
      setActiveBorrowings(activeRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBorrowChange = (e) => {
    setBorrowForm({
      ...borrowForm,
      [e.target.name]: e.target.value
    });
  };

  const handleReturnChange = (e) => {
    setReturnForm({
      ...returnForm,
      [e.target.name]: e.target.value
    });
  };

  const handleBorrowSubmit = async (e) => {
    e.preventDefault();
    
    if (!borrowForm.isbn || !borrowForm.borrowerName) {
      alert('Please fill in all required fields');
      return;
    }

    setBorrowLoading(true);
    
    try {
      const response = await transactionAPI.borrow(borrowForm);
      alert(`✅ Book borrowed successfully!\nDue Date: ${new Date(response.data.transaction.dueDate).toLocaleDateString()}`);
      setBorrowForm({ isbn: '', borrowerName: '', dueDays: 14 });
      fetchData(); // Refresh data
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error borrowing book';
      alert(`❌ ${errorMessage}`);
    } finally {
      setBorrowLoading(false);
    }
  };

  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    
    if (!returnForm.transactionId) {
      alert('Please select a transaction to return');
      return;
    }

    setReturnLoading(true);
    
    try {
      const response = await transactionAPI.return(returnForm);
      if (response.data.fineAmount > 0) {
        alert(`✅ Book returned successfully!\nFine Amount: Rs. ${response.data.fineAmount}`);
      } else {
        alert('✅ Book returned successfully! No fine charged.');
      }
      setReturnForm({ transactionId: '' });
      fetchData(); // Refresh data
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error returning book';
      alert(`❌ ${errorMessage}`);
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
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading transaction data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="borrow-return-page p-4 md:p-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Borrow & Return Books</h1>
        <p className="text-gray-600 mt-2">Manage book transactions and track borrowing activities</p>
      </div>

      {/* Tabs Navigation */}
      <div className="borrow-tabs flex border-b border-gray-200 mb-8">
        <button
          onClick={() => setActiveSection('borrow')}
          className={`px-6 py-3 font-medium text-sm transition-colors ${
            activeSection === 'borrow'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          aria-current={activeSection === 'borrow' ? 'true' : 'false'}
        >
          📚 Borrow Book
        </button>
        <button
          onClick={() => setActiveSection('return')}
          className={`px-6 py-3 font-medium text-sm transition-colors ${
            activeSection === 'return'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          aria-current={activeSection === 'return' ? 'true' : 'false'}
        >
          🔄 Return Book
        </button>
        <button
          onClick={() => setActiveSection('active')}
          className={`px-6 py-3 font-medium text-sm transition-colors ${
            activeSection === 'active'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          aria-current={activeSection === 'active' ? 'true' : 'false'}
        >
          ⏳ Active Borrowings
        </button>
        <button
          onClick={() => setActiveSection('recent')}
          className={`px-6 py-3 font-medium text-sm transition-colors ${
            activeSection === 'recent'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          aria-current={activeSection === 'recent' ? 'true' : 'false'}
        >
          📝 Recent Transactions
        </button>
      </div>

      {/* Borrow Section */}
      {activeSection === 'borrow' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Borrow Form */}
          <div className="borrow-card bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Borrow a Book</h2>
            <form onSubmit={handleBorrowSubmit}>
              <div className="space-y-6">
                {/* ISBN Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Book ISBN *
                  </label>
                  <div className="relative">
                    <select
                      name="isbn"
                      value={borrowForm.isbn}
                      onChange={handleBorrowChange}
                      required
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                    >
                      <option value="">Select a book...</option>
                      {getAvailableBooks().map((book) => (
                        <option key={book._id} value={book.isbn}>
                          {book.isbn} - {book.title} (Available: {book.availableCopies})
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                      </svg>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Only books with available copies are shown
                  </p>
                </div>

                {/* Borrower Name Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Borrower Name *
                  </label>
                  <input
                    type="text"
                    name="borrowerName"
                    value={borrowForm.borrowerName}
                    onChange={handleBorrowChange}
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter borrower's name"
                  />
                </div>

                {/* Due Days Slider */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Borrowing Period (Days) *
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="range"
                      name="dueDays"
                      min="1"
                      max="30"
                      value={borrowForm.dueDays}
                      onChange={handleBorrowChange}
                      className="flex-1"
                    />
                    <span className="text-lg font-semibold text-blue-600 min-w-[3rem]">
                      {borrowForm.dueDays} days
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Due date: {new Date(Date.now() + borrowForm.dueDays * 24 * 60 * 60 * 1000).toLocaleDateString()}
                  </p>
                </div>

                {/* Available Books Summary */}
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                  <h3 className="font-medium text-blue-800 mb-2">📋 Available Books Summary</h3>
                  <p className="text-sm text-blue-700">
                    {getAvailableBooks().length} book{getAvailableBooks().length !== 1 ? 's' : ''} available for borrowing
                  </p>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={borrowLoading || getAvailableBooks().length === 0}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {borrowLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Available Books</h2>
            {getAvailableBooks().length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">📚</div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No Books Available</h3>
                <p className="text-gray-600">All books are currently borrowed</p>
              </div>
            ) : (
              <div className="borrow-scroll-list space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {getAvailableBooks().map((book) => (
                  <div
                    key={book._id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-800">{book.title}</h3>
                        <p className="text-sm text-gray-600">{book.author}</p>
                        <div className="flex items-center mt-2 space-x-4">
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                            ISBN: {book.isbn}
                          </span>
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            📍 {book.shelfLocation}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">
                          {book.availableCopies}/{book.totalCopies}
                        </div>
                        <div className="text-xs text-gray-500">copies available</div>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Return Form */}
          <div className="return-card bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Return a Book</h2>
            <form onSubmit={handleReturnSubmit}>
              <div className="space-y-6">
                {/* Transaction Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Borrowing Transaction *
                  </label>
                  <div className="relative">
                    <select
                      name="transactionId"
                      value={returnForm.transactionId}
                      onChange={handleReturnChange}
                      required
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                    >
                      <option value="">Select a transaction...</option>
                      {activeBorrowings.map((transaction) => (
                        <option key={transaction._id} value={transaction._id}>
                          {transaction.bookTitle} - Borrowed by {transaction.borrowerName} (Due: {formatDate(transaction.dueDate)})
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                      </svg>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    {activeBorrowings.length} active borrowing{activeBorrowings.length !== 1 ? 's' : ''} found
                  </p>
                </div>

                {/* Selected Transaction Details */}
                {returnForm.transactionId && (() => {
                  const transaction = getSelectedTransaction();
                  if (!transaction) return null;
                  
                  const { isOverdue, daysOverdue, fineAmount } = calculateOverdueDetails(transaction.dueDate);
                  
                  return (
                    <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4">
                      <h3 className="font-medium text-yellow-800 mb-2">📋 Selected Borrowing Details</h3>
                      <div className="space-y-2">
                        <p className="text-sm text-yellow-700">
                          <span className="font-medium">Book:</span> {transaction.bookTitle}
                        </p>
                        <p className="text-sm text-yellow-700">
                          <span className="font-medium">Borrower:</span> {transaction.borrowerName}
                        </p>
                        <p className="text-sm text-yellow-700">
                          <span className="font-medium">Borrowed Date:</span> {formatDate(transaction.borrowedDate)}
                        </p>
                        <p className="text-sm text-yellow-700">
                          <span className="font-medium">Due Date:</span> {formatDate(transaction.dueDate)}
                        </p>
                        {isOverdue && (
                          <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded">
                            <p className="text-sm text-red-600 font-medium">
                              ⚠️ Overdue by {daysOverdue} day{daysOverdue !== 1 ? 's' : ''}
                            </p>
                            <p className="text-sm text-red-600">
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
                  className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {returnLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Active Borrowings</h2>
            {activeBorrowings.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">✅</div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No Active Borrowings</h3>
                <p className="text-gray-600">All books are returned</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {activeBorrowings.map((transaction) => {
                  const { isOverdue, daysOverdue, fineAmount } = calculateOverdueDetails(transaction.dueDate);
                  
                  return (
                    <div
                      key={transaction._id}
                      className={`border rounded-lg p-4 transition-colors ${
                        isOverdue 
                          ? 'border-red-200 bg-red-50 hover:bg-red-100' 
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-gray-800">{transaction.bookTitle}</h3>
                          <p className="text-sm text-gray-600">Borrowed by: {transaction.borrowerName}</p>
                          <div className="flex items-center mt-2 space-x-3">
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              📅 {formatDate(transaction.borrowedDate)}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded ${
                              isOverdue 
                                ? 'bg-red-100 text-red-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              ⏰ Due: {formatDate(transaction.dueDate)}
                            </span>
                          </div>
                        </div>
                        {isOverdue && (
                          <div className="text-right">
                            <div className="text-sm font-bold text-red-600">
                              {daysOverdue} day{daysOverdue !== 1 ? 's' : ''} overdue
                            </div>
                            <div className="text-xs text-red-500">Fine: Rs. {fineAmount}</div>
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
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">All Active Borrowings</h2>
            <div className="text-sm text-gray-500">
              {activeBorrowings.length} active borrowing{activeBorrowings.length !== 1 ? 's' : ''}
            </div>
          </div>

          {activeBorrowings.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-3">No Active Borrowings</h3>
              <p className="text-gray-600 mb-6">All books are currently available in the library</p>
              <a 
                href="/books"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Browse Available Books
              </a>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Book Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Borrower Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dates
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {activeBorrowings.map((transaction) => {
                    const { isOverdue, daysOverdue, fineAmount } = calculateOverdueDetails(transaction.dueDate);
                    
                    return (
                      <tr key={transaction._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{transaction.bookTitle}</div>
                          <div className="text-sm text-gray-500">ISBN: {transaction.isbn}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{transaction.borrowerName}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <div className="mb-1">
                              <span className="font-medium">Borrowed:</span> {formatDate(transaction.borrowedDate)}
                            </div>
                            <div>
                              <span className="font-medium">Due:</span> {formatDate(transaction.dueDate)}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col space-y-2">
                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              isOverdue 
                                ? 'bg-red-100 text-red-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {isOverdue ? `Overdue (${daysOverdue} days)` : 'Active'}
                            </span>
                            {isOverdue && (
                              <span className="text-xs text-red-600 font-medium">
                                Fine: Rs. {fineAmount}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => {
                              setReturnForm({ transactionId: transaction._id });
                              setActiveSection('return');
                            }}
                            className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition-colors"
                          >
                            Return
                          </button>
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
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Recent Transactions</h2>
            <div className="text-sm text-gray-500">
              Last {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
            </div>
          </div>

          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-3">No Transactions Yet</h3>
              <p className="text-gray-600 mb-6">Start borrowing and returning books to see transaction history</p>
              <button
                onClick={() => setActiveSection('borrow')}
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Borrow a Book
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((transaction) => {
                const isBorrow = transaction.transactionType === 'borrow';
                
                return (
                  <div
                    key={transaction._id}
                    className="flex items-center justify-between border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-full ${
                        isBorrow 
                          ? 'bg-blue-100 text-blue-600' 
                          : 'bg-green-100 text-green-600'
                      }`}>
                        {isBorrow ? '📚' : '🔄'}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">{transaction.bookTitle}</h3>
                        <div className="text-sm text-gray-600">
                          {isBorrow ? 'Borrowed' : 'Returned'} by {transaction.borrowerName}
                        </div>
                        <div className="flex items-center mt-2 space-x-3">
                          <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                            ISBN: {transaction.isbn}
                          </span>
                          {!isBorrow && transaction.fineAmount > 0 && (
                            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                              Fine: Rs. {transaction.fineAmount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">
                        {formatDate(transaction.borrowedDate)}
                      </div>
                      {transaction.returnedDate && (
                        <div className="text-xs text-gray-400">
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
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="bg-blue-100 p-2 rounded-lg mr-3">
              <span className="text-blue-600">📚</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Available Books</p>
              <p className="text-lg font-bold">{getAvailableBooks().length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="bg-yellow-100 p-2 rounded-lg mr-3">
              <span className="text-yellow-600">⏳</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Borrowings</p>
              <p className="text-lg font-bold">{activeBorrowings.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="bg-red-100 p-2 rounded-lg mr-3">
              <span className="text-red-600">⚠️</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Overdue Books</p>
              <p className="text-lg font-bold">
                {activeBorrowings.filter(t => calculateOverdueDetails(t.dueDate).isOverdue).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="bg-purple-100 p-2 rounded-lg mr-3">
              <span className="text-purple-600">📊</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Transactions</p>
              <p className="text-lg font-bold">{transactions.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div className="mt-8 bg-blue-50 border border-blue-100 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-3">💡 How to Use This Page</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 border border-blue-100">
            <div className="text-2xl mb-2">📚</div>
            <h4 className="font-medium text-blue-700 mb-2">Borrow Books</h4>
            <p className="text-sm text-blue-600">
              Select an available book, enter borrower details, and set the borrowing period
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-blue-100">
            <div className="text-2xl mb-2">🔄</div>
            <h4 className="font-medium text-blue-700 mb-2">Return Books</h4>
            <p className="text-sm text-blue-600">
              Select an active borrowing to return. Overdue books will incur fines automatically
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-blue-100">
            <div className="text-2xl mb-2">📊</div>
            <h4 className="font-medium text-blue-700 mb-2">Track Activities</h4>
            <p className="text-sm text-blue-600">
              View all active borrowings and recent transactions to monitor library activities
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BorrowReturn;