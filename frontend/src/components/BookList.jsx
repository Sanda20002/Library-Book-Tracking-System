import React, { useState, useEffect } from 'react';
import { bookAPI } from '../services/api';
import { useNotification } from '../context/NotificationContext';
import '../styles/BookList.css';

//component to display and manage a list of books
const BookList = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [bookToDelete, setBookToDelete] = useState(null);
  const [editingLocationId, setEditingLocationId] = useState(null);
  const [locationDraft, setLocationDraft] = useState('');
  const { showNotification } = useNotification();

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      const response = await bookAPI.getAll();
      setBooks(response.data);
    } catch (error) {
      console.error('Error fetching books:', error);
      showNotification('Failed to load books. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };
  //function to handle search
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchBooks();
      return;
    }

    try {
      const response = await bookAPI.search(searchQuery);
      setBooks(response.data);
    } catch (error) {
      console.error('Error searching books:', error);
      showNotification('Search failed. Please try again.', 'error');
    }
  };
  //function to handle delete click
  const handleDeleteClick = (book) => {
    setBookToDelete(book);
    setShowDeleteModal(true);
  };
  
  //functions to handle editing location
  const startEditLocation = (book) => {
    setEditingLocationId(book._id);
    setLocationDraft(book.shelfLocation || '');
  };
  
  //function to cancel editing location
  const cancelEditLocation = () => {
    setEditingLocationId(null);
    setLocationDraft('');
  };

  //function to save updated location
  const saveLocation = async (book) => {
    const trimmed = locationDraft.trim();
    if (!trimmed) {
      showNotification('Location cannot be empty.', 'warning');
      return;
    }

    try {
      const response = await bookAPI.update(book._id, { shelfLocation: trimmed });
      const updatedBook = response.data.book || { ...book, shelfLocation: trimmed };
      setBooks((prev) => prev.map((b) => (b._id === book._id ? updatedBook : b)));
      showNotification('Location updated successfully.', 'success');
      setEditingLocationId(null);
      setLocationDraft('');
    } catch (error) {
      console.error('Error updating location:', error);
      showNotification('Failed to update location. Please try again.', 'error');
    }
  };

  //function to confirm deletion
  const confirmDelete = async () => {
    if (!bookToDelete) return;

    try {
      await bookAPI.delete(bookToDelete._id);
      setBooks((prevBooks) => prevBooks.filter((book) => book._id !== bookToDelete._id));
      showNotification('Book deleted successfully.', 'success');
    } catch (error) {
      console.error('Error deleting book:', error);
      showNotification('Failed to delete book. Please try again.', 'error');
    } finally {
      setShowDeleteModal(false);
      setBookToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <p className="loading-text">Loading books...</p>
      </div>
    );
  }

  return (
    <div className="book-list">
      <div className="book-list-header">
        <div className="book-list-title">
          <h1>Book Management</h1>
          <p>Manage your library's book collection</p>
        </div>
        <div className="book-list-search">
          <input
            type="text"
            placeholder="Search by title, author, ISBN..."
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            onClick={handleSearch}
            className="search-btn"
          >
            Search
          </button>
          <button
            onClick={() => {
              setSearchQuery('');
              fetchBooks();
            }}
            className="clear-btn"
          >
            Clear
          </button>
        </div>
      </div>

      {books.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📚</div>
          <h3>No Books Found</h3>
          <p>Add your first book to start managing your library</p>
          <a
            href="/add-book"
            className="empty-state-link"
          >
            Add Your First Book
          </a>
        </div>
      ) : (
        <div className="table-container">
          <div className="table-wrapper">
            <table className="books-table">
              <thead>
                <tr>
                  <th>ISBN</th>
                  <th>Title &amp; Genre</th>
                  <th>Author</th>
                  <th>Location</th>
                  <th>Copies</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {books.map((book) => (
                  <tr key={book._id}>
                    <td>
                      <div className="isbn-cell">{book.isbn}</div>
                    </td>
                    <td>
                      <div className="title-genre-cell">
                        <span className="title">{book.title}</span>
                        <span className="genre">{book.genre || 'No genre'}</span>
                      </div>
                    </td>
                    <td>
                      <div className="author-cell">{book.author}</div>
                    </td>
                    <td>
                      <div className="location-cell">
                        {editingLocationId === book._id ? (
                          <div className="location-edit">
                            <input
                              type="text"
                              value={locationDraft}
                              onChange={(e) => setLocationDraft(e.target.value)}
                              className="location-input"
                              placeholder="Enter location"
                            />
                            <div className="location-edit-actions">
                              <button
                                type="button"
                                onClick={() => saveLocation(book)}
                                className="location-save-btn"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={cancelEditLocation}
                                className="location-cancel-btn"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="location-display">
                            <span>{book.shelfLocation}</span>
                            <button
                              type="button"
                              onClick={() => startEditLocation(book)}
                              className="location-edit-btn"
                            >
                              Edit
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="copies-cell">
                        <span className="available">{book.availableCopies}</span>
                        <span className="total"> / {book.totalCopies}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${book.status}`}>
                        {book.status.charAt(0).toUpperCase() + book.status.slice(1)}
                      </span>
                    </td>
                    <td className="action-cell">
                      <button
                        onClick={() => handleDeleteClick(book)}
                        className="delete-btn"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showDeleteModal && bookToDelete && (
        <div className="delete-modal-overlay">
          <div className="delete-modal">
            <div className="modal-header">
              <div className="modal-icon-wrapper">
                <span className="modal-icon">⚠️</span>
              </div>
              <div className="modal-title-wrapper">
                <h3 className="modal-title">Confirm Deletion</h3>
                <p className="modal-subtitle">This action cannot be undone</p>
              </div>
            </div>

            <div className="modal-body">
              <p>
                Are you sure you want to delete <span className="modal-book-title">"{bookToDelete.title}"</span>?
              </p>
              <p className="modal-details">
                ISBN: {bookToDelete.isbn} | Author: {bookToDelete.author}
              </p>
            </div>

            <div className="modal-actions">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setBookToDelete(null);
                }}
                className="modal-btn modal-cancel-btn"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="modal-btn modal-delete-btn"
              >
                Delete Book
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

//export the component
export default BookList;