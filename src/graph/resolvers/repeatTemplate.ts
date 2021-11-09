import {
  getModelAttribute,
} from '@/helperFunctions';

const queries = {
}

const mutations = {
}

const attributes = {
  RepeatTemplate: {
    async assignedTo(repeatTemplate) {
      return getModelAttribute(repeatTemplate, 'assignedTos');
    },
    async company(repeatTemplate) {
      return getModelAttribute(repeatTemplate, 'Company');
    },
    async createdBy(repeatTemplate) {
      return getModelAttribute(repeatTemplate, 'createdBy');
    },
    async milestone(repeatTemplate) {
      return getModelAttribute(repeatTemplate, 'Milestone');
    },
    async project(repeatTemplate) {
      return getModelAttribute(repeatTemplate, 'Project');
    },
    async requester(repeatTemplate) {
      return getModelAttribute(repeatTemplate, 'requester');
    },
    async status(repeatTemplate) {
      return getModelAttribute(repeatTemplate, 'Status');
    },
    async tags(repeatTemplate) {
      return getModelAttribute(repeatTemplate, 'Tags');
    },
    async taskType(repeatTemplate) {
      return getModelAttribute(repeatTemplate, 'TaskType');
    },
    async shortSubtasks(repeatTemplate) {
      return getModelAttribute(repeatTemplate, 'ShortSubtasks');
    },
    async subtasks(repeatTemplate) {
      return getModelAttribute(repeatTemplate, 'Subtasks');
    },
    async workTrips(repeatTemplate) {
      return getModelAttribute(repeatTemplate, 'WorkTrips');
    },
    async materials(repeatTemplate) {
      return getModelAttribute(repeatTemplate, 'Materials');
    },
    async repeatTemplateAttachments(repeatTemplate) {
      return getModelAttribute(repeatTemplate, 'RepeatTemplateAttachments');
    },
  }
};

export default {
  attributes,
  mutations,
  queries,
}
