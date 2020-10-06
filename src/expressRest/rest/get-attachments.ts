import { checkIfHasProjectRights } from '@/helperFunctions';
import checkResolver from '@/graph/resolvers/checkResolver';
import pathResolver from 'path';

export function getAttachments(app) {
  app.get('/get-attachments', async function(req, res) {
    if (!req.query) {
      return res.send({ ok: false, error: 'no parameters' })
    }
    let taskId = req.query.taskId;
    let path = req.query.path as string;
    if (!taskId || !path) {
      return res.send({ ok: false, error: 'One of parameters taskId or path missing' })
    }
    try {
      const User = await checkResolver(req);
      await checkIfHasProjectRights(User.get('id'), taskId);
    } catch (err) {
      return res.send({ ok: false, error: err.message })
    }

    res.sendFile(pathResolver.join(__dirname, `../${path}`));

  });
}
