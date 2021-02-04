import { createDoesNoExistsError, SubtaskNotNullAttributesPresent, AssignedToUserNotSolvingTheTask } from '@/configs/errors';
import { models, sequelize } from '@/models';
import { multipleIdDoesExistsCheck, idDoesExistsCheck, checkIfHasProjectRights, getModelAttribute } from '@/helperFunctions';
import { TaskInstance, ShortSubtaskInstance } from '@/models/instances';
import checkResolver from './checkResolver';

const querries = {
}

const mutations = {
  addShortSubtask: async (root, { task, ...attributes }, { req }) => {
    const SourceUser = await checkResolver(req);
    const { Task } = await checkIfHasProjectRights(SourceUser.get('id'), task, undefined, ['taskShortSubtasksWrite']);
    (<TaskInstance>Task).createTaskChange(
      {
        UserId: SourceUser.get('id'),
        TaskChangeMessages: [{
          type: 'shortSubtask',
          originalValue: null,
          newValue: `${attributes.title},${attributes.done}`,
          message: `Short subtask ${attributes.title} was added.`,
        }],
      },
      { include: [models.TaskChangeMessage] }
    )
    return models.ShortSubtask.create({
      TaskId: task,
      ...attributes,
    });
  },

  updateShortSubtask: async (root, { id, ...args }, { req }) => {
    const SourceUser = await checkResolver(req);
    const ShortSubtask = <ShortSubtaskInstance>await models.ShortSubtask.findByPk(id);
    if (ShortSubtask === null) {
      throw createDoesNoExistsError('Short subtask', id);
    }
    const { Task } = await checkIfHasProjectRights(SourceUser.get('id'), ShortSubtask.get('TaskId'), undefined, ['taskShortSubtasksWrite']);
    (<TaskInstance>Task).createTaskChange(
      {
        UserId: SourceUser.get('id'),
        TaskChangeMessages: [{
          type: 'shortSubtask',
          originalValue: `${ShortSubtask.get('title')}${ShortSubtask.get('done')}`,
          newValue: `${args.title ? args.title : ShortSubtask.get('title')},${args.done ? args.done : ShortSubtask.get('done')}`,
          message: `Short subtask ${ShortSubtask.get('title')}${args.title && args.title !== ShortSubtask.get('title') ? `/${args.title}` : ''} was updated.`,
        }],
      },
      { include: [models.TaskChangeMessage] }
    )
    return ShortSubtask.update(args);
  },

  deleteShortSubtask: async (root, { id }, { req }) => {
    const SourceUser = await checkResolver(req);
    const ShortSubtask = await models.ShortSubtask.findByPk(id);
    if (ShortSubtask === null) {
      throw createDoesNoExistsError('Short subtask', id);
    }
    const { Task } = await checkIfHasProjectRights(SourceUser.get('id'), ShortSubtask.get('TaskId'), undefined, ['taskShortSubtasksWrite']);
    (<TaskInstance>Task).createTaskChange(
      {
        UserId: SourceUser.get('id'),
        TaskChangeMessages: [{
          type: 'shortSubtask',
          originalValue: `${ShortSubtask.get('title')}${ShortSubtask.get('done')}`,
          newValue: null,
          message: `Short subtask ${ShortSubtask.get('title')} was deleted.`,
        }],
      },
      { include: [models.TaskChangeMessage] }
    )
    return ShortSubtask.destroy();
  },
}

const attributes = {
  ShortSubtask: {
  }
};

export default {
  attributes,
  mutations,
  querries
}
