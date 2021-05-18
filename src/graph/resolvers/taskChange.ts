import { models } from '@/models';
import checkResolver from './checkResolver';
import {
  getModelAttribute,
} from '@/helperFunctions';
import {
  checkIfHasProjectRights,
} from '@/graph/addons/project';
import { TASK_CHANGE_CHANGE } from '@/configs/subscriptions';
import { pubsub } from './index';
const { withFilter } = require('apollo-server-express');

const querries = {
  taskChanges: async (root, { taskId }, { req }) => {
    const SourceUser = await checkResolver(req);
    await checkIfHasProjectRights(SourceUser.get('id'), taskId, undefined, ['history']);
    return models.TaskChange.findAll({
      include: [
        models.TaskChangeMessage,
        models.User,
      ],
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

const subscriptions = {
  commentsSubscription: {
    subscribe: withFilter(
      () => pubsub.asyncIterator(TASK_CHANGE_CHANGE),
      async (data, args, { userID }) => {
        return true;
      }
    ),
  }
}

export default {
  attributes,
  mutations,
  querries,
  subscriptions,
}
