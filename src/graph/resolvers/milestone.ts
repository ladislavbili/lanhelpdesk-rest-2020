import { createDoesNoExistsError, NoAccessToThisProjectError } from '@/configs/errors';
import { models } from '@/models';
import { ProjectInstance, ProjectRightInstance } from '@/models/instances';
import { extractDatesFromObject, getModelAttribute, checkIfHasProjectRights } from '@/helperFunctions';
import checkResolver from './checkResolver';

const querries = {
  milestone: async (root, { id }, { req }) => {
    const User = await checkResolver(req);
    const Milestone = await models.Milestone.findByPk(id);
    if (Milestone === null) {
      return null;
    }
    await checkIfHasProjectRights(User.get('id'), undefined, Milestone.get('ProjectId'), ['milestoneRead']);
    return Milestone;
  },
}

const mutations = {
  addMilestone: async (root, { projectId, ...args }, { req }) => {
    const User = await checkResolver(req);
    const dates = extractDatesFromObject(args, ['startsAt', 'endsAt']);

    await checkIfHasProjectRights(User.get('id'), undefined, projectId, ['milestoneWrite']);
    return models.Milestone.create({ ...args, ...dates, ProjectId: projectId });
  },

  updateMilestone: async (root, { id, ...args }, { req }) => {
    const User = await checkResolver(req);
    const Milestone = await models.Milestone.findByPk(id);
    if (Milestone === null) {
      throw createDoesNoExistsError('Milestone', id);
    }
    const dates = extractDatesFromObject(args, ['startsAt', 'endsAt']);

    await checkIfHasProjectRights(User.get('id'), undefined, Milestone.get('ProjectId'), ['milestoneWrite']);

    return Milestone.update({ ...args, ...dates });
  },

  deleteMilestone: async (root, { id }, { req }) => {
    const User = await checkResolver(req);
    const Milestone = await models.Milestone.findByPk(id, { include: [{ model: models.Project, include: [{ model: models.ProjectRight }] }] });
    if (Milestone === null) {
      throw createDoesNoExistsError('Milestone', id);
    }
    await checkIfHasProjectRights(User.get('id'), undefined, Milestone.get('ProjectId'), ['milestoneWrite']);
    await models.Task.update({ pendingChangable: true }, { where: { pendingChangable: false, MilestoneId: id } });
    return Milestone.destroy();
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

export default {
  attributes,
  mutations,
  querries
}
