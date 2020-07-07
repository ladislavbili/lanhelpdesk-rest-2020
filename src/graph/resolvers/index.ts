import task from './task';
import tag from './tag';
import user from './user';

export default {
  Query: {
    ...task.querries,
    ...tag.querries,
    ...user.querries,

  },

  Mutation: {
    ...task.mutations,
    ...tag.mutations,
    ...user.mutations,

  },
  ...task.attributes,
  ...tag.attributes,
  ...user.attributes,

};
