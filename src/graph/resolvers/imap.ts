import { createDoesNoExistsError } from '@/configs/errors';
import { models } from '@/models';
import checkResolver from './checkResolver';

const querries = {
  imaps: async (root, args, { req }) => {
    await checkResolver(req, ['imaps']);
    return models.Imap.findAll({
      order: [
        ['order', 'ASC'],
        ['title', 'ASC'],
      ]
    })
  },
  imap: async (root, { id }, { req }) => {
    await checkResolver(req, ['imaps']);
    return models.Imap.findByPk(id);
  },
}

const mutations = {

  addImap: async (root, args, { req }) => {
    await checkResolver(req, ["imaps"]);
    if (args.def) {
      await models.Imap.update({ def: false }, { where: { def: true } })
    }
    return models.Imap.create(args);
  },

  updateImap: async (root, { id, ...args }, { req }) => {
    await checkResolver(req, ["imaps"]);
    const Imap = await models.Imap.findByPk(id);
    if (Imap === null) {
      throw createDoesNoExistsError('Imap', id);
    }
    if (args.def) {
      await models.Imap.update({ def: false }, { where: { def: true } })
    }
    return Imap.update(args);
  },

  deleteImap: async (root, { id }, { req }) => {
    await checkResolver(req, ["imaps"]);
    const Imap = await models.Imap.findByPk(id);
    if (Imap === null) {
      throw createDoesNoExistsError('Imap', id);
    }
    return Imap.destroy();
  },
}

const attributes = {
};

export default {
  attributes,
  mutations,
  querries
}
