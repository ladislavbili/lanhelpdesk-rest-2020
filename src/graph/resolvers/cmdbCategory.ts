import {
  createDoesNoExistsError,
} from '@/configs/errors';
import { models, sequelize } from '@/models';
import {
  CMDBCategoryInstance,
  CMDBItemInstance,
} from '@/models/instances';
import checkResolver from './checkResolver';
import { pubsub } from './index';
const { withFilter } = require('apollo-server-express');
import {
  CMDB_CATEGORY_CHANGE,
} from '@/configs/subscriptions';

const queries = {
  cmdbCategories: async (root, args, { req }) => {
    const User = await checkResolver(req, ['cmdb']);
    return models.CMDBCategory.findAll({
      order: [
        ['title', 'ASC'],
      ],
    });
  },
  cmdbCategory: async (root, { id }, { req }) => {
    const User = await checkResolver(req, ["cmdb"]);
    const Category = await models.CMDBCategory.findByPk(id);
    if (!Category) {
      throw createDoesNoExistsError('Category', id);
    }
    return Category;
  },
}

const mutations = {
  addCmdbCategory: async (root, args, { req }) => {
    const User = await checkResolver(req, ["cmdb"]);
    const NewCategory = await models.CMDBCategory.create(args);
    pubsub.publish(CMDB_CATEGORY_CHANGE, { cmdbCategoriesSubscription: true });
    return NewCategory;
  },
  updateCmdbCategory: async (root, { id, ...directArguments }, { req }) => {
    const User = await checkResolver(req, ["cmdb"]);
    const OriginalCategory = <CMDBCategoryInstance>await models.CMDBCategory.findByPk(id);
    if (!OriginalCategory) {
      throw createDoesNoExistsError('Category', id);
    };
    await OriginalCategory.update(directArguments);
    pubsub.publish(CMDB_CATEGORY_CHANGE, { cmdbCategoriesSubscription: true });
    return OriginalCategory.reload();
  },
  deleteCmdbCategory: async (root, { id, newId }, { req }) => {
    const User = await checkResolver(req, ["cmdb"]);
    const hasReplacement = !isNaN(parseInt(newId));
    const OriginalCategory = <CMDBCategoryInstance>await models.CMDBCategory.findByPk(id);
    if (!OriginalCategory) {
      throw createDoesNoExistsError('Category', id);
    }
    let ReplacementCategory = null;
    if (hasReplacement) {
      ReplacementCategory = <CMDBCategoryInstance>await models.CMDBCategory.findByPk(newId);
      if (!ReplacementCategory) {
        throw createDoesNoExistsError('Replacement category', newId);
      }
    }

    if (hasReplacement) {
      const OriginalItems = <CMDBItemInstance[]>await OriginalCategory.getCMDBItems();
      await Promise.all(OriginalItems.map((OriginalItem) => OriginalItem.update({ CMDBCategoryId: newId })))
    }
    await OriginalCategory.destroy();
    pubsub.publish(CMDB_CATEGORY_CHANGE, { cmdbCategoriesSubscription: true });
    return OriginalCategory;
  },
}

const attributes = {
};

const subscriptions = {
  cmdbCategoriesSubscription: {
    subscribe: withFilter(
      () => pubsub.asyncIterator(CMDB_CATEGORY_CHANGE),
      async ({ cmdbCategoriesSubscription }) => {
        return cmdbCategoriesSubscription;
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
