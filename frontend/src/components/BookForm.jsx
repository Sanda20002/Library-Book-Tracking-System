import React, { useState } from 'react';
import { bookAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import '../styles/BookForm.css';

//component to add a new book
const BookForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    genre: '',
    shelfLocation: '',
    totalCopies: 1,
    availableCopies: 1,
    status: 'available'
  });
  
  // loading state and error state
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { showNotification } = useNotification();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'totalCopies' || name === 'availableCopies' ? parseInt(value) || 0 : value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.author.trim()) newErrors.author = 'Author is required';
    if (!formData.shelfLocation.trim()) newErrors.shelfLocation = 'Shelf location is required';
    if (formData.totalCopies < 1) newErrors.totalCopies = 'Must have at least 1 copy';
    if (formData.availableCopies < 0) newErrors.availableCopies = 'Cannot be negative';
    if (formData.availableCopies > formData.totalCopies) {
      newErrors.availableCopies = 'Available copies cannot exceed total copies';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      await bookAPI.add(formData);
      showNotification('Book added successfully!', 'success');
      navigate('/books');
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error adding book';
      showNotification(errorMessage, 'error');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      title: '',
      author: '',
      genre: '',
      shelfLocation: '',
      totalCopies: 1,
      availableCopies: 1,
      status: 'available'
    });
    setErrors({});
  };

  return (
    <div className="book-form">
      <div className="form-header">
        <h1>Add New Book</h1>
        <p>Fill in the details to add a new book to the library</p>
      </div>

      <div className="form-card">
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
              {/* ISBN */}
              <div className="form-group">
                <label className="form-label">
                  ISBN
                </label>
                <input
                  type="text"
                  className="form-input"
                  value="Will be generated automatically when the book is saved"
                  disabled
                />
              </div>

              {/* Title */}
              <div className="form-group">
                <label className="form-label">
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className={`form-input ${errors.title ? 'error' : ''}`}
                  placeholder="Book Title"
                />
                {errors.title && (
                  <p className="error-message">{errors.title}</p>
                )}
              </div>

              {/* Author */}
              <div className="form-group">
                <label className="form-label">
                  Author *
                </label>
                <input
                  type="text"
                  name="author"
                  value={formData.author}
                  onChange={handleChange}
                  className={`form-input ${errors.author ? 'error' : ''}`}
                  placeholder="Author Name"
                />
                {errors.author && (
                  <p className="error-message">{errors.author}</p>
                )}
              </div>

              {/* Genre */}
              <div className="form-group">
                <label className="form-label">
                  Genre
                </label>
                <select
                  name="genre"
                  value={formData.genre}
                  onChange={handleChange}
                  className="form-select"
                >
                  <option value="">Select genre (optional)</option>
                  <option value="Fiction">Fiction</option>
                  <option value="Non-Fiction">Non-Fiction</option>
                  <option value="Science">Science</option>
                  <option value="History">History</option>
                  <option value="Biography">Biography</option>
                  <option value="Children">Children</option>
                  <option value="Fantasy">Fantasy</option>
                  <option value="Mystery">Mystery</option>
                  <option value="Romance">Romance</option>
                  <option value="Technology">Technology</option>
                </select>
              </div>

              {/* Shelf Location */}
              <div className="form-group">
                <label className="form-label">
                  Shelf Location *
                </label>
                <input
                  type="text"
                  name="shelfLocation"
                  value={formData.shelfLocation}
                  onChange={handleChange}
                  className={`form-input ${errors.shelfLocation ? 'error' : ''}`}
                  placeholder="A-12, B-5, etc."
                />
                {errors.shelfLocation && (
                  <p className="error-message">{errors.shelfLocation}</p>
                )}
              </div>

              {/* Status */}
              <div className="form-group">
                <label className="form-label">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="form-select"
                >
                  <option value="available">Available</option>
                  <option value="borrowed">Borrowed</option>
                </select>
              </div>

              {/* Total Copies */}
              <div className="form-group">
                <label className="form-label">
                  Total Copies *
                </label>
                <input
                  type="number"
                  name="totalCopies"
                  value={formData.totalCopies}
                  onChange={handleChange}
                  min="1"
                  className={`form-input ${errors.totalCopies ? 'error' : ''}`}
                />
                {errors.totalCopies && (
                  <p className="error-message">{errors.totalCopies}</p>
                )}
              </div>

              {/* Available Copies */}
              <div className="form-group">
                <label className="form-label">
                  Available Copies *
                </label>
                <input
                  type="number"
                  name="availableCopies"
                  value={formData.availableCopies}
                  onChange={handleChange}
                  min="0"
                  max={formData.totalCopies}
                  className={`form-input ${errors.availableCopies ? 'error' : ''}`}
                />
                {errors.availableCopies && (
                  <p className="error-message">{errors.availableCopies}</p>
                )}
                <p className="helper-text">
                  Must be between 0 and {formData.totalCopies}
                </p>
              </div>
          </div>

          <div className="form-actions">
              <button
                type="button"
                onClick={handleReset}
                className="reset-btn"
              >
                Reset Form
              </button>
              <button
                type="submit"
                disabled={loading}
                className="submit-btn"
              >
                {loading ? (
                  <>
                    <span className="btn-spinner"></span>
                    Adding Book...
                  </>
                ) : (
                  'Add Book'
                )}
              </button>
          </div>
        </form>
      </div>

      <div className="tips-section">
        <div className="tips-title">
          <span className="tips-title-icon">💡</span>
          Tips for Adding Books
        </div>
        <ul className="tips-list">
          <li className="tip-item">
            <span className="tip-bullet">•</span>
            <span className="tip-text">ISBN is generated automatically for each new book</span>
          </li>
          <li className="tip-item">
            <span className="tip-bullet">•</span>
            <span className="tip-text">Available copies cannot exceed total copies</span>
          </li>
          <li className="tip-item">
            <span className="tip-bullet">•</span>
            <span className="tip-text">Set status to "borrowed" only if all copies are currently borrowed</span>
          </li>
          <li className="tip-item">
            <span className="tip-bullet">•</span>
            <span className="tip-text">Shelf location helps in physically locating the book</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

//export the component
export default BookForm;