import { createDoesNoExistsError } from '@/configs/errors';
import { idDoesExistsCheck, idsDoExistsCheck, getModelAttribute } from '@/helperFunctions';
import { models } from '@/models';
import checkResolver from './checkResolver';

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
    return ErrorMessage.update({ read: read === undefined ? true : read });
  },

  setSelectedErrorMessagesRead: async (root, { ids, read }, { req }) => {
    await checkResolver(req, ["viewErrors"]);
    await idsDoExistsCheck(ids, models.ErrorMessage)
    await models.ErrorMessage.update({ read: read === undefined ? true : read }, { where: { id: ids } });
    return ids;
  },

  setAllErrorMessagesRead: async (root, { read }, { req }) => {
    await checkResolver(req, ["viewErrors"]);
    await models.ErrorMessage.update({ read: read === undefined ? true : read }, { where: { read: !(read === undefined ? true : read) } });
    return true;
  },


  deleteErrorMessage: async (root, { id }, { req }) => {
    await checkResolver(req, ["viewErrors"]);
    const ErrorMessage = await models.ErrorMessage.findByPk(id);
    if (ErrorMessage === null) {
      throw createDoesNoExistsError('ErrorMessage', id);
    }
    return ErrorMessage.destroy();
  },
  deleteSelectedErrorMessages: async (root, { ids }, { req }) => {
    await checkResolver(req, ["viewErrors"]);
    await idsDoExistsCheck(ids, models.ErrorMessage)
    await models.ErrorMessage.destroy({ where: { id: ids } });
    return ids;
  },

  deleteAllErrorMessages: async (root, args, { req }) => {
    await checkResolver(req, ["viewErrors"]);
    await models.ErrorMessage.destroy({ truncate: true });
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

export default {
  attributes,
  mutations,
  querries
}
