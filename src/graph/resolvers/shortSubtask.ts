import { createDoesNoExistsError, SubtaskNotNullAttributesPresent, AssignedToUserNotSolvingTheTask } from '@/configs/errors';
import { models, sequelize } from '@/models';
import {
  multipleIdDoesExistsCheck,
  idDoesExistsCheck,
  getModelAttribute
} from '@/helperFunctions';
import {
  checkIfHasProjectRights,
} from '@/graph/addons/project';
import { pubsub } from './index';
import { TASK_HISTORY_CHANGE } from '@/configs/subscriptions';
import { TaskInstance, ShortSubtaskInstance, RepeatTemplateInstance } from '@/models/instances';
import checkResolver from './checkResolver';

const queries = {
}

const mutations = {
  addShortSubtask: async (root, { task, ...attributes }, { req }) => {
    const SourceUser = await checkResolver(req);
    const { Task } = await checkIfHasProjectRights(SourceUser.get('id'), task, undefined, ['taskShortSubtasksWrite']);
    await (<TaskInstance>Task).createTaskChange(
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
    );
    pubsub.publish(TASK_HISTORY_CHANGE, { taskHistorySubscription: task });
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
    await (<TaskInstance>Task).createTaskChange(
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
    );
    pubsub.publish(TASK_HISTORY_CHANGE, { taskHistorySubscription: ShortSubtask.get('TaskId') });
    return ShortSubtask.update(args);
  },

  deleteShortSubtask: async (root, { id }, { req }) => {
    const SourceUser = await checkResolver(req);
    const ShortSubtask = await models.ShortSubtask.findByPk(id);
    if (ShortSubtask === null) {
      throw createDoesNoExistsError('Short subtask', id);
    }
    const { Task } = await checkIfHasProjectRights(SourceUser.get('id'), ShortSubtask.get('TaskId'), undefined, ['taskShortSubtasksWrite']);
    await (<TaskInstance>Task).createTaskChange(
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
    );
    pubsub.publish(TASK_HISTORY_CHANGE, { taskHistorySubscription: ShortSubtask.get('TaskId') });
    return ShortSubtask.destroy();
  },

  addRepeatTemplateShortSubtask: async (root, { repeatTemplate, ...attributes }, { req }) => {
    const SourceUser = await checkResolver(req);
    const RepeatTemplate = <RepeatTemplateInstance>await models.RepeatTemplate.findByPk(repeatTemplate);
    if (RepeatTemplate === null) {
      throw createDoesNoExistsError('Repeat template', repeatTemplate);
    }

    await checkIfHasProjectRights(SourceUser.get('id'), undefined, RepeatTemplate.get('ProjectId'), ['taskShortSubtasksWrite']);

    return models.ShortSubtask.create({
      RepeatTemplateId: repeatTemplate,
      ...attributes,
    });
  },

  updateRepeatTemplateShortSubtask: async (root, { id, ...args }, { req }) => {
    const SourceUser = await checkResolver(req);
    const ShortSubtask = <ShortSubtaskInstance>await models.ShortSubtask.findByPk(id, { include: [models.RepeatTemplate] });
    if (ShortSubtask === null) {
      throw createDoesNoExistsError('Short subtask', id);
    }
    await checkIfHasProjectRights(SourceUser.get('id'), undefined, (<RepeatTemplateInstance>ShortSubtask.get('RepeatTemplate')).get('ProjectId'), ['taskShortSubtasksWrite']);
    return ShortSubtask.update(args);
  },

  deleteRepeatTemplateShortSubtask: async (root, { id }, { req }) => {
    const SourceUser = await checkResolver(req);
    const ShortSubtask = await models.ShortSubtask.findByPk(id, { include: [models.RepeatTemplate] });
    if (ShortSubtask === null) {
      throw createDoesNoExistsError('Short subtask', id);
    }
    await checkIfHasProjectRights(SourceUser.get('id'), undefined, (<RepeatTemplateInstance>ShortSubtask.get('RepeatTemplate')).get('ProjectId'), ['taskShortSubtasksWrite']);
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
  queries
}
