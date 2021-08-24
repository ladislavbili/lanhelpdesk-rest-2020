import {
  MustSelectStatusesError
} from '@/configs/errors';
import { models } from '@/models';
import {
  extractDatesFromObject,
  filterUnique,
} from '@/helperFunctions';
import checkResolver from './checkResolver';
import { Op } from 'sequelize';
import {
  UserInstance,
  SubtaskInstance,
  WorkTripInstance,
  TaskInstance,
} from '@/models/instances';
const dateNames = ['fromDate', 'toDate'];

const queries = {
  getInvoiceUsers: async (root, args, { req }) => {
    await checkResolver(req, ['vykazy'], true);
    const { fromDate, toDate } = extractDatesFromObject(args, dateNames);
    const Users = <UserInstance[]>await models.User.findAll({
      order: [
        ['id', 'ASC']
      ],
      include: [
      ]
    })
    return Users.map((User) => ({
      user: User,
      subtasksHours: 0,
      tripsHours: 0,
    }))
  },

  getUserInvoice: async (root, { userId, ...args }, { req }) => {
    await checkResolver(req, ['vykazy'], true);
    const { fromDate, toDate } = extractDatesFromObject(args, dateNames);
    const [User] = await Promise.all([
      models.User.findByPk(userId),
    ]);
    const userInvoice = {
      user: User,
      fromDate: args.fromDate,
      toDate: args.toDate,
      subtaskTasks: 0,
      tripTasks: 0,
      subtaskTotals: [],
      tripTotals: [],
      subtaskCounts: {
        total: 0,
        afterHours: 0,
        afterHoursTaskIds: []
      },
      tripCounts: {
        total: 0,
        afterHours: 0,
        afterHoursTaskIds: []
      },
      typeTotals: {
        subtaskPausal: 0,
        subtaskOverPausal: 0,
        subtaskProject: 0,
        tripPausal: 0,
        tripOverPausal: 0,
        tripProject: 0,
      },
    }

    return {
      ...userInvoice,
      subtaskCounts: {
        ...userInvoice.subtaskCounts,
        afterHoursTaskIds: filterUnique(userInvoice.subtaskCounts.afterHoursTaskIds),
      },
      tripCounts: {
        ...userInvoice.tripCounts,
        afterHoursTaskIds: filterUnique(userInvoice.tripCounts.afterHoursTaskIds),
      },
      subtaskTotals: userInvoice.subtaskTotals.map((total) => ({
        ...total,
        type: total.type.title
      })),
      tripTotals: userInvoice.tripTotals.map((total) => ({
        ...total,
        type: total.type.title
      })),
    };
  },
}

const mutations = {
}

const attributes = {
};

export default {
  attributes,
  mutations,
  queries
}
