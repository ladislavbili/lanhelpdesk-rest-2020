import {
  createDoesNoExistsError,
} from '@/configs/errors';
import { models } from '@/models';
import fs from 'fs';
import {
  CMDBPasswordInstance,
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
  CMDB_PASSWORDS_CHANGE,
} from '@/configs/subscriptions';

const queries = {
  cmdbPasswords: async (root, { companyId, order, limit, page, stringFilter }, { req }) => {
    const User = await checkResolver(req, ['cmdb']);

    let passwordOrder = ['id', 'DESC'];
    switch (order) {
      case 'title': {
        passwordOrder = ['title', 'ASC'];
        break;
      }
      case 'updatedAt': {
        passwordOrder = ['updatedAt', 'DESC'];
        break;
      }
      default: {
        break;
      }
    }

    let pagination = <any>{};
    let passwordWhere = <any>{ CompanyId: companyId };
    if (limit && page) {
      pagination = {
        offset: limit * (page - 1),
        limit,
      }
    };
    if (stringFilter) {
      if (stringFilter.title.length > 0) {
        passwordWhere = {
          ...passwordWhere,
          title: { [Op.like]: `%${stringFilter.title}%` },
        }
      }
    }

    const response = await models.CMDBPassword.findAndCountAll({
      where: passwordWhere,
      order: [<any>passwordOrder],
      ...pagination,
      include: [
        {
          model: models.User,
          as: 'createdBy',
        },
        {
          model: models.User,
          as: 'changedBy',
        },
      ],
    });

    return {
      count: <number>response.count,
      passwords: <CMDBPasswordInstance[]>response.rows,
    }
  },
  cmdbPassword: async (root, { id }, { req }) => {
    const User = await checkResolver(req, ["cmdb"]);
    return models.CMDBPassword.findByPk(id);
  },
}

const mutations = {
  addCmdbPassword: async (root, { companyId, expireDate, ...directData }, { req }) => {
    const User = await checkResolver(req, ["cmdb"]);
    await idDoesExists(companyId, models.Company);

    const dates = extractDatesFromObject({ expireDate }, ['expireDate']);
    const Password = <CMDBPasswordInstance>await models.CMDBPassword.create({
      ...directData,
      ...dates,
      CompanyId: companyId,
      changedById: User.get('id'),
      createdById: User.get('id'),
    });
    pubsub.publish(CMDB_PASSWORDS_CHANGE, { cmdbPasswordsSubscription: companyId });
    return Password;
  },
  updateCmdbPassword: async (root, { id, expireDate, ...args }, { req }) => {
    const User = await checkResolver(req, ["cmdb"]);
    const OriginalPassword = <CMDBPasswordInstance>await models.CMDBPassword.findByPk(id);
    if (!OriginalPassword) {
      throw createDoesNoExistsError('Password', id);
    };
    const dates = extractDatesFromObject({ expireDate }, ['expireDate']);

    await OriginalPassword.update({
      ...args,
      ...dates,
      changedById: User.get('id'),
    });
    pubsub.publish(CMDB_PASSWORDS_CHANGE, { cmdbPasswordsSubscription: OriginalPassword.get('CompanyId') });
    return OriginalPassword.reload();
  },
  deleteCmdbPassword: async (root, { id }, { req }) => {
    const User = await checkResolver(req, ["cmdb"]);
    const OriginalPassword = <CMDBPasswordInstance>await models.CMDBPassword.findByPk(id);

    if (!OriginalPassword) {
      throw createDoesNoExistsError('Password', id);
    };
    const cmdbPasswordsSubscription = OriginalPassword.get('CompanyId');
    await OriginalPassword.destroy();
    pubsub.publish(CMDB_PASSWORDS_CHANGE, { cmdbPasswordsSubscription });
    return OriginalPassword;
  },
}

const attributes = {
  CMDBPassword: {
    async createdBy(password) {
      return getModelAttribute(password, 'createdBy');
    },
    async updatedBy(password) {
      return getModelAttribute(password, 'changedBy');
    },
  },
};

const subscriptions = {
  cmdbPasswordsSubscription: {
    subscribe: withFilter(
      () => pubsub.asyncIterator(CMDB_PASSWORDS_CHANGE),
      async ({ cmdbPasswordsSubscription }, { companyId }) => {
        return cmdbPasswordsSubscription === companyId;
      }
    ),
  },
};

export default {
  attributes,
  mutations,
  queries,
  subscriptions,
}
