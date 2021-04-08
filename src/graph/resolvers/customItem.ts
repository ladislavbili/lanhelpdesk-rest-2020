import { createDoesNoExistsError } from '@/configs/errors';
import { models } from '@/models';
import { multipleIdDoesExistsCheck, getModelAttribute } from '@/helperFunctions';
import {
  checkIfHasProjectRights,
} from '@/graph/addons/project';
import checkResolver from './checkResolver';
import {
  TaskInstance,
  RepeatTemplateInstance,
  TaskMetadataInstance,
  ProjectInstance,
} from '@/models/instances';

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
    const [
      TaskMetadata,
      Project,
    ] = await Promise.all([
      Task.getTaskMetadata(),
      Task.getProject(),
    ]);
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
    if (params.approved || (<ProjectInstance>Project).get('autoApproved')) {
      (<TaskMetadataInstance>TaskMetadata).update({
        itemsApproved: (<TaskMetadataInstance>TaskMetadata).get('itemsApproved') + params.quantity
      })
    } else {
      (<TaskMetadataInstance>TaskMetadata).update({
        itemsPending: (<TaskMetadataInstance>TaskMetadata).get('itemsPending') + params.quantity
      })
    }
    if (params.approved) {
      params = {
        ...params,
        ItemApprovedById: SourceUser.get('id')
      }
    }
    return models.CustomItem.create({
      TaskId: task,
      ...params,
    });
  },

  updateCustomItem: async (root, { id, ...params }, { req }) => {
    const SourceUser = await checkResolver(req);
    const CustomItem = await models.CustomItem.findByPk(id, {
      include: [
        {
          model: models.Task,
          include: [
            models.Project,
            {
              model: models.TaskMetadata,
              as: 'TaskMetadata'
            },
          ]
        }
      ]
    });
    if (CustomItem === null) {
      throw createDoesNoExistsError('CustomItem', id);
    }
    const Task = <TaskInstance>CustomItem.get('Task');
    const Project = <ProjectInstance>Task.get('Project');
    const TaskMetadata = <TaskMetadataInstance>Task.get('TaskMetadata');
    await checkIfHasProjectRights(SourceUser.get('id'), undefined, Project.get('id'), ['vykazWrite']);
    let TaskChangeMessages = [
      {
        type: 'customItem',
        originalValue: `${CustomItem.get('title')},${CustomItem.get('done')},${CustomItem.get('quantity')},${CustomItem.get('price')}`,
        newValue: `${params.title},${params.done},${params.quantity},${params.price}`,
        message: `Custom item ${CustomItem.get('title')}${params.title && params.title !== CustomItem.get('title') ? `/${params.title}` : ''} was updated.`,
      }
    ]
    if (params.approved === false && CustomItem.get('approved') === true) {
      params = {
        ...params,
        ItemApprovedById: null,
      }
      TaskChangeMessages.push({
        type: 'customItem',
        originalValue: `${!params.approved}`,
        newValue: `${params.approved}`,
        message: `Custom item ${CustomItem.get('title')}${params.title && params.title !== CustomItem.get('title') ? `/${params.title}` : ''} was set as not approved by ${SourceUser.get('fullName')}(${SourceUser.get('email')}).`,
      })
    } else if (params.approved === true && CustomItem.get('approved') === false) {
      params = {
        ...params,
        ItemApprovedById: SourceUser.get('id')
      }
      TaskChangeMessages.push({
        type: 'customItem',
        originalValue: `${!params.approved}`,
        newValue: `${params.approved}`,
        message: `Custom item ${CustomItem.get('title')}${params.title && params.title !== CustomItem.get('title') ? `/${params.title}` : ''} was set as approved by ${SourceUser.get('fullName')}(${SourceUser.get('email')}).`,
      })
    }
    (<TaskInstance>Task).createTaskChange(
      {
        UserId: SourceUser.get('id'),
        TaskChangeMessages,
      },
      { include: [models.TaskChangeMessage] }
    )
    //Metadata update
    if ((params.approved !== undefined && params.approved !== null) || params.quantity) {
      let itemsApproved = parseFloat(<any>TaskMetadata.get('itemsApproved'));
      let itemsPending = parseFloat(<any>TaskMetadata.get('itemsPending'));
      //Delete first
      if (Project.get('autoApproved') || CustomItem.get('approved')) {
        itemsApproved -= parseFloat(<any>CustomItem.get('quantity'));
      } else {
        itemsPending -= parseFloat(<any>CustomItem.get('quantity'));
      }
      //Add new
      if (Project.get('autoApproved') || params.approved === true || (params.approved !== false && CustomItem.get('approved'))) {
        if (params.quantity) {
          itemsApproved += parseFloat(<any>params.quantity);
        } else {
          itemsApproved += parseFloat(<any>CustomItem.get('quantity'));
        }
      } else {
        if (params.quantity) {
          itemsPending += parseFloat(<any>params.quantity);
        } else {
          itemsPending += parseFloat(<any>CustomItem.get('quantity'));
        }
      }
      //Update
      TaskMetadata.update({
        itemsApproved,
        itemsPending
      })
    }
    return CustomItem.update(params);
  },

  deleteCustomItem: async (root, { id }, { req }) => {
    const SourceUser = await checkResolver(req);
    const CustomItem = await models.CustomItem.findByPk(id, {
      include: [
        {
          model: models.Task,
          include: [
            models.Project,
            {
              model: models.TaskMetadata,
              as: 'TaskMetadata'
            },
          ]
        }
      ]
    });
    if (CustomItem === null) {
      throw createDoesNoExistsError('CustomItem', id);
    }
    const Task = <TaskInstance>CustomItem.get('Task');
    const Project = <ProjectInstance>Task.get('Project');
    const TaskMetadata = <TaskMetadataInstance>Task.get('TaskMetadata');
    await checkIfHasProjectRights(SourceUser.get('id'), undefined, Project.get('id'), ['vykazWrite']);
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
    if (Project.get('autoApproved') || CustomItem.get('approved')) {
      TaskMetadata.update({
        itemsApproved: parseFloat(<any>TaskMetadata.get('itemsApproved')) - parseFloat(<any>CustomItem.get('quantity'))
      })
    } else {
      TaskMetadata.update({
        itemsPending: parseFloat(<any>TaskMetadata.get('itemsPending')) - parseFloat(<any>CustomItem.get('quantity'))
      })
    }
    return CustomItem.destroy();
  },

  addRepeatTemplateCustomItem: async (root, { repeatTemplate, ...params }, { req }) => {
    const SourceUser = await checkResolver(req);
    const RepeatTemplate = <RepeatTemplateInstance>await models.RepeatTemplate.findByPk(repeatTemplate);
    if (RepeatTemplate === null) {
      throw createDoesNoExistsError('Repeat template', repeatTemplate);
    }

    await checkIfHasProjectRights(SourceUser.get('id'), undefined, RepeatTemplate.get('ProjectId'), ['vykazWrite']);
    if (params.approved) {
      params = {
        ...params,
        ItemApprovedById: SourceUser.get('id')
      }
    }
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
    if (params.approved === false && CustomItem.get('approved') === true) {
      params = {
        ...params,
        ItemApprovedById: null,
      }
    } else if (params.approved === true && CustomItem.get('approved') === false) {
      params = {
        ...params,
        ItemApprovedById: SourceUser.get('id')
      }
    }
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
    async approvedBy(customItem) {
      return getModelAttribute(customItem, 'ItemApprovedBy');
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
