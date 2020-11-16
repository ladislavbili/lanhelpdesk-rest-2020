import { createDoesNoExistsError } from '@/configs/errors';
import { models } from '@/models';
import checkResolver from './checkResolver';
import {
  getModelAttribute
} from '@/helperFunctions';
import { PricelistInstance, ProjectInstance, TaskTypeInstance } from '@/models/instances';

const querries = {
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
    return TaskType;
  },

  updateTaskType: async (root, { id, ...args }, { req }) => {
    await checkResolver(req, ["taskTypes"]);
    const TaskType = await models.TaskType.findByPk(id);
    if (TaskType === null) {
      throw createDoesNoExistsError('Task type', id);
    }
    return TaskType.update(args);
  },

  deleteTaskType: async (root, { id, newId }, { req }) => {
    await checkResolver(req, ["taskTypes"]);
    const OldTaskType = <TaskTypeInstance>await models.TaskType.findByPk(id,
      {
        include: [
          { model: models.Project, as: 'defTaskType' }
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
      ...(<ProjectInstance[]>OldTaskType.get('defTaskType')).map((project) => {
        return project.setDefTaskType(newId);
      }),
    ])
    const allTasks = await OldTaskType.getTasks();
    const allSubtasks = await OldTaskType.getSubtasks();
    await Promise.all([
      ...allTasks.map((task) => task.setTaskType(newId)),
      ...allTasks.map((subtask) => subtask.setTaskType(newId)),
    ]);
    return OldTaskType.destroy();
  },
}

const attributes = {
  TaskType: {
    async prices(taskType) {
      return getModelAttribute(taskType, 'Prices');
    }
  },
};

export default {
  attributes,
  mutations,
  querries
}
