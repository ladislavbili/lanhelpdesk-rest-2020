import {
  createDoesNoExistsError,
} from '@/configs/errors';

import {
  getModelAttribute,
  idsDoExistsCheck,
} from '@/helperFunctions';
import {
  checkIfHasProjectRights,
} from '@/graph/addons/project';
import {
  RoleInstance,
  ProjectGroupInstance,
} from '@/models/instances';
import checkResolver from './checkResolver';
import { models } from '@/models';
import { PROJECT_GROUP_CHANGE, PROJECT_CHANGE } from '@/configs/subscriptions';
import { pubsub } from './index';
const { withFilter } = require('apollo-server-express');


const queries = {
  projectGroups: async (root, { id }, { req }) => {
    const User = await checkResolver(req);
    if ((<RoleInstance>User.get('Role')).get('level') !== 0) {
      await checkIfHasProjectRights(User.get('id'), undefined, id, ['projectSecondary']);
    }
    return models.ProjectGroup.findAll({
      where: {
        ProjectId: id,
      }
    });
  },
}

const mutations = {
  addUserToProjectGroup: async (root, { id, userId }, { req }) => {
    const User = await checkResolver(req);
    const ProjectGroup = <ProjectGroupInstance>await models.ProjectGroup.findByPk(id);
    if (ProjectGroup === null) {
      throw createDoesNoExistsError('Project Group', id);
    }
    await idsDoExistsCheck([userId], models.User);
    await checkIfHasProjectRights(User.get('id'), undefined, ProjectGroup.get('ProjectId'), ['projectSecondary']);
    await ProjectGroup.addUser(userId);
    pubsub.publish(PROJECT_CHANGE, { projectsSubscription: true });
    pubsub.publish(PROJECT_GROUP_CHANGE, { projectGroupsSubscription: ProjectGroup.get('ProjectId') });
    return ProjectGroup.reload();
  },
}

const attributes = {
  ProjectGroup: {
    async users(projectGroup) {
      return getModelAttribute(projectGroup, 'Users');
    },
    async rights(projectGroup) {
      return getModelAttribute(projectGroup, 'ProjectGroupRight');
    },
    async project(projectGroup) {
      return getModelAttribute(projectGroup, 'Project');
    },
  },
};

const subscriptions = {
  projectGroupsSubscription: {
    subscribe: withFilter(
      () => pubsub.asyncIterator(PROJECT_GROUP_CHANGE),
      async ({ projectGroupsSubscription }, { projectId }, { userID }) => {
        return projectGroupsSubscription === projectId;
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
