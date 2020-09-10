import { Sequelize, Model, DataTypes, Op } from "sequelize";
import { logFunctionsOfModel } from 'helperFunctions';
import data from 'configs/database';

import defineAccessRights from './instances/accessRights';
import defineTags from './instances/tag';
import defineTokens from './instances/token';
import defineUsers from './instances/user';
import defineProjects from './instances/project';
import defineProjectRights from './instances/projectRight';
import defineRoles from './instances/role';
import defineTaskTypes from './instances/taskType';
import defineTripTypes from './instances/tripType';
import definePricelists from './instances/pricelist';
import definePrices from './instances/price';
import defineCompanies from './instances/company';
import defineCompanyRents from './instances/companyRent';
import defineSmtps from './instances/smtp';
import defineImaps from './instances/imap';
import defineStatuses from './instances/status';
import defineErrorMessages from './instances/errorMessage';
import defineUserNotifications from './instances/userNotification';
import defineFilter from './instances/filter';
import defineFilterOneOf from './instances/filterOneOf';
import defineMilestone from './instances/milestone';
import defineRepeats from './instances/repeat';
import defineTasks from './instances/task';
import defineSubtasks from './instances/subtask';
import defineWorkTrips from './instances/workTrip';
import defineMaterials from './instances/material';
import defineCustomItems from './instances/customItem';
import defineComments from './instances/comment';
import defineEmails from './instances/email';
import defineEmailTargets from './instances/emailTarget';
import defineCalendarEvents from './instances/calendarEvent';
import defineTaskChanges from './instances/taskChange';
import defineTaskChangeMessages from './instances/taskChangeMessage';
/*
const operatorsAliases = {

}
*/
export const sequelize = new Sequelize( data.database, data.username, data.pass,{
  host: data.host,
  dialect: 'mysql',
  logging: false,
  //operatorsAliases
});
export const models = sequelize.models;

