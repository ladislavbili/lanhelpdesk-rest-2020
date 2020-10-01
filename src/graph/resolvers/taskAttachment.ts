import { createDoesNoExistsError } from '@/configs/errors';
import { models } from '@/models';
import { ProjectInstance } from '@/models/instances';
import checkResolver from './checkResolver';
const querries = {
}

const mutations = {
}

const attributes = {
  TaskAttachment: {
    async task(taskAttachment) {
      return taskAttachment.getTask()
    }
  },
};

export default {
  attributes,
  mutations,
  querries
}
