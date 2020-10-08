import { createDoesNoExistsError } from '@/configs/errors';
import { models } from '@/models';
import { ProjectInstance } from '@/models/instances';
import checkResolver from './checkResolver';
const querries = {
}

const mutations = {
}

const attributes = {
  CommentAttachment: {
    async comment(commentAttachment) {
      return commentAttachment.getComment()
    }
  },
};

export default {
  attributes,
  mutations,
  querries
}
