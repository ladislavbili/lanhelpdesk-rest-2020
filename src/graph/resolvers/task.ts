import { InvalidTokenError, createDoesNoExistsError } from 'configs/errors';
import { models } from 'models';
import { TaskInstance } from 'models/interfaces';

const querries = {
  tasks: async ( root, args, { userData } ) => {
    return models.Task.findAll()
  },
  task: async ( root, { id }, { userData } ) => {
    if( userData === null ){
      throw InvalidTokenError;
    }
    return models.Task.findByPk(id);
  },
}

const mutations = {
  addTask: async ( root, { title, tags } ) => {
    const Task = <TaskInstance> await models.Task.create({ title });
    if( tags ){
      await Task.setTags(tags);
    }
    return Task;
  },
  updateTask: async ( root, { id, title, tags } ) => {
    const Task = <TaskInstance> await models.Task.findByPk(id);
    if( Task === null ){
      return createDoesNoExistsError("Task", id);
    }
    if( tags ) await Task.setTags(tags);
    return Task.update( { title } );
  },
}

const attributes = {
  Task: {
    async tags(task) {
      return task.getTags()
    }
  }
};

export default {
  attributes,
  mutations,
  querries
}
