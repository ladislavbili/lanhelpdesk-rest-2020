import fs from 'fs';

export function getLWFile(app) {
  app.get('/get-lw-file', async function(req, res) {
    const path = req.query.path;
    if (!path || !path.includes('files/lw-files')) {
      return res.status(412).send({ ok: false, error: 'Parameter path missing or incorrect' })
    }
    if (!fs.existsSync(path)) {
      return res.status(404).send(null);
    }

    res.sendFile(path, { root: './' });
  });
}
