import { createDoesNoExistsError } from '@/configs/errors';
import { models } from '@/models';
import { ProjectInstance } from '@/models/instances';
import { getModelAttribute } from '@/helperFunctions';
import checkResolver from './checkResolver';
const queries = {
}

const mutations = {
}

const attributes = {
  CommentAttachment: {
    async comment(commentAttachment) {
      return getModelAttribute(commentAttachment, 'Comment');
    }
  },
};

export default {
  attributes,
  mutations,
  queries
}
