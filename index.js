const express = require('express');
const multer = require('multer');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// SQLite Database Setup
const db = new sqlite3.Database('database.db', (err) => {
  if (err) {
    console.error('Database connection error:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    db.run(`
      CREATE TABLE IF NOT EXISTS books (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        imgurl TEXT NOT NULL,
        author TEXT NOT NULL,
        price REAL NOT NULL,
        description TEXT,
        filePath TEXT
      );
    `);
    // Create the 'users' table if it doesn't exist
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        cart TEXT DEFAULT NULL
      )
    `);
  }
});

// Serve static files from the public folder
app.use(express.static(path.join(__dirname, 'public')));

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Signin Route
app.post('/signin', (req, res) => {
  const { username, password } = req.body;

  const checkUserQuery = `
    SELECT * FROM users WHERE username = ?
  `;

  db.get(checkUserQuery, [username], (err, user) => {
    if (err) {
      console.error('Error checking user:', err.message);
      return res.status(500).json({ error: 'Failed to sign in.' });
    }

    if (!user) {
      // User doesn't exist, create a new user
      const createUserQuery = `
        INSERT INTO users (username, password)
        VALUES (?, ?)
      `;

      db.run(createUserQuery, [username, password], (err) => {
        if (err) {
          console.error('Error creating user:', err.message);
          return res.status(500).json({ error: 'Failed to sign in.' });
        }

        res.json({ message: 'User created and signed in successfully.' });
      });
    } else {
      // User exists, check the password
      if (user.password === password) {
        res.json({ message: 'Signin successful.', userId: user.id });
      } else {
        res.status(401).json({ error: 'Invalid credentials.' });
      }
    }
  });
});

// Signout Route (Placeholder for user authentication)
app.post('/signout', (req, res) => {
  // Placeholder logic to perform signout
  return res.json({ message: 'Signout successful.' });
});

// Book Upload Route
app.post('/upload', upload.single('bookFile'), (req, res) => {
  const { title, imgurl, author, price, description } = req.body;
  console.log(title)
  const filePath = req.file ? req.file.path : null;

  const query = `
    INSERT INTO books (title, imgurl, author, price, description, filePath)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  db.run(query, [title, imgurl, author, price, description, filePath], function (err) {
    if (err) {
      console.error('Error inserting data:', err.message);
      return res.status(500).json({ error: 'Failed to upload the book.' });
    }

    res.json({ message: 'Book uploaded successfully.' });
  });
});


// Get All Books Route
app.get('/books', (req, res) => {
  const query = `
    SELECT id, title, imgurl, author, price, description FROM books
  `;

  db.all(query, [], (err, books) => {
    if (err) {
      console.error('Error fetching data:', err.message);
      return res.status(500).json({ error: 'Failed to fetch books.' });
    }

    res.json(books);
  });
});

// Cart Route (Updated to handle adding books to the user's cart and retrieving cart data)
app.route('/cart')
  .post((req, res) => {
    const { bookId, userId } = req.body;
    console.log(userId)
    // Add the bookId to the user's cart (Assuming the user is authenticated and the userId is available in req.user.id)
    const updateCartQuery = `
      UPDATE users
      SET cart = COALESCE(cart, '') || ?
      WHERE id = ?
    `;

    db.run(updateCartQuery, [bookId + ',', userId], (err) => {
      if (err) {
        console.error('Error adding book to the cart:', err.message);
        return res.status(500).json({ error: 'Failed to add the book to the cart.' });
      }

      res.json({ message: `Book with ID ${bookId} added to the cart.` });
    });
  })
  .get((req, res) => {
    // Get the user's cart data (Assuming the user is authenticated and the userId is available in req.user.id)
    const getCartQuery = `
      SELECT cart
      FROM users
      WHERE id = ?
    `;

    const userId = 1
    db.get(getCartQuery, [userId], (err, user) => {
      if (err) {
        console.error('Error fetching cart data:', err.message);
        return res.status(500).json({ error: 'Failed to fetch cart data.' });
      }

      const cart = user?.cart?.split(',').filter((id) => id !== '') || [];
      // Assuming you have a 'books' table with book data and 'id' is the primary key
    const getBooksInCartQuery = `
    SELECT id, title, price
    FROM books
    WHERE id IN (${cart.map(() => '?').join(',')})
  `;

  if (cart.length > 0) {
    db.all(getBooksInCartQuery, cart, (err, books) => {
      if (err) {
        console.error('Error fetching books in cart:', err.message);
        return res.status(500).json({ error: 'Failed to fetch cart data.' });
      }

      res.json(books);
    });
  } else {
    res.json([]); // Empty cart, no books in cart yet
  }
});
    
  });

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
