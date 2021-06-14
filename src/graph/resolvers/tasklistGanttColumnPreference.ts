import { createDoesNoExistsError } from '@/configs/errors';
import { models } from '@/models';
import { TasklistGanttColumnPreferenceInstance } from '@/models/instances';
import checkResolver from './checkResolver';
import { getModelAttribute } from '@/helperFunctions';


const querries = {
  tasklistGanttColumnPreference: async (root, { projectId }, { req }) => {
    const User = await checkResolver(req);
    return models.TasklistGanttColumnPreference.findOne({ where: { ProjectId: projectId ? projectId : null, UserId: User.get('id') } });
  }
}

const mutations = {
  addOrUpdateTasklistGanttColumnPreference: async (root, { projectId, ...attributes }, { req }) => {
    const User = await checkResolver(req);
    const Preference = await models.TasklistGanttColumnPreference.findOne({ where: { ProjectId: projectId ? projectId : null, UserId: User.get('id') } });
    if (Preference) {
      return Preference.update(attributes);
    } else {
      return models.TasklistGanttColumnPreference.create({ ...attributes, ProjectId: projectId, UserId: User.get('id') })
    }
  }
}

const attributes = {
  TasklistGanttColumnPreference: {
    async Project(TasklistGanttColumnPreference) {
      return getModelAttribute(TasklistGanttColumnPreference, 'Project');
    },
  },
};

export default {
  attributes,
  mutations,
  querries
}
