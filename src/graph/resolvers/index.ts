import task from './task';
import tag from './tag';
import user from './user';
import role from './role';

export default {
  Query: {
    ...task.querries,
    ...tag.querries,
    ...user.querries,
    ...role.querries,

  },

  Mutation: {
    ...task.mutations,
    ...tag.mutations,
    ...user.mutations,
    ...role.mutations,

  },
  ...task.attributes,
  ...tag.attributes,
  ...user.attributes,
  ...role.attributes,

};
