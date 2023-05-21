// server.js

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const csvParser = require('csv-parser');

const app = express();
const port = 3000;
const db = new sqlite3.Database(':memory:'); // Use in-memory database for simplicity

// Step 2: Create the SQLite Database and insert data from CSV
function createDatabase() {
  db.serialize(() => {
    db.run('CREATE TABLE historical_prices (symbol TEXT, date DATE, price NUMERIC)');
    
    // Read CSV file and insert data into the database
    fs.createReadStream('historical_prices.csv')
      .pipe(csvParser())
      .on('data', (row) => {
        const { Symbol, Date, Close } = row;
        db.run('INSERT INTO historical_prices (symbol, date, price) VALUES (?, ?, ?)', [Symbol, Date, Close]);
      })
      .on('end', () => {
        console.log('Data has been loaded into the database.');
      });
  });
}

// Step 3: Implement the API

// GET /historical-data API
app.get('/historical-data', (req, res) => {
  const { symbol, from_date, to_date } = req.query;
  const query = `
    SELECT date, price
    FROM historical_prices
    WHERE symbol = ? AND date >= ? AND date <= ?
    ORDER BY date ASC
  `;

  db.all(query, [symbol, from_date, to_date], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    res.json(rows);
  });
});

// Step 4: Create the Frontend

// Serve the index.html file
app.use(express.static('public'));

// Start the server and create the database
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
  createDatabase();
});
