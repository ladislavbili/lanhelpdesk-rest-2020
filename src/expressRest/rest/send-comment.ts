import moment from 'moment';
import checkResolver from '@/graph/resolvers/checkResolver';
import { createDoesNoExistsError, InternalMessagesNotAllowed } from '@/configs/errors';
import { checkIfHasProjectRights, checkType, getAttributes } from '@/helperFunctions';
import { models } from '@/models';
import { AccessRightsInstance, RoleInstance, TaskInstance, CommentInstance } from '@/models/instances';
import { sendNotificationToUsers } from '@/graph/resolvers/userNotification';

export function sendComment(app) {
  app.post('/send-comment', async function(req, res) {
    const timestamp = moment().valueOf();
    const {
      failedGettingAttributes,
      token,
      taskId,
      message,
      parentCommentId,
      internal
    } = getAttributes([
      { key: 'token', nullAccepted: false, type: 'str' },
      { key: 'taskId', nullAccepted: false, type: 'int' },
      { key: 'message', nullAccepted: false, type: 'str' },
      { key: 'parentCommentId', nullAccepted: true, type: 'int' },
      { key: 'internal', nullAccepted: false, type: 'bool' },
    ], req.body);

    if (failedGettingAttributes) {
      return res.send({ ok: false, error: 'Comment failed, taskId(Int), token(String), message(String) or parentCommentId(Int) is missing/wrong type' })
    }
    let files = null;
    if (req.files) {
      if (Array.isArray(req.files.file)) {
        files = req.files.file;
      } else {
        files = [req.files.file];
      }
    }

    let User = null;
    let Task = null;
    let allowedInternal = false;
    try {
      User = await checkResolver({ headers: { authorization: token } });
      const checkData = await checkIfHasProjectRights(User.get('id'), taskId, undefined, ['']);
      Task = checkData.Task;
      allowedInternal = checkData.groupRights.internal;
    } catch (err) {
      return res.send({ ok: false, error: err.message })
    }
    if (internal && !allowedInternal) {
      return res.send({ ok: false, error: InternalMessagesNotAllowed.message })
    }
    let ParentComment = null;
    if (parentCommentId) {
      ParentComment = await models.Comment.findByPk(parentCommentId, { include: [models.User, { model: models.Comment, include: [models.User] }] });
      if (ParentComment === null || ParentComment.get('TaskId') !== taskId) {
        return res.send({ ok: false, error: createDoesNoExistsError('Parent comment', parentCommentId).message })
      }
      if (ParentComment.get('internal') && !allowedInternal) {
        return res.send({ ok: false, error: InternalMessagesNotAllowed.message })
      }
    }

    const NewComment = <CommentInstance>await models.Comment.create({
      internal,
      TaskId: taskId,
      commentOfId: parentCommentId || null,
      isParent: parentCommentId === null,
      UserId: User.get('id'),
      message,
    });
    if (!internal) {
      (<TaskInstance>Task).createTaskChange({
        UserId: User.get('id'),
        TaskChangeMessages: [{
          type: 'comment',
          originalValue: null,
          newValue: null,
          message: `${User.get('fullName')} has commented the task.`,
        }]
      }, { include: [{ model: models.TaskChangeMessage }] });
    }
    if (files) {
      await Promise.all(files.map((file) => file.mv(`files/comment-attachments/${taskId}/${NewComment.get('id')}/${timestamp}-${file.name}`)));
      files.map((file) => NewComment.createCommentAttachment({
        filename: file.name,
        mimetype: file.mimetype,
        contentDisposition: 'attachment',
        size: file.size,
        path: `files/comment-attachments/${taskId}/${NewComment.get('id')}/${timestamp}-${file.name}`,
      }));
    }
    let notificationMessage = `
      ${message}
    `;
    if (ParentComment) {
      notificationMessage += `
      -----Older messages-----
      ${ParentComment.get('Comments').map((Comment) => `
      ${Comment.get('User').get('fullName')} created comment at ${moment(Comment.get('createdAt')).format('HH:mm DD.MM.YYYY')}

      ${Comment.get('comment')}
      ------------------------
      `)}
      ${ParentComment.get('User').get('fullName')} created comment at ${moment(ParentComment.get('createdAt')).format('HH:mm DD.MM.YYYY')}
      ${ParentComment.get('comment')}
      `
    }
    sendNotificationToUsers(
      {
        subject: `New comment at ${moment().format('HH:mm DD.MM.YYYY')}.`,
        message: notificationMessage,
        read: false,
        createdById: User.get('id'),
        TaskId: Task.get('id'),
      },
      User.get('id'),
      Task,
    )
    return res.send({ ok: true, error: null, comment: NewComment.get() });
  });
}
