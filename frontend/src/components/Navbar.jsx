import React from 'react';
import { NavLink } from 'react-router-dom';
import '../styles/Navbar.css';

const Navbar = () => {
  const navItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/books', label: 'Books', icon: '📚' },
    { path: '/add-book', label: 'Add Book', icon: '➕' },
    { path: '/borrow-return', label: 'Borrow/Return', icon: '🔄' },
  ];

  return (
    <nav className="navbar bg-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center navbar-brand">
            <span className="text-2xl font-bold">📖 Library System</span>
          </div>
          
          <div className="hidden md:flex space-x-4 navbar-links">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-2 ${
                    isActive
                      ? 'bg-blue-700 text-white active'
                      : 'text-blue-100 hover:bg-blue-500 hover:text-white'
                  }`
                }
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;