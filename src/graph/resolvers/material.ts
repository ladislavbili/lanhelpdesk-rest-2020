import { createDoesNoExistsError } from '@/configs/errors';
import { models } from '@/models';
import { multipleIdDoesExistsCheck, checkIfHasProjectRights, getModelAttribute } from '@/helperFunctions';
import checkResolver from './checkResolver';

const querries = {
  materials: async (root, { taskId }, { req }) => {
    const SourceUser = await checkResolver(req);
    await checkIfHasProjectRights(SourceUser.get('id'), taskId, undefined, ['vykazRead']);
    return models.Material.findAll({
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
  addMaterial: async (root, { task, ...params }, { req }) => {
    const SourceUser = await checkResolver(req);
    await checkIfHasProjectRights(SourceUser.get('id'), task, undefined, ['vykazWrite']);
    return models.Material.create({
      TaskId: task,
      ...params,
    });
  },

  updateMaterial: async (root, { id, ...params }, { req }) => {
    const SourceUser = await checkResolver(req);
    const Material = await models.Material.findByPk(id);
    if (Material === null) {
      throw createDoesNoExistsError('Material', id);
    }
    await checkIfHasProjectRights(SourceUser.get('id'), Material.get('TaskId'), undefined, ['vykazWrite']);
    return Material.update(params);
  },

  deleteMaterial: async (root, { id }, { req }) => {
    const SourceUser = await checkResolver(req);
    const Material = await models.Material.findByPk(id);
    if (Material === null) {
      throw createDoesNoExistsError('Material', id);
    }
    await checkIfHasProjectRights(SourceUser.get('id'), Material.get('TaskId'), undefined, ['vykazWrite']);
    return Material.destroy();
  },
}

const attributes = {
  Material: {
    async task(material) {
      return getModelAttribute(material, 'Task');
    },
    async invoicedData(material) {
      return getModelAttribute(material, 'InvoicedMaterials');
    },
  }
};

export default {
  attributes,
  mutations,
  querries
}
