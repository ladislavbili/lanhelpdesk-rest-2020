import { createDoesNoExistsError } from '@/configs/errors';
import { models } from '@/models';
import {
} from '@/models/instances';
import checkResolver from './checkResolver';
import {
  getModelAttribute,
} from '@/helperFunctions';
import {
  checkIfHasProjectRights,
} from '@/graph/addons/project';
import fs from 'fs';
const queries = {
}

const mutations = {
  deleteProjectAttachment: async (root, { id }, { req }) => {
    const User = await checkResolver(req);
    const ProjectAttachment = await models.ProjectAttachment.findByPk(id);
    if (ProjectAttachment === null) {
      throw createDoesNoExistsError('Project attachment', id);
    }
    await checkIfHasProjectRights(User, undefined, ProjectAttachment.get('ProjectId'), ['projectWrite']);
    try {
      fs.unlinkSync(<string>ProjectAttachment.get('path'));
    } catch (err) {
    }
    return ProjectAttachment.destroy();
  },
}

const attributes = {
  ProjectAttachment: {
    async project(projectAttachment) {
      return getModelAttribute(projectAttachment, 'Project');
    }
  },
};

export default {
  attributes,
  mutations,
  queries
}
