import { createDoesNoExistsError } from '@/configs/errors';
import { models } from '@/models';
import { checkIfHasProjectRights, multipleIdDoesExistsCheck, getModelAttribute } from '@/helperFunctions';
import checkResolver from './checkResolver';
import { TaskInstance, RepeatTemplateInstance } from '@/models/instances';

const querries = {
  customItems: async (root, { taskId }, { req }) => {
    const SourceUser = await checkResolver(req);
    await checkIfHasProjectRights(SourceUser.get('id'), taskId, undefined, ['vykazRead']);
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
    const { Task } = await checkIfHasProjectRights(SourceUser.get('id'), task, undefined, ['vykazWrite']);
    (<TaskInstance>Task).createTaskChange(
      {
        UserId: SourceUser.get('id'),
        TaskChangeMessages: [{
          type: 'customItem',
          originalValue: null,
          newValue: `${params.title},${params.done},${params.quantity},${params.price}`,
          message: `Custom item ${params.title} was added.`,
        }],
      },
      { include: [models.TaskChangeMessage] }
    )
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
    const { Task } = await checkIfHasProjectRights(SourceUser.get('id'), CustomItem.get('TaskId'), undefined, ['vykazWrite']);
    (<TaskInstance>Task).createTaskChange(
      {
        UserId: SourceUser.get('id'),
        TaskChangeMessages: [{
          type: 'customItem',
          originalValue: `${CustomItem.get('title')},${CustomItem.get('done')},${CustomItem.get('quantity')},${CustomItem.get('price')}`,
          newValue: `${params.title},${params.done},${params.quantity},${params.price}`,
          message: `Custom item ${CustomItem.get('title')}${params.title && params.title !== CustomItem.get('title') ? `/${params.title}` : ''} was updated.`,
        }],
      },
      { include: [models.TaskChangeMessage] }
    )
    return CustomItem.update(params);
  },

  deleteCustomItem: async (root, { id }, { req }) => {
    const SourceUser = await checkResolver(req);
    const CustomItem = await models.CustomItem.findByPk(id);
    if (CustomItem === null) {
      throw createDoesNoExistsError('CustomItem', id);
    }
    const { Task } = await checkIfHasProjectRights(SourceUser.get('id'), CustomItem.get('TaskId'), undefined, ['vykazWrite']);
    (<TaskInstance>Task).createTaskChange(
      {
        UserId: SourceUser.get('id'),
        TaskChangeMessages: [{
          type: 'customItem',
          originalValue: `${CustomItem.get('title')},${CustomItem.get('done')},${CustomItem.get('quantity')},${CustomItem.get('price')}`,
          newValue: null,
          message: `Custom item ${CustomItem.get('title')} was deleted.`,
        }],
      },
      { include: [models.TaskChangeMessage] }
    )
    return CustomItem.destroy();
  },

  addRepeatTemplateCustomItem: async (root, { repeatTemplate, ...params }, { req }) => {
    const SourceUser = await checkResolver(req);
    const RepeatTemplate = <RepeatTemplateInstance>await models.RepeatTemplate.findByPk(repeatTemplate);
    if (RepeatTemplate === null) {
      throw createDoesNoExistsError('Repeat template', repeatTemplate);
    }

    await checkIfHasProjectRights(SourceUser.get('id'), undefined, RepeatTemplate.get('ProjectId'), ['vykazWrite']);

    return models.CustomItem.create({
      RepeatTemplateId: repeatTemplate,
      ...params,
    });
  },

  updateRepeatTemplateCustomItem: async (root, { id, ...params }, { req }) => {
    const SourceUser = await checkResolver(req);
    const CustomItem = await models.CustomItem.findByPk(id, { include: [models.RepeatTemplate] });
    if (CustomItem === null) {
      throw createDoesNoExistsError('CustomItem', id);
    }
    await checkIfHasProjectRights(SourceUser.get('id'), undefined, (<RepeatTemplateInstance>CustomItem.get('RepeatTemplate')).get('ProjectId'), ['vykazWrite']);

    return CustomItem.update(params);
  },

  deleteRepeatTemplateCustomItem: async (root, { id }, { req }) => {
    const SourceUser = await checkResolver(req);
    const CustomItem = await models.CustomItem.findByPk(id, { include: [models.RepeatTemplate] });
    if (CustomItem === null) {
      throw createDoesNoExistsError('CustomItem', id);
    }

    await checkIfHasProjectRights(SourceUser.get('id'), undefined, (<RepeatTemplateInstance>CustomItem.get('RepeatTemplate')).get('ProjectId'), ['vykazWrite']);

    return CustomItem.destroy();
  },
}

const attributes = {
  CustomItem: {
    async task(customItem) {
      return getModelAttribute(customItem, 'Task');
    },
    async invoicedData(customItem) {
      return getModelAttribute(customItem, 'InvoicedCustomItems');
    },
    async repeatTemplate(customItem) {
      return getModelAttribute(customItem, 'RepeatTemplate');
    },
  }
};

export default {
  attributes,
  mutations,
  querries
}
