import React, { useState, useEffect } from 'react';
import { transactionAPI } from '../services/api';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalBooks: 0,
    availableBooks: 0,
    borrowedBooks: 0,
    totalTransactions: 0,
    activeBorrowings: 0,
    overdueBorrowings: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await transactionAPI.getDashboard();
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Books',
      value: stats.totalBooks,
      icon: '📚',
      colorClass: 'blue'
    },
    {
      title: 'Available Books',
      value: stats.availableBooks,
      icon: '✅',
      colorClass: 'green'
    },
    {
      title: 'Borrowed Books',
      value: stats.borrowedBooks,
      icon: '📖',
      colorClass: 'yellow'
    },
    {
      title: 'Active Borrowings',
      value: stats.activeBorrowings,
      icon: '⏳',
      colorClass: 'purple'
    },
    {
      title: 'Overdue Books',
      value: stats.overdueBorrowings,
      icon: '⚠️',
      colorClass: 'red'
    },
    {
      title: 'Total Transactions',
      value: stats.totalTransactions,
      icon: '📊',
      colorClass: 'indigo'
    }
  ];

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Library Dashboard</h1>
        <p>Overview of library activities and statistics</p>
      </div>

      <div className="stats-grid">
        {statCards.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className="stat-card-inner">
              <div className="stat-info">
                <h3>{stat.title}</h3>
                <p className="stat-value">{stat.value}</p>
              </div>
              <div className={`stat-icon ${stat.colorClass}`}>
                <span>{stat.icon}</span>
              </div>
            </div>
            <div className="stat-progress">
              <div
                className={`stat-progress-bar ${stat.colorClass}`}
                style={{ width: `${Math.min((stat.value / (stats.totalBooks || 1)) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      <div className="quick-actions-section">
        <div className="quick-actions-card">
          <h2 className="quick-actions-title">Quick Actions</h2>
          <div className="quick-actions-grid">
            <a href="/add-book" className="quick-action-link blue">
              <div className="quick-action-content">
                <span className="quick-action-icon">➕</span>
                <div className="quick-action-text">
                  <h3>Add New Book</h3>
                  <p>Add a new book to the library</p>
                </div>
              </div>
            </a>
            <a href="/borrow-return" className="quick-action-link green">
              <div className="quick-action-content">
                <span className="quick-action-icon">🔄</span>
                <div className="quick-action-text">
                  <h3>Borrow/Return</h3>
                  <p>Manage book transactions</p>
                </div>
              </div>
            </a>
            <a href="/books" className="quick-action-link purple">
              <div className="quick-action-content">
                <span className="quick-action-icon">📚</span>
                <div className="quick-action-text">
                  <h3>View All Books</h3>
                  <p>Browse library catalog</p>
                </div>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

//export Dashboard component
export default Dashboard;