import {
  createDoesNoExistsError,
} from '@/configs/errors';
import { models } from '@/models';
import {
  idDoesExistsCheck,
} from '@/helperFunctions';
import {
  CMDBAddressInstance,
} from '@/models/instances';
import checkResolver from './checkResolver';

const queries = {
}

const mutations = {
  addCmdbAddress: async (root, { itemId, ...params }, { req }) => {
    const SourceUser = await checkResolver(req, ['cmdb']);
    await idDoesExistsCheck(itemId, models.CMDBItem);

    return models.CMDBAddress.create({
      CMDBItemId: itemId,
      ...params,
    });
  },

  updateCmdbAddress: async (root, { id, ...params }, { req }) => {
    const SourceUser = await checkResolver(req, ['cmdb']);
    const Address = <CMDBAddressInstance>await models.CMDBAddress.findByPk(id);
    if (Address === null) {
      throw createDoesNoExistsError('Address', id);
    }
    return Address.update(params);
  },

  deleteCmdbAddress: async (root, { id }, { req }) => {
    const SourceUser = await checkResolver(req, ['cmdb']);
    const Address = <CMDBAddressInstance>await models.CMDBAddress.findByPk(id);
    if (Address === null) {
      throw createDoesNoExistsError('Address', id);
    }
    return Address.destroy();
  },
}

const attributes = {
};

export default {
  attributes,
  mutations,
  queries
}
