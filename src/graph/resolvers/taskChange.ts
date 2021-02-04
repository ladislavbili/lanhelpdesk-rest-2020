import { models } from '@/models';
import checkResolver from './checkResolver';
import {
  getModelAttribute,
  checkIfHasProjectRights
} from '@/helperFunctions';

const querries = {
  taskChanges: async (root, { taskId }, { req }) => {
    const SourceUser = await checkResolver(req);
    await checkIfHasProjectRights(SourceUser.get('id'), taskId, undefined, ['history']);
    return models.TaskChange.findAll({
      include: [models.TaskChangeMessage],
      where: {
        TaskId: taskId
      }
    })
  },
}

const mutations = {
}

const attributes = {
  TaskChange: {
    async task(taskChange) {
      return getModelAttribute(taskChange, 'Task');
    },
    async user(taskChange) {
      return getModelAttribute(taskChange, 'User');
    },
    async taskChangeMessages(taskChange) {
      return getModelAttribute(taskChange, 'TaskChangeMessages');
    },
  },
};

export default {
  attributes,
  mutations,
  querries
}
