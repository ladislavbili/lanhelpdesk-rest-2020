import task from './task';
import tag from './tag';

export default {
  Query: {
    ...task.querries,
    ...tag.querries,

  },

  Mutation: {
    ...task.mutations,
    ...tag.mutations,

  },
  ...task.attributes,
  ...tag.attributes,
};
