import {
  createDoesNoExistsError,
} from '@/configs/errors';
import { models } from '@/models';
import {
  LanwikiTagInstance,
} from '@/models/instances';
import checkResolver from './checkResolver';
import {
  isUserAdmin,
} from '@/helperFunctions';
import { pubsub } from './index';
const { withFilter } = require('apollo-server-express');
import {
  LANWIKI_TAG_CHANGE,
} from '@/configs/subscriptions';

const queries = {
  lanwikiTags: async (root, args, { req }) => {
    const User = await checkResolver(req, ['lanwiki']);
    return models.LanwikiTag.findAll({
      order: [
        ['order', 'ASC'],
        ['title', 'ASC'],
      ],
    });
  },
  lanwikiTag: async (root, { id }, { req }) => {
    const User = await checkResolver(req, ["lanwiki"]);
    const Tag = await models.LanwikiTag.findByPk(id);
    if (!Tag) {
      throw createDoesNoExistsError('Tag', id);
    }
    return Tag;
  },
}

const mutations = {
  addLanwikiTag: async (root, args, { req }) => {
    const User = await checkResolver(req, ["lanwiki"]);
    const LanwikiTag = <LanwikiTagInstance>await models.LanwikiTag.create(args);
    pubsub.publish(LANWIKI_TAG_CHANGE, { lanwikiTagSubscription: true });
    return LanwikiTag;
  },
  updateLanwikiTag: async (root, { id, ...args }, { req }) => {
    const User = await checkResolver(req, ["lanwiki"]);
    const OriginalTag = <LanwikiTagInstance>await models.LanwikiTag.findByPk(id);
    await OriginalTag.update(args);
    pubsub.publish(LANWIKI_TAG_CHANGE, { lanwikiTagSubscription: true });
    return OriginalTag.reload();
  },
  deleteLanwikiTag: async (root, { id }, { req }) => {
    const User = await checkResolver(req, ["lanwiki"]);
    const isAdmin = isUserAdmin(User);
    const OriginalTag = <LanwikiTagInstance>await models.LanwikiTag.findByPk(id);
    await OriginalTag.destroy();
    pubsub.publish(LANWIKI_TAG_CHANGE, { lanwikiTagSubscription: true });
    return OriginalTag;
  },
}

const attributes = {
};

const subscriptions = {
  lanwikiTagSubscription: {
    subscribe: withFilter(
      () => pubsub.asyncIterator(LANWIKI_TAG_CHANGE),
      async (data, args, { userID }) => {
        return true;
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
