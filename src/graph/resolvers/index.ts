import company from './company';
import errorMessage from './errorMessage';
import imap from './imap';
import pricelist from './pricelist';
import project from './project';
import role from './role';
import tag from './tag';
import smtp from './smtp';
import status from './status';
import task from './task';
import taskType from './taskType';
import tripType from './tripType';
import user from './user';

export default {
  Query: {
    ...company.querries,
    ...errorMessage.querries,
    ...imap.querries,
    ...pricelist.querries,
    ...project.querries,
    ...role.querries,
    ...tag.querries,
    ...smtp.querries,
    ...status.querries,
    ...task.querries,
    ...taskType.querries,
    ...tripType.querries,
    ...user.querries,

  },

  Mutation: {
    ...company.mutations,
    ...errorMessage.mutations,
    ...imap.mutations,
    ...pricelist.mutations,
    ...project.mutations,
    ...role.mutations,
    ...tag.mutations,
    ...smtp.mutations,
    ...status.mutations,
    ...task.mutations,
    ...taskType.mutations,
    ...tripType.mutations,
    ...user.mutations,

  },
  ...company.attributes,
  ...errorMessage.attributes,
  ...imap.attributes,
  ...pricelist.attributes,
  ...project.attributes,
  ...role.attributes,
  ...tag.attributes,
  ...smtp.attributes,
  ...status.attributes,
  ...task.attributes,
  ...taskType.attributes,
  ...tripType.attributes,
  ...user.attributes,

};
