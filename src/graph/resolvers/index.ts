import company from './company';
import pricelist from './pricelist';
import role from './role';
import tag from './tag';
import smtp from './smtp';
import task from './task';
import taskType from './taskType';
import tripType from './tripType';
import user from './user';

export default {
  Query: {
    ...company.querries,
    ...pricelist.querries,
    ...role.querries,
    ...tag.querries,
    ...smtp.querries,
    ...task.querries,
    ...taskType.querries,
    ...tripType.querries,
    ...user.querries,

  },

  Mutation: {
    ...company.mutations,
    ...pricelist.mutations,
    ...role.mutations,
    ...tag.mutations,
    ...smtp.mutations,
    ...task.mutations,
    ...taskType.mutations,
    ...tripType.mutations,
    ...user.mutations,

  },
  ...company.attributes,
  ...pricelist.attributes,
  ...role.attributes,
  ...tag.attributes,
  ...smtp.attributes,
  ...task.attributes,
  ...taskType.attributes,
  ...tripType.attributes,
  ...user.attributes,

};
