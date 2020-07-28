import { Sequelize, Model, DataTypes, Op } from "sequelize";
import { logFunctionsOfModel } from 'helperFunctions';

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


/*
const operatorsAliases = {

}
*/
export const sequelize = new Sequelize('testdatabase', 'accessPoint', 'ap2020',{
  host: 'localhost',
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

  //logFunctionsOfModel(models.Company)
  if(ignoreUpdating){
    return new Promise( (resolve, reject) => resolve() );
  }
  return sequelize.sync({ alter: true })
}
