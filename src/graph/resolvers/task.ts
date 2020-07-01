const querries = {
  tasks: async ( root, { filter }, { models } ) => {
    if(filter) return models.Tag.findAll({ where: await JSON.parse(filter) })
    return models.Task.findAll()
  },
  task: async ( root, { id }, { models } ) => {
    return models.Task.findByPk(id);
  },
}

const mutations = {
  addTask: async ( root, { title, tags }, { models } ) => {
    const Task = await models.Task.create({ title });
    if( tags ){
      await Task.setTags(tags);
    }
    return Task;
  },
  updateTask: async ( root, { id, title, tags }, { models } ) => {
    const Task = await models.Task.findByPk(id);
    if( Task === null ){
      return new Error(`Task with id ${id} does not exist.`);
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
