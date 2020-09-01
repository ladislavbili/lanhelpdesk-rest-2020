import comment from './comment';
import company from './company';
import customItem from './customItem';
import errorMessage from './errorMessage';
import filter from './filter';
import imap from './imap';
import material from './material';
import milestone from './milestone';
import pricelist from './pricelist';
import project from './project';
import role from './role';
import smtp from './smtp';
import status from './status';
import subtask from './subtask';
import tag from './tag';
import task from './task';
import taskType from './taskType';
import tripType from './tripType';
import user from './user';
import workTrip from './workTrip';

export default {
  Query: {
    ...comment.querries,
    ...company.querries,
    ...customItem.querries,
    ...errorMessage.querries,
    ...filter.querries,
    ...imap.querries,
    ...material.querries,
    ...milestone.querries,
    ...pricelist.querries,
    ...project.querries,
    ...role.querries,
    ...tag.querries,
    ...smtp.querries,
    ...status.querries,
    ...subtask.querries,
    ...tag.querries,
    ...task.querries,
    ...taskType.querries,
    ...tripType.querries,
    ...user.querries,
    ...workTrip.querries,
  },

  Mutation: {
    ...comment.mutations,
    ...company.mutations,
    ...customItem.mutations,
    ...errorMessage.mutations,
    ...filter.mutations,
    ...imap.mutations,
    ...material.mutations,
    ...milestone.mutations,
    ...pricelist.mutations,
    ...project.mutations,
    ...role.mutations,
    ...tag.mutations,
    ...smtp.mutations,
    ...status.mutations,
    ...subtask.mutations,
    ...tag.mutations,
    ...task.mutations,
    ...taskType.mutations,
    ...tripType.mutations,
    ...user.mutations,
    ...workTrip.mutations,
  },
  ...comment.attributes,
  ...company.attributes,
  ...customItem.attributes,
  ...errorMessage.attributes,
  ...filter.attributes,
  ...imap.attributes,
  ...material.attributes,
  ...milestone.attributes,
  ...pricelist.attributes,
  ...project.attributes,
  ...role.attributes,
  ...tag.attributes,
  ...smtp.attributes,
  ...status.attributes,
  ...subtask.attributes,
  ...tag.attributes,
  ...task.attributes,
  ...taskType.attributes,
  ...tripType.attributes,
  ...user.attributes,
  ...workTrip.attributes,
};
