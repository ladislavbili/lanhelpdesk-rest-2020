import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface TaskTypeInstance extends DefaultInstance {
  title: string;
  order: number;
  getTasks?: any;
  getSubtasks?: any;
}

export default function defineTaskTypes(sequelize: Sequelize) {
  sequelize.define<TaskTypeInstance>(
    "TaskType",
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
    },
    {
      //OPTIONS
      tableName: 'task_types',
      // freezeTableName: true,
    }
  );
}

export function createTaskTypesAssoc(models) {
  models.TaskType.hasMany(models.Price);

  models.TaskType.hasMany(models.ProjectAttributes, { as: 'defTaskType' });

  models.TaskType.belongsToMany(models.Filter, { as: { singular: "filterTaskType", plural: "filterTaskTypes" }, through: 'filter_task_type' });

  models.TaskType.hasMany(models.Task);

  models.TaskType.hasMany(models.RepeatTemplate);

  models.TaskType.hasMany(models.Subtask);
}
