import moment from 'moment';
import checkResolver from '@/graph/resolvers/checkResolver';
import { checkIfHasProjectRightsOld } from '@/helperFunctions';

export function uploadAttachments(app) {
  app.post('/upload-attachments', async function(req, res) {
    const timestamp = moment().valueOf();
    const { token, taskId } = req.body;
    let files = null;
    if (req.files) {
      if (Array.isArray(req.files.file)) {
        files = req.files.file;
      } else {
        files = [req.files.file];
      }
    }

    if (!token || !files || !taskId || files.length === 0) {
      return res.send({ ok: false, error: 'Upload failed, either no files were send, taskId is missing or token is missing' })
    }
    let User = null;
    let Task = null;
    try {
      User = await checkResolver({ headers: { authorization: token } });
      const checkData = await checkIfHasProjectRightsOld(User.get('id'), taskId, "write");
      Task = checkData.Task;
    } catch (err) {
      return res.send({ ok: false, error: err.message })
    }
    await Promise.all(files.map((file) => file.mv(`files/task-attachments/${taskId}/${timestamp}-${file.name}`)));

    const attachments = await Promise.all(files.map((file) => Task.createTaskAttachment(
      {
        filename: file.name,
        mimetype: file.mimetype,
        encoding: file.encoding,
        size: file.size,
        path: `files/task-attachments/${taskId}/${timestamp}-${file.name}`,
      }
    )
    ))
    return res.send({ ok: true, error: null, attachments })
  });
}
