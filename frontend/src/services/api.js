import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Books API
export const bookAPI = {
  getAll: () => api.get('/books'),
  getById: (id) => api.get(`/books/${id}`),
  search: (query) => api.get(`/books/search?query=${query}`),
  add: (bookData) => api.post('/books', bookData),
  update: (id, bookData) => api.put(`/books/${id}`, bookData),
  delete: (id) => api.delete(`/books/${id}`),
};

// Transactions API
export const transactionAPI = {
  getAll: () => api.get('/transactions'),
  // Get active borrowings by filtering all transactions on the client
  getActive: () =>
    api.get('/transactions').then((res) => ({
      data: res.data.filter(
        (t) => t.transactionType === 'borrow' && t.status === 'active'
      ),
    })),
  getDashboard: () => api.get('/transactions/dashboard'),
  borrow: (data) => api.post('/transactions/borrow', data),
  return: (data) => api.post('/transactions/return', data),
};

export default api;