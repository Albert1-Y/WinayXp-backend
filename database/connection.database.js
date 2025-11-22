require('dotenv/config');
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;

const db = new Pool({
  allowExitOnIdle: true,
  connectionString,
});

db.query('SELECT NOW()')
  .then(() => {
    console.log('DATABASE connected');
  })
  .catch((error) => {
    console.log(error);
  });

module.exports = { db };
