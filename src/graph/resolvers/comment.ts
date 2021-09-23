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
import {
  isEmail,
  getModelAttribute,
  sendTaskNotificationsToUsers,
} from '@/helperFunctions';
import {
  checkIfHasProjectRights,
} from '@/graph/addons/project';
import { sendEmail } from '@/services/smtp'
import { RoleInstance, AccessRightsInstance, TaskInstance, EmailTargetInstance, UserInstance, CommentAttachmentInstance } from '@/models/instances';
import pathResolver from 'path';
import { Op } from 'sequelize';
import checkResolver from './checkResolver';
import fs from 'fs';
import {
  COMMENT_CHANGE,
} from '@/configs/subscriptions';
import { pubsub } from './index';
const { withFilter } = require('apollo-server-express');

export interface EmailResultInstance {
  message: string;
  error: boolean;
}

const queries = {
  comments: async (root, { task, limit, page }, { req }) => {
    const SourceUser = await checkResolver(req);
    const { groupRights } = await checkIfHasProjectRights(SourceUser, task, undefined, ['viewComments']);
    if (limit && page) {
      const { count, rows } = await models.Comment.findAndCountAll({
        limit,
        offset: (page - 1) * limit,
        order: [
          ['createdAt', 'DESC'],
        ],
        include: [
          models.User,
          models.EmailTarget,
          models.CommentAttachment,
          {
            model: models.Comment,
            include: [
              models.User,
              models.EmailTarget,
              models.CommentAttachment,
              models.Comment,
            ]
          }
        ],
        where: {
          TaskId: task,
          internal: {
            [Op.or]: [false, groupRights.project.internal]
          },
          isParent: true
        }
      })
      return (<any[]>rows).map((row) => {
        row.messageCount = count;
        return row;
      });
    }
    const { count, rows } = await models.Comment.findAndCountAll({
      order: [
        ['createdAt', 'ASC'],
      ],
      include: [
        models.User,
        models.EmailTarget,
        models.CommentAttachment,
        {
          model: models.Comment,
          include: [
            models.User,
            models.EmailTarget,
            models.CommentAttachment,
            models.Comment,
          ]
        }
      ],
      where: {
        TaskId: task,
        internal: {
          [Op.or]: [false, groupRights.project.internal]
        },
        isParent: true
      }
    });
    return (<any[]>rows).map((row) => {
      row.messageCount = count;
      return row;
    });
  },
}

const mutations = {
  resendEmail: async (root, { messageId }, { req }) => {
    const SourceUser = await checkResolver(req);
    const Comment = await models.Comment.findByPk(messageId, {
      include: [
        { model: models.User },
        { model: models.EmailTarget },
        { model: models.CommentAttachment }]
    });
    if (Comment === null) {
      throw createDoesNoExistsError('Comment', messageId);
    }
    await checkIfHasProjectRights(SourceUser, Comment.get('TaskId'), undefined, ['emails']);
    if (!Comment.get('isEmail')) {
      throw CommentNotEmailError;
    }
    if (!Comment.get('emailSend')) {
      throw EmailAlreadySendError;
    }
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
        await Comment.update({ emailError: emailResult.message })
      } else {
        await Comment.update({ emailError: null, emailSend: true })
      }
      await pubsub.publish(COMMENT_CHANGE, { commentsSubscription: Comment.get('TaskId') });
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
            await Comment.update({ emailError: emailResult.message })
          } else {
            await Comment.update({ emailError: null, emailSend: true })
          }
          pubsub.publish(COMMENT_CHANGE, { commentsSubscription: Comment.get('TaskId') });
        }
      });
    });

    return Comment;
  },
}

const attributes = {
  Comment: {
    async user(comment) {
      return getModelAttribute(comment, 'User');
    },
    async task(comment) {
      return getModelAttribute(comment, 'Task');
    },
    async childComments(comment) {
      return getModelAttribute(comment, 'Comments');
    },
    async parentComment(comment) {
      return getModelAttribute(comment, 'commentOf');
    },
    async parentCommentId(comment) {
      return comment.get('CommentId')
    },
    async tos(comment) {
      const EmailTargets = await getModelAttribute(comment, 'EmailTargets');
      return EmailTargets.map((emailTarget) => emailTarget.get('address'));
    },
    async commentAttachments(comment) {
      return getModelAttribute(comment, 'CommentAttachments');
    },

  }
};

const subscriptions = {
  commentsSubscription: {
    subscribe: withFilter(
      () => pubsub.asyncIterator(COMMENT_CHANGE),
      async ({ commentsSubscription }, { taskId }, { userID }) => {
        return commentsSubscription === taskId;
      }
    ),
  },
}

export default {
  attributes,
  mutations,
  queries,
  subscriptions,
}
