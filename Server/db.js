const mysql = require('mysql2');

const db = mysql.createPool({
    host: 'localhost',
    user: 'root', // Update with your MySQL username
    password: '', // Update with your MySQL password
    database: 'db_manage_seller'
});

db.getConnection((err) => {
    if (err) {
        console.error('Error connecting to database:', err);
        process.exit(1);
    } else {
        console.log('Connected to MySQL database!');
    }
});

module.exports = db;