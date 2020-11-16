import {
  getModelAttribute
} from '@/helperFunctions';

const querries = {
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
