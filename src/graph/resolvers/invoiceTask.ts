import {
  getModelAttribute,
} from '@/helperFunctions';
import checkResolver from './checkResolver';

const queries = {
}

const mutations = {
}

const attributes = {
  InvoiceTask: {
    async rights(task) {
      if (!task.rights) {
        return null;
      }
      return task.rights.project;
    },
    async attributeRights(task) {
      if (!task.rights) {
        return null;
      }
      return task.rights.attributes;
    },
    async assignedTo(task) {
      if (!task.rights || (
        !task.rights.attributes.assigned.view &&
        !task.rights.project.taskWorksRead &&
        !task.rights.project.taskWorksAdvancedRead
      )) {
        return [];
      }
      return getModelAttribute(task, 'assignedTos');
    },
    async company(task) {
      if (!task.rights || !task.rights.attributes.company.view) {
        return null;
      }
      return getModelAttribute(task, 'Company');
    },
    async createdBy(task) {
      return getModelAttribute(task, 'createdBy');
    },
    async milestone(task) {
      return getModelAttribute(task, 'Milestone');
    },
    async project(task) {
      return getModelAttribute(task, 'Project');
    },
    async requester(task) {
      if (!task.rights || !task.rights.attributes.requester.view) {
        return null;
      }
      return getModelAttribute(task, 'requester');
    },
    async status(task) {
      if (!task.rights || !task.rights.attributes.status.view) {
        return null;
      }
      return getModelAttribute(task, 'Status');
    },
    async tags(task) {
      if (!task.rights || !task.rights.attributes.tags.view) {
        return [];
      }
      return getModelAttribute(task, 'Tags');
    },
    async taskType(task) {
      if (!task.rights || (
        !task.rights.attributes.taskType.view &&
        !task.rights.project.taskWorksRead &&
        !task.rights.project.taskWorksAdvancedRead
      )) {
        return null;
      }
      return getModelAttribute(task, 'TaskType');
    },
    async repeat(task) {
      if (!task.rights || !task.rights.attributes.repeat.view) {
        return null;
      }
      return getModelAttribute(task, 'Repeat');
    },
    async repeatTime(task) {
      if (!task.rights || !task.rights.attributes.repeat.view) {
        return null;
      }
      return getModelAttribute(task, 'RepeatTime');
    },
    async metadata(task) {
      return getModelAttribute(task, 'TaskMetadata');
    },

    async comments(task, body, { req, userID }) {
      if (!task.rights || !task.rights.project.viewComments) {
        return [];
      }
      const [
        SourceUser,
        Comments,

      ] = await Promise.all([
        checkResolver(req),
        getModelAttribute(task, 'Comments', 'getComments', { order: [['createdAt', 'DESC']] })
      ])
      return Comments.filter((Comment) => Comment.get('isParent') && (!Comment.get('internal') || task.rights.project.internal))
    },

    async shortSubtasks(task) {
      if (!task.rights || !task.rights.project.taskSubtasksRead) {
        return [];
      }
      return getModelAttribute(task, 'ShortSubtasks');
    },
    async subtasks(task) {
      if (!task.rights || (!task.rights.project.taskWorksRead && !task.rights.project.taskWorksAdvancedRead)) {
        return [];
      }
      return getModelAttribute(task, 'Subtasks');
    },
    async workTrips(task) {
      if (!task.rights || (!task.rights.project.taskWorksRead && !task.rights.project.taskWorksAdvancedRead)) {
        return [];
      }
      return getModelAttribute(task, 'WorkTrips');
    },
    async materials(task) {
      if (!task.rights || !task.rights.project.taskMaterialsRead) {
        return [];
      }
      return getModelAttribute(task, 'Materials');
    },
    async taskChanges(task) {
      if (!task.rights || !task.rights.project.history) {
        return [];
      }
      return getModelAttribute(task, 'TaskChanges', 'getTaskChanges', { order: [['createdAt', 'DESC']] });
    },
    async taskAttachments(task) {
      if (!task.rights || !task.rights.project.taskAttachmentsRead) {
        return [];
      }
      return getModelAttribute(task, 'TaskAttachments');
    },
  },
  InvoiceSubtask: {
    async task(subtask) {
      return getModelAttribute(subtask, 'Task');
    },
    async approvedBy(subtask) {
      return getModelAttribute(subtask, 'SubtaskApprovedBy');
    },
    async repeatTemplate(subtask) {
      return getModelAttribute(subtask, 'RepeatTemplate');
    },
    async type(subtask) {
      return null;
    },
    async assignedTo(subtask) {
      return getModelAttribute(subtask, 'User');
    },
    async scheduled(subtask) {
      return getModelAttribute(subtask, 'ScheduledWork');
    },
  },
  InvoiceWorkTrip: {
    async task(workTrip) {
      return getModelAttribute(workTrip, 'Task');
    },
    async approvedBy(worktrip) {
      return getModelAttribute(worktrip, 'TripApprovedBy');
    },
    async repeatTemplate(workTrip) {
      return getModelAttribute(workTrip, 'RepeatTemplate');
    },
    async type(workTrip) {
      return getModelAttribute(workTrip, 'TripType');
    },
    async assignedTo(workTrip) {
      return getModelAttribute(workTrip, 'User');
    },
    async scheduled(workTrip) {
      return getModelAttribute(workTrip, 'ScheduledWork');
    },
  },
  InvoiceMaterial: {
    async task(material) {
      return getModelAttribute(material, 'Task');
    },
    async approvedBy(material) {
      return getModelAttribute(material, 'MaterialApprovedBy');
    },
    async repeatTemplate(material) {
      return getModelAttribute(material, 'RepeatTemplate');
    },
  },

};

export default {
  attributes,
  mutations,
  queries,
}
