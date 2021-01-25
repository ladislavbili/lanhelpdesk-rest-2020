import { createDoesNoExistsError, WorkTripNotNullAttributesPresent, AssignedToUserNotSolvingTheTask } from '@/configs/errors';
import { models, sequelize } from '@/models';
import { TaskInstance, UserInstance, WorkTripInstance } from '@/models/instances';
import { multipleIdDoesExistsCheck, idDoesExistsCheck, checkIfHasProjectRightsOld, getModelAttribute } from '@/helperFunctions';
import checkResolver from './checkResolver';

const querries = {
  workTrips: async (root, { taskId }, { req }) => {
    const SourceUser = await checkResolver(req);
    await checkIfHasProjectRightsOld(SourceUser.get('id'), taskId);
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
    const Task = <TaskInstance>(await checkIfHasProjectRightsOld(SourceUser.get('id'), task, 'write')).Task;
    const AssignedTos = <UserInstance[]>await Task.getAssignedTos();
    if (!AssignedTos.some((AssignedTo) => AssignedTo.get('id') === assignedTo)) {
      throw AssignedToUserNotSolvingTheTask;
    }
    await idDoesExistsCheck(type, models.TripType);
    return models.WorkTrip.create({
      TaskId: task,
      TripTypeId: type,
      UserId: assignedTo,
      ...params,
    });
  },

  updateWorkTrip: async (root, { id, type, assignedTo, ...params }, { req }) => {
    const SourceUser = await checkResolver(req);
    const WorkTrip = <WorkTripInstance>await models.WorkTrip.findByPk(id);
    if (WorkTrip === null) {
      throw createDoesNoExistsError('WorkTrip', id);
    }
    const Task = <TaskInstance>(await checkIfHasProjectRightsOld(SourceUser.get('id'), WorkTrip.get('TaskId'), 'write')).Task;
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
    })
    return WorkTrip.reload();
  },

  deleteWorkTrip: async (root, { id }, { req }) => {
    const SourceUser = await checkResolver(req);
    const WorkTrip = await models.WorkTrip.findByPk(id);
    if (WorkTrip === null) {
      throw createDoesNoExistsError('WorkTrip', id);
    }
    await checkIfHasProjectRightsOld(SourceUser.get('id'), WorkTrip.get('TaskId'), 'write');
    return WorkTrip.destroy();
  },
}

const attributes = {
  WorkTrip: {
    async task(workTrip) {
      return getModelAttribute(workTrip, 'Task');
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
