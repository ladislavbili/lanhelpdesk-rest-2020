import { createDoesNoExistsError, SmtpIsAlreadyBeingTestedError, IfNotWellKnownSetComunicationError } from '@/configs/errors';
import { models } from '@/models';
import checkResolver from './checkResolver';
import { testSmtp } from '@/services/smtp';

const querries = {
  smtps: async (root, args, { req }) => {
    await checkResolver(req, ['smtps']);
    return models.Smtp.findAll({
      order: [
        ['order', 'ASC'],
        ['title', 'ASC'],
      ]
    })
  },
  smtp: async (root, { id }, { req }) => {
    await checkResolver(req, ['smtps']);
    return models.Smtp.findByPk(id);
  },
}

const mutations = {

  addSmtp: async (root, args, { req }) => {
    await checkResolver(req, ["smtps"]);
    if (args.wellKnown === null && ["host", "port", "rejectUnauthorized", "secure"].some((att) => args[att] === null)) {
      throw IfNotWellKnownSetComunicationError;
    }
    if (args.def) {
      await models.Smtp.update({ def: false }, { where: { def: true } })
    }
    return models.Smtp.create(args);
  },

  updateSmtp: async (root, { id, ...args }, { req }) => {
    await checkResolver(req, ["smtps"]);
    const Smtp = await models.Smtp.findByPk(id);
    if (Smtp === null) {
      throw createDoesNoExistsError('Smtp', id);
    }
    if (args.wellKnown === null && ["host", "port", "rejectUnauthorized", "secure"].some((att) => args[att] === null)) {
      throw IfNotWellKnownSetComunicationError;
    }
    if (args.def) {
      await models.Smtp.update({ def: false }, { where: { def: true } })
    }
    return Smtp.update(args);
  },

  deleteSmtp: async (root, { id }, { req }) => {
    await checkResolver(req, ["smtps"]);
    const Smtp = await models.Smtp.findByPk(id);
    if (Smtp === null) {
      throw createDoesNoExistsError('Smtp', id);
    }
    return Smtp.destroy();
  },

  testSmtp: async (root, { id }, { req }) => {
    await checkResolver(req, ["smtps"]);
    const Smtp = await models.Smtp.findByPk(id);
    if (Smtp === null) {
      throw createDoesNoExistsError('Smtp', id);
    }
    if (Smtp.get('currentlyTested')) {
      throw SmtpIsAlreadyBeingTestedError;
    }
    testSmtp(Smtp);
    return true;
  },

  testSmtps: async (_, __, { req }) => {
    await checkResolver(req, ["smtps"]);
    const Smtps = await models.Smtp.findAll({ where: { currentlyTested: false } });
    Smtps.forEach((Smtp) => testSmtp(Smtp));
    return true;
  },
}

const attributes = {
};

export default {
  attributes,
  mutations,
  querries
}
