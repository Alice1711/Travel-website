const db = require('./db');

exports.getAllReviews = async () => {
  const [rows] = await db.query('SELECT * FROM reviews');
  return rows;
};
