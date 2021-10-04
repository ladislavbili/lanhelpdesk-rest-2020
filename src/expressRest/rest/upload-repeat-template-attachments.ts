import moment from 'moment';
import checkResolver from '@/graph/resolvers/checkResolver';
import {
  checkIfHasProjectRights,
} from '@/graph/addons/project';
import { models } from '@/models';
import { RepeatTemplateAttachmentInstance, RepeatTemplateInstance } from '@/models/instances';


export function uploadRepeatTemplateAttachments(app) {
  app.post('/upload-repeat-template-attachments', async function(req, res) {
    const timestamp = moment().valueOf();
    const { token, repeatTemplateId, newTask } = req.body;
    let files = null;
    if (req.files) {
      if (Array.isArray(req.files.file)) {
        files = req.files.file;
      } else {
        files = [req.files.file];
      }
    }

    if (!token || !files || !repeatTemplateId || files.length === 0) {
      return res.send({ ok: false, error: 'Upload failed, either no files were send, repeatTemplateId is missing or token is missing' })
    }
    let User = null;
    let RepeatTemplate = <RepeatTemplateInstance>await models.RepeatTemplate.findByPk(repeatTemplateId);
    if (!RepeatTemplate) {
      return res.send({ ok: false, error: `Repeat template doesn't exists!` })
    }
    try {
      User = await checkResolver({ headers: { authorization: token } });
      const checkData = await checkIfHasProjectRights(User, undefined, RepeatTemplate.get('ProjectId'), [newTask ? 'addTask' : 'taskAttachmentsWrite', 'repeatWrite']);
    } catch (err) {
      return res.send({ ok: false, error: err.message })
    }
    await Promise.all(files.map((file) => file.mv(`files/repeat-template-attachments/${repeatTemplateId}/${timestamp}-${file.name}`)));

    const attachments = <RepeatTemplateAttachmentInstance[]>await Promise.all(files.map((file) => RepeatTemplate.createRepeatTemplateAttachment(
      {
        filename: file.name,
        mimetype: file.mimetype,
        encoding: file.encoding,
        size: file.size,
        path: `files/repeat-template-attachments/${repeatTemplateId}/${timestamp}-${file.name}`,
      }
    )
    ))
    return res.send({ ok: true, error: null, attachments })
  });
}
