import React, { useState, useEffect } from 'react';
import { memberAPI } from '../services/api';
import { useNotification } from '../context/NotificationContext';
import '../styles/MemberList.css';

const MemberList = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [selectedMemberSummary, setSelectedMemberSummary] = useState(null);
  const [summaryLoadingId, setSummaryLoadingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  const { showNotification } = useNotification();

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const response = await memberAPI.getAll();
      setMembers(response.data);
      setError('');
    } catch (error) {
      console.error('Error fetching members:', error);
      setError('Failed to load members. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchMembers();
      return;
    }
    
    try {
      const response = await memberAPI.search(searchQuery);
      setMembers(response.data);
      setError('');
    } catch (error) {
      console.error('Error searching members:', error);
      setError('Search failed. Please try again.');
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await memberAPI.register(formData);
      alert('Member registered successfully!');
      setShowForm(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        address: ''
      });
      fetchMembers();
    } catch (error) {
      setError(error.response?.data?.message || 'Error registering member');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this member?')) {
      try {
        await memberAPI.delete(id);
        fetchMembers();
        alert('Member deleted successfully');
      } catch (error) {
        console.error('Error deleting member:', error);
        setError('Failed to delete member. Please try again.');
      }
    }
  };

  const clearError = () => {
    setError('');
  };

   const handleViewSummary = async (memberId) => {
    try {
      setSummaryLoadingId(memberId);
      const response = await memberAPI.getSummary(memberId);
      setSelectedMemberSummary(response.data);
    } catch (error) {
      console.error('Error fetching member summary:', error);
      showNotification('Failed to load member summary. Please try again.', 'error');
    } finally {
      setSummaryLoadingId(null);
    }
  };

  const closeSummary = () => {
    setSelectedMemberSummary(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) return (
    <div className="loading-container">
      <div className="loading-text">Loading members...</div>
    </div>
  );

  return (
    <div className="member-container">
      <div className="member-header">
        <h1 className="member-title">Member Management</h1>
        <div className="member-search-container">
          <input
            type="text"
            placeholder="Search members by name, email, or ID..."
            className="member-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            onClick={handleSearch}
            className="member-search-btn"
          >
            Search
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="member-add-btn"
          >
            {showForm ? 'Cancel' : 'Add Member'}
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <span>{error}</span>
          <button onClick={clearError} className="close-alert">×</button>
        </div>
      )}

      {showForm && (
        <div className="member-form-container">
          <h2 className="member-form-title">Register New Member</h2>
          <form onSubmit={handleRegister} className="member-form">
            <div className="form-group">
              <label className="form-label">
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="form-input"
                placeholder="John Doe"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="form-input"
                placeholder="john@example.com"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Phone *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                required
                className="form-input"
                placeholder="+1 234 567 8900"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Address
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="form-input"
                placeholder="123 Main St, City"
              />
            </div>

            <button
              type="submit"
              className="form-submit-btn"
            >
              Register Member
            </button>
          </form>
        </div>
      )}

      <div className="member-table-container">
        <table className="member-table">
          <thead>
            <tr>
              <th>Member ID</th>
              <th>Name</th>
              <th>Contact</th>
              <th>Status</th>
              <th>Borrowed</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty-state">
                  <div className="empty-state-icon">👤</div>
                  <p className="empty-state-text">No members found</p>
                </td>
              </tr>
            ) : (
              members.map((member) => (
                <tr key={member._id}>
                  <td>
                    <div className="member-id">{member.memberId}</div>
                  </td>
                  <td>
                    <div className="member-name">{member.name}</div>
                    <div className="member-email">{member.email}</div>
                  </td>
                  <td>
                    <div className="member-phone">{member.phone}</div>
                    {member.address && (
                      <div className="member-address" title={member.address}>
                        {member.address}
                      </div>
                    )}
                  </td>
                  <td>
                    <span className={`status-badge ${
                      member.membershipStatus === 'active' 
                        ? 'status-active'
                        : member.membershipStatus === 'suspended'
                        ? 'status-suspended'
                        : 'status-expired'
                    }`}>
                      {member.membershipStatus}
                    </span>
                  </td>
                  <td>
                    <div className="borrowed-count">
                      {member.borrowedBooks} / {member.totalBorrowed}
                    </div>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        onClick={() => handleViewSummary(member._id)}
                        className="summary-btn"
                        disabled={summaryLoadingId === member._id}
                      >
                        {summaryLoadingId === member._id ? 'Loading...' : 'View Summary'}
                      </button>
                      <button
                        onClick={() => handleDelete(member._id)}
                        className="delete-btn"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedMemberSummary && (
        <div className="member-summary-modal">
          <div className="member-summary-content">
            <h3>Member Summary</h3>
            <p className="member-summary-name">
              <strong>{selectedMemberSummary.member.name}</strong>{' '}
              <span className="member-summary-id">({selectedMemberSummary.member.memberId})</span>
            </p>
            <p>Email: {selectedMemberSummary.member.email}</p>
            <p>Phone: {selectedMemberSummary.member.phone}</p>
            {selectedMemberSummary.member.address && (
              <p>Address: {selectedMemberSummary.member.address}</p>
            )}
            <hr />
            <p>Current Borrowed: {selectedMemberSummary.stats.currentBorrowed}</p>
            <p>Total Borrowed: {selectedMemberSummary.stats.totalBorrowed}</p>
            <p>Returned Books: {selectedMemberSummary.stats.returnedBooks}</p>
            <p>Overdue Books: {selectedMemberSummary.stats.overdueBooks}</p>
            <p>
              Total Fine Amount: 
              <strong> Rs.{selectedMemberSummary.stats.totalFinePaid.toFixed(2)}</strong>
            </p>

            <h4 className="member-summary-subtitle">Borrowed Books</h4>
            {selectedMemberSummary.transactions && selectedMemberSummary.transactions.length > 0 ? (
              <div className="member-summary-transactions">
                <table>
                  <thead>
                    <tr>
                      <th>Book</th>
                      <th>Status</th>
                      <th>Borrowed</th>
                      <th>Due</th>
                      <th>Returned</th>
                      <th>Fine</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedMemberSummary.transactions.map((t) => (
                      <tr key={t._id}>
                        <td>{t.bookTitle}</td>
                        <td className={`member-summary-status member-summary-status-${t.status}`}>
                          {t.status}
                        </td>
                        <td>{formatDate(t.borrowedDate)}</td>
                        <td>{formatDate(t.dueDate)}</td>
                        <td>{formatDate(t.returnedDate)}</td>
                        <td>{t.fineAmount ? `₹${t.fineAmount.toFixed(2)}` : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>No borrowing history available for this member.</p>
            )}
            <button className="summary-close-btn" onClick={closeSummary}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

//export the component
export default MemberList;