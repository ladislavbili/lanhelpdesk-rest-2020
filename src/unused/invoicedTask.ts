//import { } from '@/configs/errors';
import { models } from '@/models';
import {
  SubtaskInstance,
  InvoicedTaskInstance,
  TaskInvoiceInstance,
  InvoicedMaterialTaskInstance,
} from '@/models/instances';
import checkResolver from './checkResolver';
import { filterUnique } from '@/helperFunctions';
import TaskResolvers from './task';
import TaskInvoiceResolvers from './taskInvoice';
import moment from 'moment';
const queries = {
}

const mutations = {
  updateInvoicedTask: async (root, { id, taskChanges, stmcChanges, cancelInvoiced }, { req }) => {
    const User = await checkResolver(req, ['vykazy']);
    //update vykazy
    const Task = await models.Task.findByPk(id,
      {
        include: [
          models.Subtask,
          models.WorkTrip,
          models.Material,
          models.CustomItem,
          {
            model: models.InvoicedTask,
            include: [models.TaskInvoice],
          },
          {
            model: models.InvoicedMaterialTask,
            include: [models.TaskInvoice]
          },
        ]
      }
    );
    let Invoices = [];
    (<InvoicedTaskInstance[]>Task.get('InvoicedTasks'))
      .forEach((InvoicedTask) => {
        Invoices.push(<TaskInvoiceInstance>InvoicedTask.get('TaskInvoice'))
      });
    (<InvoicedMaterialTaskInstance[]>Task.get('InvoicedMaterialTasks'))
      .forEach((InvoicedMaterialTask) => {
        Invoices.push(<TaskInvoiceInstance>InvoicedMaterialTask.get('TaskInvoice'))
      });
    Invoices = filterUnique(Invoices, 'id');

    await Promise.all([
      TaskResolvers.mutations.updateTask(root, { id, invoiced: !cancelInvoiced, ...taskChanges }, { req }),
      ...stmcChanges.subtasks.ADD.map((subtask) => addInvoicedSubtask(subtask, Task)),
      ...stmcChanges.subtasks.EDIT.map((subtask) => updateInvoicedSubtask(subtask, Task)),
      ...stmcChanges.subtasks.DELETE.map((id) => deleteInvoicedSubtask(id, Task)),
      ...stmcChanges.trips.ADD.map((trip) => addInvoicedTrip(trip, Task)),
      ...stmcChanges.trips.EDIT.map((trip) => updateInvoicedTrip(trip, Task)),
      ...stmcChanges.trips.DELETE.map((id) => deleteInvoicedTrip(id, Task)),
      ...stmcChanges.materials.ADD.map((material) => addInvoicedMaterial(material, Task)),
      ...stmcChanges.materials.EDIT.map((material) => updateInvoicedMaterial(material, Task)),
      ...stmcChanges.materials.DELETE.map((id) => deleteInvoicedMaterial(id, Task)),
      ...stmcChanges.customItems.ADD.map((customItem) => addInvoicedCustomItem(customItem, Task)),
      ...stmcChanges.customItems.EDIT.map((customItem) => updateInvoicedCustomItem(customItem, Task)),
      ...stmcChanges.customItems.DELETE.map((id) => deleteInvoicedCustomItem(id, Task)),
      ...Invoices.map((Invoice) => Invoice.destroy()),
    ]);
    await Promise.all(Invoices.map((Invoice) =>
      TaskInvoiceResolvers.mutations.createTaskInvoice(
        root,
        {
          title: Invoice.get('title'),
          companyId: Invoice.get('CompanyId'),
          fromDate: moment(Invoice.get('fromDate')).valueOf().toString(),
          toDate: moment(Invoice.get('toDate')).valueOf().toString(),
          invoiced: true
        },
        { req }
      )
    ));
    return models.Task.findByPk(id, {
      include: [
        { model: models.User, as: 'assignedTos' },
        models.Company,
        { model: models.User, as: 'createdBy' },
        models.Milestone,
        models.Project,
        { model: models.User, as: 'requester' },
        models.Status,
        models.Tag,
        models.TaskType,
        models.Repeat,
      ]
    });
  },

}

const attributes = {
};

export default {
  attributes,
  mutations,
  queries
}


const addInvoicedSubtask = (subtask, Task) => {
  return Task.createSubtask({
    title: subtask.title,
    order: subtask.order,
    done: true,
    quantity: subtask.quantity,
    discount: subtask.discount,
    TaskTypeId: subtask.type,
    UserId: subtask.assignedTo,
  })
}

const updateInvoicedSubtask = ({ id, type, assignedTo, ...params }, Task) => {
  const Subtask = Task.get('Subtasks').find((Subtask) => Subtask.get('id') === id);
  let promises = [];
  promises.push(Subtask.update(params));
  if (type !== undefined) {
    promises.push(Subtask.setTaskType(type));
  }
  if (assignedTo !== undefined) {
    promises.push(Subtask.setUser(assignedTo));
  }
  return Promise.all(promises);
}
const deleteInvoicedSubtask = (id, Task) => {
  return Task.get('Subtasks').find((Subtask) => Subtask.get('id') === id).destroy();
}

const addInvoicedTrip = (trip, Task) => {
  return Task.createWorkTrip({
    order: trip.order,
    done: true,
    quantity: trip.quantity,
    discount: trip.discount,
    TripTypeId: trip.type,
    UserId: trip.assignedTo,
  })
}
const updateInvoicedTrip = ({ id, type, assignedTo, ...params }, Task) => {
  const WorkTrip = Task.get('WorkTrips').find((WorkTrip) => WorkTrip.get('id') === id);
  let promises = [];
  promises.push(WorkTrip.update(params));
  if (type !== undefined) {
    promises.push(WorkTrip.setTripType(type));
  }
  if (assignedTo !== undefined) {
    promises.push(WorkTrip.setUser(assignedTo));
  }
  return Promise.all(promises);
}
const deleteInvoicedTrip = (id, Task) => {
  return Task.get('WorkTrips').find((WorkTrip) => WorkTrip.get('id') === id).destroy();
}

const addInvoicedMaterial = (material, Task) => {
  return Task.createMaterial({
    title: material.title,
    order: material.order,
    done: true,
    quantity: material.quantity,
    margin: material.margin,
    price: material.price,
  })
}
const updateInvoicedMaterial = ({ id, ...params }, Task) => {
  const Material = Task.get('Materials').find((Material) => Material.get('id') === id);
  return Material.update(params);
}
const deleteInvoicedMaterial = (id, Task) => {
  return Task.get('Materials').find((Material) => Material.get('id') === id).destroy();
}

const addInvoicedCustomItem = (customItem, Task) => {
  Task.createCustomItem({
    title: customItem.title,
    order: customItem.order,
    done: true,
    quantity: customItem.quantity,
    price: customItem.price,
  })
}
const updateInvoicedCustomItem = ({ id, ...params }, Task) => {
  const CustomItem = Task.get('CustomItems').find((CustomItem) => CustomItem.get('id') === id);
  return CustomItem.update(params);
}
const deleteInvoicedCustomItem = (id, Task) => {
  return Task.get('CustomItems').find((CustomItem) => CustomItem.get('id') === id).destroy();
}
