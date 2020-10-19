import { Sequelize, Model, DataTypes, Op } from "sequelize";
import { logFunctionsOfModel } from '@/helperFunctions';
import data from '@/configs/database';

import defineAccessRights, { createAccessRightsAssoc } from './instances/accessRights';
import defineTags, { createTagsAssoc } from './instances/tag';
import defineTokens, { createTokensAssoc } from './instances/token';
import defineUsers, { createUsersAssoc } from './instances/user';
import defineProjects, { createProjectsAssoc } from './instances/project';
import defineProjectRights, { createProjectRightsAssoc } from './instances/projectRight';
import defineRoles, { createRolesAssoc } from './instances/role';
import defineTaskTypes, { createTaskTypesAssoc } from './instances/taskType';
import defineTripTypes, { createTripTypesAssoc } from './instances/tripType';
import definePricelists, { createPricelistsAssoc } from './instances/pricelist';
import definePrices, { createPricesAssoc } from './instances/price';
import defineCompanies, { createCompaniesAssoc } from './instances/company';
import defineCompanyRents, { createCompanyRentsAssoc } from './instances/companyRent';
import defineSmtps, { createSmtpsAssoc } from './instances/smtp';
import defineImaps, { createImapsAssoc } from './instances/imap';
import defineStatuses, { createStatusesAssoc } from './instances/status';
import defineErrorMessages, { createErrorMessagesAssoc } from './instances/errorMessage';
import defineUserNotifications, { createUserNotificationsAssoc } from './instances/userNotification';
import defineFilter, { createFilterAssoc } from './instances/filter';
import defineFilterOneOf, { createFilterOneOfAssoc } from './instances/filterOneOf';
import defineMilestone, { createMilestoneAssoc } from './instances/milestone';
import defineRepeats, { createRepeatsAssoc } from './instances/repeat';
import defineTasks, { createTasksAssoc } from './instances/task';
import defineSubtasks, { createSubtasksAssoc } from './instances/subtask';
import defineWorkTrips, { createWorkTripsAssoc } from './instances/workTrip';
import defineMaterials, { createMaterialsAssoc } from './instances/material';
import defineCustomItems, { createCustomItemsAssoc } from './instances/customItem';
import defineComments, { createCommentsAssoc } from './instances/comment';
import defineEmailTargets, { createEmailTargetsAssoc } from './instances/emailTarget';
import defineCalendarEvents, { createCalendarEventsAssoc } from './instances/calendarEvent';
import defineTaskChanges, { createTaskChangesAssoc } from './instances/taskChange';
import defineTaskChangeMessages, { createTaskChangeMessagesAssoc } from './instances/taskChangeMessage';
import defineTaskAttachments, { createTaskAttachmentsAssoc } from './instances/taskAttachment';
import defineCommentAttachments, { createCommentAttachmentsAssoc } from './instances/commentAttachment';
import defineInvoicedCompanies, { createInvoicedCompaniesAssoc } from './instances/invoicedCompany';
import defineInvoicedSubtasks, { createInvoicedSubtasksAssoc } from './instances/invoicedSubtask';
import defineInvoicedTasks, { createInvoicedTasksAssoc } from './instances/invoicedTask';
import defineInvoicedTrips, { createInvoicedTripsAssoc } from './instances/invoicedTrip';
import defineTaskInvoices, { createTaskInvoicesAssoc } from './instances/taskInvoice';

/*
const operatorsAliases = {

}
*/
export const sequelize = new Sequelize(data.database, data.username, data.pass, {
  host: data.host,
  dialect: 'mysql',
  logging: false,
  //operatorsAliases
});

export const models = sequelize.models;

export const updateModels = (ignoreUpdating: Boolean) => {

  defineTags(sequelize);
  defineRoles(sequelize);
  defineAccessRights(sequelize);
  defineUsers(sequelize);
  defineTokens(sequelize);
  defineTripTypes(sequelize);
  defineTaskTypes(sequelize);
  definePricelists(sequelize);
  definePrices(sequelize);
  defineCompanies(sequelize);
  defineCompanyRents(sequelize);
  defineSmtps(sequelize);
  defineImaps(sequelize);
  defineStatuses(sequelize);
  defineProjects(sequelize);
  defineProjectRights(sequelize);
  defineErrorMessages(sequelize);
  defineUserNotifications(sequelize);
  defineFilter(sequelize);
  defineFilterOneOf(sequelize);
  defineMilestone(sequelize);
  defineRepeats(sequelize);
  defineTasks(sequelize);
  defineSubtasks(sequelize);
  defineWorkTrips(sequelize);
  defineMaterials(sequelize);
  defineCustomItems(sequelize);
  defineComments(sequelize);
  defineEmailTargets(sequelize);
  defineCalendarEvents(sequelize);
  defineTaskChanges(sequelize);
  defineTaskChangeMessages(sequelize);
  defineTaskAttachments(sequelize);
  defineCommentAttachments(sequelize);
  defineInvoicedCompanies(sequelize);
  defineInvoicedSubtasks(sequelize);
  defineInvoicedTasks(sequelize);
  defineInvoicedTrips(sequelize);
  defineTaskInvoices(sequelize);

  createAccessRightsAssoc(models);
  createTagsAssoc(models);
  createTokensAssoc(models);
  createUsersAssoc(models);
  createProjectsAssoc(models);
  createProjectRightsAssoc(models);
  createRolesAssoc(models);
  createTaskTypesAssoc(models);
  createTripTypesAssoc(models);
  createPricelistsAssoc(models);
  createPricesAssoc(models);
  createCompaniesAssoc(models);
  createCompanyRentsAssoc(models);
  createSmtpsAssoc(models);
  createImapsAssoc(models);
  createStatusesAssoc(models);
  createErrorMessagesAssoc(models);
  createUserNotificationsAssoc(models);
  createFilterAssoc(models);
  createFilterOneOfAssoc(models);
  createMilestoneAssoc(models);
  createRepeatsAssoc(models);
  createTasksAssoc(models);
  createSubtasksAssoc(models);
  createWorkTripsAssoc(models);
  createMaterialsAssoc(models);
  createCustomItemsAssoc(models);
  createCommentsAssoc(models);
  createEmailTargetsAssoc(models);
  createCalendarEventsAssoc(models);
  createTaskChangesAssoc(models);
  createTaskChangeMessagesAssoc(models);
  createTaskAttachmentsAssoc(models);
  createCommentAttachmentsAssoc(models);
  createInvoicedCompaniesAssoc(models);
  createInvoicedSubtasksAssoc(models);
  createInvoicedTasksAssoc(models);
  createInvoicedTripsAssoc(models);
  createTaskInvoicesAssoc(models);
  //LOG FUNCTIONS

  //logFunctionsOfModel(models.TaskInvoice);

  if (ignoreUpdating) {
    return new Promise((resolve, reject) => resolve());
  }
  return sequelize.sync({ alter: true })
}
