const mysql = require('mysql2');
const connection = mysql.createConnection({
  host: 'localhost',
  port: 3307,
  user: 'root',
  password: 'root',
  database: 'biblioteca_tcc'
});

module.exports = connection;