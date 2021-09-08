import { createDoesNoExistsError } from '@/configs/errors';
import { models } from '@/models';
import checkResolver from './checkResolver';
import {
  getModelAttribute
} from '@/helperFunctions';
import { PricelistInstance, ProjectAttributesInstance, TaskTypeInstance } from '@/models/instances';

import { TASK_TYPE_CHANGE } from '@/configs/subscriptions';
import { pubsub } from './index';
const { withFilter } = require('apollo-server-express');

const queries = {
  taskTypes: async (root, args, { req }) => {
    await checkResolver(req);
    return models.TaskType.findAll({
      order: [
        ['order', 'ASC'],
        ['title', 'ASC'],
      ]
    })
  },
  taskType: async (root, { id }, { req }) => {
    await checkResolver(req, ["taskTypes"]);
    return models.TaskType.findByPk(id);
  },
}

const mutations = {

  addTaskType: async (root, args, { req }) => {
    await checkResolver(req, ["taskTypes"]);
    const TaskType = await models.TaskType.create(args);
    const pricelists = await models.Pricelist.findAll();
    await Promise.all(pricelists.map((Pricelist) => (
      <PricelistInstance>Pricelist).createPrice({
        price: 0,
        type: 'TaskType',
        TaskTypeId: TaskType.get('id')
      })))
    pubsub.publish(TASK_TYPE_CHANGE, { taskTypesSubscription: true });
    return TaskType;
  },

  updateTaskType: async (root, { id, ...args }, { req }) => {
    await checkResolver(req, ["taskTypes"]);
    const TaskType = await models.TaskType.findByPk(id);
    if (TaskType === null) {
      throw createDoesNoExistsError('Task type', id);
    }
    await TaskType.update(args);
    pubsub.publish(TASK_TYPE_CHANGE, { taskTypesSubscription: true });
    return TaskType;
  },

  deleteTaskType: async (root, { id, newId }, { req }) => {
    await checkResolver(req, ["taskTypes"]);
    const OldTaskType = <TaskTypeInstance>await models.TaskType.findByPk(id,
      {
        include: [
          { model: models.ProjectAttribute, as: 'defTaskType' }
        ]
      }
    )
    if (OldTaskType === null) {
      throw createDoesNoExistsError('Task type', id);
    }
    const NewTaskType = await models.TaskType.findByPk(newId);
    if (NewTaskType === null) {
      throw createDoesNoExistsError('Task type', newId);
    }
    Promise.all([
      models.Price.destroy({ where: { type: 'TaskType', TaskTypeId: id } }),
      ...(<ProjectAttributesInstance[]>OldTaskType.get('defTaskType')).map((ProjectAttribute) => {
        return ProjectAttribute.setDefTaskType(newId);
      }),
    ])
    const allTasks = await OldTaskType.getTasks();
    const allSubtasks = await OldTaskType.getSubtasks();
    await Promise.all([
      ...allTasks.map((task) => task.setTaskType(newId)),
      ...allTasks.map((subtask) => subtask.setTaskType(newId)),
    ]);
    await OldTaskType.destroy();
    pubsub.publish(TASK_TYPE_CHANGE, { taskTypesSubscription: true });
    return OldTaskType;
  },
}

const attributes = {
  TaskType: {
    async prices(taskType) {
      return getModelAttribute(taskType, 'Prices');
    }
  },
};

const subscriptions = {
  taskTypesSubscription: {
    subscribe: withFilter(
      () => pubsub.asyncIterator(TASK_TYPE_CHANGE),
      async (data, args, { userID }) => {
        return true;
      }
    ),
  }
}

export default {
  attributes,
  mutations,
  queries,
  subscriptions,
}
