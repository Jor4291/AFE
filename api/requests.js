const { query, getConfig } = require('../lib/db');
const { mapSubmission } = require('../lib/map-submission');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const limit = Math.min(Math.max(Number(req.query.limit) || 200, 1), 500);
  const id = req.query.id ? Number(req.query.id) : null;

  try {
    const config = getConfig();

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
        connectionString: `${config.connectionString}/${config.database}`,
        request: mapSubmission(rows[0]),
      });
      return;
    }

    const [{ total }] = await query('SELECT COUNT(*) AS total FROM submissions');
    const rows = await query(
      'SELECT * FROM submissions ORDER BY sub_date DESC LIMIT ?',
      [limit],
    );

    res.status(200).json({
      live: true,
      readOnly: true,
      connectionString: `${config.connectionString}/${config.database}`,
      total,
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
