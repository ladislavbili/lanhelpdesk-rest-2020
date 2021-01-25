import { createDoesNoExistsError } from '@/configs/errors';
import { models } from '@/models';
import { multipleIdDoesExistsCheck, checkIfHasProjectRightsOld, getModelAttribute } from '@/helperFunctions';
import checkResolver from './checkResolver';

const querries = {
  materials: async (root, { taskId }, { req }) => {
    const SourceUser = await checkResolver(req);
    await checkIfHasProjectRightsOld(SourceUser.get('id'), taskId);
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
    await checkIfHasProjectRightsOld(SourceUser.get('id'), task, 'write');
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
    await checkIfHasProjectRightsOld(SourceUser.get('id'), Material.get('TaskId'), 'write');
    return Material.update(params);
  },

  deleteMaterial: async (root, { id }, { req }) => {
    const SourceUser = await checkResolver(req);
    const Material = await models.Material.findByPk(id);
    if (Material === null) {
      throw createDoesNoExistsError('Material', id);
    }
    await checkIfHasProjectRightsOld(SourceUser.get('id'), Material.get('TaskId'), 'write');
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
