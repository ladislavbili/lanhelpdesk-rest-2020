import calendarEvent from './calendarEvent';
import comment from './comment';
import commentAttachment from './commentAttachment';
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
import taskAttachment from './taskAttachment';
import taskChange from './taskChange';
import taskInvoice from './taskInvoice';
import taskType from './taskType';
import tripType from './tripType';
import user from './user';
import userInvoice from './userInvoice';
import workTrip from './workTrip';
const { PubSub } = require('apollo-server-express');
export const pubsub = new PubSub();


export default {
  Query: {
    ...calendarEvent.querries,
    ...comment.querries,
    ...commentAttachment.querries,
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
    ...taskAttachment.querries,
    ...taskChange.querries,
    ...taskInvoice.querries,
    ...taskType.querries,
    ...tripType.querries,
    ...user.querries,
    ...userInvoice.querries,
    ...workTrip.querries,
  },

  Mutation: {
    ...calendarEvent.mutations,
    ...comment.mutations,
    ...commentAttachment.mutations,
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
    ...taskAttachment.mutations,
    ...taskChange.mutations,
    ...taskInvoice.mutations,
    ...taskType.mutations,
    ...tripType.mutations,
    ...user.mutations,
    ...userInvoice.mutations,
    ...workTrip.mutations,
  },
  Subscription: {
    ...task.subscriptions,
  },

  ...calendarEvent.attributes,
  ...comment.attributes,
  ...commentAttachment.attributes,
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
  ...taskAttachment.attributes,
  ...taskType.attributes,
  ...taskChange.attributes,
  ...taskInvoice.attributes,
  ...tripType.attributes,
  ...user.attributes,
  ...userInvoice.attributes,
  ...workTrip.attributes,
};
