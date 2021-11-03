import { models, sequelize } from '@/models';
import { createDoesNoExistsError } from '@/configs/errors';
import checkResolver from './checkResolver';
import moment from 'moment';
import {
  generateCompanyInvoiceSQL,
  processPausalTasks,
  addPricesToTasks,
  getMaterialTasks,
  calculateTotals,
  addAllRightsToTasks,
  generateInvoiceSQL,
} from '@/graph/addons/invoices';
import {
  splitArrayByFilter,
  filterUnique,
} from '@/helperFunctions';
import { QueryTypes } from 'sequelize';
import {
  CompanyInstance,
  PricelistInstance,
  PriceInstance,
  TaskInstance,
  TagInstance,
} from '@/models/instances';
import { getModelAttribute } from '@/helperFunctions';


const queries = {
  companyInvoice: async (root, { fromDate, toDate, companyId }, { req }) => {
    const User = await checkResolver(req, ['vykazy']);
    const Company = <CompanyInstance>await models.Company.findByPk(companyId, {
      include: [{
        model: models.Pricelist,
        include: [models.Price]
      }]
    });
    if (Company === null) {
      throw createDoesNoExistsError('Company', companyId);
    }

    const hasPausal = Company.get('monthly');
    const worksPausal = parseFloat(Company.get('taskWorkPausal').toString());
    const tripsPausal = parseFloat(Company.get('taskTripPausal').toString());

    const Pricelist = <PricelistInstance>Company.get('Pricelist');
    const Prices = <PriceInstance[]>Pricelist.get('Prices');


    const SQL = generateCompanyInvoiceSQL(fromDate, toDate, companyId);
    const resultTasks = <any[]>await sequelize.query(SQL, {
      type: QueryTypes.SELECT,
      nest: true,
      raw: true,
      mapToModel: true
    });

    let tasks = [];
    resultTasks.forEach((resultTask) => {
      const task = tasks.find((task) => task.id === resultTask.id);
      if (task) {
        if (resultTask.Subtask.id !== null && task.Subtasks.every((subtask) => subtask.id !== resultTask.Subtask.id)) {
          task.Subtasks.push({ ...resultTask.Subtask, TaskType: resultTask.Subtask.TaskType.id === null ? null : resultTask.Subtask.TaskType });
        }
        if (resultTask.WorkTrip.id !== null && task.WorkTrips.every((workTrip) => workTrip.id !== resultTask.WorkTrip.id)) {
          task.WorkTrips.push({ ...resultTask.WorkTrip, TripType: resultTask.WorkTrip.TripType.id === null ? null : resultTask.WorkTrip.TripType });
        }
        if (resultTask.Material.id !== null && task.Materials.every((material) => material.id !== resultTask.Material.id)) {
          task.Materials.push(resultTask.Material);
        }
        if (resultTask.assignedTos.id !== null && task.assignedTos.every((assignedTo) => assignedTo.id !== resultTask.assignedTos.id)) {
          task.assignedTos.push(resultTask.assignedTos);
        }
      } else {
        tasks.push({
          ...resultTask,
          Subtasks: resultTask.Subtask.id !== null ? [{ ...resultTask.Subtask, TaskType: resultTask.Subtask.TaskType.id === null ? null : resultTask.Subtask.TaskType, assignedTo: resultTask.Subtask.assignedTo.id === null ? null : resultTask.Subtask.assignedTo }] : [],
          WorkTrips: resultTask.WorkTrip.id !== null ? [{ ...resultTask.WorkTrip, TripType: resultTask.WorkTrip.TripType.id === null ? null : resultTask.WorkTrip.TripType, assignedTo: resultTask.WorkTrip.assignedTo.id === null ? null : resultTask.WorkTrip.assignedTo }] : [],
          Materials: resultTask.Material.id !== null ? [resultTask.Material] : [],
          assignedTos: resultTask.assignedTos.id !== null ? [resultTask.assignedTos] : [],
        })
      }
    });
    tasks = addPricesToTasks(tasks, Prices, Pricelist, Company);
    tasks = addAllRightsToTasks(tasks);

    let projectTasks = [];
    let pausalTasks = [];
    let overPausalTasks = [];
    if (!hasPausal) {
      projectTasks = tasks;
    } else {
      const splitTasks = splitArrayByFilter(tasks, (task) => !task.pausal);
      projectTasks = splitTasks[0];
      [pausalTasks, overPausalTasks] = processPausalTasks(splitTasks[1], worksPausal, tripsPausal);
    }

    //filter out already invoiced tasks (needed to calculate over pausal tasks)
    projectTasks = projectTasks.filter((task) => !task.invoiced && (task.Subtasks.length > 0 || task.WorkTrips.length > 0));
    pausalTasks = pausalTasks.filter((task) => !task.invoiced && (task.Subtasks.length > 0 || task.WorkTrips.length > 0));
    overPausalTasks = overPausalTasks.filter((task) => !task.invoiced && (task.Subtasks.length > 0 || task.WorkTrips.length > 0));
    const materialTasks = getMaterialTasks(tasks);
    const totals = calculateTotals(
      projectTasks,
      pausalTasks,
      overPausalTasks,
      materialTasks,
      parseFloat(Company.get('dph').toString()) / 100 + 1,
    );

    return {
      projectTasks,
      pausalTasks,
      overPausalTasks,
      materialTasks,
      ...totals,
    };
  },
  invoice: async (root, { fromDate, toDate, companyId }, { req }) => {
    const User = await checkResolver(req, ['vykazy']);

    const SQL = generateInvoiceSQL(fromDate, toDate, companyId);
    const resultTasks = <any[]>await sequelize.query(SQL, {
      type: QueryTypes.SELECT,
      nest: true,
      raw: true,
      mapToModel: true
    });

    let tasks = [];
    resultTasks.forEach((resultTask) => {
      const invoicedTask = resultTask.InvoicedTask;
      const task = tasks.find((task) => task.id === resultTask.id);
      if (task) {
        if (resultTask.Subtask.id !== null && task.Subtasks.every((subtask) => subtask.id !== resultTask.Subtask.id)) {
          task.Subtasks.push({
            ...resultTask.Subtask,
            TaskType: {
              id: resultTask.Subtask.invoicedTypeId,
              title: resultTask.Subtask.invoicedTypeTitle,
            },
          });
        }
        if (resultTask.WorkTrip.id !== null && task.WorkTrips.every((workTrip) => workTrip.id !== resultTask.WorkTrip.id)) {
          task.WorkTrips.push({
            ...resultTask.WorkTrip,
            TripType: {
              id: resultTask.WorkTrip.invoicedTypeId,
              title: resultTask.WorkTrip.invoicedTypeTitle,
            },
          });
        }
        if (resultTask.Material.id !== null && task.Materials.every((material) => material.id !== resultTask.Material.id)) {
          task.Materials.push(resultTask.Material);
        }
        if (invoicedTask.assignedTos.id !== null && task.assignedTos.every((assignedTo) => assignedTo.id !== invoicedTask.assignedTos.userId)) {
          task.assignedTos.push({ ...invoicedTask.assignedTos, id: invoicedTask.assignedTos.userId });
        }
      } else {
        tasks.push({
          ...resultTask,
          Subtasks: (
            resultTask.Subtask.id !== null ?
              [
                {
                  ...resultTask.Subtask,
                  TaskType: {
                    id: resultTask.Subtask.invoicedTypeId,
                    title: resultTask.Subtask.invoicedTypeTitle,
                  },
                }
              ] :
              []
          ),
          WorkTrips: (
            resultTask.WorkTrip.id !== null ?
              [
                {
                  ...resultTask.WorkTrip,
                  TripType: {
                    id: resultTask.WorkTrip.invoicedTypeId,
                    title: resultTask.WorkTrip.invoicedTypeTitle,
                  },
                }
              ] :
              []
          ),
          Materials: resultTask.Material.id !== null ? [resultTask.Material] : [],
          Company: { id: invoicedTask.CompanyId, title: invoicedTask.companyTitle, dph: invoicedTask.dph },
          Status: {
            id: invoicedTask.statusId,
            title: invoicedTask.statusTitle,
            color: invoicedTask.statusColor,
          },
          TaskType: invoicedTask.taskTypeId !== null ?
            {
              id: invoicedTask.taskTypeId,
              title: invoicedTask.taskTypeTitle,
            } :
            null,
          createdBy: invoicedTask.createdBy.userId !== null ?
            {
              ...invoicedTask.createdBy,
              id: invoicedTask.createdBy.userId,
            } :
            null,
          requester: invoicedTask.requester.userId !== null ?
            {
              ...invoicedTask.requester,
              id: invoicedTask.requester.userId,
            } :
            null,
          assignedTos: invoicedTask.assignedTos.id !== null ? [{ ...invoicedTask.assignedTos, id: invoicedTask.assignedTos.userId }] : [],
        })
      }
    });
    tasks = addAllRightsToTasks(tasks);
    let pausalTasks = tasks.filter((task) => (
      task.Subtasks.some((Subtask) => Subtask.invoicedPausalQuantity !== null) ||
      task.WorkTrips.some((WorkTrip) => WorkTrip.invoicedPausalQuantity !== null)
    ));
    let overPausalTasks = tasks.filter((task) => (
      task.Subtasks.some((Subtask) => Subtask.invoicedOverPausalQuantity !== null) ||
      task.WorkTrips.some((WorkTrip) => WorkTrip.invoicedOverPausalQuantity !== null)
    ));
    let projectTasks = tasks.filter((task) => (
      task.Subtasks.some((Subtask) => Subtask.invoicedProjectQuantity !== null) ||
      task.WorkTrips.some((WorkTrip) => WorkTrip.invoicedProjectQuantity !== null)
    ));
    let materialTasks = tasks.filter((task) => task.Materials.length > 0);

    pausalTasks = pausalTasks.map((task) => ({
      ...task,
      Subtasks: task.Subtasks.filter((Subtask) => Subtask.invoicedPausalQuantity !== null).map((Subtask) => ({
        ...Subtask,
        quantity: Subtask.invoicedPausalQuantity,
        price: Subtask.invoicedPrice,
        total: parseFloat(Subtask.invoicedPausalQuantity) * parseFloat(Subtask.invoicedPrice)
      })),
      WorkTrips: task.WorkTrips.filter((WorkTrip) => WorkTrip.invoicedPausalQuantity !== null).map((WorkTrip) => ({
        ...WorkTrip,
        quantity: WorkTrip.invoicedPausalQuantity,
        price: WorkTrip.invoicedPrice,
        total: parseFloat(WorkTrip.invoicedPausalQuantity) * parseFloat(WorkTrip.invoicedPrice)
      })),
    }));
    overPausalTasks = overPausalTasks.map((task) => ({
      ...task,
      Subtasks: task.Subtasks.filter((Subtask) => Subtask.invoicedOverPausalQuantity !== null).map((Subtask) => ({
        ...Subtask,
        quantity: Subtask.invoicedOverPausalQuantity,
        price: Subtask.invoicedPrice,
        total: parseFloat(Subtask.invoicedOverPausalQuantity) * parseFloat(Subtask.invoicedPrice)
      })),
      WorkTrips: task.WorkTrips.filter((WorkTrip) => WorkTrip.invoicedOverPausalQuantity !== null).map((WorkTrip) => ({
        ...WorkTrip,
        quantity: WorkTrip.invoicedOverPausalQuantity,
        price: WorkTrip.invoicedPrice,
        total: parseFloat(WorkTrip.invoicedOverPausalQuantity) * parseFloat(WorkTrip.invoicedPrice)
      })),
    }));
    projectTasks = projectTasks.map((task) => ({
      ...task,
      Subtasks: task.Subtasks.filter((Subtask) => Subtask.invoicedProjectQuantity !== null).map((Subtask) => ({
        ...Subtask,
        quantity: Subtask.invoicedProjectQuantity,
        price: Subtask.invoicedPrice,
        total: parseFloat(Subtask.invoicedProjectQuantity) * parseFloat(Subtask.invoicedPrice)
      })),
      WorkTrips: task.WorkTrips.filter((WorkTrip) => WorkTrip.invoicedProjectQuantity !== null).map((WorkTrip) => ({
        ...WorkTrip,
        quantity: WorkTrip.invoicedProjectQuantity,
        price: WorkTrip.invoicedPrice,
        total: parseFloat(WorkTrip.invoicedProjectQuantity) * parseFloat(WorkTrip.invoicedPrice)
      })),
    }));
    materialTasks = materialTasks.map((task) => ({
      ...task,
      Materials: task.Materials.map((Material) => ({
        ...Material,
        total: parseFloat(Material.price) * parseFloat(Material.quantity)
      })),
    }));

    let pausalTotals = {
      workHours: 0,
      workOvertime: 0,
      workOvertimeTasks: [],
      workExtraPrice: 0,

      tripHours: 0,
      tripOvertime: 0,
      tripOvertimeTasks: [],
      tripExtraPrice: 0,
    }
    let overPausalTotals = {
      workHours: 0,
      workOvertime: 0,
      workOvertimeTasks: [],
      workExtraPrice: 0,
      workTotalPrice: 0,
      workTotalPriceWithDPH: 0,

      tripHours: 0,
      tripOvertime: 0,
      tripOvertimeTasks: [],
      tripExtraPrice: 0,
      tripTotalPrice: 0,
      tripTotalPriceWithDPH: 0,
    }
    let projectTotals = {
      workHours: 0,
      workOvertime: 0,
      workOvertimeTasks: [],
      workExtraPrice: 0,
      workTotalPrice: 0,
      workTotalPriceWithDPH: 0,

      tripHours: 0,
      tripOvertime: 0,
      tripOvertimeTasks: [],
      tripExtraPrice: 0,
      tripTotalPrice: 0,
      tripTotalPriceWithDPH: 0,
    }
    let materialTotals = {
      price: 0,
      priceWithDPH: 0,
    }
    pausalTasks.forEach((task) => {
      task.Subtasks.forEach((subtask) => {
        pausalTotals.workHours += parseFloat(subtask.quantity);
        if (task.overtime) {
          pausalTotals.workOvertime += parseFloat(subtask.quantity);
          if (!pausalTotals.workOvertimeTasks.includes(task.id)) {
            pausalTotals.workOvertimeTasks.push(task.id);
          }
          pausalTotals.workExtraPrice += parseFloat(subtask.price) * (parseFloat(task.InvoicedTask.overtimePercentage) / 100) * parseFloat(subtask.quantity);
        }
      });
      task.WorkTrips.forEach((workTrip) => {
        pausalTotals.tripHours += parseFloat(workTrip.quantity);
        if (task.overtime) {
          pausalTotals.tripOvertime += parseFloat(workTrip.quantity);
          if (!pausalTotals.tripOvertimeTasks.includes(task.id)) {
            pausalTotals.tripOvertimeTasks.push(task.id);
          }
          pausalTotals.tripExtraPrice += parseFloat(workTrip.price) * (parseFloat(task.InvoicedTask.overtimePercentage) / 100) * parseFloat(workTrip.quantity);
        }
      });
    });
    overPausalTasks.forEach((task) => {
      task.Subtasks.forEach((subtask) => {
        overPausalTotals.workHours += parseFloat(subtask.quantity);
        if (task.overtime) {
          overPausalTotals.workOvertime += parseFloat(subtask.quantity);
          if (!overPausalTotals.workOvertimeTasks.includes(task.id)) {
            overPausalTotals.workOvertimeTasks.push(task.id);
          }
          overPausalTotals.workExtraPrice += parseFloat(subtask.price) * (parseFloat(task.InvoicedTask.overtimePercentage) / 100) * parseFloat(subtask.quantity);
        }
        overPausalTotals.workTotalPrice += parseFloat(subtask.total);
        overPausalTotals.workTotalPriceWithDPH += parseFloat(subtask.total) * parseFloat(task.Company.dph);
      });
      task.WorkTrips.forEach((trip) => {
        overPausalTotals.tripHours += parseFloat(trip.quantity);
        if (task.overtime) {
          overPausalTotals.tripOvertime += parseFloat(trip.quantity);
          if (!overPausalTotals.tripOvertimeTasks.includes(task.id)) {
            overPausalTotals.tripOvertimeTasks.push(task.id);
          }
          overPausalTotals.tripExtraPrice += parseFloat(trip.price) * (parseFloat(task.InvoicedTask.overtimePercentage) / 100) * parseFloat(trip.quantity);
        }
        overPausalTotals.tripTotalPrice += parseFloat(trip.total);
        overPausalTotals.tripTotalPriceWithDPH += parseFloat(trip.total) * parseFloat(task.Company.dph);
      });
    });
    projectTasks.forEach((task) => {
      task.Subtasks.forEach((subtask) => {
        projectTotals.workHours += parseFloat(subtask.quantity);
        if (task.overtime) {
          projectTotals.workOvertime += parseFloat(subtask.quantity);
          if (!projectTotals.workOvertimeTasks.includes(task.id)) {
            projectTotals.workOvertimeTasks.push(task.id);
          }
          projectTotals.workExtraPrice += parseFloat(subtask.price) * (parseFloat(task.InvoicedTask.overtimePercentage) / 100) * parseFloat(subtask.quantity);
        }
        projectTotals.workTotalPrice += parseFloat(subtask.total);
        overPausalTotals.workTotalPriceWithDPH += parseFloat(subtask.total) * parseFloat(task.Company.dph);
      });
      task.WorkTrips.forEach((trip) => {
        projectTotals.tripHours += parseFloat(trip.quantity);
        if (task.overtime) {
          projectTotals.tripOvertime += parseFloat(trip.quantity);
          if (!projectTotals.tripOvertimeTasks.includes(task.id)) {
            projectTotals.tripOvertimeTasks.push(task.id);
          }
          projectTotals.tripExtraPrice += parseFloat(trip.price) * (parseFloat(task.InvoicedTask.overtimePercentage) / 100) * parseFloat(trip.quantity);
        }
        projectTotals.tripTotalPrice += parseFloat(trip.total);
        overPausalTotals.tripTotalPriceWithDPH += parseFloat(trip.total) * parseFloat(task.Company.dph);
      });
    });
    materialTasks.forEach((task) => {
      task.Materials.forEach((Material) => {
        materialTotals.price += parseFloat(Material.total);
        materialTotals.priceWithDPH += parseFloat(Material.total) * parseFloat(task.Company.dph);
      });
    });

    return {
      pausalTasks,
      overPausalTasks,
      projectTasks,
      materialTasks,
      pausalTotals,
      overPausalTotals,
      projectTotals,
      materialTotals,
    };
  },
};

