import moment from 'moment';
import checkResolver from '@/graph/resolvers/checkResolver';
import {
  CantEditInvoicedTaskError,
} from '@/configs/errors';
import {
  checkIfHasProjectRights,
} from '@/graph/addons/project';

export function uploadAttachments(app) {
  app.post('/upload-attachments', async function(req, res) {
    const timestamp = moment().valueOf();
    const { token, taskId, newTask, fromInvoice } = req.body;
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
      if (fromInvoice) {
        User = await checkResolver({ headers: { authorization: token } }, ['vykazy']);
      } else {
        User = await checkResolver({ headers: { authorization: token } });
      }
      const checkData = await checkIfHasProjectRights(User, taskId, undefined, [newTask ? 'addTask' : 'taskAttachmentsWrite'], [], fromInvoice === true);
      Task = checkData.Task;
      if (Task.get('invoiced')) {
        throw CantEditInvoicedTaskError;
      }
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
