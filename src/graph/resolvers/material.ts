import {
  createDoesNoExistsError,
  CantEditInvoicedTaskError,
} from '@/configs/errors';
import { models } from '@/models';
import {
  multipleIdDoesExistsCheck,
  getModelAttribute,
  sendTaskNotificationsToUsers,
} from '@/helperFunctions';
import {
  checkIfHasProjectRights,
} from '@/graph/addons/project';
import checkResolver from './checkResolver';
import { pubsub } from './index';
import { TASK_HISTORY_CHANGE } from '@/configs/subscriptions';
import {
  TaskInstance,
  RepeatTemplateInstance,
  TaskMetadataInstance,
  ProjectInstance,
} from '@/models/instances';

const queries = {
  materials: async (root, { taskId, fromInvoice }, { req }) => {
    const SourceUser = await checkResolver(req, fromInvoice ? ['vykazy'] : []);
    await checkIfHasProjectRights(SourceUser, taskId, undefined, ['taskMaterialsRead'], [], fromInvoice === true);
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
  addMaterial: async (root, { task, fromInvoice, ...params }, { req }) => {
    const SourceUser = await checkResolver(req, fromInvoice ? ['vykazy'] : []);
    const { Task } = await checkIfHasProjectRights(SourceUser, task, undefined, ['taskMaterialsWrite'], [], fromInvoice === true);
    const [
      TaskMetadata,
      Project,
    ] = await Promise.all([
      Task.getTaskMetadata(),
      Task.getProject(),
    ]);
    if (Task.get('invoiced')) {
      throw CantEditInvoicedTaskError;
    }
    await (<TaskInstance>Task).createTaskChange(
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
    );
    sendTaskNotificationsToUsers(SourceUser, Task, [{ type: 'otherAttributesAdd', data: { label: 'Materiálu', newData: [params.done ? '[Dokončené]' : '[-]', params.title, params.quantity] } }]);
    pubsub.publish(TASK_HISTORY_CHANGE, { taskHistorySubscription: task });

    if (params.approved || (<ProjectInstance>Project).get('autoApproved')) {
      (<TaskMetadataInstance>TaskMetadata).update({
        materialsApproved: parseFloat(<any>(<TaskMetadataInstance>TaskMetadata).get('materialsApproved')) + parseFloat(<any>params.quantity),
      })
    } else {
      (<TaskMetadataInstance>TaskMetadata).update({
        materialsPending: parseFloat(<any>(<TaskMetadataInstance>TaskMetadata).get('materialsPending')) + parseFloat(<any>params.quantity),
      })
    }
    if (params.approved) {
      params = {
        ...params,
        MaterialApprovedById: SourceUser.get('id')
      }
    }
    return models.Material.create({
      TaskId: task,
      ...params,
    });
  },

  updateMaterial: async (root, { id, fromInvoice, ...params }, { req }) => {
    const SourceUser = await checkResolver(req, fromInvoice ? ['vykazy'] : []);
    const Material = await models.Material.findByPk(id, {
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
    if (Material === null) {
      throw createDoesNoExistsError('Material', id);
    }
    const Task = <TaskInstance>Material.get('Task');
    if (Task.get('invoiced')) {
      throw CantEditInvoicedTaskError;
    }
    const Project = <ProjectInstance>Task.get('Project');
    const TaskMetadata = <TaskMetadataInstance>Task.get('TaskMetadata');
    let TaskChangeMessages = [
      {
        type: 'material',
        originalValue: `${Material.get('title')},${Material.get('done')},${Material.get('quantity')},${Material.get('price')},${Material.get('margin')}`,
        newValue: `${params.title},${params.done},${params.quantity},${params.price},${params.margin}`,
        message: `Material ${Material.get('title')}${params.title && params.title !== Material.get('title') ? `/${params.title}` : ''} was updated.`,
      }
    ]
    await checkIfHasProjectRights(SourceUser, undefined, Project.get('id'), ['taskMaterialsWrite'], [], fromInvoice === true);
    if (params.approved === false && Material.get('approved') === true) {
      params = {
        ...params,
        MaterialApprovedById: null,
      }
      TaskChangeMessages.push({
        type: 'material',
        originalValue: `${!params.approved}`,
        newValue: `${params.approved}`,
        message: `Material ${Material.get('title')}${params.title && params.title !== Material.get('title') ? `/${params.title}` : ''} was set as not approved by ${SourceUser.get('fullName')}(${SourceUser.get('email')}).`,
      })
    } else if (params.approved === true && Material.get('approved') === false) {
      params = {
        ...params,
        MaterialApprovedById: SourceUser.get('id')
      }
      TaskChangeMessages.push({
        type: 'material',
        originalValue: `${!params.approved}`,
        newValue: `${params.approved}`,
        message: `Material ${Material.get('title')}${params.title && params.title !== Material.get('title') ? `/${params.title}` : ''} was set as approved by ${SourceUser.get('fullName')}(${SourceUser.get('email')}).`,
      })
    }
    await (<TaskInstance>Task).createTaskChange(
      {
        UserId: SourceUser.get('id'),
        TaskChangeMessages,
      },
      { include: [models.TaskChangeMessage] }
    );
    sendTaskNotificationsToUsers(
      SourceUser,
      Task,
      [
        {
          type: 'otherAttributes',
          data: {
            label: 'Materiálu',
            old: `${Material.get('done') ? '[Dokončené]' : '[-]'} - ${Material.get('title')} - ${Material.get('quantity')}`,
            new: `${params.done ? (params.done ? '[Dokončené]' : '[-]') : (Material.get('done') ? '[Dokončené]' : '[-]')} - ${params.title ? params.title : Material.get('title')} - ${params.quantity ? params.quantity : Material.get('quantity')}`
          }
        }
      ]
    );
    pubsub.publish(TASK_HISTORY_CHANGE, { taskHistorySubscription: Material.get('TaskId') });

    //Metadata update
    if ((params.approved !== undefined && params.approved !== null) || params.quantity) {
      let materialsApproved = parseFloat(<any>TaskMetadata.get('materialsApproved'));
      let materialsPending = parseFloat(<any>TaskMetadata.get('materialsPending'));
      //Delete first
      if (Project.get('autoApproved') || Material.get('approved')) {
        materialsApproved -= parseFloat(<any>Material.get('quantity'));
      } else {
        materialsPending -= parseFloat(<any>Material.get('quantity'));
      }
      //Add new
      if (Project.get('autoApproved') || params.approved === true || (params.approved !== false && Material.get('approved'))) {
        if (params.quantity) {
          materialsApproved += parseFloat(<any>params.quantity);
        } else {
          materialsApproved += parseFloat(<any>Material.get('quantity'));
        }
      } else {
        if (params.quantity) {
          materialsPending += parseFloat(<any>params.quantity);
        } else {
          materialsPending += parseFloat(<any>Material.get('quantity'));
        }
      }
      //Update
      TaskMetadata.update({
        materialsApproved,
        materialsPending
      })
    }

    return Material.update(params);
  },

  deleteMaterial: async (root, { id, fromInvoice }, { req }) => {
    const SourceUser = await checkResolver(req, fromInvoice ? ['vykazy'] : []);
    const Material = await models.Material.findByPk(id, {
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
    if (Material === null) {
      throw createDoesNoExistsError('Material', id);
    }
    const Task = <TaskInstance>Material.get('Task');
    if (Task.get('invoiced')) {
      throw CantEditInvoicedTaskError;
    }
    const Project = <ProjectInstance>Task.get('Project');
    const TaskMetadata = <TaskMetadataInstance>Task.get('TaskMetadata');
    await checkIfHasProjectRights(SourceUser, undefined, Project.get('id'), ['taskMaterialsWrite'], [], fromInvoice === true);
    await (<TaskInstance>Task).createTaskChange(
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
    );
    sendTaskNotificationsToUsers(
      SourceUser,
      Task,
      [
        {
          type: 'otherAttributesDelete',
          data: {
            label: 'Materiálu',
            oldData: [Material.get('done') ? '[Dokončené]' : '[-]', Material.get('title'), Material.get('quantity')],
          }
        }
      ]
    );
    pubsub.publish(TASK_HISTORY_CHANGE, { taskHistorySubscription: Material.get('TaskId') });
    if (Project.get('autoApproved') || Material.get('approved')) {
      TaskMetadata.update({
        materialsApproved: parseFloat(<any>TaskMetadata.get('materialsApproved')) - parseFloat(<any>Material.get('quantity'))
      })
    } else {
      TaskMetadata.update({
        materialsPending: parseFloat(<any>TaskMetadata.get('materialsPending')) - parseFloat(<any>Material.get('quantity'))
      })
    }
    return Material.destroy();
  },

  addRepeatTemplateMaterial: async (root, { repeatTemplate, ...params }, { req }) => {
    const SourceUser = await checkResolver(req);
    const RepeatTemplate = <RepeatTemplateInstance>await models.RepeatTemplate.findByPk(repeatTemplate);
    if (RepeatTemplate === null) {
      throw createDoesNoExistsError('Repeat template', repeatTemplate);
    }
    await checkIfHasProjectRights(SourceUser, undefined, RepeatTemplate.get('ProjectId'), ['taskMaterialsWrite'], [{ right: 'repeat', action: 'edit' }]);
    if (params.approved) {
      params = {
        ...params,
        MaterialApprovedById: SourceUser.get('id')
      }
    }
    return models.Material.create({
      RepeatTemplateId: repeatTemplate,
      ...params,
    });
  },

  updateRepeatTemplateMaterial: async (root, { id, ...params }, { req }) => {
    const SourceUser = await checkResolver(req);
    const Material = await models.Material.findByPk(id, { include: [models.RepeatTemplate] });
    if (Material === null) {
      throw createDoesNoExistsError('Material', id);
    }
    await checkIfHasProjectRights(SourceUser, undefined, (<RepeatTemplateInstance>Material.get('RepeatTemplate')).get('ProjectId'), ['taskMaterialsWrite'], [{ right: 'repeat', action: 'edit' }]);
    if (params.approved === false && Material.get('approved') === true) {
      params = {
        ...params,
        MaterialApprovedById: null,
      }
    } else if (params.approved === true && Material.get('approved') === false) {
      params = {
        ...params,
        MaterialApprovedById: SourceUser.get('id')
      }
    }
    return Material.update(params);
  },

  deleteRepeatTemplateMaterial: async (root, { id }, { req }) => {
    const SourceUser = await checkResolver(req);
    const Material = await models.Material.findByPk(id, { include: [models.RepeatTemplate] });
    if (Material === null) {
      throw createDoesNoExistsError('Material', id);
    }
    await checkIfHasProjectRights(SourceUser, undefined, (<RepeatTemplateInstance>Material.get('RepeatTemplate')).get('ProjectId'), ['taskMaterialsWrite'], [{ right: 'repeat', action: 'edit' }]);
    return Material.destroy();
  },
}

const attributes = {
  Material: {
    async task(material) {
      return getModelAttribute(material, 'Task');
    },
    async approvedBy(material) {
      return getModelAttribute(material, 'MaterialApprovedBy');
    },
    async repeatTemplate(material) {
      return getModelAttribute(material, 'RepeatTemplate');
    },
  }
};

export default {
  attributes,
  mutations,
  queries
}
