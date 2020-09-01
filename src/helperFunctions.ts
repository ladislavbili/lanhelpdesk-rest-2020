import  { Op } from 'sequelize';
import { createDoesNoExistsError, InsufficientProjectAccessError } from 'configs/errors';
import { ProjectRightInstance } from 'models/instances';

import { models } from 'models';

export const randomString =  () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

export const flattenObject = (object, prefix = '') => {
  let newObject = {};
  Object.keys(object).map((firstKey) => {
    Object.keys(object[firstKey]).map((secondKey) => {
      newObject[`${prefix}${prefix === '' ? firstKey : capitalizeFirstLetter(firstKey)}${capitalizeFirstLetter(secondKey)}`] = object[firstKey][secondKey];
    })
  })
  return newObject;
}

export const splitArrayByFilter = (array, filter) => {
  return array.reduce(([p, f], e) => (filter(e) ? [[...p, e], f] : [p, [...f, e]]), [[], []]);
}

export const capitalizeFirstLetter = (s) => {
  if (typeof s !== 'string') return ''
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export const logFunctionsOfModel = ( model ) => {
  Object.keys(model.associations).forEach( ( assoc ) => {
    Object.keys(model.associations[assoc].accessors).forEach( ( accessor ) => {
      console.log(model.name + '.' + model.associations[assoc].accessors[accessor]+'()');
    } )
  } )
}

export const idDoesExists = async (id: number, model) => {
  return (await model.findByPk(id) !== null);
}

export const multipleIdDoesExists = async ( pairs ) => {
  let promises = pairs.map( (pair) => pair.model.findByPk(pair.id) );
  let responses = await Promise.all(promises);
  return responses.some( (response) => response === null );
}

export const idsDoExists = async (ids: number[], model) => {
  const count = await model.count({
    where: {
      id: ids
    },
  });
  return count === ids.length
}

export const idDoesExistsCheck = async (id: number, model) => {
  if(await model.findByPk(id) === null){
    throw createDoesNoExistsError(model.name, id);
  }
}

export const multipleIdDoesExistsCheck = async ( pairs ) => {
  const promises = pairs.map( (pair) => pair.model.findByPk(pair.id) );
  const responses = await Promise.all(promises);
  if(responses.some( (response) => response === null )){
    const failedPairs = pairs.filter( (pair, index) => responses[index] === null );
    throw createDoesNoExistsError( failedPairs.map( (pair) => `${pair.model.name} - id:${pair.id}` ).toString() );
  }
}

export const idsDoExistsCheck = async (ids: number[], model) => {
  const responses = await Promise.all( ids.map( (id) => model.findByPk(id) ) )
  if( responses.some( (response) => response === null ) ){
    const failedIds = ids.filter( (id, index) => responses[index] === null );
    throw createDoesNoExistsError(model.name, failedIds);
  }
}

export const addApolloError = ( source, error, userId = null, sourceId = null ) => {
  return models.ErrorMessage.create({
    errorMessage: error.message,
    source,
    sourceId,
    type: error.extensions.code,
    userId
  })
}

export const checkIfHasProjectRights = async (userId, taskId, right = 'read') => {
  const User = await models.User.findByPk(userId,{ include: [{ model: models.ProjectRight }] })
  const Task = await models.Task.findByPk(taskId);
  if(Task === null){
    throw createDoesNoExistsError('Task', taskId);
  }
  const ProjectRight = (<ProjectRightInstance[]>User.get('ProjectRights')).find( (ProjectRight) => ProjectRight.get('ProjectId') === Task.get('ProjectId') );
  if(ProjectRight !== undefined){
  }
  if(ProjectRight === undefined || !ProjectRight.get(right)){
    throw InsufficientProjectAccessError;
  }

  return { ProjectRight, Task, internal: ProjectRight.get('internal') };
}
