import { createDoesNoExistsError } from '@/configs/errors';
import { models } from '@/models';
import { RepeatTemplateInstance } from '@/models/instances';
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
  deleteRepeatTemplateAttachment: async (root, { id }, { req }) => {
    const User = await checkResolver(req);
    const RepeatTemplateAttachment = await models.RepeatTemplateAttachment.findByPk(id, {
      include: [models.RepeatTemplate]
    });
    if (RepeatTemplateAttachment === null) {
      throw createDoesNoExistsError('Repeat template attachment', id);
    }
    await checkIfHasProjectRights(
      User,
      undefined,
      (<RepeatTemplateInstance>RepeatTemplateAttachment.get('RepeatTemplate')).get('ProjectId'),
      ['taskAttachmentsWrite'],
      [{ right: 'repeat', action: 'edit' }]
    );
    try {
      fs.unlinkSync(<string>RepeatTemplateAttachment.get('path'));
    } catch (err) {
    }
    return RepeatTemplateAttachment.destroy();
  },
}

const attributes = {
  RepeatTemplateAttachment: {
    async repeatTemplate(repeatTemplateAttachment) {
      return getModelAttribute(repeatTemplateAttachment, 'RepeatTemplate');
    }
  },
};

export default {
  attributes,
  mutations,
  queries
}
