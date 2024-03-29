import { createDoesNoExistsError, NoAccessToThisProjectError } from '@/configs/errors';
import { models } from '@/models';
import {
  ProjectInstance,
  MilestoneInstance,
} from '@/models/instances';
import { extractDatesFromObject, getModelAttribute } from '@/helperFunctions';
import {
  checkIfHasProjectRights,
} from '@/graph/addons/project';
import checkResolver from './checkResolver';
import { MILESTONE_CHANGE } from '@/configs/subscriptions';
import { pubsub } from './index';
const { withFilter } = require('apollo-server-express');

const queries = {
  milestone: async (root, { id }, { req }) => {
    const User = await checkResolver(req);
    const Milestone = await models.Milestone.findByPk(id);
    if (Milestone === null) {
      return null;
    }
    await checkIfHasProjectRights(User, undefined, Milestone.get('ProjectId'), []);
    return Milestone;
  },
}

const mutations = {
  addMilestone: async (root, { projectId, ...args }, { req }) => {
    const User = await checkResolver(req);
    const dates = extractDatesFromObject(args, ['startsAt', 'endsAt']);

    await checkIfHasProjectRights(User, undefined, projectId, []);
    const NewMilestone = <MilestoneInstance>await models.Milestone.create({ ...args, ...dates, ProjectId: projectId });
    pubsub.publish(MILESTONE_CHANGE, { milestonesSubscription: true });
    return NewMilestone;
  },

  updateMilestone: async (root, { id, ...args }, { req }) => {
    const User = await checkResolver(req);
    const Milestone = await models.Milestone.findByPk(id);
    if (Milestone === null) {
      throw createDoesNoExistsError('Milestone', id);
    }
    const dates = extractDatesFromObject(args, ['startsAt', 'endsAt']);

    await checkIfHasProjectRights(User, undefined, Milestone.get('ProjectId'), []);

    await Milestone.update({ ...args, ...dates });
    pubsub.publish(MILESTONE_CHANGE, { milestonesSubscription: true });
    return Milestone;
  },

  deleteMilestone: async (root, { id }, { req }) => {
    const User = await checkResolver(req);
    const Milestone = await models.Milestone.findByPk(id, { include: [models.Project] });
    if (Milestone === null) {
      throw createDoesNoExistsError('Milestone', id);
    }
    await checkIfHasProjectRights(User, undefined, Milestone.get('ProjectId'), []);
    await models.Task.update({ pendingChangable: true }, { where: { pendingChangable: false, MilestoneId: id } });
    await Milestone.destroy();
    pubsub.publish(MILESTONE_CHANGE, { milestonesSubscription: true });
    return Milestone;
  },
}

const attributes = {
  Milestone: {
    async project(milestone) {
      return getModelAttribute(milestone, 'Project');
    },
    async tasks(milestone) {
      return getModelAttribute(milestone, 'Tasks');
    },
  },
};

const subscriptions = {
  milestonesSubscription: {
    subscribe: withFilter(
      () => pubsub.asyncIterator(MILESTONE_CHANGE),
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
  subscriptions,
}
