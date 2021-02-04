import { createDoesNoExistsError } from '@/configs/errors';
import { models } from '@/models';
import { multipleIdDoesExistsCheck, checkIfHasProjectRights, getModelAttribute } from '@/helperFunctions';
import checkResolver from './checkResolver';
import { TaskInstance } from '@/models/instances';

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
    const { Task } = await checkIfHasProjectRights(SourceUser.get('id'), task, undefined, ['vykazWrite']);
    (<TaskInstance>Task).createTaskChange(
      {
        UserId: SourceUser.get('id'),
        TaskChangeMessages: [{
          type: 'material',
          originalValue: null,
          newValue: `${params.title},${params.done},${params.quantity},${params.price},${params.margin}`,
          message: `Material ${params.title} was added.`,
        }],
      },
      { include: [models.TaskChangeMessage] }
    )
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
    const { Task } = await checkIfHasProjectRights(SourceUser.get('id'), Material.get('TaskId'), undefined, ['vykazWrite']);
    (<TaskInstance>Task).createTaskChange(
      {
        UserId: SourceUser.get('id'),
        TaskChangeMessages: [{
          type: 'material',
          originalValue: `${Material.get('title')},${Material.get('done')},${Material.get('quantity')},${Material.get('price')},${Material.get('margin')}`,
          newValue: `${params.title},${params.done},${params.quantity},${params.price},${params.margin}`,
          message: `Material ${Material.get('title')}${params.title && params.title !== Material.get('title') ? `/${params.title}` : ''} was updated.`,
        }],
      },
      { include: [models.TaskChangeMessage] }
    )
    return Material.update(params);
  },

  deleteMaterial: async (root, { id }, { req }) => {
    const SourceUser = await checkResolver(req);
    const Material = await models.Material.findByPk(id);
    if (Material === null) {
      throw createDoesNoExistsError('Material', id);
    }
    const { Task } = await checkIfHasProjectRights(SourceUser.get('id'), Material.get('TaskId'), undefined, ['vykazWrite']);
    (<TaskInstance>Task).createTaskChange(
      {
        UserId: SourceUser.get('id'),
        TaskChangeMessages: [{
          type: 'material',
          originalValue: `${Material.get('title')},${Material.get('done')},${Material.get('quantity')},${Material.get('price')},${Material.get('margin')}`,
          newValue: null,
          message: `Material ${Material.get('title')} was deleted.`,
        }],
      },
      { include: [models.TaskChangeMessage] }
    )
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
