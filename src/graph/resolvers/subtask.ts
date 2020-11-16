import { createDoesNoExistsError, SubtaskNotNullAttributesPresent, AssignedToUserNotSolvingTheTask } from '@/configs/errors';
import { models, sequelize } from '@/models';
import { multipleIdDoesExistsCheck, idDoesExistsCheck, checkIfHasProjectRights, getModelAttribute } from '@/helperFunctions';
import { TaskInstance, UserInstance, SubtaskInstance } from '@/models/instances';
import checkResolver from './checkResolver';

const querries = {
  subtasks: async (root, { taskId }, { req }) => {
    const SourceUser = await checkResolver(req);
    await checkIfHasProjectRights(SourceUser.get('id'), taskId);
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
    const Task = <TaskInstance>(await checkIfHasProjectRights(SourceUser.get('id'), task, 'write')).Task;
    const AssignedTos = <UserInstance[]>await Task.getAssignedTos();
    if (!AssignedTos.some((AssignedTo) => AssignedTo.get('id') === assignedTo)) {
      throw AssignedToUserNotSolvingTheTask;
    }
    await idDoesExistsCheck(type, models.TaskType);
    return models.Subtask.create({
      TaskId: task,
      TaskTypeId: type,
      UserId: assignedTo,
      ...params,
    });
  },

  updateSubtask: async (root, { id, type, assignedTo, ...params }, { req }) => {
    const SourceUser = await checkResolver(req);
    const Subtask = <SubtaskInstance>await models.Subtask.findByPk(id);
    if (Subtask === null) {
      throw createDoesNoExistsError('Subtask', id);
    }
    const Task = <TaskInstance>(await checkIfHasProjectRights(SourceUser.get('id'), Subtask.get('TaskId'), 'write')).Task;
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
    })
    return Subtask.reload();
  },

  deleteSubtask: async (root, { id }, { req }) => {
    const SourceUser = await checkResolver(req);
    const Subtask = await models.Subtask.findByPk(id);
    if (Subtask === null) {
      throw createDoesNoExistsError('Subtask', id);
    }
    await checkIfHasProjectRights(SourceUser.get('id'), Subtask.get('TaskId'), 'write');
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
  }
};

export default {
  attributes,
  mutations,
  querries
}
