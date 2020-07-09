import { createDoesNoExistsError } from 'configs/errors';
import { models } from 'models';

const querries = {
  tags: async ( root, { filter } ) => {
    if(filter) return models.Tag.findAll({ where: await JSON.parse(filter) })
    return models.Tag.findAll()
  },
  tag: async ( root, { id } ) => {
    return models.Tag.findByPk(id);
  },
}

const mutations = {

  addTag: async ( root, args ) => {
    return models.Tag.create( args );
  },

  updateTag: async ( root, { id, ...args } ) => {
    const Tag = await models.Tag.findByPk(id);
    if( Tag === null ){
      throw createDoesNoExistsError('Tag', id);
    }
    return Tag.update( args );
  },

  deleteTag: async ( root, { id } ) => {
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
