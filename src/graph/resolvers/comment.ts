import {
  createDoesNoExistsError,
  AssignedToUserNotSolvingTheTask,
  InternalMessagesNotAllowed,
  EmailNoRecipientError,
  createWrongEmailsError,
  CommentNotEmailError,
  EmailAlreadySendError
} from '@/configs/errors';
import { models } from '@/models';
import { checkIfHasProjectRights, isEmail } from '@/helperFunctions';
import { sendEmail } from '@/services/smtp'
import { RoleInstance, AccessRightsInstance, TaskInstance, EmailTargetInstance, UserInstance, CommentAttachmentInstance } from '@/models/instances';
import pathResolver from 'path';
import { Op } from 'sequelize';
import checkResolver from './checkResolver';
import fs from 'fs';

export interface EmailResultInstance {
  message: string;
  error: boolean;
}

const querries = {
  comments: async (root, { taskId }, { req }) => {
    const SourceUser = await checkResolver(req);
    const AccessRights = <AccessRightsInstance>(<RoleInstance>SourceUser.get('Role')).get('AccessRight');
    const { internal } = await checkIfHasProjectRights(SourceUser.get('id'), taskId);
    return models.Comment.findAll({
      order: [
        ['createdAt', 'ASC'],
      ],
      where: {
        TaskId: taskId,
        internal: {
          [Op.or]: [false, (internal || AccessRights.get('internal'))]
        },
        isParent: true
      }
    })
  },
}

