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
    await checkIfHasProjectRights(SourceUser.get('id'), task, undefined, ['taskShortSubtasksWrite']);
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
    await checkIfHasProjectRights(SourceUser.get('id'), ShortSubtask.get('TaskId'), undefined, ['taskShortSubtasksWrite']);
    return ShortSubtask.update(args);
  },

  deleteShortSubtask: async (root, { id }, { req }) => {
    const SourceUser = await checkResolver(req);
    const ShortSubtask = await models.ShortSubtask.findByPk(id);
    if (ShortSubtask === null) {
      throw createDoesNoExistsError('Short subtask', id);
    }
    await checkIfHasProjectRights(SourceUser.get('id'), ShortSubtask.get('TaskId'), undefined, ['taskShortSubtasksWrite']);
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
