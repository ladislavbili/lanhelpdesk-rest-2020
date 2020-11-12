import { checkIfHasProjectRights } from '@/helperFunctions';
import checkResolver from '@/graph/resolvers/checkResolver';
import { AccessRightsInstance, RoleInstance, CommentInstance } from '@/models/instances';
import { models } from '@/models';
import fs from 'fs';
import pathResolver from 'path';

export function getAttachments(app) {
  //parameter - comment or task
  //path
  //load if comment of task has access
  //load if task has access
  app.get('/get-attachments', async function(req, res) {
    if (!req.query) {
      return res.send({ ok: false, error: 'no parameters' })
    }
    const { path, type } = req.query;
    if (!path || !type) {
      return res.send({ ok: false, error: 'Some parameters path or type missing' })
    }
    let checkResult = null;
    if (type === 'task') {
      checkResult = await checkTask(path, req);
    } else if (type === 'comment') {
      checkResult = await checkComment(path, req);
    } else {
      return res.send({ ok: false, error: 'Wrong attachment type (task/comment)' });
    }

    if (!checkResult.ok) {
      return res.send({ ok: false, error: checkResult.error });
    }
    if (!fs.existsSync(path)) {
      checkResult.Attachment.destroy();
      return res.send({ ok: false, error: 'Attachment was deleted from the server.' })
    }
    res.sendFile(pathResolver.join(__dirname, `../../../${path}`));
  });
}

async function checkTask(path, req) {
  const TaskAttachment = await models.TaskAttachment.findOne({ where: { path } });
  if (!TaskAttachment) {
    return { ok: false, error: `Attachment with path ${path} doesn't exists.` }
  }
  try {
    const User = await checkResolver(req);
    await checkIfHasProjectRights(User.get('id'), TaskAttachment.get('TaskId'));
    return { ok: true, error: null, Attachment: TaskAttachment };
  } catch (err) {
    return { ok: false, error: err.message }
  }
}

async function checkComment(path, req) {
  const CommentAttachment = await models.CommentAttachment.findOne({ where: { path }, include: [{ model: models.Comment }] });
  if (!CommentAttachment) {
    return { ok: false, error: `Attachment with path ${path} doesn't exists.` }
  }
  const Comment = <CommentInstance>CommentAttachment.get('Comment');
  try {
    const User = await checkResolver(req);
    const checkResult = await checkIfHasProjectRights(User.get('id'), Comment.get('TaskId'));
    const internalRight = (<AccessRightsInstance>(<RoleInstance>User.get('Role')).get('AccessRight')).get('internal');
    if (Comment.get('internal') && !(checkResult.internal || internalRight)) {
      return { ok: false, error: `Can't show internal comment to user without rights.` }
    }
    return { ok: true, error: null, Attachment: CommentAttachment };
  } catch (err) {
    return { ok: false, error: err.message }
  }
}
