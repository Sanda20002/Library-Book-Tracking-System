import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import BookList from './components/BookList';
import BookForm from './components/BookForm';
import BorrowReturn from './components/BorrowReturn';
import Footer from './components/Footer';

function App() {
  return (
    <Router>
      <div className="app-root">
        <Navbar />
        <div className="app-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/books" element={<BookList />} />
            <Route path="/add-book" element={<BookForm />} />
            <Route path="/borrow-return" element={<BorrowReturn />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
        <Footer />
      </div>
    </Router>
  );
}

export default App;