import { Sequelize, Model, DataTypes, Op } from "sequelize";
import defineAccessRights from './instances/accessRights';
import defineTags from './instances/tag';
import defineTasks from './instances/task';
import defineTokens from './instances/token';
import defineUsers from './instances/user';
import defineRoles from './instances/role';
import defineTaskTypes from './instances/taskType';
import defineTripTypes from './instances/tripType';
import definePricelists from './instances/pricelist';
import definePrices from './instances/price';
import defineCompanies from './instances/company';
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


  if(ignoreUpdating){
    return new Promise( (resolve, reject) => resolve() );
  }
  return sequelize.sync({ alter: true })
}
