import { MustSelectStatusesError, createDoesNoExistsError } from '@/configs/errors';
import { models } from '@/models';
import {
  TaskInstance,
  SubtaskInstance,
  WorkTripInstance,
  MaterialInstance,
  CustomItemInstance,
  CompanyRentInstance,
  CompanyInstance,
  TaskInvoiceInstance,
  PricelistInstance,
  PriceInstance
} from '@/models/instances';
import { Op, Sequelize as sequelize } from 'sequelize';
import checkResolver from './checkResolver';
import {
  extractDatesFromObject,
  splitArrayByFilter,

  getFinalPrice,
  getTotalAHPrice,
  getTotalFinalPrice,
  getTotalFinalPriceWithDPH,
  getAHExtraPrice,
  getTotalAHExtraPrice,
  getModelAttribute,
} from '@/helperFunctions';
import moment from 'moment';
const dateNames = ['fromDate', 'toDate'];

let fakeID = 0;

const querries = {
  getInvoiceCompanies: async (root, { statuses, ...args }, { req }) => {
    await checkResolver(req, ['vykazy']);
    if (statuses.length === 0) {
      throw MustSelectStatusesError;
    }
    const { fromDate, toDate } = extractDatesFromObject(args, dateNames);
    const Companies = await models.Company.findAll({
      order: [
        ['id', 'ASC']
      ],
      include: [
        {
          model: models.Task,
          attributes: ['id'],
          where: {
            closeDate: {
              [Op.and]: {
                [Op.gte]: fromDate,
                [Op.lte]: toDate
              }
            },
            StatusId: statuses
          },
          include: [
            {
              model: models.Subtask,
              attributes: ['quantity'],
            },
            {
              model: models.WorkTrip,
              attributes: ['quantity'],
            },
            {
              model: models.Material,
              attributes: ['quantity'],
            },
            {
              model: models.CustomItem,
              attributes: ['quantity'],
            }
          ]
        },
        {
          model: models.CompanyRent,
          attributes: ['quantity'],
        }
      ]
    })

    let CompanyInvoices = Companies.map((Company) => ({
      company: Company,
      subtasksHours: (<TaskInstance[]>Company.get('Tasks')).reduce((acc, Task) => {
        return acc + (<SubtaskInstance[]>Task.get('Subtasks')).reduce((acc, Subtask) => acc + parseFloat(Subtask.get('quantity').toString()), 0);
      }, 0),
      tripsHours: (<TaskInstance[]>Company.get('Tasks')).reduce((acc, Task) => {
        return acc + (<WorkTripInstance[]>Task.get('WorkTrips')).reduce((acc, WorkTrip) => acc + parseFloat(WorkTrip.get('quantity').toString()), 0);
      }, 0),
      materialsQuantity: (<TaskInstance[]>Company.get('Tasks')).reduce((acc, Task) => {
        return acc + (<MaterialInstance[]>Task.get('Materials')).reduce((acc, Material) => acc + parseFloat(Material.get('quantity').toString()), 0);
      }, 0),
      customItemsQuantity: (<TaskInstance[]>Company.get('Tasks')).reduce((acc, Task) => {
        return acc + (<CustomItemInstance[]>Task.get('CustomItems')).reduce((acc, CustomItem) => acc + parseFloat(CustomItem.get('quantity').toString()), 0);
      }, 0),
      rentedItemsQuantity: (<CompanyRentInstance[]>Company.get('CompanyRents')).reduce((acc, CompanyRent) => acc + parseFloat(CompanyRent.get('quantity').toString()), 0),
    }));

    return CompanyInvoices.filter((CompanyInvoice) => (
      CompanyInvoice.subtasksHours !== 0 ||
      CompanyInvoice.tripsHours !== 0 ||
      CompanyInvoice.materialsQuantity !== 0 ||
      CompanyInvoice.customItemsQuantity !== 0 ||
      CompanyInvoice.rentedItemsQuantity !== 0
    ));
  },

  getCompanyInvoiceData: async (root, { statuses, companyId, ...args }, { req }) => {
    await checkResolver(req, ['vykazy']);
    if (statuses.length === 0) {
      throw MustSelectStatusesError;
    }
    const { fromDate, toDate } = extractDatesFromObject(args, dateNames);
    const Company = await models.Company.findByPk(companyId, {
      include: [
        {
          model: models.Pricelist,
          attributes: ['title', 'afterHours'],
          include: [
            {
              model: models.Price,
            }
          ]
        },
        {
          model: models.Task,
          order: [['closeDate', 'ASC']],
          where: {
            closeDate: {
              [Op.and]: {
                [Op.gte]: fromDate,
                [Op.lte]: toDate
              }
            },
            StatusId: statuses
          },
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
            {
              model: models.Subtask,
              include: [models.TaskType],
            },
            {
              model: models.WorkTrip,
              include: [models.TripType],
            },
            models.Material,
            models.CustomItem,
          ]
        },
        models.CompanyRent,
      ]
    });

    const previousMonthTasks = await models.Task.findAll({
      where: {
        CompanyId: companyId,
        closeDate: {
          [Op.and]: {
            [Op.gte]: moment(fromDate).startOf('month').valueOf(),
            [Op.lte]: fromDate
          },
        },
        pausal: true,
      },
      include: [
        {
          model: models.Subtask,
        },
        {
          model: models.WorkTrip,
        },
      ],
    })
    //project tasks
    let { rawPausalTasks, rawProjectTasks } = splitTasksByPausal(Company.get('Tasks'));

    //tasks counts
    const { projectTasks, projectCounts } = processProjectTasks(rawProjectTasks, Company, true);
    //all pausal tasks
    const { pausalTasks, overPausalTasks, pausalCounts, overPausalCounts } = processTasksPausals(
      splitTasksByMonthAndYear(
        [...previousMonthTasks, ...rawPausalTasks]
      ),
      Company,
      previousMonthTasks,
      true
    );
    const companyRentsCounts = processCompanyRents(Company.get('CompanyRents'), Company);
    const { materialTasks, totalMaterialAndCustomItemPriceWithoutDPH, totalMaterialAndCustomItemPriceWithDPH } = processTasksMaterialsAndCustomItems(Company.get('Tasks'), Company);
    return {
      company: Company,
      projectTasks, projectCounts,
      pausalTasks, overPausalTasks, pausalCounts, overPausalCounts,
      materialTasks, totalMaterialAndCustomItemPriceWithoutDPH, totalMaterialAndCustomItemPriceWithDPH,
      companyRentsCounts
    };
  },

  getCompanyInvoices: async (root, { id }, { req }) => {
    await checkResolver(req, ['vykazy']);
    const Company = await models.Company.findByPk(id, { include: { model: models.TaskInvoice } });
    if (Company === null) {
      throw createDoesNoExistsError('Company', id);
    }
    return Company.get('TaskInvoices');
  },

  getTaskInvoice: async (root, { id }, { req }) => {
    await checkResolver(req, ['vykazy']);
    const TaskInvoice = await models.TaskInvoice.findByPk(id, {
      include: [
        models.Company,
        {
          model: models.InvoicedCompany,
          include: [
            models.InvoicedCompanyRent,
          ]
        },
        {
          model: models.InvoicedMaterialTask,
          as: 'materialTasks',
          include: [
            models.Task,
            {
              model: models.InvoicedMaterial,
              as: 'materials',
              include: [models.Material],
            },
            {
              model: models.InvoicedCustomItem,
              as: 'customItems',
              include: [models.CustomItem]
            }
          ]
        },
        {
          model: models.InvoicedTask,
          include: [
            models.Task,
            {
              model: models.InvoicedSubtask,
              include: [models.Subtask]
            },
            {
              model: models.InvoicedTrip,
              include: [{
                model: models.WorkTrip,
                include: [models.TripType]
              }]
            },
          ]
        },
      ]
    });

    if (TaskInvoice === null) {
      throw createDoesNoExistsError('Task invoice', id);
    }
    return TaskInvoice;
  },
}

