import { models } from '@/models';
import checkResolver from './checkResolver';
import {
  getModelAttribute,
} from '@/helperFunctions';
import {
  checkIfHasProjectRights,
} from '@/graph/addons/project';
import { TASK_HISTORY_CHANGE } from '@/configs/subscriptions';
import { pubsub } from './index';
const { withFilter } = require('apollo-server-express');

const queries = {
  taskChanges: async (root, { taskId }, { req }) => {
    const SourceUser = await checkResolver(req);
    await checkIfHasProjectRights(SourceUser, taskId, undefined, ['history']);
    return models.TaskChange.findAll({
      include: [
        models.TaskChangeMessage,
        models.User,
      ],
      where: {
        TaskId: taskId
      },
      order: [
        ['id', 'DESC'],
      ],
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

const subscriptions = {
  taskHistorySubscription: {
    subscribe: withFilter(
      () => pubsub.asyncIterator(TASK_HISTORY_CHANGE),
      async ({ taskHistorySubscription }, { taskId }, { userID }) => {
        return taskHistorySubscription === taskId;
      }
    ),
  },
}

export default {
  attributes,
  mutations,
  queries,
  subscriptions,
}
