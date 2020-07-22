import { createDoesNoExistsError } from 'configs/errors';
import { models } from 'models';
import checkResolver from './checkResolver';

const querries = {
  smtps: async ( root , args, { req } ) => {
    await checkResolver( req, ['smtps'] );
    return models.Smtp.findAll({
      order: [
        ['order', 'ASC'],
        ['title', 'ASC'],
      ]
    })
  },
  smtp: async ( root, { id }, { req } ) => {
    await checkResolver( req, ['smtps'] );
    return models.Smtp.findByPk(id);
  },
}

const mutations = {

  addSmtp: async ( root, args, { req } ) => {
    await checkResolver( req, ["smtps"] );
    return models.Smtp.create( args );
  },

  updateSmtp: async ( root, { id, ...args }, { req } ) => {
    await checkResolver( req, ["smtps"] );
    const Smtp = await models.Smtp.findByPk(id);
    if( Smtp === null ){
      throw createDoesNoExistsError('Smtp', id);
    }
    return Smtp.update( args );
  },

  deleteSmtp: async ( root, { id }, { req } ) => {
    await checkResolver( req, ["smtps"] );
    const Smtp = await models.Smtp.findByPk(id);
    if( Smtp === null ){
      throw createDoesNoExistsError('Smtp', id);
    }
    return Smtp.destroy();
  },
}

const attributes = {
};

export default {
  attributes,
  mutations,
  querries
}
