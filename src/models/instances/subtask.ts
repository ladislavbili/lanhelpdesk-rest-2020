import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface SubtaskInstance extends DefaultInstance {

  title: string;
  order: number;
  done: boolean;
  approved: boolean;
  quantity: number;
  discount: number;
  //task
  //type
  //assignedTo

  invoiced: boolean;
  invoicedPrice: number;
  invoicedPausalQuantity: number;
  invoicedOverPausalQuantity: number;
  invoicedProjectQuantity: number;
  invoicedTypeId: number;
  invoicedTypeTitle: string;

  setTaskType?: any;
  setUser?: any;
  createScheduledWork?: any;
  getScheduledWork?: any;
}

export default function defineSubtasks(sequelize: Sequelize) {
  sequelize.define<SubtaskInstance>(
    "Subtask",
    {
      title: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      order: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      done: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      approved: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      quantity: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      discount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      invoiced: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      invoicedPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      invoicedPausalQuantity: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      invoicedOverPausalQuantity: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      invoicedProjectQuantity: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      invoicedTypeId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      invoicedTypeTitle: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      //OPTIONS
      tableName: 'subtasks',
      // freezeTableName: true,
    }
  );
}

export function createSubtasksAssoc(models) {
  models.Subtask.belongsTo(models.Task);

  models.Subtask.belongsTo(models.RepeatTemplate);

  models.Subtask.belongsTo(models.TaskType);

  models.Subtask.belongsTo(models.User);

  models.Subtask.belongsTo(models.User, { as: 'SubtaskApprovedBy' });

  models.Subtask.hasOne(models.ScheduledWork, { onDelete: 'CASCADE' });

  models.Subtask.hasOne(models.InvoicedTaskUser, { onDelete: 'CASCADE' });
}
