import { createDoesNoExistsError, SubtaskNotNullAttributesPresent, AssignedToUserNotSolvingTheTask } from '@/configs/errors';
import { models, sequelize } from '@/models';
import { multipleIdDoesExistsCheck, idDoesExistsCheck, getModelAttribute } from '@/helperFunctions';
import {
  checkIfHasProjectRights,
} from '@/graph/addons/project';
import {
  TaskInstance,
  UserInstance,
  SubtaskInstance,
  TaskTypeInstance,
  RepeatTemplateInstance,
  TaskMetadataInstance,
  ProjectInstance,
} from '@/models/instances';
import { pubsub } from './index';
import { TASK_HISTORY_CHANGE } from '@/configs/subscriptions';
import checkResolver from './checkResolver';

const querries = {
  subtasks: async (root, { taskId }, { req }) => {
    const SourceUser = await checkResolver(req);
    await checkIfHasProjectRights(SourceUser.get('id'), taskId, undefined, ['vykazRead']);
    return models.Subtask.findAll({
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
  addSubtask: async (root, { task, type, assignedTo, ...params }, { req }) => {
    const SourceUser = await checkResolver(req);
    const { Task } = await checkIfHasProjectRights(SourceUser.get('id'), task, undefined, ['vykazWrite']);
    const [
      AssignedTos,
      TaskMetadata,
      Project,
    ] = await Promise.all([
      Task.getAssignedTos(),
      Task.getTaskMetadata(),
      Task.getProject()
    ])
    if (!(<UserInstance[]>AssignedTos).some((AssignedTo) => AssignedTo.get('id') === assignedTo)) {
      throw AssignedToUserNotSolvingTheTask;
    }
    await idDoesExistsCheck(type, models.TaskType);
    await (<TaskInstance>Task).createTaskChange(
      {
        UserId: SourceUser.get('id'),
        TaskChangeMessages: [{
          type: 'subtask',
          originalValue: null,
          newValue: `${params.title},${params.done},${params.quantity},${params.discount},${type},${assignedTo}`,
          message: `Subtask ${params.title} was added.`,
        }],
      },
      { include: [models.TaskChangeMessage] }
    );
    pubsub.publish(TASK_HISTORY_CHANGE, { taskHistorySubscription: task });
    if (params.approved) {
      params = {
        ...params,
        SubtaskApprovedById: SourceUser.get('id'),
      }
    }
    if (params.approved || (<ProjectInstance>Project).get('autoApproved')) {
      (<TaskMetadataInstance>TaskMetadata).update({
        subtasksApproved: (<TaskMetadataInstance>TaskMetadata).get('subtasksApproved') + parseFloat(<any>params.quantity)
      })
    } else {
      (<TaskMetadataInstance>TaskMetadata).update({
        subtasksPending: (<TaskMetadataInstance>TaskMetadata).get('subtasksPending') + parseFloat(<any>params.quantity)
      })
    }
    return models.Subtask.create({
      TaskId: task,
      TaskTypeId: type,
      UserId: assignedTo,
      ...params,
    });
  },

  updateSubtask: async (root, { id, type, assignedTo, ...params }, { req }) => {
    const SourceUser = await checkResolver(req);
    const Subtask = <SubtaskInstance>await models.Subtask.findByPk(id, {
      include: [
        models.TaskType,
        {
          model: models.Task,
          include: [
            models.Project,
            {
              model: models.TaskMetadata,
              as: 'TaskMetadata'
            },
            {
              model: models.User,
              as: 'assignedTos'
            }
          ]
        }
      ]
    });
    if (Subtask === null) {
      throw createDoesNoExistsError('Subtask', id);
    }
    const Task = <TaskInstance>Subtask.get('Task');
    const Project = <ProjectInstance>Task.get('Project');
    const AssignedTos = <UserInstance[]>Task.get('assignedTos');
    const TaskMetadata = <TaskMetadataInstance>Task.get('TaskMetadata');
    const originalValue = `${Subtask.get('title')}${Subtask.get('done').toString()},${Subtask.get('quantity')},${Subtask.get('discount')},${(<TaskTypeInstance>Subtask.get('TaskType')).get('id')},${Subtask.get('UserId')}`;
    let TaskChangeMessages = [{
      type: 'subtask',
      originalValue,
      newValue: `${params.title},${params.done},${params.quantity},${params.discount},${type},${assignedTo}`,
      message: `Subtask ${Subtask.get('title')}${params.title !== Subtask.get('title') ? `/${params.title}` : ''} was updated.`,
    }]
    await checkIfHasProjectRights(SourceUser.get('id'), undefined, Task.get('ProjectId'), ['vykazWrite']);
    if (assignedTo !== undefined) {
      if (!AssignedTos.some((AssignedTo) => AssignedTo.get('id') === assignedTo)) {
        throw AssignedToUserNotSolvingTheTask;
      }
    }
    if (type === null || assignedTo === null) {
      throw SubtaskNotNullAttributesPresent;
    }
    let pairs = [];
    if (type !== undefined) {
      pairs.push({ id: type, model: models.TaskType })
    }
    if (assignedTo !== undefined) {
      pairs.push({ id: assignedTo, model: models.User })
    }
    await multipleIdDoesExistsCheck(pairs);
    await sequelize.transaction(async (t) => {
      let promises = [];
      if (type !== undefined) {
        await idDoesExistsCheck(type, models.TaskType);
        promises.push(Subtask.setTaskType(type, { transaction: t }));
      }
      if (assignedTo !== undefined) {
        promises.push(Subtask.setUser(assignedTo, { transaction: t }));
      }
      if (params.approved === false && Subtask.get('approved') === true) {
        params = {
          ...params,
          SubtaskApprovedById: null,
        }
        TaskChangeMessages.push({
          type: 'subtask',
          originalValue: `${!params.approved}`,
          newValue: `${params.approved}`,
          message: `Subtask ${Subtask.get('title')}${params.title !== Subtask.get('title') ? `/${params.title}` : ''} was set as not approved by ${SourceUser.get('fullName')}(${SourceUser.get('email')}).`,
        })
      } else if (params.approved === true && Subtask.get('approved') === false) {
        params = {
          ...params,
          SubtaskApprovedById: SourceUser.get('id')
        }
        TaskChangeMessages.push({
          type: 'subtask',
          originalValue: `${!params.approved}`,
          newValue: `${params.approved}`,
          message: `Subtask ${Subtask.get('title')}${params.title !== Subtask.get('title') ? `/${params.title}` : ''} was set as approved by ${SourceUser.get('fullName')}(${SourceUser.get('email')}).`,
        })
      }
      //Metadata update
      if ((params.approved !== undefined && params.approved !== null) || params.quantity) {
        let subtasksApproved = parseFloat(<any>TaskMetadata.get('subtasksApproved'));
        let subtasksPending = parseFloat(<any>TaskMetadata.get('subtasksPending'));
        //Delete first
        if (Project.get('autoApproved') || Subtask.get('approved')) {
          subtasksApproved -= parseFloat(<any>Subtask.get('quantity'));
        } else {
          subtasksPending -= parseFloat(<any>Subtask.get('quantity'));
        }
        //Add new
        if (Project.get('autoApproved') || params.approved === true || (params.approved !== false && Subtask.get('approved'))) {
          if (params.quantity) {
            subtasksApproved += parseFloat(<any>params.quantity);
          } else {
            subtasksApproved += parseFloat(<any>Subtask.get('quantity'));
          }
        } else {
          if (params.quantity) {
            subtasksPending += parseFloat(<any>params.quantity);
          } else {
            subtasksPending += parseFloat(<any>Subtask.get('quantity'));
          }
        }
        //Update
        TaskMetadata.update({
          subtasksApproved,
          subtasksPending
        }, { transaction: t })
      }
      promises.push(Subtask.update(params, { transaction: t }));
      await Promise.all(promises);
    });
    await (<TaskInstance>Task).createTaskChange(
      {
        UserId: SourceUser.get('id'),
        TaskChangeMessages,
      },
      { include: [models.TaskChangeMessage] }
    );
    pubsub.publish(TASK_HISTORY_CHANGE, { taskHistorySubscription: Subtask.get('TaskId') });
    return Subtask.reload();
  },

  deleteSubtask: async (root, { id }, { req }) => {
    const SourceUser = await checkResolver(req);
    const Subtask = await models.Subtask.findByPk(id, {
      include: [
        models.TaskType,
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
    if (Subtask === null) {
      throw createDoesNoExistsError('Subtask', id);
    }
    const Task = <TaskInstance>Subtask.get('Task');
    const Project = <ProjectInstance>Task.get('Project');
    const TaskMetadata = <TaskMetadataInstance>Task.get('TaskMetadata');

    await checkIfHasProjectRights(SourceUser.get('id'), undefined, Project.get('id'), ['vykazWrite']);
    const originalValue = `${Subtask.get('title')}${Subtask.get('done').toString()},${Subtask.get('quantity')},${Subtask.get('discount')},${(<TaskTypeInstance>Subtask.get('TaskType')).get('id')},${Subtask.get('UserId')}`;
    await (<TaskInstance>Task).createTaskChange(
      {
        UserId: SourceUser.get('id'),
        TaskChangeMessages: [{
          type: 'subtask',
          originalValue,
          newValue: null,
          message: `Subtask ${Subtask.get('title')} was deleted.`,
        }],
      },
      { include: [models.TaskChangeMessage] }
    );
    pubsub.publish(TASK_HISTORY_CHANGE, { taskHistorySubscription: Subtask.get('TaskId') });
    if (Project.get('autoApproved') || Subtask.get('approved')) {
      TaskMetadata.update({
        subtasksApproved: parseFloat(<any>TaskMetadata.get('subtasksApproved')) - parseFloat(<any>Subtask.get('quantity'))
      })
    } else {
      TaskMetadata.update({
        subtasksPending: parseFloat(<any>TaskMetadata.get('subtasksPending')) - parseFloat(<any>Subtask.get('quantity'))
      })
    }
    return Subtask.destroy();
  },

  addRepeatTemplateSubtask: async (root, { repeatTemplate, type, assignedTo, ...params }, { req }) => {
    const SourceUser = await checkResolver(req);
    const RepeatTemplate = <RepeatTemplateInstance>await models.RepeatTemplate.findByPk(
      repeatTemplate,
      { include: [{ model: models.User, as: 'assignedTos' }] }
    );
    if (RepeatTemplate === null) {
      throw createDoesNoExistsError('Repeat template', repeatTemplate);
    }

    await checkIfHasProjectRights(SourceUser.get('id'), undefined, RepeatTemplate.get('ProjectId'), ['vykazWrite']);
    const AssignedTos = <UserInstance[]>RepeatTemplate.get('assignedTos');
    if (!AssignedTos.some((AssignedTo) => AssignedTo.get('id') === assignedTo)) {
      throw AssignedToUserNotSolvingTheTask;
    }
    await idDoesExistsCheck(type, models.TaskType);
    if (params.approved) {
      params = {
        ...params,
        SubtaskApprovedById: SourceUser.get('id'),
      }
    }
    return models.Subtask.create({
      RepeatTemplateId: repeatTemplate,
      TaskTypeId: type,
      UserId: assignedTo,
      ...params,
    });
  },

  updateRepeatTemplateSubtask: async (root, { id, type, assignedTo, ...params }, { req }) => {
    const SourceUser = await checkResolver(req);
    const Subtask = <SubtaskInstance>await models.Subtask.findByPk(
      id,
      {
        include: [
          models.TaskType,
          {
            model: models.RepeatTemplate,
            include: [
              { model: models.User, as: 'assignedTos' }
            ]
          }
        ]
      }
    );
    if (Subtask === null) {
      throw createDoesNoExistsError('Subtask', id);
    }
    await checkIfHasProjectRights(SourceUser.get('id'), undefined, (<RepeatTemplateInstance>Subtask.get('RepeatTemplate')).get('ProjectId'), ['vykazWrite']);
    if (assignedTo !== undefined) {
      const AssignedTos = <UserInstance[]>(<RepeatTemplateInstance>Subtask.get('RepeatTemplate')).get('assignedTos');
      if (!AssignedTos.some((AssignedTo) => AssignedTo.get('id') === assignedTo)) {
        throw AssignedToUserNotSolvingTheTask;
      }
    }
    if (type === null || assignedTo === null) {
      throw SubtaskNotNullAttributesPresent;
    }
    let pairs = [];
    if (type !== undefined) {
      pairs.push({ id: type, model: models.TaskType })
    }
    if (assignedTo !== undefined) {
      pairs.push({ id: assignedTo, model: models.User })
    }
    await multipleIdDoesExistsCheck(pairs);
    await sequelize.transaction(async (t) => {
      let promises = [];
      if (type !== undefined) {
        await idDoesExistsCheck(type, models.TaskType);
        promises.push(Subtask.setTaskType(type, { transaction: t }));
      }
      if (assignedTo !== undefined) {
        promises.push(Subtask.setUser(assignedTo, { transaction: t }));
      }
      if (params.approved === false && Subtask.get('approved') === true) {
        params = {
          ...params,
          SubtaskApprovedById: null,
        }
      } else if (params.approved === true && Subtask.get('approved') === false) {
        params = {
          ...params,
          SubtaskApprovedById: SourceUser.get('id')
        }
      }
      promises.push(Subtask.update(params, { transaction: t }));
      await Promise.all(promises);
    });
    return Subtask.reload();
  },

  deleteRepeatTemplateSubtask: async (root, { id }, { req }) => {
    const SourceUser = await checkResolver(req);
    const Subtask = <SubtaskInstance>await models.Subtask.findByPk(
      id,
      {
        include: [
          models.TaskType,
          models.RepeatTemplate
        ]
      }
    );
    if (Subtask === null) {
      throw createDoesNoExistsError('Subtask', id);
    }
    await checkIfHasProjectRights(SourceUser.get('id'), undefined, (<RepeatTemplateInstance>Subtask.get('RepeatTemplate')).get('ProjectId'), ['vykazWrite']);
    return Subtask.destroy();
  },

}

const attributes = {
  Subtask: {
    async task(subtask) {
      return getModelAttribute(subtask, 'Task');
    },
    async approvedBy(subtask) {
      return getModelAttribute(subtask, 'SubtaskApprovedBy');
    },
    async repeatTemplate(subtask) {
      return getModelAttribute(subtask, 'RepeatTemplate');
    },
    async type(subtask) {
      return getModelAttribute(subtask, 'TaskType');
    },
    async assignedTo(subtask) {
      return getModelAttribute(subtask, 'User');
    },
    async invoicedData(subtask) {
      return getModelAttribute(subtask, 'InvoicedSubtasks');
    },
  }
};

export default {
  attributes,
  mutations,
  querries
}
