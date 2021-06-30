import { createDoesNoExistsError } from '@/configs/errors';
import { models } from '@/models';
import { ProjectInstance, TaskInstance, StatusInstance } from '@/models/instances';
import checkResolver from './checkResolver';
import { STATUS_TEMPLATE_CHANGE } from '@/configs/subscriptions';
import { pubsub } from './index';
const { withFilter } = require('apollo-server-express');

const queries = {
  statusTemplates: async (root, args, { req }) => {
    await checkResolver(req);
    return models.Status.findAll({
      order: [
        ['order', 'ASC'],
        ['title', 'ASC'],
      ],
      where: {
        template: true
      }
    })
  },
  statusTemplate: async (root, { id }, { req }) => {
    await checkResolver(req, ["statuses"]);
    return models.Status.findByPk(id);
  },

  statuses: async (root, { projectId }, { req }) => {
    await checkResolver(req);
    return models.Status.findAll({
      order: [
        ['order', 'ASC'],
        ['title', 'ASC'],
      ],
      where: {
        projectStatusId: projectId
      }
    })
  },
}

const mutations = {
  addStatusTemplate: async (root, args, { req }) => {
    await checkResolver(req, ["statuses"]);
    const NewStatus = await models.Status.create({ ...args, template: true });
    pubsub.publish(STATUS_TEMPLATE_CHANGE, { statusTemplateSubscription: true });
    return NewStatus;
  },

  updateStatusTemplate: async (root, { id, ...args }, { req }) => {
    await checkResolver(req, ["statuses"]);
    const Status = await models.Status.findByPk(id);
    if (Status === null) {
      throw createDoesNoExistsError('Status', id);
    }
    const UpdatedStatus = await Status.update(args);
    pubsub.publish(STATUS_TEMPLATE_CHANGE, { statusTemplateSubscription: true });
    return UpdatedStatus;
  },

  deleteStatusTemplate: async (root, { id }, { req }) => {
    await checkResolver(req, ["statuses"]);
    const OldStatus = <StatusInstance>await models.Status.findByPk(id);
    if (OldStatus === null) {
      throw createDoesNoExistsError('Status', id);
    }
    await OldStatus.destroy();
    pubsub.publish(STATUS_TEMPLATE_CHANGE, { statusTemplateSubscription: true });
    return OldStatus;
  },
}

const attributes = {
};

const subscriptions = {
  statusTemplateSubscription: {
    subscribe: withFilter(
      () => pubsub.asyncIterator(STATUS_TEMPLATE_CHANGE),
      async (data, args, { userID }) => {
        return true;
      }
    ),
  }
}

export default {
  attributes,
  mutations,
  queries,
  subscriptions
}
