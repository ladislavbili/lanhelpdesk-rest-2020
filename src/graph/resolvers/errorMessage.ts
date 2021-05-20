import { createDoesNoExistsError } from '@/configs/errors';
import { idDoesExistsCheck, idsDoExistsCheck, getModelAttribute } from '@/helperFunctions';
import { models } from '@/models';
import checkResolver from './checkResolver';
import { ERROR_MESSAGE_CHANGE } from '@/configs/subscriptions';
import { pubsub } from './index';
const { withFilter } = require('apollo-server-express');

const querries = {
  errorMessages: async (root, args, { req }) => {
    await checkResolver(req, ["viewErrors"]);
    return models.ErrorMessage.findAll({
      order: [
        ['createdAt', 'ASC'],
      ],
      include: [
        models.User
      ]
    })
  },
  errorMessageCount: async (root, args, { req }) => {
    await checkResolver(req, ["viewErrors"]);
    return models.ErrorMessage.count({ where: { read: false } })
  },
}

const mutations = {
  setErrorMessageRead: async (root, { id, read }, { req }) => {
    await checkResolver(req, ["viewErrors"]);
    const ErrorMessage = await models.ErrorMessage.findByPk(id);
    if (ErrorMessage === null) {
      throw createDoesNoExistsError('ErrorMessage', id);
    }
    await ErrorMessage.update({ read: read === undefined ? true : read });
    pubsub.publish(ERROR_MESSAGE_CHANGE, { errorMessagesSubscription: true });
    return ErrorMessage;
  },

  setSelectedErrorMessagesRead: async (root, { ids, read }, { req }) => {
    await checkResolver(req, ["viewErrors"]);
    await idsDoExistsCheck(ids, models.ErrorMessage)
    await models.ErrorMessage.update({ read: read === undefined ? true : read }, { where: { id: ids } });
    pubsub.publish(ERROR_MESSAGE_CHANGE, { errorMessagesSubscription: true });
    return ids;
  },

  setAllErrorMessagesRead: async (root, { read }, { req }) => {
    await checkResolver(req, ["viewErrors"]);
    await models.ErrorMessage.update({ read: read === undefined ? true : read }, { where: { read: !(read === undefined ? true : read) } });
    pubsub.publish(ERROR_MESSAGE_CHANGE, { errorMessagesSubscription: true });
    return true;
  },


  deleteErrorMessage: async (root, { id }, { req }) => {
    await checkResolver(req, ["viewErrors"]);
    const ErrorMessage = await models.ErrorMessage.findByPk(id);
    if (ErrorMessage === null) {
      throw createDoesNoExistsError('ErrorMessage', id);
    }
    await ErrorMessage.destroy();
    pubsub.publish(ERROR_MESSAGE_CHANGE, { errorMessagesSubscription: true });
    return ErrorMessage;
  },
  deleteSelectedErrorMessages: async (root, { ids }, { req }) => {
    await checkResolver(req, ["viewErrors"]);
    await idsDoExistsCheck(ids, models.ErrorMessage)
    await models.ErrorMessage.destroy({ where: { id: ids } });
    pubsub.publish(ERROR_MESSAGE_CHANGE, { errorMessagesSubscription: true });
    return ids;
  },

  deleteAllErrorMessages: async (root, args, { req }) => {
    await checkResolver(req, ["viewErrors"]);
    await models.ErrorMessage.destroy({ truncate: true });
    pubsub.publish(ERROR_MESSAGE_CHANGE, { errorMessagesSubscription: true });
    return true;
  },
}

const attributes = {
  ErrorMessage: {
    async user(errorMessage) {
      return getModelAttribute(errorMessage, 'User');
    },
  },
};

const subscriptions = {
  errorMessagesSubscription: {
    subscribe: withFilter(
      () => pubsub.asyncIterator(ERROR_MESSAGE_CHANGE),
      async (data, args, { userID }) => {
        return true;
      }
    ),
  },
  errorMessageCountSubscription: {
    subscribe: withFilter(
      () => pubsub.asyncIterator(ERROR_MESSAGE_CHANGE),
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
