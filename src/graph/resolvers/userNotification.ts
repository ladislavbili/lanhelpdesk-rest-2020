import { createDoesNoExistsError } from '@/configs/errors';
import {
  idDoesExistsCheck,
  idsDoExistsCheck,
  getModelAttribute,
  filterUnique,
} from '@/helperFunctions';
import moment from 'moment';
import { sendEmail } from '@/services/smtp';
import { models } from '@/models';
import checkResolver from './checkResolver';
import { UserNotificationInstance, UserInstance } from '@/models/instances';
import { USER_NOTIFICATION_CHANGE } from '@/configs/subscriptions';
import { pubsub } from './index';
const { withFilter } = require('apollo-server-express');

const querries = {
  userNotifications: async (root, { limit }, { req }) => {
    let includeLimit = {};
    if (limit) {
      includeLimit['limit'] = limit;
    }
    const User = await checkResolver(
      req,
      [],
      false,
      [
        {
          model: models.UserNotification,
          ...includeLimit,
          order: [
            ['id', 'DESC'],
          ],
          include: [
            models.User,
            {
              model: models.User,
              as: 'createdBy'
            },
            models.Task,
          ]
        }
      ]
    );
    return User.get('UserNotifications');
  },

  userNotificationsCount: async (root, args, { req }) => {
    const User = await checkResolver(req);
    return models.UserNotification.count({ where: { UserId: User.get('id'), read: false } })
  },
}

const mutations = {
  setUserNotificationRead: async (root, { id, read }, { req }) => {
    const User = await checkResolver(req);
    const UserNotification = await models.UserNotification.findByPk(id);
    if (UserNotification === null || User.get('id') !== UserNotification.get('UserId')) {
      throw createDoesNoExistsError('UserNotification', id);
    }
    return UserNotification.update({ read: read === undefined ? true : read });
  },

  setSelectedUserNotificationsRead: async (root, { ids, read }, { req }) => {
    const User = await checkResolver(req);
    const UserNotifications = <UserNotificationInstance[]>await models.UserNotification.findAll({
      where: {
        id: ids,
        UserId: User.get('id')
      },
      attributes: ['id', 'UserId']
    })
    const filteredIds = <number[]>UserNotifications.map((UserNotification) => UserNotification.get('id'));
    await models.UserNotification.update(
      { read: read === undefined ? true : read },
      { where: { id: filteredIds } }
    );
    return filteredIds;
  },

  setAllUserNotificationsRead: async (root, { read }, { req }) => {
    const User = await checkResolver(req);
    await models.UserNotification.update(
      { read: read === undefined ? true : read },
      { where: { read: !(read === undefined ? true : read), UserId: User.get('id') } }
    );
    return true;
  },


  deleteUserNotification: async (root, { id }, { req }) => {
    const User = await checkResolver(req);
    const UserNotification = await models.UserNotification.findByPk(id);
    if (UserNotification === null || UserNotification.get('UserId') !== User.get('id')) {
      throw createDoesNoExistsError('UserNotification', id);
    }
    return UserNotification.destroy();
  },

  deleteSelectedUserNotifications: async (root, { ids }, { req }) => {
    const User = await checkResolver(req);
    const UserNotifications = <UserNotificationInstance[]>await models.UserNotification.findAll({
      where: {
        id: ids,
        UserId: User.get('id')
      },
      attributes: ['id', 'UserId']
    })
    const filteredIds = <number[]>UserNotifications.map((UserNotification) => UserNotification.get('id'));
    await models.UserNotification.destroy({ where: { id: filteredIds } });
    return filteredIds;
  },

  deleteAllUserNotifications: async (root, args, { req }) => {
    const User = await checkResolver(req);
    await models.UserNotification.destroy({ truncate: true, where: { UserId: User.get('id') } });
    return true;
  },
}

const attributes = {
  UserNotification: {
    async task(userNotification) {
      return getModelAttribute(userNotification, 'Task');
    },
    async forUser(userNotification) {
      return getModelAttribute(userNotification, 'User');
    },
    async fromUser(userNotification) {
      return getModelAttribute(userNotification, 'createdBy');
    },
  },
};

const subscriptions = {
  userNotificationsSubscription: {
    subscribe: withFilter(
      () => pubsub.asyncIterator(USER_NOTIFICATION_CHANGE),
      async (data, args, { userID }) => {
        return true;
      }
    ),
  }
}

export default {
  attributes,
  mutations,
  querries,
  subscriptions,
}

export const sendNotificationToUsers = async (notification, UserId, Task) => {
  const [response1, response2] = await Promise.all([
    models.User.findAll({ where: { id: [Task.get('requesterId')] } }),
    Task.getAssignedTos()
  ])
  let Users = <UserInstance[]>[...(<UserInstance[]>response1), ...(<UserInstance[]>response2)];
  filterUnique(Users, 'id').forEach((User) => {
    sendNotification(User, Task, notification);
  })
}

export const sendNotification = async (User, Task, notification) => {
  models.UserNotification.create({ ...notification, UserId: User.get('id') });

  if (User.get('receiveNotifications')) {
    sendEmail(
      `In task with id ${Task.get('id')} and current title ${Task.get('title')} was changed at ${moment().format('HH:mm DD.MM.YYYY')}.
      Subject: ${notification.subject}
      Message: ${notification.message}
      This is an automated message.If you don't wish to receive this kind of notification, please log in and change your profile setting.
      `,
      "",
      `${Task.get('id')}: ${Task.get('title')} was changed at ${moment().format('HH:mm DD.MM.YYYY')} `,
      User.get('email'),
      'lanhelpdesk2019@gmail.com'
    );
  }
}
