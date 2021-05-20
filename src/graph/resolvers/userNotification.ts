import { createDoesNoExistsError } from '@/configs/errors';
import {
  getModelAttribute,
} from '@/helperFunctions';
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
    await UserNotification.update({ read: read === undefined ? true : read });
    pubsub.publish(USER_NOTIFICATION_CHANGE, { userNotificationsSubscription: User.get('id') });
    return UserNotification;
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
    pubsub.publish(USER_NOTIFICATION_CHANGE, { userNotificationsSubscription: User.get('id') });
    return filteredIds;
  },

  setAllUserNotificationsRead: async (root, { read }, { req }) => {
    const User = await checkResolver(req);
    await models.UserNotification.update(
      { read: read === undefined ? true : read },
      { where: { read: !(read === undefined ? true : read), UserId: User.get('id') } }
    );
    pubsub.publish(USER_NOTIFICATION_CHANGE, { userNotificationsSubscription: User.get('id') });
    return true;
  },


  deleteUserNotification: async (root, { id }, { req }) => {
    const User = await checkResolver(req);
    const UserNotification = await models.UserNotification.findByPk(id);
    if (UserNotification === null || UserNotification.get('UserId') !== User.get('id')) {
      throw createDoesNoExistsError('UserNotification', id);
    }
    await UserNotification.destroy();
    pubsub.publish(USER_NOTIFICATION_CHANGE, { userNotificationsSubscription: User.get('id') });
    return UserNotification;
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
    pubsub.publish(USER_NOTIFICATION_CHANGE, { userNotificationsSubscription: User.get('id') });
    return filteredIds;
  },

  deleteAllUserNotifications: async (root, args, { req }) => {
    const User = await checkResolver(req);
    await models.UserNotification.destroy({ truncate: true, where: { UserId: User.get('id') } });
    pubsub.publish(USER_NOTIFICATION_CHANGE, { userNotificationsSubscription: User.get('id') });
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
      async ({ userNotificationsSubscription }, args, { userID }) => {
        return userNotificationsSubscription === userID;
      }
    ),
  },
  userNotificationsCountSubscription: {
    subscribe: withFilter(
      () => pubsub.asyncIterator(USER_NOTIFICATION_CHANGE),
      async ({ userNotificationsSubscription }, args, { userID }) => {
        return userNotificationsSubscription === userID;
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
