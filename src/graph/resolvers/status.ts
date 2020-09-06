import { createDoesNoExistsError } from 'configs/errors';
import { models } from 'models';
import { ProjectInstance, TaskInstance, StatusInstance } from 'models/instances';
import checkResolver from './checkResolver';

const querries = {
  statuses: async ( root , args, { req } ) => {
    await checkResolver( req );
    return models.Status.findAll({
      order: [
        ['order', 'ASC'],
        ['title', 'ASC'],
      ]
    })
  },
  status: async ( root, { id }, { req } ) => {
    await checkResolver( req, ["statuses"] );
    return models.Status.findByPk(id);
  },
}

const mutations = {

  addStatus: async ( root, args, { req } ) => {
    await checkResolver( req, ["statuses"] );
    return models.Status.create( args );
  },

  updateStatus: async ( root, { id, ...args }, { req } ) => {
    await checkResolver( req, ["statuses"] );
    const Status = await models.Status.findByPk(id);
    if( Status === null ){
      throw createDoesNoExistsError('Status', id);
    }
    return Status.update( args );
  },

  deleteStatus: async ( root, { id, newId }, { req } ) => {
    await checkResolver( req, ["statuses"] );
    const NewStatus = await models.Status.findByPk(newId);
    const OldStatus = <StatusInstance> await models.Status.findByPk(id,
      {
        include: [
          { model: models.Project, as: 'defStatus' }
        ]
      }
    )
    if( OldStatus === null ){
      throw createDoesNoExistsError('Status', id);
    }
    if( NewStatus === null ){
      throw createDoesNoExistsError('Status', newId);
    }
    await Promise.all([
      ...(<ProjectInstance[]>OldStatus.get('defStatus')).map( (project) => {
        return project.setDefStatus(newId);
      }),

    ])
    const allTasks = <TaskInstance[]> await OldStatus.getTasks();
    await Promise.all( allTasks.map( (task) => task.setStatus(newId) ) )
    return OldStatus.destroy();
  },
}

const attributes = {
};

export default {
  attributes,
  mutations,
  querries
}
