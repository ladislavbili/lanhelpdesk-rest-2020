import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface InvoicedTaskInstance extends DefaultInstance {
  //task
  //InvoicedSubtask
  //InvoicedTrip
}

export default function defineInvoicedTasks(sequelize: Sequelize) {
  sequelize.define<InvoicedTaskInstance>(
    "InvoicedTask",
    {
    },
    {
      //OPTIONS
      tableName: 'invoiced_task',
      // freezeTableName: true,
    }
  );
}

export function createInvoicedTasksAssoc(models) {
  models.InvoicedTask.belongsTo(models.TaskInvoice);
  models.InvoicedTask.belongsTo(models.Task);
  models.InvoicedTask.hasMany(models.InvoicedSubtask);
  models.InvoicedTask.hasMany(models.InvoicedTrip);
}