const mutations = {
  invoiceTasks: async (root, { fromDate, toDate, companyId, taskIds }, { req }) => {
    let invoice = <any>await queries.companyInvoice(root, { fromDate, toDate, companyId }, { req });
    const Company = <CompanyInstance>await models.Company.findByPk(companyId, {
      include: [models.Pricelist]
    });
    if (Company === null) {
      throw createDoesNoExistsError('Company', companyId);
    }

    const Pricelist = <PricelistInstance>Company.get('Pricelist');

    const Tasks = <TaskInstance[]>await models.Task.findAll({ attributes: ['id', 'invoiced', 'invoicedDate'], where: { id: taskIds, CompanyId: companyId, invoiced: false }, include: [{ model: models.Tag, attributes: ['id', 'title', 'color', 'order'] }] });
    invoice = {
      pausalTasks: invoice.pausalTasks.map((task) => ({ ...task, Task: Tasks.find((Task) => Task.get('id') === task.id) })).filter((task) => task.Task !== undefined),
      overPausalTasks: invoice.overPausalTasks.map((task) => ({ ...task, Task: Tasks.find((Task) => Task.get('id') === task.id) })).filter((task) => task.Task !== undefined),
      projectTasks: invoice.projectTasks.map((task) => ({ ...task, Task: Tasks.find((Task) => Task.get('id') === task.id) })).filter((task) => task.Task !== undefined),
      materialTasks: invoice.materialTasks.map((task) => ({ ...task, Task: Tasks.find((Task) => Task.get('id') === task.id) })).filter((task) => task.Task !== undefined),
    };

    const invoicedDate = moment().valueOf();

    await sequelize.transaction(async (transaction) => {

      const invoiceTaskPromises = filterUnique([
        ...invoice.pausalTasks,
        ...invoice.overPausalTasks,
        ...invoice.projectTasks,
        ...invoice.materialTasks,
      ], 'id').map((task) => [
        task.Task.update({ invoiced: true, invoicedDate }, { transaction }),
        task.Task.createInvoicedTask(
          {
            TaskId: task.Task.get('id'),
            companyId: Company.get('id'),
            companyTitle: Company.get('title'),
            type: 'pausal',
            dph: Company.get('dph'),
            statusId: task.Status.id,
            statusTitle: task.Status.title,
            statusColor: task.Status.color,
            taskTypeId: task.TaskType.id,
            taskTypeTitle: task.TaskType.title,
            overtimePercentage: Pricelist.get('afterHours'),
            assignedTos: task.assignedTos.map((user) => ({
              userId: user.id,
              username: user.username,
              email: user.email,
              name: user.name,
              surname: user.surname,
              fullName: user.fullName,
            })),
            requester: {
              userId: task.requester.id,
              username: task.requester.username,
              email: task.requester.email,
              name: task.requester.name,
              surname: task.requester.surname,
              fullName: task.requester.fullName,
            },
            createdBy: {
              userId: task.createdBy.id,
              username: task.createdBy.username,
              email: task.createdBy.email,
              name: task.createdBy.name,
              surname: task.createdBy.surname,
              fullName: task.createdBy.fullName,
            },
            InvoicedTaskTags: (<TagInstance[]>task.Task.get('Tags')).map((Tag) => ({
              tagId: Tag.get('id'),
              title: Tag.get('title'),
              color: Tag.get('color'),
              order: Tag.get('order'),
            })),
          },
          {
            include: [
              {
                model: models.InvoicedTaskUser,
                as: 'assignedTos',
              },
              {
                model: models.InvoicedTaskUser,
                as: 'requester',
              },
              {
                model: models.InvoicedTaskUser,
                as: 'createdBy',
              },
              models.InvoicedTaskTag,
            ],
            transaction,
          }
        )
      ]).reduce((acc, taskUpdates) => [...acc, ...taskUpdates], []);

      let createInvoiceUserData = [
        ...invoice.pausalTasks,
        ...invoice.overPausalTasks,
        ...invoice.projectTasks,
      ].reduce((acc, task) => ({
        subtasks: [...acc.subtasks, ...task.Subtasks],
        trips: [...acc.trips, ...task.WorkTrips],
      }), { subtasks: [], trips: [] });
      createInvoiceUserData = { subtasks: filterUnique(createInvoiceUserData.subtasks, 'id'), trips: filterUnique(createInvoiceUserData.trips, 'id') };
      const createInvoiceUserPromises = [
        ...createInvoiceUserData.subtasks.map((subtask) => models.InvoicedTaskUser.create(
          {
            SubtaskId: subtask.id,
            userId: subtask.assignedTo.id,
            username: subtask.assignedTo.username,
            email: subtask.assignedTo.email,
            name: subtask.assignedTo.name,
            surname: subtask.assignedTo.surname,
            fullName: subtask.assignedTo.fullName,
          },
          { transaction }
        )),
        ...createInvoiceUserData.trips.map((trip) => models.InvoicedTaskUser.create(
          {
            WorkTripId: trip.id,
            userId: trip.assignedTo.id,
            username: trip.assignedTo.username,
            email: trip.assignedTo.email,
            name: trip.assignedTo.name,
            surname: trip.assignedTo.surname,
            fullName: trip.assignedTo.fullName,
          },
          { transaction }
        )),
      ];

      await Promise.all([
        ...invoiceTaskPromises,
        ...createInvoiceUserPromises,
        ...invoice.pausalTasks.map((task) => {
          return [
            ...task.Subtasks.map((subtask) => models.Subtask.update(
              {
                invoiced: true,
                invoicedPausalQuantity: subtask.quantity,
              },
              { where: { id: subtask.id }, transaction }
            )),
            ...task.WorkTrips.map((trip) => models.WorkTrip.update(
              {
                invoiced: true,
                invoicedPausalQuantity: trip.quantity,
                invoicedTypeId: trip.TripType.id,
                invoicedTypeTitle: trip.TripType.title,
              },
              { where: { id: trip.id }, transaction }
            )),
          ]
        }).reduce((acc, taskUpdates) => [...acc, ...taskUpdates], []),
        ...invoice.overPausalTasks.map((task) => {
          return [
            ...task.Subtasks.map((subtask) => models.Subtask.update(
              {
                invoiced: true,
                invoicedOverPausalQuantity: subtask.quantity,
                invoicedPrice: subtask.price,
              },
              { where: { id: subtask.id }, transaction }
            )),
            ...task.WorkTrips.map((trip) => models.WorkTrip.update(
              {
                invoiced: true,
                invoicedOverPausalQuantity: trip.quantity,
                invoicedPrice: trip.price,
                invoicedTypeId: trip.TripType.id,
                invoicedTypeTitle: trip.TripType.title,
              },
              { where: { id: trip.id }, transaction }
            )),
          ]
        }).reduce((acc, taskUpdates) => [...acc, ...taskUpdates], []),
        ...invoice.projectTasks.map((task) => {
          return [
            ...task.Subtasks.map((subtask) => models.Subtask.update(
              {
                invoiced: true,
                invoicedProjectQuantity: subtask.quantity,
                invoicedPrice: subtask.price,
              },
              { where: { id: subtask.id }, transaction }
            )),
            ...task.WorkTrips.map((trip) => models.WorkTrip.update(
              {
                invoiced: true,
                invoicedProjectQuantity: trip.quantity,
                invoicedPrice: trip.price,
                invoicedTypeId: trip.TripType.id,
                invoicedTypeTitle: trip.TripType.title,
              },
              { where: { id: trip.id }, transaction }
            )),
          ]
        }).reduce((acc, taskUpdates) => [...acc, ...taskUpdates], []),
        ...invoice.materialTasks.map((task) => task.Materials.map((material) => models.Material.update(
          { invoiced: true },
          { where: { id: material.id }, transaction }
        ))).reduce((acc, taskUpdates) => [...acc, ...taskUpdates], []),
      ]);
    });
    return true;
  },
}

const attributes = {
};

export default {
  attributes,
  mutations,
  queries
};
