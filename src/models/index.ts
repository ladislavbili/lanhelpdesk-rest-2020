import { Sequelize, Model, DataTypes, Op } from "sequelize";
import defineTags from './instances/tag';
import defineTasks from './instances/task';
import defineTokens from './instances/token';
import defineUsers from './instances/user';
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
  defineUsers(sequelize);
  defineTokens(sequelize);
  models.Tag.belongsToMany(models.Task, { through: 'task_has_tags' });
  models.Task.belongsToMany(models.Tag, { through: 'task_has_tags' });
  models.User.hasMany(models.Token);
  models.Token.belongsTo(models.User);
  if(ignoreUpdating){
    return new Promise( (resolve, reject) => resolve() );
  }
  return sequelize.sync({ alter: true })
}
