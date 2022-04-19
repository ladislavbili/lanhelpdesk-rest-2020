import { Sequelize, Model, DataTypes, Op } from "sequelize";
import { logFunctionsOfModel } from '@/helperFunctions';
import data from '@/configs/database';

import defineAccessRights, { createAccessRightsAssoc } from './instances/accessRights';
import defineTags, { createTagsAssoc } from './instances/tag';
import defineTokens, { createTokensAssoc } from './instances/token';
import defineUsers, { createUsersAssoc } from './instances/user';
import defineProjects, { createProjectsAssoc } from './instances/project';
import defineProjectAttributes, { createProjectAttributesAssoc } from './instances/projectAttributes';
import defineRoles, { createRolesAssoc } from './instances/role';
import defineTaskTypes, { createTaskTypesAssoc } from './instances/taskType';
import defineTripTypes, { createTripTypesAssoc } from './instances/tripType';
import definePricelists, { createPricelistsAssoc } from './instances/pricelist';
import definePrices, { createPricesAssoc } from './instances/price';
import defineCompanies, { createCompaniesAssoc } from './instances/company';
import defineCompanyDefaults, { createCompanyDefaultsAssoc } from './instances/companyDefaults';
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
import defineRepeatTimes, { createRepeatTimesAssoc } from './instances/repeatTime';
import defineTasks, { createTasksAssoc } from './instances/task';
import defineRepeatTemplates, { createRepeatTemplatesAssoc } from './instances/repeatTemplate';
import defineRepeatTemplateAttachments, { createRepeatTemplateAttachmentsAssoc } from './instances/repeatTemplateAttachment';
import defineSubtasks, { createSubtasksAssoc } from './instances/subtask';
import defineWorkTrips, { createWorkTripsAssoc } from './instances/workTrip';
import defineMaterials, { createMaterialsAssoc } from './instances/material';
import defineComments, { createCommentsAssoc } from './instances/comment';
import defineEmailTargets, { createEmailTargetsAssoc } from './instances/emailTarget';
import defineTaskChanges, { createTaskChangesAssoc } from './instances/taskChange';
import defineTaskChangeMessages, { createTaskChangeMessagesAssoc } from './instances/taskChangeMessage';
import defineTaskAttachments, { createTaskAttachmentsAssoc } from './instances/taskAttachment';
import defineCommentAttachments, { createCommentAttachmentsAssoc } from './instances/commentAttachment';
import defineShortSubtasks, { createShortSubtasksAssoc } from './instances/shortSubtask';
import defineProjectGroups, { createProjectGroupsAssoc } from './instances/projectGroup';
import defineProjectGroupRights, { createProjectGroupRightsAssoc } from './instances/projectGroupRights';
import defineTaskMetadata, { createTaskMetadataAssoc } from './instances/taskMetadata';
import defineTasklistColumnPreferences, { createTasklistColumnPreferencesAssoc } from './instances/taskListColumnPreference';
import defineTasklistGanttColumnPreferences, { createTasklistGanttColumnPreferencesAssoc } from './instances/taskListGanttColumnPreference';
import defineScheduledWorks, { createScheduledWorksAssoc } from './instances/scheduledWork';
import defineProjectAttachments, { createProjectAttachmentsAssoc } from './instances/projectAttachment';
import defineTasklistSorts, { createTasklistSortsAssoc } from './instances/tasklistSort';
import defineInvoicedTasks, { createInvoicedTasksAssoc } from './instances/invoicedTask';
import defineInvoicedTaskTags, { createInvoicedTaskTagsAssoc } from './instances/invoicedTaskTag';
import defineInvoicedTaskUsers, { createInvoicedTaskUsersAssoc } from './instances/invoicedTaskUser';
import defineLanwikiFolders, { createLanwikiFoldersAssoc } from './instances/lanwikiFolder';
import defineLanwikiFolderRights, { createLanwikiFolderRightsAssoc } from './instances/lanwikiFolderRight';
import defineLanwikiPages, { createLanwikiPagesAssoc } from './instances/lanwikiPage';
import defineLanwikiTags, { createLanwikiTagsAssoc } from './instances/lanwikiTag';
import defineLanwikiFiles, { createLanwikiFilesAssoc } from './instances/lanwikiFile';
import defineCMDBAddressess, { createCMDBAddressesAssoc } from './instances/cmdbAddress';
import defineCMDBCategories, { createCMDBCategoriesAssoc } from './instances/cmdbCategory';
import defineCMDBFiles, { createCMDBFilesAssoc } from './instances/cmdbFile';
import defineCMDBItems, { createCMDBItemsAssoc } from './instances/cmdbItem';
import defineCMDBManuals, { createCMDBManualsAssoc } from './instances/cmdbManual';
import defineCMDBSchemes, { createCMDBSchemesAssoc } from './instances/cmdbScheme';
import defineCMDBPasswords, { createCMDBPasswordsAssoc } from './instances/cmdbPassword';
import defineCMDBItemPasswords, { createCMDBItemPasswordsAssoc } from './instances/cmdbItemPassword';

import definePassEntries, { createPassEntriesAssoc } from './instances/passEntry';
import definePassFolders, { createPassFoldersAssoc } from './instances/passFolder';
import definePassFolderRights, { createPassFolderRightsAssoc } from './instances/passFolderRight';

