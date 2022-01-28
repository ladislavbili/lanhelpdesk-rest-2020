import fs from 'fs';

export function getCMDBFile(app) {
  app.get('/get-cmdb-file', async function(req, res) {
    const path = req.query.path;
    if (!path || !path.includes('files/cmdb-files')) {
      return res.status(412).send({ ok: false, error: 'Parameter path missing or incorrect' })
    }
    if (!fs.existsSync(path)) {
      return res.status(404).send(null);
    }

    res.sendFile(path, { root: './' });
  });
}