const mutations = {
  createTaskInvoice: async (root, { statuses, companyId, title, ...args }, { req }) => {
    await checkResolver(req, ['vykazy']);
    if (statuses.length === 0) {
      throw MustSelectStatusesError;
    }
    //check invoice status
    const InvoiceStatus = await models.Status.findOne({ where: { action: 'Invoiced' } });
    if (InvoiceStatus === null) {
      throw createDoesNoExistsError('Invoice status');
    }
    const { fromDate, toDate } = extractDatesFromObject(args, dateNames);
    const Company = await models.Company.findByPk(companyId, {
      include: [
        {
          model: models.Pricelist,
          attributes: [
            'afterHours',
            'title'
          ],
          include: [
            {
              model: models.Price,
            }
          ]
        },
        {
          model: models.Task,
          order: [['closeDate', 'ASC']],
          where: {
            closeDate: {
              [Op.and]: {
                [Op.gte]: fromDate,
                [Op.lte]: toDate
              }
            },
            StatusId: statuses
          },
          include: [
            {
              model: models.Subtask,
              include: [
                {
                  model: models.TaskType,
                  attributes: ['title']
                },
                {
                  model: models.User,
                  attributes: ['name', 'surname', 'email', 'username']
                },
              ]
            },
            {
              model: models.WorkTrip,
              include: [
                {
                  model: models.TripType,
                  attributes: ['title']
                },
                {
                  model: models.User,
                  attributes: ['name', 'surname', 'email', 'username']
                },
              ]
            },
            {
              model: models.Material,
            },
            {
              model: models.CustomItem,
            }
          ]
        },
        {
          model: models.CompanyRent,
        }
      ]
    });
    const previousMonthTasks = await models.Task.findAll({
      where: {
        CompanyId: companyId,
        closeDate: {
          [Op.and]: {
            [Op.gte]: moment(fromDate).startOf('month').valueOf(),
            [Op.lte]: fromDate
          },
        },
        pausal: true,
      },
      include: [
        {
          model: models.Subtask,
        },
        {
          model: models.WorkTrip,
        },
      ],
    })
    //project tasks
    let { rawPausalTasks, rawProjectTasks } = splitTasksByPausal(Company.get('Tasks'));
    //project tasks counts, add to database
    const { projectTasks, projectCounts } = processProjectTasks(rawProjectTasks, Company);
    //all pausal tasks
    const { pausalTasks, overPausalTasks, pausalCounts, overPausalCounts } = processTasksPausals(
      splitTasksByMonthAndYear(
        [...previousMonthTasks, ...rawPausalTasks]
      ),
      Company,
      previousMonthTasks
    );
    const companyRentsCounts = processCompanyRents(Company.get('CompanyRents'), Company);
    const { materialTasks, totalMaterialAndCustomItemPriceWithoutDPH, totalMaterialAndCustomItemPriceWithDPH } = processTasksMaterialsAndCustomItems(Company.get('Tasks'), Company);
    const prices = <PriceInstance[]>(<PricelistInstance>Company.get('Pricelist')).get('Prices');
    const afterHours = (<PricelistInstance>Company.get('Pricelist')).get('afterHours');
    const dph = Company.get('dph');
    const taskInvoice = {
      title: title,
      fromDate: fromDate,
      toDate: toDate,
      //company
      CompanyId: companyId,
      InvoicedCompany: {
        title: Company.get('title'),
        dph: Company.get('dph'),
        monthly: Company.get('monthly'),
        monthlyPausal: Company.get('monthlyPausal'),
        taskTripPausal: Company.get('taskWorkPausal'),
        taskWorkPausal: Company.get('taskTripPausal'),
        InvoicedCompanyRents: (<CompanyRentInstance[]>Company.get('CompanyRents')).map((rent) => ({
          title: rent.title,
          quantity: rent.quantity,
          cost: rent.cost,
          price: rent.price,
          total: rent.total,
        }))
      },
      //companyRentsCounts -g
      CRCRentTotalWithoutDPH: companyRentsCounts.totalWithoutDPH,
      CRCRentTotalWithDPH: companyRentsCounts.totalWithDPH,

      //pausalCounts -g
      PCSubtasks: pausalCounts.subtasks,
      PCSubtasksAfterHours: pausalCounts.subtasksAfterHours,
      PCSubtasksAfterHoursTaskIds: pausalCounts.subtasksAfterHoursTaskIds.toString(),
      PCSubtasksAfterHoursPrice: pausalCounts.subtasksAfterHoursPrice,
      PCTrips: pausalCounts.trips,
      PCTripsAfterHours: pausalCounts.tripsAfterHours,
      PCTripsAfterHoursTaskIds: pausalCounts.tripsAfterHoursTaskIds.toString(),
      PCTripsAfterHoursPrice: pausalCounts.tripsAfterHoursPrice,

      //overPausalCounts -g
      OPCSubtasks: overPausalCounts.subtasks,
      OPCSubtasksAfterHours: overPausalCounts.subtasksAfterHours,
      OPCSubtasksAfterHoursTaskIds: overPausalCounts.subtasksAfterHoursTaskIds.toString(),
      OPCSubtasksAfterHoursPrice: overPausalCounts.subtasksAfterHoursPrice,
      OPCSubtasksTotalPriceWithoutDPH: overPausalCounts.subtasksTotalPriceWithoutDPH,
      OPCSubtasksTotalPriceWithDPH: overPausalCounts.subtasksTotalPriceWithDPH,

      OPCTrips: overPausalCounts.trips,
      OPCTripsAfterHours: overPausalCounts.tripsAfterHours,
      OPCTripsAfterHoursTaskIds: overPausalCounts.tripsAfterHoursTaskIds.toString(),
      OPCTripsAfterHoursPrice: overPausalCounts.tripsAfterHoursPrice,
      OPCTripsTotalPriceWithoutDPH: overPausalCounts.tripsTotalPriceWithoutDPH,
      OPCTripsTotalPriceWithDPH: overPausalCounts.tripsTotalPriceWithDPH,

      //projectCounts -g
      PRCSubtasks: projectCounts.subtasks,
      PRCSubtasksAfterHours: projectCounts.subtasksAfterHours,
      PRCSubtasksAfterHoursTaskIds: projectCounts.subtasksAfterHoursTaskIds.toString(),
      PRCSubtasksAfterHoursPrice: projectCounts.subtasksAfterHoursPrice,
      PRCSubtasksTotalPriceWithoutDPH: projectCounts.subtasksTotalPriceWithoutDPH,
      PRCSubtasksTotalPriceWithDPH: projectCounts.subtasksTotalPriceWithDPH,

      PRCTrips: projectCounts.trips,
      PRCTripsAfterHours: projectCounts.tripsAfterHours,
      PRCTripsAfterHoursTaskIds: projectCounts.tripsAfterHoursTaskIds.toString(),
      PRCTripsAfterHoursPrice: projectCounts.tripsAfterHoursPrice,
      PRCTripsTotalPriceWithoutDPH: projectCounts.tripsTotalPriceWithoutDPH,
      PRCTripsTotalPriceWithDPH: projectCounts.tripsTotalPriceWithDPH,
      InvoicedTasks: [
        ...pausalTasks.map((PausalTask) => buildInvoicedTask(PausalTask, 'PAUSAL')),
        ...overPausalTasks.map((OPTask) => buildInvoicedTask(OPTask, 'OVERTIME')),
        ...projectTasks.map((ProjTask) => buildInvoicedTask(ProjTask, 'PROJECT')),
      ],
      materialTasks: materialTasks.map((materialTask) => ({
        TaskId: materialTask.task.id,
        materials: materialTask.materials.map((material) => ({
          MaterialId: material.id,
          title: material.title,
          quantity: material.quantity,
          margin: material.margin,
          price: material.price,
          totalPrice: material.totalPrice,
        })),
        customItems: materialTask.customItems.map((customItem) => ({
          CustomItemId: customItem.id,
          title: customItem.title,
          quantity: customItem.quantity,
          price: customItem.price,
          totalPrice: customItem.totalPrice,
        })),
      })),
      totalMaterialAndCustomItemPriceWithoutDPH: totalMaterialAndCustomItemPriceWithoutDPH,
      totalMaterialAndCustomItemPriceWithDPH: totalMaterialAndCustomItemPriceWithDPH,
    }

    const TaskInvoice = <TaskInvoiceInstance>await models.TaskInvoice.create(
      taskInvoice,
      {
        include: [
          { model: models.InvoicedCompany, include: [models.InvoicedCompanyRent] },
          { model: models.InvoicedTask, include: [models.InvoicedSubtask, models.InvoicedTrip] },
          { model: models.InvoicedMaterialTask, include: [{ model: models.InvoicedMaterial, as: 'materials' }, { model: models.InvoicedCustomItem, as: 'customItems' }], as: 'materialTasks' },
        ]
      }
    );
    await Promise.all((<TaskInstance[]>Company.get('Tasks')).map((Task) => Task.setStatus(InvoiceStatus)));
    return TaskInvoice;
  },
}

