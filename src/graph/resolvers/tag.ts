import { createDoesNoExistsError } from 'configs/errors';

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

  addTag: async ( root, args, { models } ) => {
    return models.Tag.create( args );
  },

  updateTag: async ( root, { id, ...args }, { models } ) => {
    const Tag = await models.Tag.findByPk(id);
    if( Tag === null ){
      throw createDoesNoExistsError('Tag', id);
    }
    return Tag.update( args );
  },

  deleteTag: async ( root, { id }, { models } ) => {
    const Tag = await models.Tag.findByPk(id);
    if( Tag === null ){
      throw createDoesNoExistsError('Tag', id);
    }
    return Tag.destroy();
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
