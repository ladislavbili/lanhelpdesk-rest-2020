import { createDoesNoExistsError, SubtaskNotNullAttributesPresent, AssignedToUserNotSolvingTheTask } from '@/configs/errors';
import { models, sequelize } from '@/models';
import { multipleIdDoesExistsCheck, idDoesExistsCheck, checkIfHasProjectRights, getModelAttribute } from '@/helperFunctions';
import { TaskInstance, UserInstance, SubtaskInstance, TaskTypeInstance } from '@/models/instances';
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
    const AssignedTos = <UserInstance[]>await Task.getAssignedTos();
    if (!AssignedTos.some((AssignedTo) => AssignedTo.get('id') === assignedTo)) {
      throw AssignedToUserNotSolvingTheTask;
    }
    await idDoesExistsCheck(type, models.TaskType);
    (<TaskInstance>Task).createTaskChange(
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
    )
    return models.Subtask.create({
      TaskId: task,
      TaskTypeId: type,
      UserId: assignedTo,
      ...params,
    });
  },

  updateSubtask: async (root, { id, type, assignedTo, ...params }, { req }) => {
    const SourceUser = await checkResolver(req);
    const Subtask = <SubtaskInstance>await models.Subtask.findByPk(id, { include: [models.TaskType] });
    const originalValue = `${Subtask.get('title')}${Subtask.get('done').toString()},${Subtask.get('quantity')},${Subtask.get('discount')},${(<TaskTypeInstance>Subtask.get('TaskType')).get('id')},${Subtask.get('UserId')}`;
    if (Subtask === null) {
      throw createDoesNoExistsError('Subtask', id);
    }
    const { Task } = await checkIfHasProjectRights(SourceUser.get('id'), Subtask.get('TaskId'), undefined, ['vykazWrite']);
    if (assignedTo !== undefined) {
      const AssignedTos = <UserInstance[]>await Task.getAssignedTos();
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
      promises.push(Subtask.update(params, { transaction: t }));
      await Promise.all(promises);
    });
    (<TaskInstance>Task).createTaskChange(
      {
        UserId: SourceUser.get('id'),
        TaskChangeMessages: [{
          type: 'subtask',
          originalValue,
          newValue: `${params.title},${params.done},${params.quantity},${params.discount},${type},${assignedTo}`,
          message: `Subtask ${Subtask.get('title')}${params.title !== Subtask.get('title') ? `/${params.title}` : ''} was updated.`,
        }],
      },
      { include: [models.TaskChangeMessage] }
    )
    return Subtask.reload();
  },

  deleteSubtask: async (root, { id }, { req }) => {
    const SourceUser = await checkResolver(req);
    const Subtask = await models.Subtask.findByPk(id, { include: [models.TaskType] });
    if (Subtask === null) {
      throw createDoesNoExistsError('Subtask', id);
    }
    const { Task } = await checkIfHasProjectRights(SourceUser.get('id'), Subtask.get('TaskId'), undefined, ['vykazWrite']);
    const originalValue = `${Subtask.get('title')}${Subtask.get('done').toString()},${Subtask.get('quantity')},${Subtask.get('discount')},${(<TaskTypeInstance>Subtask.get('TaskType')).get('id')},${Subtask.get('UserId')}`;
    (<TaskInstance>Task).createTaskChange(
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
    )
    return Subtask.destroy();
  },
}

const attributes = {
  Subtask: {
    async task(subtask) {
      return getModelAttribute(subtask, 'Task');
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