const attributes = {
  TaskInvoice: {
    async companyRentsCounts(taskInvoice) {
      return taskInvoice.get('companyRentsCounts')
    },
    async pausalCounts(taskInvoice) {
      return taskInvoice.get('pausalCounts')
    },
    async overPausalCounts(taskInvoice) {
      return taskInvoice.get('overPausalCounts')
    },
    async projectCounts(taskInvoice) {
      return taskInvoice.get('projectCounts')
    },
    async company(taskInvoice) {
      return getModelAttribute(taskInvoice, 'Company');
    },
    async invoicedCompany(taskInvoice) {
      return getModelAttribute(taskInvoice, 'InvoicedCompany');
    },
    async materialTasks(taskInvoice) {
      return getModelAttribute(taskInvoice, 'materialTasks');
    },
    async pausalTasks(taskInvoice) {
      const allTasks = await getModelAttribute(taskInvoice, 'InvoicedTasks');
      return allTasks.filter((Task) => Task.get('type') === 'PAUSAL');
    },
    async overPausalTasks(taskInvoice) {
      const allTasks = await getModelAttribute(taskInvoice, 'InvoicedTasks');
      return allTasks.filter((Task) => Task.get('type') === 'OVERTIME');
    },
    async projectTasks(taskInvoice) {
      const allTasks = await getModelAttribute(taskInvoice, 'InvoicedTasks');
      return allTasks.filter((Task) => Task.get('type') === 'PROJECT');
    },
  },

  InvoicedCompany: {
    async companyRents(invoicedCompany) {
      return getModelAttribute(invoicedCompany, 'InvoicedCompanyRents');
    },
  },
  MaterialTask: {
    async task(materialTask) {
      return getModelAttribute(materialTask, 'Task');
    },
    async materials(materialTask) {
      return getModelAttribute(materialTask, 'materials');
    },
    async customItems(materialTask) {
      return getModelAttribute(materialTask, 'customItems');
    },
  },
  InvoicedMaterial: {
    async material(invoicedMaterial) {
      return getModelAttribute(invoicedMaterial, 'Material');
    }
  },
  InvoicedCustomItem: {
    async customItem(invoicedCustomItem) {
      return getModelAttribute(invoicedCustomItem, 'CustomItem');
    }
  },
  InvoicedTask: {
    async task(invoicedTask) {
      return getModelAttribute(invoicedTask, 'Task');
    },
    async subtasks(invoicedTask) {
      return getModelAttribute(invoicedTask, 'InvoicedSubtasks');

    },
    async trips(invoicedTask) {
      return getModelAttribute(invoicedTask, 'InvoicedTrips');

    }
  },
  InvoicedSubtask: {
    async subtask(invoicedSubtask) {
      return getModelAttribute(invoicedSubtask, 'Subtask');
    }
  },
  InvoicedTrip: {
    async trip(invoicedTrip) {
      return getModelAttribute(invoicedTrip, 'WorkTrip');
    }
  },
};

