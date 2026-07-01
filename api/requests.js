const { query } = require('../lib/db');
const { mapSubmission } = require('../lib/map-submission');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);
  const id = req.query.id ? Number(req.query.id) : null;

  try {
    if (id) {
      const rows = await query(
        'SELECT * FROM submissions WHERE id = ? LIMIT 1',
        [id],
      );

      if (!rows.length) {
        res.status(404).json({ error: 'Request not found' });
        return;
      }

      res.status(200).json({
        live: true,
        readOnly: true,
        request: mapSubmission(rows[0]),
      });
      return;
    }

    const rows = await query(
      'SELECT * FROM submissions ORDER BY sub_date DESC LIMIT ?',
      [limit],
    );

    res.status(200).json({
      live: true,
      readOnly: true,
      count: rows.length,
      requests: rows.map(mapSubmission),
    });
  } catch (err) {
    res.status(500).json({
      live: false,
      error: err.message,
    });
  }
};
