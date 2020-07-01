import { Sequelize, Model, DataTypes, Op } from "sequelize";
import defineTags from './instances/tags';
import defineTasks from './instances/tasks';

const operatorsAliases = {
  and: Op.and,
  or: Op.or,
  eq: Op.eq,
  ne: Op.ne,
  is: Op.is,
  not: Op.not,
  col: Op.col,
  gt: Op.gt,
  gte: Op.gte,
  lt: Op.lt,
  lte: Op.lte,
  between: Op.between,
  notBetween: Op.notBetween,
  all: Op.all,
  in: Op.in,
  notIn: Op.notIn,
  like: Op.like,
  notLike: Op.notLike,
  startsWith: Op.startsWith,
  endsWith: Op.endsWith,
  substring: Op.substring,
  iLike: Op.iLike,
  notILike: Op.notILike,
  regexp: Op.regexp,
  notRegexp: Op.notRegexp,
  iRegexp: Op.iRegexp,
  notIRegexp: Op.notIRegexp,
  any: Op.any,
}

export const sequelize = new Sequelize('testdatabase', 'accessPoint', 'ap2020',{
  host: 'localhost',
  dialect: 'mysql',
  logging: false,
  operatorsAliases
});
export const models = sequelize.models;


export const updateModels = ( ignoreUpdating: Boolean ) => {

  defineTags(sequelize);
  defineTasks(sequelize);
  models.Tag.belongsToMany(models.Task, { through: 'task_has_tags' });
  models.Task.belongsToMany(models.Tag, { through: 'task_has_tags' });

  if(ignoreUpdating){
    return new Promise( (resolve, reject) => resolve() );
  }
  return sequelize.sync({ alter: true })
}
/*
const testingCreate = async () => {
  console.log('testing create');

  //let jane = await models.User.create({ name: 'Jane', surname: 'Doe' })
  //console.log(jane.toJSON());
  //console.log(jane.get().name);
  //jane.set({ nameX: 'Peter' })
  //console.log(jane.get().name);
  //jane.update({ name: 'Karol' });
  //console.log(jane.toJSON());
  //save() to save changes
  //destroy() to delete
}
testingCreate();
*/
