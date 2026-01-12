import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import BookList from './components/BookList';
import BookForm from './components/BookForm';
import BorrowReturn from './components/BorrowReturn';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/books" element={<BookList />} />
            <Route path="/add-book" element={<BookForm />} />
            <Route path="/borrow-return" element={<BorrowReturn />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
        
        {/* Footer */}
        <footer className="mt-12 border-t border-gray-200 bg-white">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center text-gray-600">
              <p>📖 Library Management System</p>
              <p className="mt-2 text-sm">A simple MERN stack application for managing library books</p>
              <p className="mt-4 text-xs text-gray-400">
                Made with ❤️ for library management
              </p>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;