export const updateModels = ( ignoreUpdating: Boolean ) => {

  defineTags(sequelize);

  defineRoles(sequelize);
  defineAccessRights(sequelize);
  models.Role.hasOne(models.AccessRights, { foreignKey: { allowNull: false }, onDelete: 'CASCADE' });
  models.AccessRights.belongsTo(models.Role, { foreignKey: { allowNull: false } });

  defineUsers(sequelize);
  models.User.belongsTo(models.Role, { foreignKey: { allowNull: false } });
  models.Role.hasMany(models.User);

  defineTokens(sequelize);
  models.User.hasMany(models.Token);
  models.Token.belongsTo(models.User);

  defineTripTypes(sequelize);
  defineTaskTypes(sequelize);

  definePricelists(sequelize);
  definePrices(sequelize);
  models.Pricelist.hasMany(models.Price, { onDelete: 'CASCADE' });
  models.Price.belongsTo(models.Pricelist, { foreignKey: { allowNull: false } });

  models.TripType.hasMany(models.Price);
  models.Price.belongsTo(models.TripType);

  models.TaskType.hasMany(models.Price);
  models.Price.belongsTo(models.TaskType);

  defineCompanies(sequelize);

  models.Pricelist.hasMany(models.Company);
  models.Company.belongsTo(models.Pricelist, { foreignKey: { allowNull: false } });

  models.Company.hasMany(models.User);
  models.User.belongsTo(models.Company, { foreignKey: { allowNull: false } });

  defineCompanyRents(sequelize);

  models.Company.hasMany(models.CompanyRent, { foreignKey: { allowNull: false } });
  models.CompanyRent.belongsTo(models.Company, { foreignKey: { allowNull: false } });

  defineSmtps(sequelize);
  defineImaps(sequelize);
  defineStatuses(sequelize);

  models.Status.belongsToMany(models.User, { through: 'user_set_statuses' });
  models.User.belongsToMany(models.Status, { through: 'user_set_statuses' });

  defineProjects(sequelize);
  defineProjectRights(sequelize);

  //PROJECT RIGHTS - USERS
  models.User.hasMany(models.ProjectRight, { onDelete: 'CASCADE' });
  models.ProjectRight.belongsTo(models.User, { foreignKey: { allowNull: false } });

  //PROJECT - PROJECT RIGHTS
  models.Project.hasMany(models.ProjectRight, { onDelete: 'CASCADE' });
  models.ProjectRight.belongsTo(models.Project, { foreignKey: { allowNull: false } });

  //PROJECT - ASSIGNED TO

  models.Project.belongsToMany(models.User, { as: { singular: "defAssignedTo", plural: "defAssignedTos" }, through: 'project_def_assignedTos' });
  models.User.belongsToMany(models.Project, { as: { singular: "defAssignedTo", plural: "defAssignedTos" }, through: 'project_def_assignedTos' });

  //PROJECT - COMPANY
  models.Project.belongsTo(models.Company, { as: 'defCompany' });
  models.Company.hasMany(models.Project, { as: 'defCompany' });

  //PROJECT - REQUESTER
  models.Project.belongsTo(models.User, { as: 'defRequester' });
  models.User.hasMany(models.Project, { as: 'defRequester' });

  //PROJECT - STATUS
  models.Project.belongsTo(models.Status, { as: 'defStatus' });
  models.Status.hasMany(models.Project, { as: 'defStatus' });

  //PROJECT - TAGS
  models.Project.belongsToMany(models.Tag, { as: 'defTags', through: 'project_def_tags' });
  models.Tag.belongsToMany(models.Project, { as: 'defTags', through: 'project_def_tags' });

  //PROJECT - TASKTYPE
  models.Project.belongsTo(models.TaskType, { as: 'defTaskType' });
  models.TaskType.hasMany(models.Project, { as: 'defTaskType' });

  //ERROR MESSAGES
  defineErrorMessages(sequelize);
  models.ErrorMessage.belongsTo(models.User);
  models.User.hasMany(models.ErrorMessage);

  //NOTIFICATIONS
  defineUserNotifications(sequelize);
  models.UserNotification.belongsTo(models.User);
  models.User.hasMany(models.UserNotification);

  //FILTER
  defineFilter(sequelize);
  defineFilterOneOf(sequelize);

  models.Filter.belongsTo(models.User, { as: 'filterCreatedBy' });
  models.User.hasMany(models.Filter, { as: 'filterCreatedBy' });

  models.Filter.hasMany(models.FilterOneOf, { onDelete: 'CASCADE' });
  models.FilterOneOf.belongsTo(models.Filter, { foreignKey: { allowNull: false } });

  models.Filter.belongsTo(models.User, { as: 'filterAssignedTo' });
  models.User.hasMany(models.Filter, { as: 'filterAssignedTo' });

  models.Filter.belongsTo(models.User, { as: 'filterRequester' });
  models.User.hasMany(models.Filter, { as: 'filterRequester' });

  models.Filter.belongsTo(models.Company, { as: 'filterCompany' });
  models.Company.hasMany(models.Filter, { as: 'filterCompany' });

  models.Filter.belongsTo(models.TaskType, { as: 'filterTaskType' });
  models.TaskType.hasMany(models.Filter, { as: 'filterTaskType' });

  models.Filter.belongsTo(models.Project, {as : 'filterOfProject' });
  models.Project.hasMany(models.Filter, {as : { singular: "filterOfProject", plural: "filterOfProjects" } });

  models.Filter.belongsToMany(models.Role, { through: 'filter_access_roles' });
  models.Role.belongsToMany(models.Filter, { through: 'filter_access_roles' });

  //MILESTONE
  defineMilestone(sequelize);
  models.Project.hasMany(models.Milestone, { onDelete: 'CASCADE' });
  models.Milestone.belongsTo(models.Project, { foreignKey: { allowNull: false } });

  defineRepeats(sequelize);
  //TASKS
  defineTasks(sequelize);

  //TASKS - USER NOTIFICATION - DELETED
  models.UserNotification.belongsTo(models.Task, { foreignKey: { allowNull: false } });
  models.Task.hasMany(models.UserNotification, { onDelete: 'CASCADE' });

  //TASKS - ASSINGED TO - REMOVED
  models.Task.belongsToMany(models.User, { as : { singular: "assignedTo", plural: "assignedTos" }, through: 'task_assignedTo' });
  models.User.belongsToMany(models.Task, { as : { singular: "assignedToTask", plural: "assignedToTasks" }, through: 'task_assignedTo' });

  //TASKS - COMPANY - REPLACED
  models.Task.belongsTo(models.Company, { foreignKey: { allowNull: false } });
  models.Company.hasMany(models.Task);

  //TASKS - CREATED BY - SET NULL
  models.Task.belongsTo(models.User, { as: 'createdBy' });
  models.User.hasMany(models.Task, { as: 'createdTask' });

  //TASKS - MILESTONE - SET NULL
  models.Task.belongsTo(models.Milestone);
  models.Milestone.hasMany(models.Task);

  //TASKS - PROJECT - TASK DELETED
  models.Task.belongsTo(models.Project, { foreignKey: { allowNull: false } });
  models.Project.hasMany(models.Task, { onDelete: 'CASCADE' } );

  //TASKS - REQUESTER - REPLACED
  models.Task.belongsTo(models.User, { as: 'requester' });
  models.User.hasMany(models.Task, { as: { singular: 'requesterTask', plural: 'requesterTasks' } });

  //TASKS - STATUS - REPLACED
  models.Task.belongsTo(models.Status, { foreignKey: { allowNull: false } });
  models.Status.hasMany(models.Task);

  //TASKS - TAGS - REMOVED
  models.Tag.belongsToMany(models.Task, { through: 'task_has_tags' });
  models.Task.belongsToMany(models.Tag, { through: 'task_has_tags' });

  //TASKS - TASK TYPE - REPLACED
  models.Task.belongsTo(models.TaskType);
  models.TaskType.hasMany(models.Task);

  //TASKS - REPEAT - DELETED
  models.Task.hasOne(models.Repeat, { onDelete: 'CASCADE' });
  models.Repeat.belongsTo(models.Task, { foreignKey: { allowNull: false } });

  defineSubtasks(sequelize);

  models.Task.hasMany(models.Subtask, { onDelete: 'CASCADE' });
  models.Subtask.belongsTo(models.Task, { foreignKey: { allowNull: false } });

  //SUBTASK - TASK TYPE - REPLACED
  models.Subtask.belongsTo(models.TaskType);
  models.TaskType.hasMany(models.Subtask);

  //SUBTASK - USER - REPLACED
  models.Subtask.belongsTo(models.User);
  models.User.hasMany(models.Subtask);

  defineWorkTrips(sequelize);
  models.Task.hasMany(models.WorkTrip, { onDelete: 'CASCADE' });
  models.WorkTrip.belongsTo(models.Task, { foreignKey: { allowNull: false } });


  //WORK TRIP - TRIP TYPE - REPLACED
  models.WorkTrip.belongsTo(models.TripType);
  models.TripType.hasMany(models.WorkTrip);

  //WORK TRIP - USER - REPLACED
  models.WorkTrip.belongsTo(models.User);
  models.User.hasMany(models.WorkTrip);

  defineMaterials(sequelize);
  models.Task.hasMany(models.Material, { onDelete: 'CASCADE' });
  models.Material.belongsTo(models.Task, { foreignKey: { allowNull: false } });

  defineCustomItems(sequelize);
  models.Task.hasMany(models.CustomItem, { onDelete: 'CASCADE' });
  models.CustomItem.belongsTo(models.Task, { foreignKey: { allowNull: false } });

  defineComments(sequelize);
  models.User.hasMany(models.Comment, { onDelete: 'CASCADE' });
  models.Comment.belongsTo(models.User, { foreignKey: { allowNull: false } });

  models.Task.hasMany(models.Comment, { onDelete: 'CASCADE' });
  models.Comment.belongsTo(models.Task, { foreignKey: { allowNull: false } });

  models.Comment.belongsTo( models.Comment, { as: 'commentOf' });
  models.Comment.hasMany(models.Comment, { onDelete: 'CASCADE' });


  defineEmails(sequelize);
  models.User.hasMany(models.Email, { onDelete: 'CASCADE' });
  models.Email.belongsTo(models.User);

  models.Task.hasMany(models.Email, { onDelete: 'CASCADE' });
  models.Email.belongsTo(models.Task, { foreignKey: { allowNull: false } });

  defineEmailTargets(sequelize);

  models.Email.hasMany(models.EmailTarget, { onDelete: 'CASCADE' });
  models.EmailTarget.belongsTo(models.Email, { foreignKey: { allowNull: false } });

  defineCalendarEvents(sequelize);
  models.Task.hasMany(models.CalendarEvent, { onDelete: 'CASCADE' });
  models.CalendarEvent.belongsTo(models.Task, { foreignKey: { allowNull: false } });

  defineTaskChanges(sequelize);
  defineTaskChangeMessages(sequelize);

  models.TaskChange.belongsTo(models.Task, { foreignKey: { allowNull: false } });
  models.Task.hasMany(models.TaskChange, { onDelete: 'CASCADE' });

  models.TaskChange.belongsTo(models.User);
  models.User.hasMany(models.TaskChange);

  models.TaskChange.hasMany(models.TaskChangeMessage, { onDelete: 'CASCADE' });
  models.TaskChangeMessage.belongsTo(models.TaskChange, { foreignKey: { allowNull: false } });

  //LOG FUNCTIONS
  //logFunctionsOfModel(models.Task);
  /*
  Todo list
    -calendar events (start end task) - only when can edit task
    -task history/notifications - log task edit - start with status, comment
    invoices
  */

  if(ignoreUpdating){
    return new Promise( (resolve, reject) => resolve() );
  }
  return sequelize.sync({ alter: true })
}
