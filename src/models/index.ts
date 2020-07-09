import { Sequelize, Model, DataTypes, Op } from "sequelize";
import defineAccessRights from './instances/accessRights';
import defineTags from './instances/tag';
import defineTasks from './instances/task';
import defineTokens from './instances/token';
import defineUsers from './instances/user';
import defineRoles from './instances/role';
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
  defineAccessRights(sequelize);
  defineTags(sequelize);
  defineTasks(sequelize);
  defineUsers(sequelize);
  defineTokens(sequelize);
  defineRoles(sequelize);

  models.Tag.belongsToMany(models.Task, { through: 'task_has_tags' });
  models.Task.belongsToMany(models.Tag, { through: 'task_has_tags' });

  models.User.hasMany(models.Token);
  models.Token.belongsTo(models.User);

  models.User.belongsTo(models.Role, { foreignKey: { allowNull: false } });
  models.Role.hasMany(models.User);

  models.Role.hasOne(models.AccessRights, { foreignKey: { allowNull: false } });
  models.AccessRights.belongsTo(models.Role, { foreignKey: { allowNull: false } });
  
  if(ignoreUpdating){
    return new Promise( (resolve, reject) => resolve() );
  }
  return sequelize.sync({ alter: true })
}
