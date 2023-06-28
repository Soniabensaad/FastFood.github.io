const PORT = process.env.PORT || 8000;
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const app = express();
const pool = require('./db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

app.use(cors());
app.use(express.json());

//roles
const verifyRole = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ error: 'No token provided' });

  jwt.verify(token, 'secret', (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Failed to authenticate token' });

    const { email } = decoded;
    pool.query('SELECT role FROM users WHERE email = $1', [email], (err, result) => {
      if (err) return res.status(500).json({ error: 'An error occurred' });

      const userRole = result.rows[0].role;
      req.userRole = userRole;
      next();
    });
  });
};




// Get all fast food items for a specific user
app.get('/api/v1/fastfood/:userEmail', async (req, res) => {
  const { userEmail } = req.params;

  try {
    
    const all = await pool.query('SELECT * FROM FASTFOOD');
    res.json(all.rows);
  } catch (err) {
    console.error(err);
  }
});

// Get all fast food items for a specific email
app.get('/api/v1/fastfood', async (req, res) => {
  const { userEmail } = req.query;
  try {
    const all = await pool.query('SELECT * FROM fastfood WHERE email = $1', [userEmail]);
    res.json(all.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve fast food items' });
  }
});

// Add a new fast food item
app.post('/api/v1/fastfood/', verifyRole, async (req, res) => {
  const { title, location, email, date, progress } = req.body;
  const id = uuidv4();

  if (req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Not authorized' });
  }
  try {
    const newFast = await pool.query(
      `INSERT INTO fastfood (title, location, email, date, progress) VALUES ($1, $2, $3, $4, $5)`,
      [title, location, email, date, progress]
    );
    res.json(newFast);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while adding the fast food item' });
  }
});


// Update a fast food item
app.put('/api/v1/fastfood/:id'  , async (req, res) => {
  const { id } = req.params;
  const { title, location, email, date, progress } = req.body;
  try {
    const editFast = await pool.query(
      'UPDATE fastfood SET title = $1, location = $2, email = $3, date = $4, progress = $5 WHERE id = $6;',
      [title, location, email, date, progress, id]
    );
    res.json(editFast);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while updating the fast food item' });
  }
});

// Add a comment to a fast food item
app.post('/api/v1/fastfood/:id/comments', async (req, res) => {
  const { id } = req.params;
  const { comment } = req.body;
 
  
  

  try {

    const updateFast = await pool.query(
      'UPDATE fastfood SET comments = array_append(comments, $1) WHERE id = $2;',
      [comment, id]
    );
    res.json(updateFast);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// Get comments for a specific fast food item
app.get('/api/v1/fastfood/:id/comments', async (req, res) => {
  const { id } = req.params;

  try {
    const fastfood = await pool.query('SELECT * FROM fastfood WHERE id = $1;', [id]);
    const comments = fastfood.rows[0].comments || [];
    res.json(comments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve comments' });
  }
});

// Delete a fast food item
app.delete('/api/v1/fastfood/:id', verifyRole, async (req, res) => {
  const { id } = req.params;
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    
    const deleteFast = await pool.query('DELETE FROM fastfood WHERE id = $1;', [id]);
    res.json(deleteFast);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while deleting the fast food item' });
  }
});


// Signup
app.post('/signup', async (req, res) => {
  const { email, password, role } = req.body;
  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(password, salt);
   // Default role for new users
 

  try {
    // ... existing code ...
    const newUser = await pool.query(
      'INSERT INTO users (email, hashed_password,role) VALUES ($1, $2, $3) RETURNING *',
      [email, hashedPassword, role || 'user']
    );
  

    const token = jwt.sign({ email }, 'secret', { expiresIn: '1hr' });
    res.json({ email, token, role: newUser.rows[0].role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while signing up' });
  }
});


// Login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const users = await pool.query('SELECT * FROM users WHERE email = $1;', [email]);
    if (!users.rows.length) return res.json({ detail: 'User does not exist!' });
    const success = await bcrypt.compare(password, users.rows[0].hashed_password);
    const token = jwt.sign({ email }, 'secret', { expiresIn: '1hr' });
    if (success) {
      res.json({ email: users.rows[0].email, token });
    } else {
      res.json({ detail: 'Login failed' });
    }
  } catch (err) {
    console.error(err);
    if (err) {
      res.json({ detail: err.detail });
    }
  }
});

app.listen(PORT, () => console.log(`Server running on PORT ${PORT}`));
