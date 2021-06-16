import {
  checkIfHasProjectRights,
} from '@/graph/addons/project';
import checkResolver from '@/graph/resolvers/checkResolver';
import { AccessRightsInstance, RoleInstance, CommentInstance, RepeatTemplateInstance, RepeatTemplateAttachmentInstance } from '@/models/instances';
import { models } from '@/models';
import fs from 'fs';
import pathResolver from 'path';
import {
  testing,
} from '@/configs/constants';

export function getAttachments(app) {
  //parameter - comment or task
  //path
  //load if comment of task has access
  //load if task has access
  app.get('/get-attachments', async function(req, res) {
    if (!req.query) {
      return res.status(412).send({ ok: false, error: 'no parameters' })
    }

    const { path, type } = req.query;
    if (!path || !type) {
      return res.status(412).send({ ok: false, error: 'Some parameters path or type missing' })
    }
    let checkResult = null;
    if (type === 'task') {
      checkResult = await checkTask(path, req);
    } else if (type === 'repeatTemplate') {
      checkResult = await checkRepeatTemplate(path, req);
    } else if (type === 'comment') {
      checkResult = await checkComment(path, req);
    } else if (type === 'project') {
      checkResult = await checkProject(path, req);
    } else {
      return res.status(412).send({ ok: false, error: 'Wrong attachment type (task/comment)' });
    }

    if (!checkResult.ok) {
      return res.status(404).send({ ok: false, error: checkResult.error });
    }
    if (!fs.existsSync(path)) {
      checkResult.Attachment.destroy();
      return res.status(404).send({ ok: false, error: 'Attachment was deleted from the server.' })
    }

    res.sendFile(path, { root: './' });
  });
}

async function checkTask(path, req) {
  const TaskAttachment = await models.TaskAttachment.findOne({ where: { path } });
  if (!TaskAttachment) {
    return { ok: false, error: `Attachment with path ${path} doesn't exists.` }
  }
  try {
    const User = await checkResolver(req);
    await checkIfHasProjectRights(User.get('id'), TaskAttachment.get('TaskId'), undefined, ['taskAttachmentsRead']);
    return { ok: true, error: null, Attachment: TaskAttachment };
  } catch (err) {
    return { ok: false, error: err.message }
  }
}

async function checkRepeatTemplate(path, req) {
  const RepeatTemplateAttachment = <RepeatTemplateAttachmentInstance>await models.RepeatTemplateAttachment.findOne({ where: { path }, include: [models.RepeatTemplate] });
  if (!RepeatTemplateAttachment) {
    return { ok: false, error: `Attachment with path ${path} doesn't exists.` }
  }
  try {
    const User = await checkResolver(req);
    await checkIfHasProjectRights(User.get('id'), undefined, (<RepeatTemplateInstance>RepeatTemplateAttachment.get('RepeatTemplate')).get('ProjectId'), ['taskAttachmentsRead', 'repeatRead']);
    return { ok: true, error: null, Attachment: RepeatTemplateAttachment };
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
    const { groupRights } = await checkIfHasProjectRights(User.get('id'), Comment.get('TaskId'), undefined, ['viewComments']);
    if (Comment.get('internal') && !groupRights.internal) {
      return { ok: false, error: `Can't show internal comment to user without rights.` }
    }
    return { ok: true, error: null, Attachment: CommentAttachment };
  } catch (err) {
    return { ok: false, error: err.message }
  }
}

async function checkProject(path, req) {
  const ProjectAttachment = await models.ProjectAttachment.findOne({ where: { path } });
  if (!ProjectAttachment) {
    return { ok: false, error: `Attachment with path ${path} doesn't exists.` }
  }
  try {
    const User = await checkResolver(req);
    await checkIfHasProjectRights(User.get('id'), undefined, ProjectAttachment.get('ProjectId'), ['projectPrimaryRead']);
    return { ok: true, error: null, Attachment: ProjectAttachment };
  } catch (err) {
    return { ok: false, error: err.message }
  }
}
