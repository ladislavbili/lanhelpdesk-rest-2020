import { models, sequelize } from '@/models';
import { createDoesNoExistsError } from '@/configs/errors';
import {
  generateCompanyInvoiceSQL,
  processPausalTasks,
  addPricesToTasks,
  getMaterialTasks,
  calculateTotals,
  addAllRightsToTasks,
} from '@/graph/addons/invoices';
import {
  splitArrayByFilter,
} from 'helperFunctions';
import { QueryTypes } from 'sequelize';
import {
  CompanyInstance,
  PricelistInstance,
  PriceInstance,
} from '@/models/instances';
import checkResolver from './checkResolver';
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
          Subtasks: resultTask.Subtask.id !== null ? [{ ...resultTask.Subtask, TaskType: resultTask.Subtask.TaskType.id === null ? null : resultTask.Subtask.TaskType }] : [],
          WorkTrips: resultTask.WorkTrip.id !== null ? [{ ...resultTask.WorkTrip, TripType: resultTask.WorkTrip.TripType.id === null ? null : resultTask.WorkTrip.TripType }] : [],
          Materials: resultTask.Material.id !== null ? [resultTask.Material] : [],
          assignedTos: resultTask.assignedTos.id !== null ? [resultTask.assignedTos] : [],
        })
      }
    })
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
    projectTasks = projectTasks.filter((task) => !task.invoiced && task.Subtasks.length > 0 || task.WorkTrips.length > 0);
    pausalTasks = pausalTasks.filter((task) => !task.invoiced && task.Subtasks.length > 0 || task.WorkTrips.length > 0);
    overPausalTasks = overPausalTasks.filter((task) => !task.invoiced && task.Subtasks.length > 0 || task.WorkTrips.length > 0);
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
  }
};

const mutations = {
};

const attributes = {
};

export default {
  attributes,
  mutations,
  queries
};