const mutations = {
  addComment: async (root, { task, parentCommentId, internal, ...params }, { req }) => {
    const SourceUser = await checkResolver(req);
    const internalRight = (<AccessRightsInstance>(<RoleInstance>SourceUser.get('Role')).get('AccessRight')).get('internal');
    const { internal: allowedInternal, Task } = await checkIfHasProjectRights(SourceUser.get('id'), task);
    if (internal && !allowedInternal && !internalRight) {
      throw InternalMessagesNotAllowed;
    }
    if (parentCommentId) {
      const ParentComment = await models.Comment.findByPk(parentCommentId);
      if (ParentComment === null || ParentComment.get('TaskId') !== task) {
        throw createDoesNoExistsError('Parent comment', parentCommentId);
      }
      if (ParentComment.get('internal') && !allowedInternal && !internalRight) {
        throw InternalMessagesNotAllowed;
      }
    }

    const NewComment = await models.Comment.create({
      internal,
      TaskId: task,
      commentOfId: parentCommentId || null,
      isParent: parentCommentId === null || parentCommentId === undefined,
      UserId: SourceUser.get('id'),
      ...params,
    });
    if (!internal) {
      (<TaskInstance>Task).createTaskChange({
        UserId: SourceUser.get('id'),
        TaskChangeMessages: [{
          type: 'comment',
          originalValue: null,
          newValue: null,
          message: `${SourceUser.get('fullName')} has commented the task.`,
        }]
      }, { include: [{ model: models.TaskChangeMessage }] });
    }
    return NewComment;
  },

  sendEmail: async (root, { task, parentCommentId, message, subject, tos }, { req }) => {
    const SourceUser = await checkResolver(req, ['mailViaComment']);
    await checkIfHasProjectRights(SourceUser.get('id'), task);
    if (parentCommentId) {
      const ParentComment = await models.Comment.findByPk(parentCommentId);
      if (ParentComment === null || ParentComment.get('TaskId') !== task) {
        throw createDoesNoExistsError('Parent comment', parentCommentId);
      }
    }
    if (tos.length === 0) {
      throw EmailNoRecipientError;
    }
    if (tos.some((address) => !isEmail(address))) {
      throw createWrongEmailsError(tos.filter((address) => !isEmail(address)));
    }
    let emailResult = <EmailResultInstance>await sendEmail(message, message, subject, tos, SourceUser.get('email'));
    let savedResult = { emailSend: true, emailError: null };
    if (emailResult.error) {
      savedResult = { emailSend: false, emailError: emailResult.message }
    }
    const NewComment = await models.Comment.create({
      message,
      UserId: SourceUser.get('id'),
      TaskId: task,
      commentOfId: parentCommentId || null,
      internal: false,
      subject,
      isEmail: true,
      ...savedResult,
      isParent: parentCommentId === null || parentCommentId === undefined,
      EmailTargets: tos.map((to) => ({ address: to })),
    }, { include: [models.EmailTarget] });
    models.TaskChange.create({
      UserId: SourceUser.get('id'),
      TaskId: task,
      TaskChangeMessages: [{
        type: 'email',
        originalValue: null,
        newValue: null,
        message: `${SourceUser.get('fullName')} send email from the task.`,
      }],
    }, { include: [{ model: models.TaskChangeMessage }] });
    return NewComment;
  },
  resendEmail: async (root, { messageId }, { req }) => {
    const SourceUser = await checkResolver(req, ['mailViaComment']);
    const Comment = await models.Comment.findByPk(messageId, {
      include: [
        { model: models.User },
        { model: models.EmailTarget },
        { model: models.CommentAttachment }]
    });
    if (Comment === null) {
      throw createDoesNoExistsError('Comment', messageId);
    }
    await checkIfHasProjectRights(SourceUser.get('id'), Comment.get('TaskId'));
    if (!Comment.get('isEmail')) {
      throw CommentNotEmailError;
    }
    /*
    if (!Comment.get('emailSend')) {
      throw EmailAlreadySendError;
    }
    */
    const CommentAttachments = <CommentAttachmentInstance[]>Comment.get('CommentAttachments');
    let files = [];
    if (CommentAttachments.length === 0) {
      let emailResult = <EmailResultInstance>await sendEmail(
        Comment.get('message'),
        null,
        Comment.get('subject'),
        (<EmailTargetInstance[]>Comment.get('EmailTargets')).map((EmailTarget) => EmailTarget.get('address')),
        (<UserInstance>Comment.get('User')).get('email')
      );
      if (emailResult.error) {
        Comment.update({ emailError: emailResult.message })
      } else {
        Comment.update({ emailError: null, emailSend: true })
      }
    }
    CommentAttachments.forEach((CommentAttachment) => {
      fs.readFile(`./${CommentAttachment.get('path')}`, async (err, data) => {
        if (err) {
          CommentAttachment.destroy();
          files.push({
            ...CommentAttachment.get(),
            data: null
          })
        } else {
          files.push({
            ...CommentAttachment.get(),
            data
          })
        }
        if (files.length === CommentAttachments.length) {
          files = files.filter((file) => file.data !== null);
          let emailResult = <EmailResultInstance>await sendEmail(
            Comment.get('message'),
            null,
            Comment.get('subject'),
            (<EmailTargetInstance[]>Comment.get('EmailTargets')).map((EmailTarget) => EmailTarget.get('address')),
            (<UserInstance>Comment.get('User')).get('email'),
            files
          );
          if (emailResult.error) {
            Comment.update({ emailError: emailResult.message })
          } else {
            Comment.update({ emailError: null, emailSend: true })
          }
        }
      });
    });

    return Comment;
  },
}

const attributes = {
  Comment: {
    async user(comment) {
      return comment.getUser()
    },
    async task(comment) {
      return comment.getTask()
    },
    async childComments(comment) {
      return comment.getComments()
    },
    async parentComment(comment) {
      return comment.getCommentOf()
    },
    async parentCommentId(comment) {
      return comment.get('CommentId')
    },
    async tos(comment) {
      const EmailTargets = await comment.getEmailTargets();
      return EmailTargets.map((emailTarget) => emailTarget.get('address'));
    },
    async commentAttachments(comment) {
      return comment.getCommentAttachments()
    },

  }
};

export default {
  attributes,
  mutations,
  querries
}