export default {
  attributes,
  mutations,
  querries
}

function splitTasksByPausal(tasks) {
  const [rawPausalTasks, projectTasks] = splitArrayByFilter(tasks, (Task) => Task.get('pausal'));
  return { rawPausalTasks, rawProjectTasks: projectTasks };
}

function splitTasksByMonthAndYear(tasks) {
  let splitTasks = {};
  tasks.forEach((Task) => {
    const closeDate = moment(Task.get('closeDate'));
    const key = `${closeDate.month()}-${closeDate.year()}`;
    if (!splitTasks.hasOwnProperty(key)) {
      splitTasks[key] = [];
    }
    splitTasks[key].push(Task);
  })
  return splitTasks;
}

function buildInvoicedTask(taskData, type) {
  return {
    TaskId: taskData.task.id,
    type,
    InvoicedSubtasks: taskData.subtasks.map((subtask) => ({
      SubtaskId: subtask.id,
      price: subtask.price,
      quantity: subtask.quantity,
      type: subtask.TaskType.get('title'),
      assignedTo: `${subtask.User.get('fullName')}(${subtask.User.get('email')})`,
    })),
    InvoicedTrips: taskData.trips.map((workTrip) => ({
      WorkTripId: workTrip.id,
      price: workTrip.price,
      quantity: workTrip.quantity,
      type: workTrip.TripType.get('title'),
      assignedTo: `${workTrip.User.get('fullName')}(${workTrip.User.get('email')})`,
    })),
  }
}

