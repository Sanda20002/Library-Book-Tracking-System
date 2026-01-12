import React, { useState, useEffect } from 'react';
import { transactionAPI } from '../services/api';

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
      color: 'bg-blue-500',
      textColor: 'text-blue-500'
    },
    {
      title: 'Available Books',
      value: stats.availableBooks,
      icon: '✅',
      color: 'bg-green-500',
      textColor: 'text-green-500'
    },
    {
      title: 'Borrowed Books',
      value: stats.borrowedBooks,
      icon: '📖',
      color: 'bg-yellow-500',
      textColor: 'text-yellow-500'
    },
    {
      title: 'Active Borrowings',
      value: stats.activeBorrowings,
      icon: '⏳',
      color: 'bg-purple-500',
      textColor: 'text-purple-500'
    },
    {
      title: 'Overdue Books',
      value: stats.overdueBorrowings,
      icon: '⚠️',
      color: 'bg-red-500',
      textColor: 'text-red-500'
    },
    {
      title: 'Total Transactions',
      value: stats.totalTransactions,
      icon: '📊',
      color: 'bg-indigo-500',
      textColor: 'text-indigo-500'
    }
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Library Dashboard</h1>
        <p className="text-gray-600 mt-2">Overview of library activities and statistics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">{stat.title}</p>
                <p className="text-3xl font-bold mt-2">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-full`}>
                <span className="text-2xl">{stat.icon}</span>
              </div>
            </div>
            <div className="mt-4">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${stat.color} rounded-full`}
                  style={{ width: `${Math.min((stat.value / (stats.totalBooks || 1)) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a href="/add-book" className="block p-4 bg-blue-50 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors">
              <div className="flex items-center">
                <span className="text-2xl mr-3">➕</span>
                <div>
                  <h3 className="font-semibold text-blue-700">Add New Book</h3>
                  <p className="text-sm text-blue-600">Add a new book to the library</p>
                </div>
              </div>
            </a>
            <a href="/borrow-return" className="block p-4 bg-green-50 rounded-lg border border-green-100 hover:bg-green-100 transition-colors">
              <div className="flex items-center">
                <span className="text-2xl mr-3">🔄</span>
                <div>
                  <h3 className="font-semibold text-green-700">Borrow/Return</h3>
                  <p className="text-sm text-green-600">Manage book transactions</p>
                </div>
              </div>
            </a>
            <a href="/books" className="block p-4 bg-purple-50 rounded-lg border border-purple-100 hover:bg-purple-100 transition-colors">
              <div className="flex items-center">
                <span className="text-2xl mr-3">📚</span>
                <div>
                  <h3 className="font-semibold text-purple-700">View All Books</h3>
                  <p className="text-sm text-purple-600">Browse library catalog</p>
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