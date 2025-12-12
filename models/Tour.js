const db = require('./db');

exports.getAllTours = async () => {
  const [rows] = await db.query('SELECT * FROM tours ORDER BY date LIMIT 6');
  return rows;
};
