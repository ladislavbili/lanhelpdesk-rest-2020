const querries = {
}

const mutations = {
}

const attributes = {
  TaskChange: {
    async task(taskChange) {
      return taskChange.getTask()
    },
    async user(taskChange) {
      return taskChange.getUser()
    },
    async taskChangeMessages(taskChange) {
      return taskChange.getTaskChangeMessages()
    },
  },
};

export default {
  attributes,
  mutations,
  querries
}
