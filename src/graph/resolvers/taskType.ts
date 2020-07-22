import { createDoesNoExistsError } from 'configs/errors';
import { models } from 'models';
import checkResolver from './checkResolver';
import { PricelistInstance } from 'models/instances';

const querries = {
  taskTypes: async ( root , args, { req } ) => {
    await checkResolver( req );
    return models.TaskType.findAll({
      order: [
        ['order', 'ASC'],
        ['title', 'ASC'],
      ]
    })
  },
  taskType: async ( root, { id }, { req } ) => {
    await checkResolver( req, ["taskTypes"] );
    return models.TaskType.findByPk(id);
  },
}

const mutations = {

  addTaskType: async ( root, args, { req } ) => {
    await checkResolver( req, ["taskTypes"] );
    const TaskType = await models.TaskType.create( args );
    const pricelists = await models.Pricelist.findAll();
    await Promise.all( pricelists.map( ( Pricelist ) => (
      <PricelistInstance> Pricelist).createPrice({
        price: 0,
        type: 'TaskType',
        TaskTypeId: TaskType.get('id')
      })  ) )
    return TaskType;
  },

  updateTaskType: async ( root, { id, ...args }, { req } ) => {
    await checkResolver( req, ["taskTypes"] );
    const TaskType = await models.TaskType.findByPk(id);
    if( TaskType === null ){
      throw createDoesNoExistsError('Task type', id);
    }
    return TaskType.update( args );
  },

  deleteTaskType: async ( root, { id }, { req } ) => {
    await checkResolver( req, ["taskTypes"] );
    const TaskType = await models.TaskType.findByPk(id);
    if( TaskType === null ){
      throw createDoesNoExistsError('Task type', id);
    }
    await models.Price.destroy({ where: { type: 'TaskType', TaskTypeId: id } })
    return TaskType.destroy();
  },
}

const attributes = {
  TaskType: {
    async prices(taskType) {
      return taskType.getPrices()
    }
  },
};

export default {
  attributes,
  mutations,
  querries
}
