import {
  createDoesNoExistsError,
} from '@/configs/errors';
import { models, sequelize } from '@/models';
import {
  getModelAttribute,
} from '@/helperFunctions';
import {
  CMDBSchemeInstance,
  CompanyInstance,
} from '@/models/instances';
import checkResolver from './checkResolver';

const queries = {
  cmdbScheme: async (root, { companyId }, { req }) => {
    const User = await checkResolver(req, ["cmdb"]);
    const Scheme = await models.CMDBScheme.findOne({ where: { CompanyId: companyId }, include: [models.Company] });
    if (!Scheme) {
      return null;
    }
    return Scheme;
  },
}

const mutations = {
  addOrUpdateCmdbScheme: async (root, { companyId, description }, { req }) => {
    await checkResolver(req, ["cmdb"]);
    const Company = <CompanyInstance>await models.Company.findByPk(companyId, { include: [models.CMDBScheme] });
    if (!Company) {
      throw createDoesNoExistsError('Company', companyId);
    }
    const OriginalScheme = <CMDBSchemeInstance>Company.get('CMDBScheme');
    if (OriginalScheme) {
      return OriginalScheme.update({ description });
    }
    return models.CMDBScheme.create({ description, CompanyId: companyId });
  },
}

const attributes = {
  CMDBScheme: {
    async file(scheme) {
      return getModelAttribute(scheme, 'CMDBFile');
    },
    async company(scheme) {
      return getModelAttribute(scheme, 'Company');
    },
  },
};

const subscriptions = {
};

export default {
  attributes,
  mutations,
  queries,
  subscriptions,
}
