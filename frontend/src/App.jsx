import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import BookList from './components/BookList';
import BookForm from './components/BookForm';
import BorrowReturn from './components/BorrowReturn';
import Footer from './components/Footer';
import { NotificationProvider } from './context/NotificationContext';
import MemberList from './components/MemberList';

function App() {
  return (
    <NotificationProvider>
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
              <Route path="/members" element={<MemberList />}
               />
            </Routes>
          </div>
          <Footer />
        </div>
      </Router>
    </NotificationProvider>
  );
}

export default App;