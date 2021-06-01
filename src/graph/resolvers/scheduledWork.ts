import {
  getModelAttribute,
} from '@/helperFunctions';
const querries = {
}

const mutations = {
}

const attributes = {
  ScheduledWork: {
    async subtask(scheduledWork) {
      return getModelAttribute(scheduledWork, 'Subtask');
    },
    async workTrip(scheduledWork) {
      return getModelAttribute(scheduledWork, 'WorkTrip');
    },
  },
};

export default {
  attributes,
  mutations,
  querries
}
