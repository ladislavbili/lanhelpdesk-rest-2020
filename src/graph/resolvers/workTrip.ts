import { createDoesNoExistsError, WorkTripNotNullAttributesPresent, AssignedToUserNotSolvingTheTask } from '@/configs/errors';
import { models, sequelize } from '@/models';
import {
  TaskInstance,
  UserInstance,
  WorkTripInstance,
  TripTypeInstance,
  RepeatTemplateInstance,
  TaskMetadataInstance,
  ProjectInstance,
  ScheduledWorkInstance,
} from '@/models/instances';
import {
  multipleIdDoesExistsCheck,
  idDoesExistsCheck,
  getModelAttribute,
  extractDatesFromObject,
} from '@/helperFunctions';
import {
  checkIfHasProjectRights,
} from '@/graph/addons/project';
import { pubsub } from './index';
import { TASK_HISTORY_CHANGE } from '@/configs/subscriptions';
import checkResolver from './checkResolver';
const scheduledDates = ['from', 'to'];

const queries = {
  workTrips: async (root, { taskId }, { req }) => {
    const SourceUser = await checkResolver(req);
    await checkIfHasProjectRights(SourceUser, taskId, undefined, ['taskWorksRead']);
    return models.WorkTrip.findAll({
      order: [
        ['order', 'ASC'],
        ['title', 'ASC'],
      ],
      where: {
        TaskId: taskId
      },
      include: [models.ScheduledWork],
    })
  },
}

