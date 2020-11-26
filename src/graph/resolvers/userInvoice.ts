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
  InvoicedSubtaskInstance,
  InvoicedTripInstance,
  SubtaskInstance,
  WorkTripInstance,
  TaskInstance,
} from '@/models/instances';
const dateNames = ['fromDate', 'toDate'];

const querries = {
  getInvoiceUsers: async (root, args, { req }) => {
    await checkResolver(req, ['vykazy', 'viewVykaz'], true);
    const { fromDate, toDate } = extractDatesFromObject(args, dateNames);
    const Users = <UserInstance[]>await models.User.findAll({
      order: [
        ['id', 'ASC']
      ],
      include: [
        {
          model: models.InvoicedSubtask,
          attributes: ['id', 'quantity'],
          where: {
            createdAt: {
              [Op.and]: {
                [Op.gte]: fromDate,
                [Op.lte]: toDate
              }
            },
          },
        },
        {
          model: models.InvoicedTrip,
          attributes: ['id', 'quantity'],
          where: {
            createdAt: {
              [Op.and]: {
                [Op.gte]: fromDate,
                [Op.lte]: toDate
              }
            },
          },
        },
      ]
    })
    return Users.map((User) => ({
      user: User,
      subtasksHours: (<InvoicedSubtaskInstance[]>User.get('InvoicedSubtasks')).reduce((acc, Subtask) => acc + parseFloat(Subtask.get('quantity').toString()), 0),
      tripsHours: (<InvoicedTripInstance[]>User.get('InvoicedTrips')).reduce((acc, Trip) => acc + parseFloat(Trip.get('quantity').toString()), 0),
    }))
  },
  getUserInvoice: async (root, { userId, ...args }, { req }) => {
    await checkResolver(req, ['vykazy', 'viewVykaz'], true);
    const { fromDate, toDate } = extractDatesFromObject(args, dateNames);
    const [User, InvoicedTasks] = await Promise.all([
      models.User.findByPk(userId),
      models.InvoicedTask.findAll({
        where: {
          createdAt: {
            [Op.and]: {
              [Op.gte]: fromDate,
              [Op.lte]: toDate
            }
          },
        },
        include: [
          {
            model: models.InvoicedSubtask,
            required: false,
            include: [models.Subtask],
            where: {
              UserId: userId
            }
          },
          {
            model: models.InvoicedTrip,
            required: false,
            include: [models.WorkTrip],
            where: {
              UserId: userId
            }
          },
          {
            model: models.Task,
            include: [
              {
                model: models.User,
                as: 'requester'
              },
              {
                model: models.User,
                as: 'assignedTos'
              },
              models.Status,
              models.Company,
            ]
          },
        ]
      }),
    ]);
    const userInvoice = {
      user: User,
      fromDate: args.fromDate,
      toDate: args.toDate,
      subtaskTasks: InvoicedTasks.filter((InvoicedTask) => (<InvoicedSubtaskInstance[]>InvoicedTask.get('InvoicedSubtasks')).length > 0),
      tripTasks: InvoicedTasks.filter((InvoicedTask) => (<InvoicedTripInstance[]>InvoicedTask.get('InvoicedTrips')).length > 0),
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
    InvoicedTasks.forEach((InvoicedTask) => {
      const Task = <TaskInstance>InvoicedTask.get('Task');
      (<InvoicedSubtaskInstance[]>InvoicedTask.get('InvoicedSubtasks')).forEach((InvoicedSubtask) => {
        const quantity = parseFloat(InvoicedSubtask.get('quantity').toString());
        const Subtask = <SubtaskInstance>InvoicedSubtask.get('Subtask');
        const totalIndex = userInvoice.subtaskTotals.findIndex((total) => (
          (Subtask && Subtask.get('TaskTypeId') === total.type.id) ||
          (!Subtask && InvoicedSubtask.get('type') === total.type.id)
        ));
        if (totalIndex !== -1) {
          userInvoice.subtaskTotals[totalIndex].quantity += quantity;
        } else {
          if (Subtask) {
            userInvoice.subtaskTotals.push({
              quantity,
              type: {
                id: Subtask.get('TaskTypeId'),
                title: InvoicedSubtask.get('type')
              }
            })
          } else {
            userInvoice.subtaskTotals.push({
              quantity,
              type: {
                id: InvoicedSubtask.get('type'),
                title: InvoicedSubtask.get('type')
              }
            })
          }
        }
        userInvoice.subtaskCounts.total += quantity;
        if (Task.get('overtime')) {
          userInvoice.subtaskCounts.afterHours += quantity;
          userInvoice.subtaskCounts.afterHoursTaskIds.push(Task.get('id'));
        }
        switch (InvoicedTask.get('type')) {
          case 'PAUSAL': {
            userInvoice.typeTotals.subtaskPausal += quantity;
            break;
          }
          case 'OVERTIME': {
            userInvoice.typeTotals.subtaskOverPausal += quantity;
            break;
          }
          case 'PROJECT': {
            userInvoice.typeTotals.subtaskProject += quantity;
            break;
          }

          default:
            break;
        }
      });
      (<InvoicedTripInstance[]>InvoicedTask.get('InvoicedTrips')).forEach((InvoicedTrip) => {
        const quantity = parseFloat(InvoicedTrip.get('quantity').toString());
        const WorkTrip = <WorkTripInstance>InvoicedTrip.get('WorkTrip');
        const totalIndex = userInvoice.tripTotals.findIndex((total) => (
          (WorkTrip && WorkTrip.get('TripTypeId') === total.type.id) ||
          (!WorkTrip && InvoicedTrip.get('type') === total.type.id)
        ));
        if (totalIndex !== -1) {
          userInvoice.tripTotals[totalIndex].quantity += quantity;
        } else {
          if (WorkTrip) {
            userInvoice.tripTotals.push({
              quantity,
              type: {
                id: WorkTrip.get('TripTypeId'),
                title: InvoicedTrip.get('type')
              }
            })
          } else {
            userInvoice.tripTotals.push({
              quantity,
              type: {
                id: InvoicedTrip.get('type'),
                title: InvoicedTrip.get('type')
              }
            })
          }
        }
        userInvoice.tripCounts.total += quantity;
        if (Task.get('overtime')) {
          userInvoice.tripCounts.afterHours += quantity;
          userInvoice.tripCounts.afterHoursTaskIds.push(Task.get('id'));
        }

        switch (InvoicedTask.get('type')) {
          case 'PAUSAL': {
            userInvoice.typeTotals.tripPausal += quantity;
            break;
          }
          case 'OVERTIME': {
            userInvoice.typeTotals.tripOverPausal += quantity;
            break;
          }
          case 'PROJECT': {
            userInvoice.typeTotals.tripProject += quantity;
            break;
          }
          default:
            break;
        }
      });
    })

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
  querries
}