function processTasksPausals(datedTasks, Company, previousMonthTasks, useFakeID = false) {
  const prices = Company.get('Pricelist').get('Prices');
  const afterHours = Company.get('Pricelist').get('afterHours');
  const dph = Company.get('dph');
  let discardTaskIds = previousMonthTasks.map((Task) => Task.get('id'))

  let resultPausalTasks = [];
  let resultOverPausalTasks = [];
  let pausalCounts = {
    subtasks: 0,
    subtasksAfterHours: 0,
    subtasksAfterHoursTaskIds: [],
    subtasksAfterHoursPrice: 0,

    trips: 0,
    tripsAfterHours: 0,
    tripsAfterHoursTaskIds: [],
    tripsAfterHoursPrice: 0,
  }

  let overPausalCounts = {
    subtasks: 0,
    subtasksAfterHours: 0,
    subtasksAfterHoursTaskIds: [],
    subtasksAfterHoursPrice: 0,
    subtasksTotalPriceWithoutDPH: 0,
    subtasksTotalPriceWithDPH: 0,

    trips: 0,
    tripsAfterHours: 0,
    tripsAfterHoursTaskIds: [],
    tripsAfterHoursPrice: 0,
    tripsTotalPriceWithoutDPH: 0,
    tripsTotalPriceWithDPH: 0,
  }

  Object.keys(datedTasks).forEach((date) => {
    let dateTasks = datedTasks[date];
    let taskWorkPausalCount = parseFloat(Company.get('taskWorkPausal'));
    let taskTripPausalCount = parseFloat(Company.get('taskTripPausal'));
    dateTasks.forEach((Task) => {
      const dontCount = discardTaskIds.includes(Task.get('id'));
      let taskPausalObject = {
        task: Task,
        subtasks: [],
        trips: [],
      }
      let taskOverPausalObject = {
        task: Task,
        subtasks: [],
        trips: [],
      }
      Task.get('Subtasks').forEach((Subtask) => {
        let price = prices.find((Price) => Price.get('type') === 'TaskType' && Price.get('TaskTypeId') === Subtask.get('TaskTypeId'));
        if (price === undefined) {
          price = 0
        } else {
          price = parseFloat(price.get('price'));
        }

        let subtask = {
          ...Subtask.get(),
          id: Subtask.get('id'),
          subtaskID: Subtask.get('id'),
          discount: parseFloat(Subtask.get('discount')),
          quantity: parseFloat(Subtask.get('quantity')),
          price: getFinalPrice(price, Subtask.get('discount'), Task.get('overtime'), afterHours),
          type: Subtask.get('TaskType'),
        };

        let quantity = subtask.quantity;

        if (taskWorkPausalCount > quantity) {
          if (!dontCount) {
            pausalCounts.subtasks += quantity;
            //if overtime count it
            if (Task.get('overtime')) {
              pausalCounts.subtasksAfterHours += quantity;
              //add overtime id if not already included
              if (!pausalCounts.subtasksAfterHoursTaskIds.includes(Task.get('id'))) {
                pausalCounts.subtasksAfterHoursTaskIds.push(Task.get('id'));
              }
              pausalCounts.subtasksAfterHoursPrice += getTotalAHExtraPrice(price, quantity, subtask.discount, afterHours);
            }
          }
          taskWorkPausalCount -= quantity;
          taskPausalObject.subtasks.push(subtask);

        } else if (taskWorkPausalCount === 0) {
          if (!dontCount) {
            overPausalCounts.subtasks += quantity;
            overPausalCounts.subtasksTotalPriceWithoutDPH += getTotalFinalPrice(price, quantity, subtask.discount, Task.get('overtime'), afterHours)
            overPausalCounts.subtasksTotalPriceWithDPH += getTotalFinalPriceWithDPH(price, quantity, subtask.discount, dph, Task.get('overtime'), afterHours);
            if (Task.get('overtime')) {
              overPausalCounts.subtasksAfterHours += quantity;
              //add overtime id if not already included
              if (!overPausalCounts.subtasksAfterHoursTaskIds.includes(Task.get('id'))) {
                overPausalCounts.subtasksAfterHoursTaskIds.push(Task.get('id'));
              }
              overPausalCounts.subtasksAfterHoursPrice += getTotalAHExtraPrice(price, quantity, subtask.discount, afterHours);
            }
          }

          taskOverPausalObject.subtasks.push(subtask);
        } else {
          //in pausal
          if (!dontCount) {
            pausalCounts.subtasks += taskWorkPausalCount;
            //if overtime count it
            if (Task.get('overtime')) {
              pausalCounts.subtasksAfterHours += taskWorkPausalCount;
              //add overtime id if not already included
              if (!pausalCounts.subtasksAfterHoursTaskIds.includes(Task.get('id'))) {
                pausalCounts.subtasksAfterHoursTaskIds.push(Task.get('id'));
              }
              pausalCounts.subtasksAfterHoursPrice += getTotalAHExtraPrice(price, taskWorkPausalCount, subtask.discount, afterHours);
            }
          }

          taskPausalObject.subtasks.push({ ...subtask, id: useFakeID ? fakeID++ : subtask.id, quantity: taskWorkPausalCount });

          //over pausal
          if (!dontCount) {
            overPausalCounts.subtasks += quantity - taskWorkPausalCount;
            overPausalCounts.subtasksTotalPriceWithoutDPH += getTotalFinalPrice(price, quantity - taskWorkPausalCount, subtask.discount, Task.get('overtime'), afterHours)
            overPausalCounts.subtasksTotalPriceWithDPH += getTotalFinalPriceWithDPH(price, quantity - taskWorkPausalCount, subtask.discount, dph, Task.get('overtime'), afterHours);
            if (Task.get('overtime')) {
              overPausalCounts.subtasksAfterHours += quantity - taskWorkPausalCount;
              //add overtime id if not already included
              if (!overPausalCounts.subtasksAfterHoursTaskIds.includes(Task.get('id'))) {
                overPausalCounts.subtasksAfterHoursTaskIds.push(Task.get('id'));
              }
              overPausalCounts.subtasksAfterHoursPrice += getTotalAHPrice(price, quantity - taskWorkPausalCount, subtask.discount, afterHours);
            }
          }
          taskOverPausalObject.subtasks.push({ ...subtask, id: useFakeID ? fakeID++ : subtask.id, quantity: quantity - taskWorkPausalCount });
          taskWorkPausalCount = 0;
        }
      });

      Task.get('WorkTrips').forEach((WorkTrip) => {
        let price = prices.find((Price) => Price.get('type') === 'TripType' && Price.get('TripTypeId') === WorkTrip.get('TripTypeId'));
        if (price === undefined) {
          price = 0
        } else {
          price = parseFloat(price.get('price'));
        }

        let workTrip = {
          ...WorkTrip.get(),
          id: WorkTrip.get('id'),
          workTripID: WorkTrip.get('id'),
          discount: parseFloat(WorkTrip.get('discount')),
          quantity: parseFloat(WorkTrip.get('quantity')),
          price: getFinalPrice(price, WorkTrip.get('discount'), Task.get('overtime'), afterHours),
          type: WorkTrip.get('TripType')
        };
        let quantity = workTrip.quantity;
        if (taskTripPausalCount > quantity) {
          if (!dontCount) {
            pausalCounts.trips += quantity;
            //if overtime count it
            if (Task.get('overtime')) {
              pausalCounts.tripsAfterHours += quantity;
              //add overtime id if not already included
              if (!pausalCounts.tripsAfterHoursTaskIds.includes(Task.get('id'))) {
                pausalCounts.tripsAfterHoursTaskIds.push(Task.get('id'));
              }
              pausalCounts.tripsAfterHoursPrice += getTotalAHExtraPrice(price, quantity, workTrip.discount, afterHours);
            }
          }

          taskTripPausalCount -= quantity;
          taskPausalObject.trips.push(workTrip);
        } else if (taskTripPausalCount === 0) {
          if (!dontCount) {
            overPausalCounts.trips += quantity;
            overPausalCounts.tripsTotalPriceWithoutDPH += getTotalFinalPrice(price, quantity, workTrip.discount, Task.get('overtime'), afterHours)
            overPausalCounts.tripsTotalPriceWithDPH += getTotalFinalPriceWithDPH(price, quantity, workTrip.discount, dph, Task.get('overtime'), afterHours);
            if (Task.get('overtime')) {
              overPausalCounts.tripsAfterHours += quantity;
              //add overtime id if not already included
              if (!overPausalCounts.tripsAfterHoursTaskIds.includes(Task.get('id'))) {
                overPausalCounts.tripsAfterHoursTaskIds.push(Task.get('id'));
              }
              overPausalCounts.tripsAfterHoursPrice += getTotalAHPrice(price, quantity, workTrip.discount, afterHours);
            }
          }

          taskOverPausalObject.trips.push(workTrip);
        } else {
          //in pausal
          if (!dontCount) {
            pausalCounts.trips += taskTripPausalCount;
            //if overtime count it
            if (Task.get('overtime')) {
              pausalCounts.tripsAfterHours += taskTripPausalCount;
              //add overtime id if not already included
              if (!pausalCounts.tripsAfterHoursTaskIds.includes(Task.get('id'))) {
                pausalCounts.tripsAfterHoursTaskIds.push(Task.get('id'));
              }
              pausalCounts.tripsAfterHoursPrice += getTotalAHExtraPrice(price, taskTripPausalCount, workTrip.discount, afterHours);
            }
          }

          taskPausalObject.trips.push({ ...workTrip, id: useFakeID ? fakeID++ : workTrip.id, quantity: taskTripPausalCount });

          //over pausal
          if (!dontCount) {
            overPausalCounts.trips += quantity - taskTripPausalCount;
            overPausalCounts.tripsTotalPriceWithoutDPH += getTotalFinalPrice(price, quantity - taskTripPausalCount, workTrip.discount, Task.get('overtime'), afterHours)
            overPausalCounts.tripsTotalPriceWithDPH += getTotalFinalPriceWithDPH(price, quantity - taskTripPausalCount, workTrip.discount, dph, Task.get('overtime'), afterHours);
            if (Task.get('overtime')) {
              overPausalCounts.tripsAfterHours += quantity - taskTripPausalCount;
              //add overtime id if not already included
              if (!overPausalCounts.tripsAfterHoursTaskIds.includes(Task.get('id'))) {
                overPausalCounts.tripsAfterHoursTaskIds.push(Task.get('id'));
              }
              overPausalCounts.tripsAfterHoursPrice += getTotalAHPrice(price, quantity - taskTripPausalCount, workTrip.discount, afterHours);
            }
          }

          taskOverPausalObject.trips.push({ ...workTrip, id: useFakeID ? fakeID++ : workTrip.id, quantity: quantity - taskTripPausalCount });
          taskTripPausalCount = 0;
        }
      });
      if (taskPausalObject.subtasks.length > 0 || taskPausalObject.trips.length > 0) {
        resultPausalTasks.push(taskPausalObject);
      }
      if (taskOverPausalObject.subtasks.length > 0 || taskOverPausalObject.trips.length > 0) {
        resultOverPausalTasks.push(taskOverPausalObject);
      }
    })
  })
  return {
    pausalTasks: resultPausalTasks.filter((taskObject) => !discardTaskIds.includes(taskObject.task.get('id'))),
    overPausalTasks: resultOverPausalTasks.filter((taskObject) => !discardTaskIds.includes(taskObject.task.get('id'))),
    pausalCounts,
    overPausalCounts
  }
}

