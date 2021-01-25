import { createDoesNoExistsError } from '@/configs/errors';
import { models } from '@/models';
import { ProjectInstance } from '@/models/instances';
import checkResolver from './checkResolver';
import {
  checkIfHasProjectRightsOld,
  getModelAttribute,
} from '@/helperFunctions';
import fs from 'fs';
const querries = {
}

const mutations = {
  deleteTaskAttachment: async (root, { id }, { req }) => {
    const User = await checkResolver(req);
    const TaskAttachment = await models.TaskAttachment.findByPk(id);
    if (TaskAttachment === null) {
      throw createDoesNoExistsError('Task attachment', id);
    }
    await checkIfHasProjectRightsOld(User.get('id'), TaskAttachment.get('TaskId'), 'write');
    try {
      fs.unlinkSync(<string>TaskAttachment.get('path'));
    } catch (err) {
    }
    return TaskAttachment.destroy();
  },
}

const attributes = {
  TaskAttachment: {
    async task(taskAttachment) {
      return getModelAttribute(taskAttachment, 'Task');
    }
  },
};

export default {
  attributes,
  mutations,
  querries
}
