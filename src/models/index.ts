import { Sequelize, Model, DataTypes, Op } from "sequelize";
import { logFunctionsOfModel } from 'helperFunctions';
import data from 'configs/database';

import defineAccessRights from './instances/accessRights';
import defineTags from './instances/tag';
import defineTasks from './instances/task';
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
  defineTasks(sequelize);
  models.Tag.belongsToMany(models.Task, { through: 'task_has_tags' });
  models.Task.belongsToMany(models.Tag, { through: 'task_has_tags' });

  defineRoles(sequelize);
  defineAccessRights(sequelize);
  models.Role.hasOne(models.AccessRights, { foreignKey: { allowNull: false } });
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

  defineErrorMessages(sequelize);
  models.ErrorMessage.belongsTo(models.User);
  models.User.hasMany(models.ErrorMessage);

  defineUserNotifications(sequelize);
  models.UserNotification.belongsTo(models.User);
  models.User.hasMany(models.UserNotification);

  models.UserNotification.belongsTo(models.Task);
  models.Task.hasMany(models.UserNotification);

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

  defineMilestone(sequelize);
  models.Milestone.belongsTo(models.Project, { onDelete: 'CASCADE' });
  models.Project.hasMany(models.Milestone, { foreignKey: { allowNull: false } });

  //logFunctionsOfModel(models.Filter)


  if(ignoreUpdating){
    return new Promise( (resolve, reject) => resolve() );
  }
  return sequelize.sync({ alter: true })
}
