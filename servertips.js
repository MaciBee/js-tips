require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors()); // Enable CORS for all domains
app.use(bodyParser.json()); // Support JSON-encoded bodies

// Create a MySQL connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Function to handle database querying with the pool
function queryDatabase(sql, params, callback) {
    pool.query(sql, params, (err, results) => {
        callback(err, results);
    });
}

// Endpoint to get all tips
app.get('/tips', (req, res) => {
    const sqlSelect = 'SELECT * FROM tips ORDER BY created_at DESC';
    queryDatabase(sqlSelect, [], (err, results) => {
        if (err) {
            console.error('Error fetching tips:', err);
            res.status(500).json({ error: 'Error fetching tips', details: err });
            return;
        }
        res.json(results);
    });
});

// Endpoint to add a new tip
app.post('/tips', (req, res) => {
    const { title, description, category, author } = req.body;
    const sqlInsert = 'INSERT INTO tips (title, description, category, author) VALUES (?, ?, ?, ?)';
    queryDatabase(sqlInsert, [title, description, category, author], (err, result) => {
        if (err) {
            console.error('Failed to insert tip:', err);
            res.status(500).json({ error: 'Database error', details: err });
            return;
        }
        res.status(201).json({
            id: result.insertId,
            title,
            description,
            category,
            author
        });
    });
});

// Endpoint to get comments for a specific tip
app.get('/comments/:tip_id', (req, res) => {
    const { tip_id } = req.params;
    const sqlSelect = 'SELECT * FROM comments WHERE tip_id = ? ORDER BY created_at DESC';
    queryDatabase(sqlSelect, [tip_id], (err, results) => {
        if (err) {
            console.error('Error fetching comments:', err);
            res.status(500).json({ error: 'Error fetching comments', details: err });
            return;
        }
        res.json(results);
    });
});

// Endpoint to add a new comment
app.post('/comments', (req, res) => {
    const { tip_id, comment_text, author } = req.body;
    const sqlInsert = 'INSERT INTO comments (tip_id, comment_text, author) VALUES (?, ?, ?)';
    queryDatabase(sqlInsert, [tip_id, comment_text, author], (err, result) => {
        if (err) {
            console.error('Failed to insert comment:', err);
            res.status(500).json({ error: 'Database error', details: err });
            return;
        }
        res.status(201).json({
            id: result.insertId,
            tip_id,
            comment_text,
            author
        });
    });
});

// Gracefully closing the pool on application termination
process.on('SIGINT', () => {
    pool.end(err => {
        if (err) console.log('Failed to close pool', err);
        console.log('Pool closed');
        process.exit(err ? 1 : 0);
    });
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
