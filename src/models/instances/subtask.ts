import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface SubtaskInstance extends DefaultInstance {

  title: string;
  order: number;
  done: boolean;
  quantity: number;
  discount: number;
  invoiced: boolean;
  //task
  //type
  //assignedTo

  setTaskType?: any;
  setUser?: any;
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

  models.Subtask.hasMany(models.InvoicedSubtask);
}
