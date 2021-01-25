import { createDoesNoExistsError, SubtaskNotNullAttributesPresent, AssignedToUserNotSolvingTheTask } from '@/configs/errors';
import { models, sequelize } from '@/models';
import { checkIfHasProjectRightsOld, getModelAttribute, extractDatesFromObject } from '@/helperFunctions';
import checkResolver from './checkResolver';

const querries = {
}

const mutations = {
  addScheduledTask: async (root, { task, ...attributes }, { req }) => {
    const SourceUser = await checkResolver(req);
    await checkIfHasProjectRightsOld(SourceUser.get('id'), task, 'write');
    const dates = extractDatesFromObject(attributes, ['from', 'to']);
    return models.ScheduledTask.create({
      TaskId: task,
      ...attributes,
      ...dates,
    });
  },

  deleteScheduledTask: async (root, { id }, { req }) => {
    const SourceUser = await checkResolver(req);
    const ScheduledTask = await models.ScheduledTask.findByPk(id);
    if (ScheduledTask === null) {
      throw createDoesNoExistsError('Scheduled task', id);
    }
    await checkIfHasProjectRightsOld(SourceUser.get('id'), ScheduledTask.get('TaskId'), 'write');
    return await ScheduledTask.destroy();
  },
}

const attributes = {
  ScheduledTask: {
    async user(scheduledTask) {
      return getModelAttribute(scheduledTask, 'User');
    },
  },
};

export default {
  attributes,
  mutations,
  querries
}