const mutations = {
  addWorkTrip: async (root, { task, type, assignedTo, scheduled, ...params }, { req }) => {
    const SourceUser = await checkResolver(req);
    const { Task } = await checkIfHasProjectRights(SourceUser, task, undefined, ['taskWorksWrite']);
    const [
      AssignedTos,
      TaskMetadata,
      Project,
    ] = await Promise.all([
      Task.getAssignedTos(),
      Task.getTaskMetadata(),
      Task.getProject()
    ])
    if (!(<UserInstance[]>AssignedTos).some((AssignedTo) => AssignedTo.get('id') === assignedTo)) {
      throw AssignedToUserNotSolvingTheTask;
    }
    await idDoesExistsCheck(type, models.TripType);
    await (<TaskInstance>Task).createTaskChange(
      {
        UserId: SourceUser.get('id'),
        TaskChangeMessages: [{
          type: 'workTrip',
          originalValue: null,
          newValue: `${params.done},${params.quantity},${params.discount},${type},${assignedTo}`,
          message: `Work trip was added.`,
        }],
      },
      { include: [models.TaskChangeMessage] }
    );
    pubsub.publish(TASK_HISTORY_CHANGE, { taskHistorySubscription: task });

    if (params.approved) {
      params = {
        ...params,
        TripApprovedById: SourceUser.get('id'),
      }
    }
    if (params.approved || (<ProjectInstance>Project).get('autoApproved')) {
      (<TaskMetadataInstance>TaskMetadata).update({
        tripsApproved: parseFloat(<any>(<TaskMetadataInstance>TaskMetadata).get('tripsApproved')) + parseFloat(<any>params.quantity),
      })
    } else {
      (<TaskMetadataInstance>TaskMetadata).update({
        tripsPending: parseFloat(<any>(<TaskMetadataInstance>TaskMetadata).get('tripsPending')) + parseFloat(<any>params.quantity),
      })
    }
    if (scheduled) {
      return models.WorkTrip.create({
        TaskId: task,
        TripTypeId: type,
        UserId: assignedTo,
        ...params,
        ScheduledWork: extractDatesFromObject(scheduled, scheduledDates),
      }, {
          include: [models.ScheduledWork]
        });
    } else {
      return models.WorkTrip.create({
        TaskId: task,
        TripTypeId: type,
        UserId: assignedTo,
        ...params,
      });
    }
  },

  updateWorkTrip: async (root, { id, type, assignedTo, scheduled, ...params }, { req }) => {
    const SourceUser = await checkResolver(req);
    const WorkTrip = <WorkTripInstance>await models.WorkTrip.findByPk(id, {
      include: [
        models.TripType,
        models.ScheduledWork,
        {
          model: models.Task,
          include: [
            models.Project,
            {
              model: models.TaskMetadata,
              as: 'TaskMetadata'
            },
            {
              model: models.User,
              as: 'assignedTos'
            }
          ]
        }
      ]
    });
    if (WorkTrip === null) {
      throw createDoesNoExistsError('WorkTrip', id);
    }
    const Task = <TaskInstance>WorkTrip.get('Task');
    const Project = <ProjectInstance>Task.get('Project');
    const AssignedTos = <UserInstance[]>Task.get('assignedTos');
    const TaskMetadata = <TaskMetadataInstance>Task.get('TaskMetadata');
    const originalValue = `${WorkTrip.get('done').toString()},${WorkTrip.get('quantity')},${WorkTrip.get('discount')},${(<TripTypeInstance>WorkTrip.get('TripType')).get('id')},${WorkTrip.get('UserId')}`;
    let TaskChangeMessages = [
      {
        type: 'workTrip',
        originalValue,
        newValue: `${params.done},${params.quantity},${params.discount},${type},${assignedTo}`,
        message: `Work trip ${(<TripTypeInstance>WorkTrip.get('TripType')).get('title')} was updated.`,
      }
    ];
    await checkIfHasProjectRights(SourceUser, undefined, Task.get('ProjectId'), ['taskWorksWrite']);
    if (assignedTo !== undefined) {
      if (WorkTrip.get('UserId') !== assignedTo && !AssignedTos.some((AssignedTo) => AssignedTo.get('id') === assignedTo)) {
        throw AssignedToUserNotSolvingTheTask;
      }
    }
    if (type === null || assignedTo === null) {
      throw WorkTripNotNullAttributesPresent;
    }
    let pairs = [];
    if (type !== undefined) {
      pairs.push({ id: type, model: models.TripType })
    }
    if (assignedTo !== undefined) {
      pairs.push({ id: assignedTo, model: models.User })
    }
    await multipleIdDoesExistsCheck(pairs);
    await sequelize.transaction(async (t) => {
      let promises = [];
      if (type !== undefined) {
        await idDoesExistsCheck(type, models.TripType);
        promises.push(WorkTrip.setTripType(type, { transaction: t }));
      }
      if (assignedTo !== undefined) {
        promises.push(WorkTrip.setUser(assignedTo, { transaction: t }));
      }
      if (params.approved === false && WorkTrip.get('approved') === true) {
        params = {
          ...params,
          TripApprovedById: null,
        }
        TaskChangeMessages.push({
          type: 'workTrip',
          originalValue: `${!params.approved}`,
          newValue: `${params.approved}`,
          message: `Work trip ${(<TripTypeInstance>WorkTrip.get('TripType')).get('title')} was set as not approved by ${SourceUser.get('fullName')}(${SourceUser.get('email')}).`,
        })
      } else if (params.approved === true && WorkTrip.get('approved') === false) {
        params = {
          ...params,
          TripApprovedById: SourceUser.get('id')
        }
        TaskChangeMessages.push({
          type: 'workTrip',
          originalValue: `${!params.approved}`,
          newValue: `${params.approved}`,
          message: `Work trip ${(<TripTypeInstance>WorkTrip.get('TripType')).get('title')} was set as approved by ${SourceUser.get('fullName')}(${SourceUser.get('email')}).`,
        })
      }
      //Metadata update
      if ((params.approved !== undefined && params.approved !== null) || params.quantity) {
        const metaQuantity = parseFloat(<any>(params.quantity ? params.quantity : WorkTrip.get('quantity')));
        let tripsApproved = parseFloat(<any>TaskMetadata.get('tripsApproved'));
        let tripsPending = parseFloat(<any>TaskMetadata.get('tripsPending'));
        //Delete first
        if (Project.get('autoApproved') || WorkTrip.get('approved')) {
          tripsApproved -= metaQuantity;
        } else {
          tripsPending -= metaQuantity;
        }
        //Add new
        if (Project.get('autoApproved') || params.approved === true || (params.approved !== false && WorkTrip.get('approved'))) {
          tripsApproved += metaQuantity;
        } else {
          tripsPending += metaQuantity;
        }
        //Update
        TaskMetadata.update({
          tripsApproved,
          tripsPending
        }, { transaction: t })
      }
      //scheduled
      const ScheduledWork = <ScheduledWorkInstance>WorkTrip.get('ScheduledWork');
      if (scheduled === null && ScheduledWork) {
        promises.push(ScheduledWork.destroy({ transaction: t }));
      } else if (scheduled) {
        if (ScheduledWork) {
          promises.push(ScheduledWork.update(extractDatesFromObject(scheduled, scheduledDates), { transaction: t }));
        } else {
          promises.push(WorkTrip.createScheduledWork(extractDatesFromObject(scheduled, scheduledDates), { transaction: t }));
        }
      }
      promises.push(WorkTrip.update(params, { transaction: t }));
      await Promise.all(promises);
    });
    await (<TaskInstance>Task).createTaskChange(
      {
        UserId: SourceUser.get('id'),
        TaskChangeMessages,
      },
      { include: [models.TaskChangeMessage] }
    );
    pubsub.publish(TASK_HISTORY_CHANGE, { taskHistorySubscription: WorkTrip.get('TaskId') });
    return WorkTrip.reload();
  },

  deleteWorkTrip: async (root, { id }, { req }) => {
    const SourceUser = await checkResolver(req);
    const WorkTrip = await models.WorkTrip.findByPk(id, {
      include: [
        models.TripType,
        {
          model: models.Task,
          include: [
            models.Project,
            {
              model: models.TaskMetadata,
              as: 'TaskMetadata'
            },
          ]
        }
      ]
    });
    if (WorkTrip === null) {
      throw createDoesNoExistsError('WorkTrip', id);
    }
    const Task = <TaskInstance>WorkTrip.get('Task');
    const Project = <ProjectInstance>Task.get('Project');
    const TaskMetadata = <TaskMetadataInstance>Task.get('TaskMetadata');

    await checkIfHasProjectRights(SourceUser, undefined, Project.get('id'), ['taskWorksWrite']);
    const originalValue = `${WorkTrip.get('done').toString()},${WorkTrip.get('quantity')},${WorkTrip.get('discount')},${(<TripTypeInstance>WorkTrip.get('TripType')).get('id')},${WorkTrip.get('UserId')}`;
    await (<TaskInstance>Task).createTaskChange(
      {
        UserId: SourceUser.get('id'),
        TaskChangeMessages: [{
          type: 'workTrip',
          originalValue,
          newValue: null,
          message: `Work trip ${(<TripTypeInstance>WorkTrip.get('TripType')).get('title')} was deleted.`,
        }],
      },
      { include: [models.TaskChangeMessage] }
    );
    pubsub.publish(TASK_HISTORY_CHANGE, { taskHistorySubscription: WorkTrip.get('TaskId') });
    if (Project.get('autoApproved') || WorkTrip.get('approved')) {
      TaskMetadata.update({
        tripsApproved: TaskMetadata.get('tripsApproved') - (<number>WorkTrip.get('quantity'))
      })
    } else {
      TaskMetadata.update({
        tripsPending: TaskMetadata.get('tripsPending') - (<number>WorkTrip.get('quantity'))
      })
    }
    return WorkTrip.destroy();
  },

  addRepeatTemplateWorkTrip: async (root, { repeatTemplate, type, assignedTo, scheduled, ...params }, { req }) => {
    const SourceUser = await checkResolver(req);
    const RepeatTemplate = <RepeatTemplateInstance>await models.RepeatTemplate.findByPk(
      repeatTemplate,
      { include: [{ model: models.User, as: 'assignedTos' }] }
    );
    if (RepeatTemplate === null) {
      throw createDoesNoExistsError('Repeat template', repeatTemplate);
    }
    await checkIfHasProjectRights(SourceUser, undefined, RepeatTemplate.get('ProjectId'), ['taskWorksWrite'], [{ right: 'repeat', action: 'edit' }]);
    const AssignedTos = <UserInstance[]>RepeatTemplate.get('assignedTos');
    if (!AssignedTos.some((AssignedTo) => AssignedTo.get('id') === assignedTo)) {
      throw AssignedToUserNotSolvingTheTask;
    }
    await idDoesExistsCheck(type, models.TripType);
    if (params.approved) {
      params = {
        ...params,
        TripApprovedById: SourceUser.get('id'),
      }
    }

    if (scheduled) {
      return models.WorkTrip.create({
        RepeatTemplateId: repeatTemplate,
        TripTypeId: type,
        UserId: assignedTo,
        ...params,
        ScheduledWork: extractDatesFromObject(scheduled, scheduledDates),
      }, {
          include: [models.ScheduledWork]
        });
    } else {
      return models.WorkTrip.create({
        RepeatTemplateId: repeatTemplate,
        TripTypeId: type,
        UserId: assignedTo,
        ...params,
      });
    }
  },

  updateRepeatTemplateWorkTrip: async (root, { id, type, assignedTo, scheduled, ...params }, { req }) => {
    const SourceUser = await checkResolver(req);
    const WorkTrip = <WorkTripInstance>await models.WorkTrip.findByPk(
      id,
      {
        include: [
          models.TripType,
          models.ScheduledWork,
          {
            model: models.RepeatTemplate,
            include: [
              { model: models.User, as: 'assignedTos' }
            ]
          }
        ],
      }
    );
    if (WorkTrip === null) {
      throw createDoesNoExistsError('WorkTrip', id);
    }
    await checkIfHasProjectRights(SourceUser, undefined, (<RepeatTemplateInstance>WorkTrip.get('RepeatTemplate')).get('ProjectId'), ['taskWorksWrite'], [{ right: 'repeat', action: 'edit' }]);
    if (assignedTo !== undefined) {
      const AssignedTos = <UserInstance[]>(<RepeatTemplateInstance>WorkTrip.get('RepeatTemplate')).get('assignedTos');
      if (WorkTrip.get('UserId') !== assignedTo && !AssignedTos.some((AssignedTo) => AssignedTo.get('id') === assignedTo)) {
        throw AssignedToUserNotSolvingTheTask;
      }
    }
    if (type === null || assignedTo === null) {
      throw WorkTripNotNullAttributesPresent;
    }
    let pairs = [];
    if (type !== undefined) {
      pairs.push({ id: type, model: models.TripType })
    }
    if (assignedTo !== undefined) {
      pairs.push({ id: assignedTo, model: models.User })
    }
    await multipleIdDoesExistsCheck(pairs);
    await sequelize.transaction(async (t) => {
      let promises = [];
      if (type !== undefined) {
        await idDoesExistsCheck(type, models.TripType);
        promises.push(WorkTrip.setTripType(type, { transaction: t }));
      }
      if (assignedTo !== undefined) {
        promises.push(WorkTrip.setUser(assignedTo, { transaction: t }));
      }
      if (params.approved === false && WorkTrip.get('approved') === true) {
        params = {
          ...params,
          TripApprovedById: null,
        }
      } else if (params.approved === true && WorkTrip.get('approved') === false) {
        params = {
          ...params,
          TripApprovedById: SourceUser.get('id')
        }
      }
      //scheduled
      const ScheduledWork = <ScheduledWorkInstance>WorkTrip.get('ScheduledWork');
      if (scheduled === null && ScheduledWork) {
        promises.push(ScheduledWork.destroy({ transaction: t }));
      } else if (scheduled) {
        if (ScheduledWork) {
          promises.push(ScheduledWork.update(extractDatesFromObject(scheduled, scheduledDates), { transaction: t }));
        } else {
          promises.push(WorkTrip.createScheduledWork(extractDatesFromObject(scheduled, scheduledDates), { transaction: t }));
        }
      }
      promises.push(WorkTrip.update(params, { transaction: t }));
      await Promise.all(promises);
    });
    return WorkTrip.reload();
  },

  deleteRepeatTemplateWorkTrip: async (root, { id }, { req }) => {
    const SourceUser = await checkResolver(req);
    const WorkTrip = await models.WorkTrip.findByPk(id, { include: [models.TripType, models.RepeatTemplate] });
    if (WorkTrip === null) {
      throw createDoesNoExistsError('WorkTrip', id);
    }
    await checkIfHasProjectRights(SourceUser, undefined, (<RepeatTemplateInstance>WorkTrip.get('RepeatTemplate')).get('ProjectId'), ['taskWorksWrite'], [{ right: 'repeat', action: 'edit' }]);
    return WorkTrip.destroy();
  },

}

const attributes = {
  WorkTrip: {
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
  }
};

export default {
  attributes,
  mutations,
  queries
}
