import comment from './comment';
import commentAttachment from './commentAttachment';
import company from './company';
import errorMessage from './errorMessage';
import filter from './filter';
import imap from './imap';
import invoice from './invoice';
import invoiceCompany from './invoiceCompany';
import invoiceTask from './invoiceTask';
import material from './material';
import milestone from './milestone';
import pricelist from './pricelist';
import project from './project';
import projectAttachment from './projectAttachment';
import projectGroup from './projectGroup';
import role from './role';
import scheduledWork from './scheduledWork';
import shortSubtask from './shortSubtask';
import smtp from './smtp';
import status from './status';
import subtask from './subtask';
import tag from './tag';
import task from './task';
import taskAttachment from './taskAttachment';
import taskChange from './taskChange';
import tasklistColumnPreference from './tasklistColumnPreference';
import tasklistGanttColumnPreference from './tasklistGanttColumnPreference';
import taskType from './taskType';
import tripType from './tripType';
import user from './user';
import workTrip from './workTrip';
import repeat from './repeat';
import repeatTemplate from './repeatTemplate';
import repeatTemplateAttachment from './repeatTemplateAttachment'
import userNotification from './userNotification';
import repeatTime from './repeatTime';
import lanwikiFolder from './lanwikiFolder';
import lanwikiTag from './lanwikiTag';
import lanwikiPage from './lanwikiPage';
import cmdbAddress from './cmdbAddress';
import cmdbCategory from './cmdbCategory';
import cmdbItem from './cmdbItem';
import cmdbManual from './cmdbManual';
import cmdbScheme from './cmdbScheme';

const { PubSub } = require('apollo-server-express');
import { EventEmitter } from 'events';
const biggerEventEmitter = new EventEmitter();
biggerEventEmitter.setMaxListeners(30);
export const pubsub = new PubSub({ eventEmitter: biggerEventEmitter });


export default {
  Query: {
    ...comment.queries,
    ...commentAttachment.queries,
    ...company.queries,
    ...errorMessage.queries,
    ...filter.queries,
    ...imap.queries,
    ...invoice.queries,
    ...invoiceCompany.queries,
    ...invoiceTask.queries,

    ...material.queries,
    ...milestone.queries,
    ...pricelist.queries,
    ...project.queries,
    ...projectAttachment.queries,
    ...projectGroup.queries,
    ...role.queries,
    ...tag.queries,
    ...scheduledWork.queries,
    ...shortSubtask.queries,
    ...smtp.queries,
    ...status.queries,
    ...subtask.queries,
    ...tag.queries,
    ...task.queries,
    ...taskAttachment.queries,
    ...taskChange.queries,
    ...tasklistColumnPreference.queries,
    ...tasklistGanttColumnPreference.queries,
    ...taskType.queries,
    ...tripType.queries,
    ...user.queries,
    ...workTrip.queries,
    ...repeat.queries,
    ...repeatTemplate.queries,
    ...repeatTemplateAttachment.queries,
    ...userNotification.queries,
    ...repeatTime.queries,
    ...lanwikiFolder.queries,
    ...lanwikiTag.queries,
    ...lanwikiPage.queries,
    ...cmdbAddress.queries,
    ...cmdbCategory.queries,
    ...cmdbItem.queries,
    ...cmdbManual.queries,
    ...cmdbScheme.queries,
  },

  Mutation: {
    ...comment.mutations,
    ...commentAttachment.mutations,
    ...company.mutations,
    ...errorMessage.mutations,
    ...filter.mutations,
    ...imap.mutations,
    ...invoice.mutations,
    ...invoiceCompany.mutations,
    ...invoiceTask.mutations,

    ...material.mutations,
    ...milestone.mutations,
    ...pricelist.mutations,
    ...project.mutations,
    ...projectAttachment.mutations,
    ...projectGroup.mutations,
    ...role.mutations,
    ...tag.mutations,
    ...scheduledWork.mutations,
    ...shortSubtask.mutations,
    ...smtp.mutations,
    ...status.mutations,
    ...subtask.mutations,
    ...tag.mutations,
    ...task.mutations,
    ...taskAttachment.mutations,
    ...taskChange.mutations,
    ...tasklistColumnPreference.mutations,
    ...tasklistGanttColumnPreference.mutations,
    ...taskType.mutations,
    ...tripType.mutations,
    ...user.mutations,
    ...workTrip.mutations,
    ...repeat.mutations,
    ...repeatTemplate.mutations,
    ...repeatTemplateAttachment.mutations,
    ...userNotification.mutations,
    ...repeatTime.mutations,
    ...lanwikiFolder.mutations,
    ...lanwikiTag.mutations,
    ...lanwikiPage.mutations,
    ...cmdbAddress.mutations,
    ...cmdbCategory.mutations,
    ...cmdbItem.mutations,
    ...cmdbManual.mutations,
    ...cmdbScheme.mutations,
  },
  Subscription: {
    ...comment.subscriptions,
    ...company.subscriptions,
    ...errorMessage.subscriptions,
    ...filter.subscriptions,
    ...milestone.subscriptions,
    ...pricelist.subscriptions,
    ...project.subscriptions,
    ...projectGroup.subscriptions,
    ...role.subscriptions,
    ...status.subscriptions,
    ...task.subscriptions,
    ...taskChange.subscriptions,
    ...taskType.subscriptions,
    ...tripType.subscriptions,
    ...user.subscriptions,
    ...repeat.subscriptions,
    ...userNotification.subscriptions,
    ...lanwikiFolder.subscriptions,
    ...lanwikiTag.subscriptions,
    ...lanwikiPage.subscriptions,
    ...cmdbCategory.subscriptions,
    ...cmdbManual.subscriptions,
    ...cmdbScheme.subscriptions,
  },

  ...comment.attributes,
  ...commentAttachment.attributes,
  ...company.attributes,
  ...errorMessage.attributes,
  ...filter.attributes,
  ...imap.attributes,
  ...invoice.attributes,
  ...invoiceCompany.attributes,
  ...invoiceTask.attributes,
  ...material.attributes,
  ...milestone.attributes,
  ...pricelist.attributes,
  ...project.attributes,
  ...projectAttachment.attributes,
  ...projectGroup.attributes,
  ...role.attributes,
  ...tag.attributes,
  ...scheduledWork.attributes,
  ...shortSubtask.attributes,
  ...smtp.attributes,
  ...status.attributes,
  ...subtask.attributes,
  ...tag.attributes,
  ...task.attributes,
  ...taskAttachment.attributes,
  ...taskType.attributes,
  ...taskChange.attributes,
  ...tasklistColumnPreference.attributes,
  ...tasklistGanttColumnPreference.attributes,
  ...tripType.attributes,
  ...user.attributes,
  ...workTrip.attributes,
  ...repeat.attributes,
  ...repeatTemplate.attributes,
  ...repeatTemplateAttachment.attributes,
  ...userNotification.attributes,
  ...repeatTime.attributes,
  ...lanwikiFolder.attributes,
  ...lanwikiTag.attributes,
  ...lanwikiPage.attributes,
  ...cmdbAddress.attributes,
  ...cmdbCategory.attributes,
  ...cmdbItem.attributes,
  ...cmdbManual.attributes,
  ...cmdbScheme.attributes,
};
