import { createDoesNoExistsError } from 'configs/errors';
import { models } from 'models';
import { checkIfHasProjectRights } from "helperFunctions";
import { multipleIdDoesExistsCheck } from 'helperFunctions';
import checkResolver from './checkResolver';

const querries = {
  customItems: async (root, { taskId }, { req }) => {
    const SourceUser = await checkResolver(req);
    await checkIfHasProjectRights(SourceUser.get('id'), taskId);
    return models.CustomItem.findAll({
      order: [
        ['order', 'ASC'],
        ['title', 'ASC'],
      ],
      where: {
        TaskId: taskId
      }
    })
  },
}

const mutations = {
  addCustomItem: async (root, { task, ...params }, { req }) => {
    const SourceUser = await checkResolver(req);
    await checkIfHasProjectRights(SourceUser.get('id'), task, 'write');
    return models.CustomItem.create({
      TaskId: task,
      ...params,
    });
  },

  updateCustomItem: async (root, { id, ...params }, { req }) => {
    const SourceUser = await checkResolver(req);
    const CustomItem = await models.CustomItem.findByPk(id);
    if (CustomItem === null) {
      throw createDoesNoExistsError('CustomItem', id);
    }
    await checkIfHasProjectRights(SourceUser.get('id'), CustomItem.get('TaskId'), 'write');
    return CustomItem.update(params);
  },

  deleteCustomItem: async (root, { id }, { req }) => {
    const SourceUser = await checkResolver(req);
    const CustomItem = await models.CustomItem.findByPk(id);
    if (CustomItem === null) {
      throw createDoesNoExistsError('CustomItem', id);
    }
    await checkIfHasProjectRights(SourceUser.get('id'), CustomItem.get('TaskId'), 'write');
    return CustomItem.destroy();
  },
}

const attributes = {
  CustomItem: {
    async task(customItem) {
      return customItem.getTask()
    },
  }
};

export default {
  attributes,
  mutations,
  querries
}
