import React from 'react';
import '../styles/Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-section footer-brand">
          <h2>City Library - Diyathalwa</h2>
         
          <p className="footer-tagline">Reading today, leading tomorrow.</p>
        </div>

        <div className="footer-section">
          <h3>Library Hours</h3>
          <ul>
            <li><span>Mon – Fri:</span> 9:00 AM – 7:00 PM</li>
            <li><span>Saturday:</span> 10:00 AM – 5:00 PM</li>
            <li><span>Sunday & Public Holidays:</span> Closed</li>
          </ul>
        </div>

        <div className="footer-section">
          <h3>Contact</h3>
          <ul>
            <li><span>Address:</span> No.123 , Haputhale road , Diyathalawa</li>
            <li><span>Phone:</span> +94 57 234 5678</li>
            <li><span>Email:</span> citylibrary@gmail.com</li>
          </ul>
        </div>

        <div className="footer-section">
          <h3>Quick Links</h3>
          <ul>
            <li><a href="/books">Browse Books</a></li>
            <li><a href="/add-book">Add New Book</a></li>
            <li><a href="/borrow-return">Borrow & Return</a></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-bottom-left">
          &copy; {currentYear} City Central Library. All rights reserved.
        </div>
        <div className="footer-bottom-right">
          <span>Powered by Library Management System</span>
        </div>
      </div>
    </footer>
  );
};

//export the component
export default Footer;
