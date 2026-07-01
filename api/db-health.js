const { query } = require('../lib/db');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    await query('SELECT 1 AS ok');
    const [{ total }] = await query('SELECT COUNT(*) AS total FROM submissions');

    res.status(200).json({
      ok: true,
      connected: true,
      submissionCount: total,
    });
  } catch (err) {
    res.status(500).json({
      ok: false,
      connected: false,
      error: err.message,
    });
  }
};
