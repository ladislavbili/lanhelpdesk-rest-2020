const querries = {
  tags: async ( root, { filter }, { models } ) => {
    if(filter) return models.Tag.findAll({ where: await JSON.parse(filter) })
    return models.Tag.findAll()
  },
  tag: async ( root, { id }, { models } ) => {
    return models.Tag.findByPk(id);
  },
}

const mutations = {
  addTag: async ( root, { title, color }, { models } ) => {
    return models.Tag.create({ title, color });
  },
  updateTag: async ( root, { id, title, color }, { models } ) => {
    const Tag = await models.Tag.findByPk(id);
    if( Tag === null ){
      return new Error(`Tag with id ${id} does not exist.`);
    }
    return Tag.update( { title, color } );
  },
}

const attributes = {
  Tag: {
    async tasks(tag) {
      return tag.getTasks()
    }
  },
};

export default {
  attributes,
  mutations,
  querries
}