function processTasksMaterialsAndCustomItems(Tasks, Company) {
  //price per unit, total + margin - in materials
  const dph = Company.get('dph');

  let totalMaterialAndCustomItemPriceWithoutDPH = 0;

  const materialTasks = Tasks.map((Task) => {
    const newMaterials = Task.get('Materials').map((Material) => {
      const price = parseFloat(Material.get('price'));
      const margin = parseFloat(Material.get('margin'));
      const quantity = parseFloat(Material.get('quantity'));
      totalMaterialAndCustomItemPriceWithoutDPH += (price * margin / 100 + price) * quantity;
      return {
        ...Material.get(),
        price: price * margin / 100 + price,
        totalPrice: (price * margin / 100 + price) * quantity
      }
    })

    const newCustomItems = Task.get('CustomItems').map((CustomItem) => {
      const price = parseFloat(CustomItem.get('price'));
      const quantity = parseFloat(CustomItem.get('quantity'));
      totalMaterialAndCustomItemPriceWithoutDPH += price * quantity;
      return {
        ...CustomItem.get(),
        price: price,
        totalPrice: price * quantity
      }
    })
    return { task: Task, materials: newMaterials, customItems: newCustomItems };
  })

  return {
    materialTasks,
    totalMaterialAndCustomItemPriceWithoutDPH,
    totalMaterialAndCustomItemPriceWithDPH: totalMaterialAndCustomItemPriceWithoutDPH * (1 + dph / 100),
  };
}

