import React, { useState } from 'react';
import { bookAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';

const BookForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    isbn: '',
    title: '',
    author: '',
    genre: '',
    shelfLocation: '',
    totalCopies: 1,
    availableCopies: 1,
    status: 'available'
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

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
    
    if (!formData.isbn.trim()) newErrors.isbn = 'ISBN is required';
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
      alert('✅ Book added successfully!');
      navigate('/books');
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error adding book';
      alert(`❌ ${errorMessage}`);
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      isbn: '',
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
    <div className="p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Add New Book</h1>
          <p className="text-gray-600 mt-2">Fill in the details to add a new book to the library</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* ISBN */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ISBN *
                </label>
                <input
                  type="text"
                  name="isbn"
                  value={formData.isbn}
                  onChange={handleChange}
                  className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.isbn ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="978-3-16-148410-0"
                />
                {errors.isbn && (
                  <p className="mt-1 text-sm text-red-600">{errors.isbn}</p>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.title ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Book Title"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                )}
              </div>

              {/* Author */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Author *
                </label>
                <input
                  type="text"
                  name="author"
                  value={formData.author}
                  onChange={handleChange}
                  className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.author ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Author Name"
                />
                {errors.author && (
                  <p className="mt-1 text-sm text-red-600">{errors.author}</p>
                )}
              </div>

              {/* Genre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Genre
                </label>
                <input
                  type="text"
                  name="genre"
                  value={formData.genre}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Fiction, Science, History, etc."
                />
              </div>

              {/* Shelf Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shelf Location *
                </label>
                <input
                  type="text"
                  name="shelfLocation"
                  value={formData.shelfLocation}
                  onChange={handleChange}
                  className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.shelfLocation ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="A-12, B-5, etc."
                />
                {errors.shelfLocation && (
                  <p className="mt-1 text-sm text-red-600">{errors.shelfLocation}</p>
                )}
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="available">Available</option>
                  <option value="borrowed">Borrowed</option>
                </select>
              </div>

              {/* Total Copies */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Copies *
                </label>
                <input
                  type="number"
                  name="totalCopies"
                  value={formData.totalCopies}
                  onChange={handleChange}
                  min="1"
                  className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.totalCopies ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.totalCopies && (
                  <p className="mt-1 text-sm text-red-600">{errors.totalCopies}</p>
                )}
              </div>

              {/* Available Copies */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Available Copies *
                </label>
                <input
                  type="number"
                  name="availableCopies"
                  value={formData.availableCopies}
                  onChange={handleChange}
                  min="0"
                  max={formData.totalCopies}
                  className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.availableCopies ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.availableCopies && (
                  <p className="mt-1 text-sm text-red-600">{errors.availableCopies}</p>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  Must be between 0 and {formData.totalCopies}
                </p>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end gap-4">
              <button
                type="button"
                onClick={handleReset}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Reset Form
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Adding Book...
                  </>
                ) : (
                  'Add Book'
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-100 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">💡 Tips for Adding Books</h3>
          <ul className="text-blue-700 space-y-2">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>ISBN must be unique for each book</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Available copies cannot exceed total copies</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Set status to "borrowed" only if all copies are currently borrowed</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Shelf location helps in physically locating the book</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default BookForm;