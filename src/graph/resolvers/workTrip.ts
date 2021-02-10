import { createDoesNoExistsError, WorkTripNotNullAttributesPresent, AssignedToUserNotSolvingTheTask } from '@/configs/errors';
import { models, sequelize } from '@/models';
import { TaskInstance, UserInstance, WorkTripInstance, TripTypeInstance, RepeatTemplateInstance } from '@/models/instances';
import { multipleIdDoesExistsCheck, idDoesExistsCheck, checkIfHasProjectRights, getModelAttribute } from '@/helperFunctions';
import checkResolver from './checkResolver';

const querries = {
  workTrips: async (root, { taskId }, { req }) => {
    const SourceUser = await checkResolver(req);
    await checkIfHasProjectRights(SourceUser.get('id'), taskId, undefined, ['vykazRead']);
    return models.WorkTrip.findAll({
      order: [
        ['order', 'ASC'],
        ['title', 'ASC'],
      ],
      where: {
        TaskId: taskId
      }
    })
  },
}

const mutations = {
  addWorkTrip: async (root, { task, type, assignedTo, ...params }, { req }) => {
    const SourceUser = await checkResolver(req);
    const { Task } = await checkIfHasProjectRights(SourceUser.get('id'), task, undefined, ['vykazWrite']);
    const AssignedTos = <UserInstance[]>await Task.getAssignedTos();
    if (!AssignedTos.some((AssignedTo) => AssignedTo.get('id') === assignedTo)) {
      throw AssignedToUserNotSolvingTheTask;
    }
    await idDoesExistsCheck(type, models.TripType);
    (<TaskInstance>Task).createTaskChange(
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
    )
    return models.WorkTrip.create({
      TaskId: task,
      TripTypeId: type,
      UserId: assignedTo,
      ...params,
    });
  },

  updateWorkTrip: async (root, { id, type, assignedTo, ...params }, { req }) => {
    const SourceUser = await checkResolver(req);
    const WorkTrip = <WorkTripInstance>await models.WorkTrip.findByPk(id, { include: [models.TripType] });
    const originalValue = `${WorkTrip.get('done').toString()},${WorkTrip.get('quantity')},${WorkTrip.get('discount')},${(<TripTypeInstance>WorkTrip.get('TripType')).get('id')},${WorkTrip.get('UserId')}`;
    if (WorkTrip === null) {
      throw createDoesNoExistsError('WorkTrip', id);
    }
    const { Task } = await checkIfHasProjectRights(SourceUser.get('id'), WorkTrip.get('TaskId'), undefined, ['vykazWrite']);
    if (assignedTo !== undefined) {
      const AssignedTos = <UserInstance[]>await Task.getAssignedTos();
      if (!AssignedTos.some((AssignedTo) => AssignedTo.get('id') === assignedTo)) {
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
      promises.push(WorkTrip.update(params, { transaction: t }));
      await Promise.all(promises);
    });
    (<TaskInstance>Task).createTaskChange(
      {
        UserId: SourceUser.get('id'),
        TaskChangeMessages: [{
          type: 'workTrip',
          originalValue,
          newValue: `${params.done},${params.quantity},${params.discount},${type},${assignedTo}`,
          message: `Work trip ${(<TripTypeInstance>WorkTrip.get('TripType')).get('title')} was updated.`,
        }],
      },
      { include: [models.TaskChangeMessage] }
    )
    return WorkTrip.reload();
  },

  deleteWorkTrip: async (root, { id }, { req }) => {
    const SourceUser = await checkResolver(req);
    const WorkTrip = await models.WorkTrip.findByPk(id, { include: [models.TripType] });
    if (WorkTrip === null) {
      throw createDoesNoExistsError('WorkTrip', id);
    }
    const { Task } = await checkIfHasProjectRights(SourceUser.get('id'), WorkTrip.get('TaskId'), undefined, ['vykazWrite']);
    const originalValue = `${WorkTrip.get('done').toString()},${WorkTrip.get('quantity')},${WorkTrip.get('discount')},${(<TripTypeInstance>WorkTrip.get('TripType')).get('id')},${WorkTrip.get('UserId')}`;
    (<TaskInstance>Task).createTaskChange(
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
    )
    return WorkTrip.destroy();
  },

  addRepeatTemplateWorkTrip: async (root, { repeatTemplate, type, assignedTo, ...params }, { req }) => {
    const SourceUser = await checkResolver(req);
    const RepeatTemplate = <RepeatTemplateInstance>await models.RepeatTemplate.findByPk(
      repeatTemplate,
      { include: [{ model: models.User, as: 'assignedTos' }] }
    );
    if (RepeatTemplate === null) {
      throw createDoesNoExistsError('Repeat template', repeatTemplate);
    }
    await checkIfHasProjectRights(SourceUser.get('id'), undefined, RepeatTemplate.get('ProjectId'), ['vykazWrite']);
    const AssignedTos = <UserInstance[]>RepeatTemplate.get('assignedTos');
    if (!AssignedTos.some((AssignedTo) => AssignedTo.get('id') === assignedTo)) {
      throw AssignedToUserNotSolvingTheTask;
    }
    await idDoesExistsCheck(type, models.TripType);
    return models.WorkTrip.create({
      RepeatTemplateId: repeatTemplate,
      TripTypeId: type,
      UserId: assignedTo,
      ...params,
    });
  },

  updateRepeatTemplateWorkTrip: async (root, { id, type, assignedTo, ...params }, { req }) => {
    const SourceUser = await checkResolver(req);
    const WorkTrip = <WorkTripInstance>await models.WorkTrip.findByPk(
      id,
      {
        include: [
          models.TripType,
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
    await checkIfHasProjectRights(SourceUser.get('id'), undefined, (<RepeatTemplateInstance>WorkTrip.get('RepeatTemplate')).get('ProjectId'), ['vykazWrite']);
    if (assignedTo !== undefined) {
      const AssignedTos = <UserInstance[]>(<RepeatTemplateInstance>WorkTrip.get('RepeatTemplate')).get('assignedTos');
      if (!AssignedTos.some((AssignedTo) => AssignedTo.get('id') === assignedTo)) {
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
    await checkIfHasProjectRights(SourceUser.get('id'), undefined, (<RepeatTemplateInstance>WorkTrip.get('RepeatTemplate')).get('ProjectId'), ['vykazWrite']);
    return WorkTrip.destroy();
  },

}

const attributes = {
  WorkTrip: {
    async task(workTrip) {
      return getModelAttribute(workTrip, 'Task');
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
    async invoicedData(workTrip) {
      return getModelAttribute(workTrip, 'InvoicedTrips');
    },
  }
};

export default {
  attributes,
  mutations,
  querries
}