function processCompanyRents(CompanyRents, Company) {
  const dph = Company.get('dph');
  const total = CompanyRents.reduce((acc, CompanyRent) => {
    return acc + parseFloat(CompanyRent.get('quantity')) * parseFloat(CompanyRent.get('price'))
  }, 0)

  return {
    totalWithoutDPH: total,
    totalWithDPH: total * (1 + dph / 100),
  }
}

function processProjectTasks(Tasks, Company, useFakeID = false) {
  const prices = Company.get('Pricelist').get('Prices');
  const afterHours = Company.get('Pricelist').get('afterHours');
  const dph = Company.get('dph');

  let counts = {
    subtasks: 0,
    subtasksAfterHours: 0,
    subtasksAfterHoursTaskIds: [],
    subtasksAfterHoursPrice: 0,
    subtasksTotalPriceWithoutDPH: 0,
    subtasksTotalPriceWithDPH: 0,
    trips: 0,
    tripsAfterHours: 0,
    tripsAfterHoursTaskIds: [],
    tripsAfterHoursPrice: 0,
    tripsTotalPriceWithoutDPH: 0,
    tripsTotalPriceWithDPH: 0,
  }
  const projectTasks = Tasks.map((Task) => {
    let overtime = Task.get('overtime');
    const subtasks = Task.get('Subtasks').map((Subtask) => {
      let price = prices.find((Price) => Price.get('type') === 'TaskType' && Price.get('TaskTypeId') === Subtask.get('TaskTypeId'));
      if (price === undefined) {
        price = 0
      } else {
        price = parseFloat(price.get('price'));
      }

      let subtask = {
        ...Subtask.get(),
        id: useFakeID ? fakeID++ : Subtask.get('id'),
        subtaskID: Subtask.get('id'),
        discount: parseFloat(Subtask.get('discount')),
        quantity: parseFloat(Subtask.get('quantity')),
        price: getFinalPrice(price, Subtask.get('discount'), Task.get('overtime'), afterHours),
        type: Subtask.get('TaskType'),
      };

      counts.subtasks += subtask.quantity;
      counts.subtasksTotalPriceWithoutDPH += getTotalFinalPrice(price, subtask.quantity, subtask.discount, overtime, afterHours);
      counts.subtasksTotalPriceWithDPH += getTotalFinalPriceWithDPH(price, subtask.quantity, subtask.discount, dph, overtime, afterHours);
      if (overtime) {
        counts.subtasksAfterHours += subtask.quantity;
        //add overtime id if not already included
        if (!counts.subtasksAfterHoursTaskIds.includes(Task.get('id'))) {
          counts.subtasksAfterHoursTaskIds.push(Task.get('id'));
        }
        counts.subtasksAfterHoursPrice += getTotalAHPrice(price, subtask.quantity, subtask.discount, afterHours);
      }
      return subtask;
    });

    const trips = Task.get('WorkTrips').map((WorkTrip) => {
      let price = prices.find((Price) => Price.get('type') === 'TripType' && Price.get('TripTypeId') === WorkTrip.get('TripTypeId'));

      if (price === undefined) {
        price = 0
      } else {
        price = parseFloat(price.get('price'));
      }

      let workTrip = {
        ...WorkTrip.get(),
        id: useFakeID ? fakeID++ : WorkTrip.get('id'),
        workTripID: WorkTrip.get('id'),
        discount: parseFloat(WorkTrip.get('discount')),
        quantity: parseFloat(WorkTrip.get('quantity')),
        price: getFinalPrice(price, WorkTrip.get('discount'), Task.get('overtime'), afterHours),
        type: WorkTrip.get('TripType'),
      };
      counts.trips += workTrip.quantity;
      counts.tripsTotalPriceWithoutDPH += getTotalFinalPrice(price, workTrip.quantity, workTrip.discount, overtime, afterHours);
      counts.tripsTotalPriceWithDPH += getTotalFinalPriceWithDPH(price, workTrip.quantity, workTrip.discount, dph, overtime, afterHours);
      if (overtime) {
        counts.tripsAfterHours += workTrip.quantity;
        //add overtime id if not already included
        if (!counts.tripsAfterHoursTaskIds.includes(Task.get('id'))) {
          counts.tripsAfterHoursTaskIds.push(Task.get('id'));
        }
        counts.tripsAfterHoursPrice += getTotalAHPrice(price, workTrip.quantity, workTrip.discount, afterHours);
      }
      return workTrip;
    });
    return {
      task: Task,
      subtasks,
      trips,
    };
  })
  return { projectTasks, projectCounts: counts };
}
