require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const db = new sqlite3.Database(process.env.DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database', err);
  } else {
    console.log('Database connected');
    db.run(`CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT,
      message TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
  }
});

app.use(express.static(path.join(__dirname, 'public')));
app.get('/chat-history', (req, res) => {
  db.all('SELECT * FROM messages ORDER BY timestamp DESC LIMIT 50', (err, rows) => {
    if (err) {
      res.status(500).json({ error: 'Error fetching chat history' });
    } else {
      res.json(rows.reverse());
    }
  });
});

io.on('connection', (socket) => {
  console.log('New user connected');

  socket.on('chat message', (msg) => {
    const { username, message } = msg;
  
    db.run('INSERT INTO messages (username, message) VALUES (?, ?)', [username, message], (err) => {
      if (err) {
        console.error('Error saving message:', err);
      } else {
        io.emit('chat message', { username, message, timestamp: new Date() });
      }
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
