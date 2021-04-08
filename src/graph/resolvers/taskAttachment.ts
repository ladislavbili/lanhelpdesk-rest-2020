import { createDoesNoExistsError } from '@/configs/errors';
import { models } from '@/models';
import { ProjectInstance, TaskInstance } from '@/models/instances';
import checkResolver from './checkResolver';
import {
  getModelAttribute,
} from '@/helperFunctions';
import {
  checkIfHasProjectRights,
} from '@/graph/addons/project';
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
    const { Task } = await checkIfHasProjectRights(User.get('id'), TaskAttachment.get('TaskId'), undefined, ['taskAttachmentsWrite']);
    try {
      fs.unlinkSync(<string>TaskAttachment.get('path'));
    } catch (err) {
    }
    (<TaskInstance>Task).createTaskChange(
      {
        UserId: User.get('id'),
        TaskChangeMessages: [{
          type: 'attachment',
          originalValue: null,
          newValue: null,
          message: `Attachment ${TaskAttachment.get('filename')} was deleted.`,
        }],
      },
      { include: [models.TaskChangeMessage] }
    )
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
