const db = require('./db');

exports.getAllDestinations = async () => {
  const [rows] = await db.query('SELECT * FROM destinations');
  return rows;
};
