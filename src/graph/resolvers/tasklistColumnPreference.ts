import { createDoesNoExistsError } from '@/configs/errors';
import { models } from '@/models';
import { TasklistColumnPreferenceInstance } from '@/models/instances';
import checkResolver from './checkResolver';
import { getModelAttribute } from '@/helperFunctions';


const querries = {
  tasklistColumnPreference: async (root, { projectId }, { req }) => {
    const User = await checkResolver(req);
    return models.TasklistColumnPreference.findOne({ where: { ProjectId: projectId ? projectId : null, UserId: User.get('id') } });
  }
}

const mutations = {
  addOrUpdateTasklistColumnPerference: async (root, { projectId, ...attributes }, { req }) => {
    const User = await checkResolver(req);
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
  querries
}
