import moment from 'moment';
import {
  createDoesNoExistsError,
} from '@/configs/errors';
import { models } from '@/models';
import {
  ProjectInstance,
} from '@/models/instances';
import checkResolver from '@/graph/resolvers/checkResolver';
import {
  checkIfHasProjectRights,
} from '@/graph/addons/project';

export function uploadProjectAttachments(app) {
  app.post('/upload-project-attachments', async function(req, res) {
    const timestamp = moment().valueOf();
    const { token, projectId } = req.body;
    let files = null;
    if (req.files) {
      if (Array.isArray(req.files.file)) {
        files = req.files.file;
      } else {
        files = [req.files.file];
      }
    }

    if (!token || !files || !projectId || files.length === 0) {
      return res.send({ ok: false, error: 'Upload failed, either no files were send, projectId is missing or token is missing' })
    }
    const Project = <ProjectInstance>await models.Project.findByPk(projectId);
    if (Project === null) {
      throw createDoesNoExistsError('Project', projectId);
    }
    try {
      const User = await checkResolver({ headers: { authorization: token } });
      await checkIfHasProjectRights(User.get('id'), undefined, projectId, ['projectPrimaryWrite']);
    } catch (err) {
      return res.send({ ok: false, error: err.message })
    }
    await Promise.all(files.map((file) => file.mv(`files/project-attachments/${projectId}/${timestamp}-${file.name}`)));

    const attachments = await Promise.all(files.map((file) => Project.createProjectAttachment(
      {
        filename: file.name,
        mimetype: file.mimetype,
        encoding: file.encoding,
        size: file.size,
        path: `files/project-attachments/${projectId}/${timestamp}-${file.name}`,
      }
    )
    ))
    return res.send({ ok: true, error: null, attachments })
  });
}
