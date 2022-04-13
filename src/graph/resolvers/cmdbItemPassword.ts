import {
  createDoesNoExistsError,
} from '@/configs/errors';
import { models } from '@/models';
import fs from 'fs';
import {
  CMDBItemPasswordInstance,
} from '@/models/instances';
import { Op } from 'sequelize';
import checkResolver from './checkResolver';
import {
  getModelAttribute,
  idDoesExists,
  extractDatesFromObject,
} from '@/helperFunctions';
import { pubsub } from './index';
const { withFilter } = require('apollo-server-express');
import {
} from '@/configs/subscriptions';

const queries = {
}

const mutations = {
  addCmdbItemPassword: async (root, { itemId, expireDate, ...directData }, { req }) => {
    console.log('aaa');

    const User = await checkResolver(req, ["cmdb"]);
    await idDoesExists(itemId, models.CMDBItem);

    const dates = extractDatesFromObject({ expireDate }, ['expireDate']);
    const Password = <CMDBItemPasswordInstance>await models.CMDBItemPassword.create({
      ...directData,
      ...dates,
      CMDBItemId: itemId,
    });
    return Password;
  },
  updateCmdbItemPassword: async (root, { id, expireDate, ...args }, { req }) => {
    const User = await checkResolver(req, ["cmdb"]);
    const OriginalPassword = <CMDBItemPasswordInstance>await models.CMDBItemPassword.findByPk(id);
    if (!OriginalPassword) {
      throw createDoesNoExistsError('Password', id);
    };
    const dates = extractDatesFromObject({ expireDate }, ['expireDate']);

    await OriginalPassword.update({
      ...args,
      ...dates,
    });
    return OriginalPassword.reload();
  },
  deleteCmdbItemPassword: async (root, { id }, { req }) => {
    const User = await checkResolver(req, ["cmdb"]);
    const OriginalPassword = <CMDBItemPasswordInstance>await models.CMDBItemPassword.findByPk(id);

    if (!OriginalPassword) {
      throw createDoesNoExistsError('Password', id);
    };
    const cmdbPasswordsSubscription = OriginalPassword.get('CompanyId');
    await OriginalPassword.destroy();
    return OriginalPassword;
  },
}

const attributes = {

};

const subscriptions = {
};

export default {
  attributes,
  mutations,
  queries,
  subscriptions,
}
