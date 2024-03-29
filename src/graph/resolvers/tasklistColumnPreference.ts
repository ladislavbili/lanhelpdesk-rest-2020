import { createDoesNoExistsError } from '@/configs/errors';
import { models } from '@/models';
import {
  TasklistColumnPreferenceInstance,
  RoleInstance,
  AccessRightsInstance,
} from '@/models/instances';
import checkResolver from './checkResolver';
import { getModelAttribute } from '@/helperFunctions';


const queries = {
  tasklistColumnPreference: async (root, { projectId }, { req }) => {
    const User = await checkResolver(req);
    const rights = <AccessRightsInstance>(<RoleInstance>User.get('Role')).get('AccessRight');
    if (!rights.tasklistPreferences) {
      return null;
    }
    return models.TasklistColumnPreference.findOne({ where: { ProjectId: projectId ? projectId : null, UserId: User.get('id') } });
  }
}

const mutations = {
  addOrUpdateTasklistColumnPreference: async (root, { projectId, ...attributes }, { req }) => {
    const User = await checkResolver(req);
    const rights = <AccessRightsInstance>(<RoleInstance>User.get('Role')).get('AccessRight');
    if (!rights.tasklistPreferences) {
      return null;
    }
    const Preference = await models.TasklistColumnPreference.findOne({ where: { ProjectId: projectId ? projectId : null, UserId: User.get('id') } });
    if (Preference) {
      return Preference.update(attributes);
    } else {
      return models.TasklistColumnPreference.create({ ...attributes, ProjectId: projectId, UserId: User.get('id') })
    }
  }
}

const attributes = {
  TasklistColumnPreference: {
    async Project(TasklistColumnPreference) {
      return getModelAttribute(TasklistColumnPreference, 'Project');
    },
  },
};

export default {
  attributes,
  mutations,
  queries
}
