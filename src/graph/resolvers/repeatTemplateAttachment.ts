import { createDoesNoExistsError } from '@/configs/errors';
import { models } from '@/models';
import { RepeatTemplateInstance } from '@/models/instances';
import checkResolver from './checkResolver';
import {
  checkIfHasProjectRights,
  getModelAttribute,
} from '@/helperFunctions';
import fs from 'fs';
const querries = {
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
      User.get('id'),
      undefined,
      (<RepeatTemplateInstance>RepeatTemplateAttachment.get('RepeatTemplate')).get('ProjectId'),
      ['taskAttachmentsWrite', 'repeatWrite']
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
  querries
}
