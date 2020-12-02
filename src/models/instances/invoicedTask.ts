import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface InvoicedTaskInstance extends DefaultInstance {
  //task
  //InvoicedSubtask
  //InvoicedTrip
  type: string;
  project: string;
  requester: string;
  //assignedTo
  taskType: string;
  company: string;
  milestone: string;
  //tags
}

export default function defineInvoicedTasks(sequelize: Sequelize) {
  sequelize.define<InvoicedTaskInstance>(
    "InvoicedTask",
    {
      type: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      project: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: ""
      },
      requester: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: ""
      },
      taskType: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: ""
      },
      company: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: ""
      },
      milestone: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
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
  models.InvoicedTask.hasMany(models.InvoicedSubtask, { onDelete: 'CASCADE' });
  models.InvoicedTask.hasMany(models.InvoicedTrip, { onDelete: 'CASCADE' });
  models.InvoicedTask.hasMany(models.InvoicedTag, { onDelete: 'CASCADE' });
  models.InvoicedTask.hasMany(models.InvoicedAssignedTo, { onDelete: 'CASCADE' });
}
