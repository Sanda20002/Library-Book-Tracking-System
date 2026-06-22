Library Book Tracking System

A full-stack web application for managing and tracking library books efficiently. This system allows users to manage books, monitor availability, and maintain library records through an easy-to-use interface.

Features

* Add new books to the library
* View all available books
* Update book information
* Delete book records
* Search books by title, author, or category
* Track book availability
* Responsive user interface
* MongoDB database integration

Technologies Used

Frontend

* React.js
* HTML5
* CSS3
* JavaScript

Backend

* Node.js
* Express.js

Database

* MongoDB Atlas
* Mongoose

Project Structure


Library-Book-Tracking-System/
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── models/
│   ├── routes/
│   ├── controllers/
│   ├── server.js
│   └── package.json
│
└── README.md


Installation

Clone the Repository

```bash
git clone https://github.com/your-username/Library-Book-Tracking-System.git
```

Navigate to the Project Directory

```bash
cd Library-Book-Tracking-System
```

Install Backend Dependencies

```bash
cd backend
npm install
```

Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

Environment Variables

Create a `.env` file inside the backend folder and add:

```env
PORT=5000
MONGODB_URL=your_mongodb_connection_string
```

Running the Application

Start Backend Server

```bash
cd backend
npm start
```

Backend will run on:

```
http://localhost:5000
```

Start Frontend

```bash
cd frontend
npm start
```

Frontend will run on:

```
http://localhost:3000
```

Future Enhancements

* User Authentication
* Book Borrowing Management
* Fine Calculation System
* Admin Dashboard
* Report Generation

Author

Sandamini Gamage

## License

This project is developed for educational purposes.
