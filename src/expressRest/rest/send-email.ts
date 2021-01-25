import moment from 'moment';
import { createDoesNoExistsError, InternalMessagesNotAllowed, createWrongEmailsError, EmailNoRecipientError } from '@/configs/errors';
import checkResolver from '@/graph/resolvers/checkResolver';
import { checkIfHasProjectRightsOld, checkType, getAttributes, isEmail } from '@/helperFunctions';
import { models } from '@/models';
import { AccessRightsInstance, RoleInstance, TaskInstance, CommentInstance } from '@/models/instances';
import { EmailResultInstance } from '@/graph/resolvers/comment';
import { sendEmail as sendEmailService } from '@/services/smtp'

export function sendEmail(app) {
  app.post('/send-email', async function(req, res) {
    if (!Array.isArray(req.body.tos) && typeof req.body.tos === 'string') {
      req.body.tos = [req.body.tos];
    }
    const timestamp = moment().valueOf();
    const {
      failedGettingAttributes,
      token,
      taskId,
      message,
      tos,
      subject,
      parentCommentId,
    } = getAttributes([
      { key: 'token', nullAccepted: false, type: 'str' },
      { key: 'taskId', nullAccepted: false, type: 'int' },
      { key: 'message', nullAccepted: false, type: 'str' },
      { key: 'tos', nullAccepted: false, type: 'arr' },
      { key: 'subject', nullAccepted: false, type: 'str' },
      { key: 'parentCommentId', nullAccepted: true, type: 'int' },
    ], req.body);

    if (failedGettingAttributes) {
      return res.send({ ok: false, error: 'Comment failed, taskId(Int), token(String), message(String), subject(String) or tos(String[]) is missing/wrong type' })
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
      User = await checkResolver({ headers: { authorization: token } }, ['mailViaComment']);
      const checkData = await checkIfHasProjectRightsOld(User.get('id'), taskId);
      Task = checkData.Task;
      allowedInternal = checkData.internal;
    } catch (err) {
      return res.send({ ok: false, error: err.message })
    }

    if (parentCommentId) {
      const internalRight = (<AccessRightsInstance>(<RoleInstance>User.get('Role')).get('AccessRight')).get('internal');
      const ParentComment = await models.Comment.findByPk(parentCommentId);
      if (ParentComment === null || ParentComment.get('TaskId') !== taskId) {
        return res.send({ ok: false, error: createDoesNoExistsError('Parent comment', parentCommentId).message })
      }
      if (ParentComment.get('internal') && !allowedInternal && !internalRight) {
        return res.send({ ok: false, error: InternalMessagesNotAllowed.message })
      }
    }

    if (tos.length === 0) {
      return res.send({ ok: false, error: EmailNoRecipientError.message })
    }
    if (tos.some((address) => !isEmail(address))) {
      return res.send({ ok: false, error: createWrongEmailsError(tos.filter((address) => !isEmail(address))).message })
    }
    console.log('emailResult');

    let emailResult = <EmailResultInstance>await sendEmailService(message, message, subject, tos, User.get('email'), files);
    console.log(emailResult);

    let savedResult = { emailSend: true, emailError: null };
    if (emailResult.error) {
      savedResult = { emailSend: false, emailError: emailResult.message }
    }

    const NewComment = <CommentInstance>await models.Comment.create({
      message,
      UserId: User.get('id'),
      TaskId: taskId,
      commentOfId: parentCommentId || null,
      internal: false,
      subject,
      isEmail: true,
      ...savedResult,
      isParent: parentCommentId === null || parentCommentId === undefined,
      EmailTargets: tos.map((to) => ({ address: to })),
    }, { include: [models.EmailTarget] });
    models.TaskChange.create({
      UserId: User.get('id'),
      TaskId: taskId,
      TaskChangeMessages: [{
        type: 'email',
        originalValue: null,
        newValue: null,
        message: `${User.get('fullName')} send email from the task.`,
      }],
    }, { include: [{ model: models.TaskChangeMessage }] });
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
    return res.send({ ok: true, error: null, comment: NewComment.get() });
  });
}
