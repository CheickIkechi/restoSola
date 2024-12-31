// insertUsers.js
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

const db = new sqlite3.Database('./sola_resto.db', (err) => {
  if (err) {
    console.error('Error connecting to SQLite database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
  }
});

// Liste des utilisateurs à insérer
const users = [
  { username: 'Sola', password: 'sola7921' },

];

const insertUsers = async () => {
  for (const user of users) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    db.run(`INSERT INTO users (username, password) VALUES (?, ?)`, [user.username, hashedPassword], function (err) {
      if (err) {
        console.error('Error inserting user:', err.message);
      } else {
        console.log(`User  ${user.username} inserted with ID ${this.lastID}`);
      }
    });
  }
  db.close();
};

insertUsers();