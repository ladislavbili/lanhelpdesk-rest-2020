import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface InvoicedTaskInstance extends DefaultInstance {
  companyId: number;
  companyTitle: string;
  type: string;
  dph: number;
  statusId: number;
  statusTitle: string;
  statusColor: string;
  taskTypeId: number;
  taskTypeTitle: string;
  overtimePercentage: number;
}

export default function defineInvoicedTasks(sequelize: Sequelize) {
  sequelize.define<InvoicedTaskInstance>(
    "InvoicedTask",
    {
      companyId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
      },
      companyTitle: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null,
      },
      type: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      dph: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
      },
      statusId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
      },
      statusTitle: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null,
      },
      statusColor: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null,
      },
      taskTypeId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
      },
      taskTypeTitle: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null,
      },
      overtimePercentage: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
    },
    {
      //OPTIONS
      tableName: 'invoiced_tasks',
      // freezeTableName: true,
    }
  );
}

export function createInvoicedTasksAssoc(models) {
  models.InvoicedTask.hasMany(models.InvoicedTaskUser, { as: { singular: 'assignedTo', plural: 'assignedTos' }, foreignKey: { name: 'assignedToId' }, onDelete: 'CASCADE' });
  models.InvoicedTask.hasOne(models.InvoicedTaskUser, { as: 'requester', onDelete: 'CASCADE' });
  models.InvoicedTask.hasOne(models.InvoicedTaskUser, { as: 'createdBy', onDelete: 'CASCADE' });

  models.InvoicedTask.hasMany(models.InvoicedTaskTag, { onDelete: 'CASCADE' });
  models.InvoicedTask.belongsTo(models.Task, { foreignKey: { allowNull: false } });
}