const modelToLog = '';

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
  defineCompanyDefaults(sequelize);
  defineCompanyRents(sequelize);
  defineSmtps(sequelize);
  defineImaps(sequelize);
  defineStatuses(sequelize);
  defineProjects(sequelize);
  defineProjectAttributes(sequelize);
  defineErrorMessages(sequelize);
  defineUserNotifications(sequelize);
  defineFilter(sequelize);
  defineFilterOneOf(sequelize);
  defineMilestone(sequelize);
  defineTasks(sequelize);
  defineRepeats(sequelize);
  defineRepeatTemplates(sequelize);
  defineRepeatTemplateAttachments(sequelize);
  defineSubtasks(sequelize);
  defineWorkTrips(sequelize);
  defineMaterials(sequelize);
  defineComments(sequelize);
  defineEmailTargets(sequelize);
  defineTaskChanges(sequelize);
  defineTaskChangeMessages(sequelize);
  defineTaskAttachments(sequelize);
  defineCommentAttachments(sequelize);
  defineShortSubtasks(sequelize);
  defineProjectGroups(sequelize);
  defineProjectGroupRights(sequelize);
  defineTaskMetadata(sequelize);
  defineTasklistColumnPreferences(sequelize);
  defineTasklistGanttColumnPreferences(sequelize);
  defineRepeatTimes(sequelize);
  defineScheduledWorks(sequelize);
  defineProjectAttachments(sequelize);
  defineTasklistSorts(sequelize);
  defineInvoicedTasks(sequelize);
  defineInvoicedTaskTags(sequelize);
  defineInvoicedTaskUsers(sequelize);
  defineLanwikiFolders(sequelize);
  defineLanwikiFolderRights(sequelize);
  defineLanwikiPages(sequelize);
  defineLanwikiTags(sequelize);
  defineLanwikiFiles(sequelize);
  defineCMDBAddressess(sequelize);
  defineCMDBCategories(sequelize);
  defineCMDBFiles(sequelize);
  defineCMDBItems(sequelize);
  defineCMDBManuals(sequelize);
  defineCMDBSchemes(sequelize);
  defineCMDBPasswords(sequelize);
  defineCMDBItemPasswords(sequelize);
  definePassEntries(sequelize);
  definePassFolders(sequelize);
  definePassFolderRights(sequelize);

  //ASSOCS
  createRolesAssoc(models);
  createUsersAssoc(models);
  createAccessRightsAssoc(models);
  createTokensAssoc(models);
  createProjectsAssoc(models);
  createProjectAttributesAssoc(models);
  createTagsAssoc(models);
  createTaskTypesAssoc(models);
  createTripTypesAssoc(models);
  createPricelistsAssoc(models);
  createPricesAssoc(models);
  createCompaniesAssoc(models);
  createCompanyDefaultsAssoc(models);
  createCompanyRentsAssoc(models);
  createSmtpsAssoc(models);
  createImapsAssoc(models);
  createStatusesAssoc(models);
  createErrorMessagesAssoc(models);
  createUserNotificationsAssoc(models);
  createFilterAssoc(models);
  createFilterOneOfAssoc(models);
  createMilestoneAssoc(models);
  createTasksAssoc(models);
  createRepeatsAssoc(models);
  createRepeatTemplatesAssoc(models);
  createRepeatTemplateAttachmentsAssoc(models);
  createSubtasksAssoc(models);
  createWorkTripsAssoc(models);
  createMaterialsAssoc(models);
  createCommentsAssoc(models);
  createEmailTargetsAssoc(models);
  createTaskChangesAssoc(models);
  createTaskChangeMessagesAssoc(models);
  createTaskAttachmentsAssoc(models);
  createCommentAttachmentsAssoc(models);
  createShortSubtasksAssoc(models);

  createProjectGroupsAssoc(models);
  createProjectGroupRightsAssoc(models);
  createTaskMetadataAssoc(models);
  createTasklistColumnPreferencesAssoc(models);
  createTasklistGanttColumnPreferencesAssoc(models);
  createRepeatTimesAssoc(models);
  createScheduledWorksAssoc(models);
  createProjectAttachmentsAssoc(models);
  createTasklistSortsAssoc(models);
  createInvoicedTasksAssoc(models);
  createInvoicedTaskTagsAssoc(models);
  createInvoicedTaskUsersAssoc(models);
  createLanwikiFoldersAssoc(models);
  createLanwikiFolderRightsAssoc(models);
  createLanwikiPagesAssoc(models);
  createLanwikiTagsAssoc(models);
  createLanwikiFilesAssoc(models);
  createCMDBAddressesAssoc(models);
  createCMDBCategoriesAssoc(models);
  createCMDBFilesAssoc(models);
  createCMDBItemsAssoc(models);
  createCMDBManualsAssoc(models);
  createCMDBSchemesAssoc(models);
  createCMDBPasswordsAssoc(models);
  createCMDBItemPasswordsAssoc(models);
  createPassEntriesAssoc(models);
  createPassFoldersAssoc(models);
  createPassFolderRightsAssoc(models);

  //LOG FUNCTIONS

  modelToLog.length !== 0 && logFunctionsOfModel(models[modelToLog]);


  if (ignoreUpdating) {
    return new Promise((resolve, reject) => resolve());
  }
  return sequelize.sync({ alter: true })
}
